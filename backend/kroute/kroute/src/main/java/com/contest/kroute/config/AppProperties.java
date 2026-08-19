package com.contest.kroute.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
		Cors cors,
		TourApi tourApi,
		Kakao kakao,
		Upstash upstash,
		Auth auth,
		Frontend frontend,
		Mail mail
) {
	public record Cors(String allowedOrigins) {
	}

	public record TourApi(String baseUrl, String serviceKey) {
	}

	public record Kakao(String restApiKey) {
	}

	public record Upstash(Redis redis) {
		public record Redis(String restUrl, String restToken) {
		}
	}

	public record Auth(boolean secureCookie, long sessionDays, long passwordResetMinutes) {
	}

	public record Frontend(String baseUrl) {
	}

	public record Mail(String fromEmail) {
	}
}
