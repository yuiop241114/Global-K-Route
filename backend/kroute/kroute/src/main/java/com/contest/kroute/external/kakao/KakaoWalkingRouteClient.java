package com.contest.kroute.external.kakao;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import com.contest.kroute.config.AppProperties;
import com.contest.kroute.route.dto.WalkingRouteRequest.Point;
import com.contest.kroute.route.dto.WalkingRouteResponse;
import com.contest.kroute.route.dto.WalkingRouteResponse.Coordinate;
import com.contest.kroute.route.exception.WalkingRouteUnavailableException;
import com.fasterxml.jackson.databind.JsonNode;

@Component
public class KakaoWalkingRouteClient {
	private static final String WALKING_ROUTE_URL = "https://dapi.kakao.com/v2/routing/walk";
	private static final int MAX_POINTS_PER_REQUEST = 7;

	private final RestClient restClient;
	private final AppProperties appProperties;

	public KakaoWalkingRouteClient(RestClient.Builder restClientBuilder, AppProperties appProperties) {
		this.restClient = restClientBuilder.build();
		this.appProperties = appProperties;
	}

	public WalkingRouteResponse findWalkingRoute(List<Point> points) {
		validateApiKey();

		int totalDistanceMeters = 0;
		int totalDurationSeconds = 0;
		List<Coordinate> coordinates = new ArrayList<>();

		int startIndex = 0;
		while (startIndex < points.size() - 1) {
			int endIndex = Math.min(startIndex + MAX_POINTS_PER_REQUEST - 1, points.size() - 1);
			WalkingRouteResponse section = requestSection(points.subList(startIndex, endIndex + 1));
			totalDistanceMeters += section.totalDistanceMeters();
			totalDurationSeconds += section.totalDurationSeconds();
			appendCoordinates(coordinates, section.coordinates());
			startIndex = endIndex;
		}

		if (coordinates.size() < 2) {
			throw new WalkingRouteUnavailableException("Kakao Maps returned no walking route coordinates.");
		}

		return new WalkingRouteResponse(totalDistanceMeters, totalDurationSeconds, List.copyOf(coordinates));
	}

	private WalkingRouteResponse requestSection(List<Point> points) {
		Point start = points.get(0);
		Point end = points.get(points.size() - 1);
		UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(WALKING_ROUTE_URL)
				.queryParam("start_x", start.longitude())
				.queryParam("start_y", start.latitude())
				.queryParam("end_x", end.longitude())
				.queryParam("end_y", end.latitude())
				.queryParam("input_coord", "WGS84")
				.queryParam("output_coord", "WGS84");

		if (points.size() > 2) {
			List<Point> viaPoints = points.subList(1, points.size() - 1);
			uriBuilder.queryParam("via_x", joinLongitudes(viaPoints));
			uriBuilder.queryParam("via_y", joinLatitudes(viaPoints));
		}

		URI uri = uriBuilder.build().encode().toUri();
		try {
			JsonNode response = restClient.get()
					.uri(uri)
					.header("Authorization", "KakaoAK " + appProperties.kakao().restApiKey())
					.retrieve()
					.body(JsonNode.class);
			return parseResponse(response);
		} catch (RestClientException exception) {
			throw new WalkingRouteUnavailableException("Kakao Maps walking route request failed.", exception);
		}
	}

	private WalkingRouteResponse parseResponse(JsonNode response) {
		JsonNode route = response == null ? null : response.path("route");
		if (route == null || route.isMissingNode() || route.isNull()) {
			throw new WalkingRouteUnavailableException("Kakao Maps could not find a walking route.");
		}

		JsonNode properties = route.path("properties");
		List<Coordinate> coordinates = new ArrayList<>();
		route.path("legs").forEach(leg -> leg.path("steps").forEach(step ->
				step.path("path").path("points").forEach(point -> {
					if (point.isArray() && point.size() >= 2) {
						appendCoordinate(coordinates, new Coordinate(point.get(1).asDouble(), point.get(0).asDouble()));
					}
				})
		));

		return new WalkingRouteResponse(
				properties.path("totalDistance").asInt(),
				properties.path("totalTime").asInt(),
				List.copyOf(coordinates)
		);
	}

	private String joinLongitudes(List<Point> points) {
		return points.stream().map(point -> point.longitude().toString()).collect(Collectors.joining(","));
	}

	private String joinLatitudes(List<Point> points) {
		return points.stream().map(point -> point.latitude().toString()).collect(Collectors.joining(","));
	}

	private void appendCoordinates(List<Coordinate> target, List<Coordinate> source) {
		source.forEach(coordinate -> appendCoordinate(target, coordinate));
	}

	private void appendCoordinate(List<Coordinate> target, Coordinate coordinate) {
		if (target.isEmpty() || !sameCoordinate(target.get(target.size() - 1), coordinate)) {
			target.add(coordinate);
		}
	}

	private boolean sameCoordinate(Coordinate left, Coordinate right) {
		return Double.compare(left.latitude(), right.latitude()) == 0
				&& Double.compare(left.longitude(), right.longitude()) == 0;
	}

	private void validateApiKey() {
		if (appProperties.kakao().restApiKey() == null || appProperties.kakao().restApiKey().isBlank()) {
			throw new WalkingRouteUnavailableException("KAKAO_REST_API_KEY is required.");
		}
	}
}
