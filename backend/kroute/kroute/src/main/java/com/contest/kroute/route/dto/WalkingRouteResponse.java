package com.contest.kroute.route.dto;

import java.util.List;

public record WalkingRouteResponse(
		int totalDistanceMeters,
		int totalDurationSeconds,
		List<Coordinate> coordinates
) {
	public record Coordinate(double latitude, double longitude) {
	}
}
