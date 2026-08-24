package com.contest.kroute.route.service;

import com.contest.kroute.route.dto.RoutePopularityMetrics;

public final class RoutePopularityScore {
	private static final int MAX_COMPOSITION_BONUS_PLACES = 8;

	private RoutePopularityScore() {
	}

	public static double calculate(RoutePopularityMetrics metrics, long placeSaveCount, int placeCount) {
		double averagePlaceSaveCount = placeCount == 0 ? 0 : (double) placeSaveCount / placeCount;
		double score =
				metrics.copyCount() * 10.0
				+ metrics.viewCount()
				+ averagePlaceSaveCount * 2.0
				+ Math.min(placeCount, MAX_COMPOSITION_BONUS_PLACES) * 0.5
				+ metrics.weeklyCopyCount() * 6.0
				+ metrics.monthlyCopyCount() * 3.0
				+ metrics.weeklyViewCount() * 0.6
				+ metrics.monthlyViewCount() * 0.3;
		return Math.round(score * 10.0) / 10.0;
	}
}
