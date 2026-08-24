package com.contest.kroute.route.dto;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;

public record PopularPlaceSearchCriteria(
		PopularityPeriod period,
		Instant savedAfter,
		Integer areaCode,
		String category,
		int limit
) {
	private static final Set<String> SUPPORTED_CATEGORIES = Set.of(
			"tourist_attraction",
			"restaurant",
			"accommodation"
	);

	public static PopularPlaceSearchCriteria of(String period, Integer areaCode, String category,
			int limit, Instant now) {
		if (areaCode != null && areaCode < 1) {
			throw new IllegalArgumentException("areaCode must be positive");
		}
		if (limit < 1 || limit > 30) {
			throw new IllegalArgumentException("limit must be between 1 and 30");
		}
		String normalizedCategory = normalizeCategory(category);
		PopularityPeriod normalizedPeriod = PopularityPeriod.from(period);
		return new PopularPlaceSearchCriteria(
				normalizedPeriod,
				normalizedPeriod.savedAfter(now),
				areaCode,
				normalizedCategory,
				limit
		);
	}

	private static String normalizeCategory(String category) {
		if (category == null || category.isBlank()) {
			return null;
		}
		String normalized = category.trim().toLowerCase(Locale.ROOT);
		if (!SUPPORTED_CATEGORIES.contains(normalized)) {
			throw new IllegalArgumentException("Unsupported place category: " + category);
		}
		return normalized;
	}
}
