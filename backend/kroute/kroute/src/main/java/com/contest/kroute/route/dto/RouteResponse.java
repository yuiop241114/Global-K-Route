package com.contest.kroute.route.dto;

import java.time.Instant;
import java.util.List;

import com.contest.kroute.route.domain.TravelRoute;
import com.contest.kroute.route.domain.RouteTransportMode;

public record RouteResponse(
		Long id,
		String title,
		String description,
		java.time.LocalDate travelDate,
		RouteTransportMode transportMode,
		List<RoutePlaceResponse> places,
		boolean publicRoute,
		Instant publishedAt,
		long copyCount,
		Instant createdAt,
		Instant updatedAt
) {
	public static RouteResponse from(TravelRoute route, List<RoutePlaceResponse> places, long copyCount) {
		return new RouteResponse(
				route.getId(),
				route.getTitle(),
				route.getDescription(),
				route.getTravelDate(),
				route.getTransportMode(),
				places,
				route.isPublicRoute(),
				route.getPublishedAt(),
				copyCount,
				route.getCreatedAt(),
				route.getUpdatedAt()
		);
	}
}
