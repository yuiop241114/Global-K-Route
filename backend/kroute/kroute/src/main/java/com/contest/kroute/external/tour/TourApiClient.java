package com.contest.kroute.external.tour;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import com.contest.kroute.config.AppProperties;
import com.contest.kroute.place.dto.NearbyPlaceResponse;
import com.contest.kroute.place.dto.NearbyPlaceSearchRequest;
import com.fasterxml.jackson.databind.JsonNode;

@Component
public class TourApiClient {

	private static final Logger log = LoggerFactory.getLogger(TourApiClient.class);

	private static final String LOCATION_BASED_LIST_OPERATION = "locationBasedList2";
	private static final String MOBILE_OS = "ETC";
	private static final String MOBILE_APP = "GlobalKRoute";
	private static final int DEFAULT_NUM_OF_ROWS = 20;

	private static final Map<String, String> SERVICE_NAMES_BY_LANGUAGE = Map.of(
			"ko", "KorService2",
			"en", "EngService2",
			"ja", "JpnService2",
			"zh-cn", "ChsService2",
			"zh-tw", "ChtService2",
			"fr", "FreService2",
			"es", "SpnService2",
			"de", "GerService2",
			"ru", "RusService2"
	);

	private static final Map<String, String> KOREAN_CONTENT_TYPE_IDS = Map.of(
			"tourist_attraction", "12",
			"restaurant", "39",
			"accommodation", "32"
	);

	private static final Map<String, String> GLOBAL_CONTENT_TYPE_IDS = Map.of(
			"tourist_attraction", "76",
			"restaurant", "82",
			"accommodation", "80"
	);

	private final RestClient restClient;
	private final AppProperties appProperties;

	public TourApiClient(RestClient.Builder restClientBuilder, AppProperties appProperties) {
		this.restClient = restClientBuilder.build();
		this.appProperties = appProperties;
	}

	public List<NearbyPlaceResponse> findNearbyPlaces(NearbyPlaceSearchRequest request) {
		if (appProperties.tourApi().serviceKey() == null || appProperties.tourApi().serviceKey().isBlank()) {
			throw new IllegalStateException("TOUR_API_KEY is required.");
		}
		if (request.selectedLatitude() == null || request.selectedLongitude() == null) {
			return List.of();
		}

		URI requestUri = buildLocationBasedListUri(request);
		JsonNode response = restClient.get()
				.uri(requestUri)
				.retrieve()
				.body(JsonNode.class);

		logTourApiResponse(request, response);
		return toNearbyPlaces(response);
	}

	private URI buildLocationBasedListUri(NearbyPlaceSearchRequest request) {
		String serviceName = resolveServiceName(request.language());
		UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(appProperties.tourApi().baseUrl())
				.pathSegment(serviceName, LOCATION_BASED_LIST_OPERATION)
				.queryParam("serviceKey", appProperties.tourApi().serviceKey())
				.queryParam("MobileOS", MOBILE_OS)
				.queryParam("MobileApp", MOBILE_APP)
				.queryParam("_type", "json")
				.queryParam("numOfRows", DEFAULT_NUM_OF_ROWS)
				.queryParam("pageNo", 1)
				.queryParam("arrange", "E")
				.queryParam("mapX", request.selectedLongitude())
				.queryParam("mapY", request.selectedLatitude())
				.queryParam("radius", request.radius());

		resolveContentTypeId(request.language(), request.contentType())
				.ifPresent(contentTypeId -> builder.queryParam("contentTypeId", contentTypeId));

		return builder.build(true).toUri();
	}

	private String resolveServiceName(String language) {
		String normalizedLanguage = language == null ? "ko" : language.toLowerCase(Locale.ROOT);
		return SERVICE_NAMES_BY_LANGUAGE.getOrDefault(normalizedLanguage, "KorService2");
	}

	private Optional<String> resolveContentTypeId(String language, String contentType) {
		if (contentType == null || contentType.isBlank()) {
			return Optional.empty();
		}
		if ("ko".equalsIgnoreCase(language)) {
			return Optional.ofNullable(KOREAN_CONTENT_TYPE_IDS.get(contentType));
		}
		return Optional.ofNullable(GLOBAL_CONTENT_TYPE_IDS.get(contentType));
	}

	private List<NearbyPlaceResponse> toNearbyPlaces(JsonNode response) {
		JsonNode items = response.path("response").path("body").path("items").path("item");
		if (items.isMissingNode() || items.isNull()) {
			return List.of();
		}

		List<NearbyPlaceResponse> places = new ArrayList<>();
		if (items.isArray()) {
			items.forEach(item -> toNearbyPlace(item).ifPresent(places::add));
			return places;
		}

		toNearbyPlace(items).ifPresent(places::add);
		return places;
	}

	private void logTourApiResponse(NearbyPlaceSearchRequest request, JsonNode response) {
		JsonNode header = response.path("response").path("header");
		JsonNode body = response.path("response").path("body");
		log.info(
				"TourAPI location search completed. language={}, service={}, contentType={}, radius={}, resultCode={}, resultMsg={}, totalCount={}",
				request.language(),
				resolveServiceName(request.language()),
				request.contentType(),
				request.radius(),
				header.path("resultCode").asText(""),
				header.path("resultMsg").asText(""),
				body.path("totalCount").asInt(0)
		);
	}

	private Optional<NearbyPlaceResponse> toNearbyPlace(JsonNode item) {
		Optional<Double> latitude = parseDouble(item.path("mapy").asText(null));
		Optional<Double> longitude = parseDouble(item.path("mapx").asText(null));
		if (latitude.isEmpty() || longitude.isEmpty()) {
			return Optional.empty();
		}

		return Optional.of(new NearbyPlaceResponse(
				item.path("contentid").asText(""),
				item.path("title").asText(""),
				resolveCategory(item.path("contenttypeid").asText("")),
				item.path("addr1").asText(""),
				latitude.get(),
				longitude.get(),
				parseDouble(item.path("dist").asText(null))
						.map(Double::intValue)
						.orElse(0),
				item.path("firstimage").asText(null)
		));
	}

	private String resolveCategory(String contentTypeId) {
		return switch (contentTypeId) {
			case "12" -> "tourist_attraction";
			case "14" -> "cultural_facility";
			case "15" -> "festival";
			case "25" -> "travel_course";
			case "28" -> "sports";
			case "32" -> "accommodation";
			case "38" -> "shopping";
			case "39" -> "restaurant";
			case "75" -> "sports";
			case "76" -> "tourist_attraction";
			case "77" -> "transportation";
			case "78" -> "cultural_facility";
			case "79" -> "shopping";
			case "80" -> "accommodation";
			case "82" -> "restaurant";
			case "85" -> "festival";
			default -> contentTypeId == null || contentTypeId.isBlank() ? "unknown" : contentTypeId;
		};
	}

	private Optional<Double> parseDouble(String value) {
		if (value == null || value.isBlank()) {
			return Optional.empty();
		}
		try {
			return Optional.of(Double.parseDouble(value));
		} catch (NumberFormatException exception) {
			return Optional.empty();
		}
	}
}
