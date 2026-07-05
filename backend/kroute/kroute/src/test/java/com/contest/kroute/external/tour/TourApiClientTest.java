package com.contest.kroute.external.tour;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.contest.kroute.config.AppProperties;
import com.contest.kroute.place.dto.PlaceDetailResponse;

class TourApiClientTest {

	@Test
	void combinesTourApiDetailResponsesIntoNormalizedDetail() {
		RestClient.Builder restClientBuilder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(restClientBuilder).build();
		TourApiClient client = new TourApiClient(restClientBuilder, appProperties());

		server.expect(requestTo(containsString("/KorService2/detailCommon2")))
				.andRespond(withSuccess("""
						{
						  "response": {
						    "body": {
						      "items": {
						        "item": {
						          "contentid": "100",
						          "title": "테스트 관광지",
						          "overview": "<p>상세 소개<br>두 번째 줄</p>",
						          "addr1": "서울특별시",
						          "addr2": "종로구",
						          "tel": "02-123-4567",
						          "homepage": "<a href=\\"http://example.com\\">홈페이지</a>",
						          "mapy": "37.57",
						          "mapx": "126.98",
						          "firstimage": "http://images.example.com/main.jpg"
						        }
						      }
						    }
						  }
						}
						""", MediaType.APPLICATION_JSON));

		server.expect(requestTo(containsString("/KorService2/detailIntro2")))
				.andRespond(withSuccess("""
						{
						  "response": {
						    "body": {
						      "items": {
						        "item": {
						          "usetime": "09:00~18:00",
						          "restdate": "월요일",
						          "parking": "주차 가능",
						          "infocenter": "02-123-4567"
						        }
						      }
						    }
						  }
						}
						""", MediaType.APPLICATION_JSON));

		server.expect(requestTo(containsString("/KorService2/detailInfo2")))
				.andRespond(withSuccess("""
						{
						  "response": {
						    "body": {
						      "items": {
						        "item": [
						          {
						            "infoname": "이용 안내",
						            "infotext": "편한 신발을 권장합니다."
						          }
						        ]
						      }
						    }
						  }
						}
						""", MediaType.APPLICATION_JSON));

		server.expect(requestTo(containsString("/KorService2/detailImage2")))
				.andRespond(withSuccess("""
						{
						  "response": {
						    "body": {
						      "items": {
						        "item": [
						          {
						            "originimgurl": "http://images.example.com/sub.jpg"
						          }
						        ]
						      }
						    }
						  }
						}
						""", MediaType.APPLICATION_JSON));

		PlaceDetailResponse detail = client.findPlaceDetail("100", "ko", "tourist_attraction");

		assertThat(detail.contentId()).isEqualTo("100");
		assertThat(detail.category()).isEqualTo("tourist_attraction");
		assertThat(detail.title()).isEqualTo("테스트 관광지");
		assertThat(detail.overview()).isEqualTo("상세 소개\n두 번째 줄");
		assertThat(detail.address()).isEqualTo("서울특별시 종로구");
		assertThat(detail.homepage()).isEqualTo("http://example.com");
		assertThat(detail.primaryImageUrl()).isEqualTo("https://images.example.com/main.jpg");
		assertThat(detail.imageUrls()).containsExactly(
				"https://images.example.com/main.jpg",
				"https://images.example.com/sub.jpg"
		);
		assertThat(detail.visitInfo().openingHours()).isEqualTo("09:00~18:00");
		assertThat(detail.additionalInfo()).hasSize(1);
		assertThat(detail.additionalInfo().get(0).title()).isEqualTo("이용 안내");
		server.verify();
	}

	private AppProperties appProperties() {
		return new AppProperties(
				new AppProperties.Cors("http://localhost:3000"),
				new AppProperties.TourApi("https://apis.example.com/B551011", "test-key"),
				new AppProperties.Kakao(""),
				new AppProperties.Upstash(new AppProperties.Upstash.Redis("", ""))
		);
	}
}
