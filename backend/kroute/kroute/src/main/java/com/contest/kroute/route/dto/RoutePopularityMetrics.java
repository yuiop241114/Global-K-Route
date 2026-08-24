package com.contest.kroute.route.dto;

public record RoutePopularityMetrics(
		long copyCount,
		long viewCount,
		long weeklyCopyCount,
		long monthlyCopyCount,
		long weeklyViewCount,
		long monthlyViewCount
) {
	public static RoutePopularityMetrics empty() {
		return new RoutePopularityMetrics(0, 0, 0, 0, 0, 0);
	}
}
