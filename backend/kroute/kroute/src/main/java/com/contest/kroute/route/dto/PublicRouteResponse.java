package com.contest.kroute.route.dto;

import java.time.Instant;
import java.util.List;

import com.contest.kroute.route.domain.TravelRoute;

public record PublicRouteResponse(
		Long id,
		String title,
		List<RoutePlaceResponse> places,
		long copyCount,
		Instant publishedAt,
		Instant updatedAt
) {
	public static PublicRouteResponse from(TravelRoute route, List<RoutePlaceResponse> places, long copyCount) {
		return new PublicRouteResponse(
				route.getId(),
				route.getTitle(),
				places,
				copyCount,
				route.getPublishedAt(),
				route.getUpdatedAt()
		);
	}
}
