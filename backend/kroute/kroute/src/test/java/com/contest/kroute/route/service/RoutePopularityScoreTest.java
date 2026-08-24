package com.contest.kroute.route.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.contest.kroute.route.dto.RoutePopularityMetrics;

class RoutePopularityScoreTest {

	@Test
	void combinesCopiesViewsCompositionAndRecentActivity() {
		RoutePopularityMetrics metrics = new RoutePopularityMetrics(2, 5, 1, 2, 3, 4);

		double score = RoutePopularityScore.calculate(metrics, 12, 3);

		assertThat(score).isEqualTo(49.5);
	}

	@Test
	void capsPlaceCountBonusAndHandlesEmptyRoute() {
		RoutePopularityMetrics emptyMetrics = RoutePopularityMetrics.empty();

		assertThat(RoutePopularityScore.calculate(emptyMetrics, 0, 0)).isZero();
		assertThat(RoutePopularityScore.calculate(emptyMetrics, 0, 12)).isEqualTo(4.0);
	}
}
