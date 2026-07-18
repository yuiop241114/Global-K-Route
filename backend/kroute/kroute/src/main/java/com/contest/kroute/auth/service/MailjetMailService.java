package com.contest.kroute.auth.service;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import com.contest.kroute.auth.domain.UserAccount;
import com.contest.kroute.auth.exception.AuthException;
import com.contest.kroute.config.AppProperties;

@Service
@Profile("!local")
public class MailjetMailService {
	private static final Logger log = LoggerFactory.getLogger(MailjetMailService.class);
	private static final int MAX_ERROR_BODY_LENGTH = 500;

	private final RestClient restClient;
	private final AppProperties appProperties;

	public MailjetMailService(RestClient.Builder restClientBuilder, AppProperties appProperties) {
		this.restClient = restClientBuilder.build();
		this.appProperties = appProperties;
	}

	public void sendUsernameReminder(UserAccount user) {
		String subject = "Global K-Route username reminder";
		String text = "요청하신 Global K-Route 아이디는 " + user.getUsername()
				+ " 입니다.\n\nYour Global K-Route username is " + user.getUsername() + ".";
		send(user.getEmail(), subject, text);
	}

	public void sendPasswordReset(UserAccount user, String resetUrl, long validMinutes) {
		String subject = "Global K-Route password reset";
		String text = "비밀번호를 재설정하려면 아래 주소를 여세요. 이 링크는 " + validMinutes + "분 동안 유효합니다.\n"
				+ resetUrl + "\n\nOpen the link below to reset your password. It is valid for "
				+ validMinutes + " minutes.\n" + resetUrl;
		send(user.getEmail(), subject, text);
	}

	private void send(String recipient, String subject, String text) {
		AppProperties.Mailjet mailjet = appProperties.mailjet();
		if (isBlank(mailjet.baseUrl()) || isBlank(mailjet.apiKey()) || isBlank(mailjet.secretKey())
				|| isBlank(mailjet.fromEmail())) {
			log.error("Mailjet delivery is not configured; check the Mailjet environment variables");
			throw new AuthException(HttpStatus.SERVICE_UNAVAILABLE, "Email delivery is not configured");
		}

		Map<String, Object> message = Map.of(
				"From", Map.of("Email", mailjet.fromEmail(), "Name", mailjet.fromName()),
				"To", List.of(Map.of("Email", recipient)),
				"Subject", subject,
				"TextPart", text
		);

		try {
			restClient.post()
					.uri(createSendUri(mailjet.baseUrl()))
					.headers(headers -> headers.setBasicAuth(mailjet.apiKey(), mailjet.secretKey()))
					.body(Map.of("Messages", List.of(message)))
					.retrieve()
					.toBodilessEntity();
		} catch (RestClientResponseException exception) {
			log.error("Mailjet request failed with status {}: {}", exception.getStatusCode(),
					sanitize(exception.getResponseBodyAsString()));
			throw new AuthException(HttpStatus.BAD_GATEWAY, "Email delivery failed");
		} catch (RestClientException exception) {
			log.error("Mailjet request could not be completed", exception);
			throw new AuthException(HttpStatus.BAD_GATEWAY, "Email delivery failed");
		}
	}

	private URI createSendUri(String baseUrl) {
		String normalized = baseUrl.trim();
		while (normalized.endsWith("/")) {
			normalized = normalized.substring(0, normalized.length() - 1);
		}
		if (!normalized.endsWith("/send")) {
			normalized += "/send";
		}
		return URI.create(normalized);
	}

	private String sanitize(String responseBody) {
		String sanitized = responseBody == null ? "" : responseBody.replace('\r', ' ').replace('\n', ' ');
		return sanitized.length() <= MAX_ERROR_BODY_LENGTH
				? sanitized
				: sanitized.substring(0, MAX_ERROR_BODY_LENGTH) + "...";
	}

	private boolean isBlank(String value) {
		return value == null || value.isBlank();
	}
}
