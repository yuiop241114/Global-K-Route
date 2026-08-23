package com.contest.kroute.route.dto;

import java.util.Locale;

public enum PublicRouteSort {
	LATEST,
	POPULAR,
	PLACE_COUNT;

	public static PublicRouteSort from(String value) {
		if (value == null || value.isBlank()) {
			return LATEST;
		}
		String normalized = value.trim()
				.replace('-', '_')
				.replaceAll("([a-z])([A-Z])", "$1_$2")
				.toUpperCase(Locale.ROOT);
		return switch (normalized) {
			case "LATEST" -> LATEST;
			case "POPULAR" -> POPULAR;
			case "PLACE_COUNT" -> PLACE_COUNT;
			default -> throw new IllegalArgumentException("Unsupported public route sort: " + value);
		};
	}
}
