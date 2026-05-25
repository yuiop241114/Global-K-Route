package com.contest.kroute.cache;

import java.time.Duration;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.contest.kroute.config.AppProperties;

@Service
public class UpstashRedisCacheService implements CacheService {

	private final RestClient.Builder restClientBuilder;
	private final AppProperties appProperties;

	public UpstashRedisCacheService(RestClient.Builder restClientBuilder, AppProperties appProperties) {
		this.restClientBuilder = restClientBuilder;
		this.appProperties = appProperties;
	}

	@Override
	public Optional<String> get(String key) {
		if (!isConfigured()) {
			return Optional.empty();
		}

		String response = restClient()
				.get()
				.uri("/get/{key}", key)
				.retrieve()
				.body(String.class);

		return Optional.ofNullable(response);
	}

	@Override
	public void set(String key, String value, Duration ttl) {
		if (!isConfigured()) {
			return;
		}

		restClient()
				.post()
				.uri("/set/{key}/{value}?EX={ttl}", key, value, ttl.toSeconds())
				.retrieve()
				.toBodilessEntity();
	}

	private RestClient restClient() {
		return restClientBuilder
				.baseUrl(appProperties.upstash().redis().restUrl())
				.defaultHeader("Authorization", "Bearer " + appProperties.upstash().redis().restToken())
				.build();
	}

	private boolean isConfigured() {
		AppProperties.Upstash.Redis redis = appProperties.upstash().redis();
		return redis.restUrl() != null && !redis.restUrl().isBlank()
				&& redis.restToken() != null && !redis.restToken().isBlank();
	}
}
