package com.contest.kroute.route.dto;

import java.time.Instant;
import java.util.List;

import com.contest.kroute.route.domain.TravelRoute;
import com.contest.kroute.route.domain.RouteTransportMode;

public record PublicRouteResponse(
		Long id,
		String title,
		String description,
		java.time.LocalDate travelDate,
		RouteTransportMode transportMode,
		List<RoutePlaceResponse> places,
		long copyCount,
		Instant publishedAt,
		Instant updatedAt
) {
	public static PublicRouteResponse from(TravelRoute route, List<RoutePlaceResponse> places, long copyCount) {
		return new PublicRouteResponse(
				route.getId(),
				route.getTitle(),
				route.getDescription(),
				route.getTravelDate(),
				route.getTransportMode(),
				places,
				copyCount,
				route.getPublishedAt(),
				route.getUpdatedAt()
		);
	}
}
