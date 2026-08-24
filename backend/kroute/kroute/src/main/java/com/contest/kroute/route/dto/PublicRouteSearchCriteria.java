package com.contest.kroute.route.dto;

import java.time.Instant;

public record PublicRouteSearchCriteria(
		String query,
		Integer areaCode,
		Integer minPlaces,
		Integer maxPlaces,
		PublicRouteSort sort,
		int page,
		int size,
		Instant scoredAt
) {
	private static final int MAX_QUERY_LENGTH = 100;
	private static final int MAX_ROUTE_PLACES = 30;
	private static final int MAX_PAGE_SIZE = 30;

	public static PublicRouteSearchCriteria of(String query, Integer areaCode, Integer minPlaces,
			Integer maxPlaces, String sort, int page, int size) {
		return of(query, areaCode, minPlaces, maxPlaces, sort, page, size, Instant.now());
	}

	public static PublicRouteSearchCriteria of(String query, Integer areaCode, Integer minPlaces,
			Integer maxPlaces, String sort, int page, int size, Instant scoredAt) {
		String normalizedQuery = query == null || query.isBlank() ? null : query.trim();
		if (normalizedQuery != null && normalizedQuery.length() > MAX_QUERY_LENGTH) {
			throw new IllegalArgumentException("Route search query must be 100 characters or fewer");
		}
		if (areaCode != null && areaCode < 1) {
			throw new IllegalArgumentException("areaCode must be positive");
		}
		validatePlaceCount("minPlaces", minPlaces);
		validatePlaceCount("maxPlaces", maxPlaces);
		if (minPlaces != null && maxPlaces != null && minPlaces > maxPlaces) {
			throw new IllegalArgumentException("minPlaces cannot be greater than maxPlaces");
		}
		if (page < 0) {
			throw new IllegalArgumentException("page cannot be negative");
		}
		if (size < 1 || size > MAX_PAGE_SIZE) {
			throw new IllegalArgumentException("size must be between 1 and 30");
		}
		return new PublicRouteSearchCriteria(
				normalizedQuery,
				areaCode,
				minPlaces,
				maxPlaces,
				PublicRouteSort.from(sort),
				page,
				size,
				scoredAt
		);
	}

	private static void validatePlaceCount(String name, Integer value) {
		if (value != null && (value < 1 || value > MAX_ROUTE_PLACES)) {
			throw new IllegalArgumentException(name + " must be between 1 and 30");
		}
	}
}
