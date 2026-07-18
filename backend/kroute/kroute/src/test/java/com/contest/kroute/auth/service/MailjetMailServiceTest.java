package com.contest.kroute.auth.service;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.contest.kroute.auth.domain.UserAccount;
import com.contest.kroute.config.AppProperties;

class MailjetMailServiceTest {

	@Test
	void sendsUsernameReminderToMailjetV31Endpoint() {
		RestClient.Builder restClientBuilder = RestClient.builder();
		MockRestServiceServer server = MockRestServiceServer.bindTo(restClientBuilder).build();
		MailjetMailService service = new MailjetMailService(restClientBuilder, appProperties());
		UserAccount user = new UserAccount("traveler", "traveler@example.com", "password-hash");

		server.expect(requestTo("https://api.mailjet.com/v3.1/send"))
				.andExpect(content().string(containsString("traveler@example.com")))
				.andExpect(content().string(containsString("traveler")))
				.andRespond(withSuccess("{\"Messages\":[{\"Status\":\"success\"}]}", MediaType.APPLICATION_JSON));

		service.sendUsernameReminder(user);

		server.verify();
	}

	private AppProperties appProperties() {
		return new AppProperties(
				new AppProperties.Cors("http://localhost:3000"),
				new AppProperties.TourApi("https://apis.example.com/B551011", "test-key"),
				new AppProperties.Kakao(""),
				new AppProperties.Upstash(new AppProperties.Upstash.Redis("", "")),
				new AppProperties.Auth(false, 7, 30),
				new AppProperties.Frontend("http://localhost:3000"),
				new AppProperties.Mailjet(
						"https://api.mailjet.com/v3.1", "api-key", "secret-key",
						"sender@example.com", "Global K-Route")
		);
	}
}
