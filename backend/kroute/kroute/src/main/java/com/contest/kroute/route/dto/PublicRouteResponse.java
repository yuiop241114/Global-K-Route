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
		List<PublicRoutePlaceResponse> places,
		long copyCount,
		long viewCount,
		long placeSaveCount,
		double popularityScore,
		Instant publishedAt,
		Instant updatedAt
) {
	public static PublicRouteResponse from(TravelRoute route, List<PublicRoutePlaceResponse> places,
			RoutePopularityMetrics metrics, long placeSaveCount, double popularityScore) {
		return new PublicRouteResponse(
				route.getId(),
				route.getTitle(),
				route.getDescription(),
				route.getTravelDate(),
				route.getTransportMode(),
				places,
				metrics.copyCount(),
				metrics.viewCount(),
				placeSaveCount,
				popularityScore,
				route.getPublishedAt(),
				route.getUpdatedAt()
		);
	}
}
