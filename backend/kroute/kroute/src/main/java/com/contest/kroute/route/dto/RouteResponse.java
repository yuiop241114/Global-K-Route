package com.contest.kroute.route.dto;

import java.time.Instant;
import java.util.List;

import com.contest.kroute.route.domain.TravelRoute;

public record RouteResponse(
		Long id,
		String title,
		List<RoutePlaceResponse> places,
		Instant createdAt,
		Instant updatedAt
) {
	public static RouteResponse from(TravelRoute route, List<RoutePlaceResponse> places) {
		return new RouteResponse(route.getId(), route.getTitle(), places, route.getCreatedAt(), route.getUpdatedAt());
	}
}
