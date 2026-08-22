package com.contest.kroute.external.kakao;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.contest.kroute.config.AppProperties;
import com.contest.kroute.route.dto.WalkingRouteRequest.Point;
import com.contest.kroute.route.dto.WalkingRouteResponse;

class KakaoWalkingRouteClientTest {

	@Test
	void combinesWalkingSectionsWhenRouteHasMoreThanFiveWaypoints() {
		RestClient.Builder restClientBuilder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(restClientBuilder).build();
		KakaoWalkingRouteClient client = new KakaoWalkingRouteClient(restClientBuilder, appProperties());

		server.expect(requestTo(containsString("via_x=")))
				.andExpect(header("Authorization", "KakaoAK test-rest-key"))
				.andRespond(withSuccess(routeResponse(100, 60,
						"[[127.0,37.0],[127.2,37.2],[127.6,37.6]]"), MediaType.APPLICATION_JSON));
		server.expect(requestTo(containsString("start_x=127.6")))
				.andExpect(header("Authorization", "KakaoAK test-rest-key"))
				.andRespond(withSuccess(routeResponse(200, 120,
						"[[127.6,37.6],[127.7,37.7]]"), MediaType.APPLICATION_JSON));

		List<Point> points = List.of(
				new Point(37.0, 127.0),
				new Point(37.1, 127.1),
				new Point(37.2, 127.2),
				new Point(37.3, 127.3),
				new Point(37.4, 127.4),
				new Point(37.5, 127.5),
				new Point(37.6, 127.6),
				new Point(37.7, 127.7)
		);

		WalkingRouteResponse response = client.findWalkingRoute(points);

		assertThat(response.totalDistanceMeters()).isEqualTo(300);
		assertThat(response.totalDurationSeconds()).isEqualTo(180);
		assertThat(response.coordinates()).hasSize(4);
		assertThat(response.coordinates().get(2).longitude()).isEqualTo(127.6);
		server.verify();
	}

	private String routeResponse(int distance, int duration, String points) {
		return """
				{
				  "route": {
				    "properties": {
				      "totalDistance": %d,
				      "totalTime": %d
				    },
				    "legs": [{
				      "steps": [{
				        "path": { "points": %s }
				      }]
				    }]
				  }
				}
				""".formatted(distance, duration, points);
	}

	private AppProperties appProperties() {
		return new AppProperties(
				new AppProperties.Cors("http://localhost:3000"),
				new AppProperties.TourApi("https://apis.example.com/B551011", "test-key"),
				new AppProperties.Kakao("test-rest-key"),
				new AppProperties.Upstash(new AppProperties.Upstash.Redis("", "")),
				new AppProperties.Auth(false, 7, 30),
				new AppProperties.Frontend("http://localhost:3000"),
				new AppProperties.Mail("")
		);
	}
}
