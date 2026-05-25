package com.contest.kroute.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
		Cors cors,
		TourApi tourApi,
		Kakao kakao,
		Upstash upstash
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
}
