package com.contest.kroute.route.dto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;

import org.junit.jupiter.api.Test;

class PopularPlaceSearchCriteriaTest {

	private static final Instant NOW = Instant.parse("2026-08-25T12:00:00Z");

	@Test
	void createsAllTimeCriteriaWithoutTimeBoundary() {
		PopularPlaceSearchCriteria criteria = PopularPlaceSearchCriteria.of(
				"total", null, null, 12, NOW
		);

		assertThat(criteria.period()).isEqualTo(PopularityPeriod.TOTAL);
		assertThat(criteria.savedAfter()).isNull();
		assertThat(criteria.areaCode()).isNull();
		assertThat(criteria.category()).isNull();
	}

	@Test
	void createsRollingWeeklyAndMonthlyBoundaries() {
		PopularPlaceSearchCriteria weekly = PopularPlaceSearchCriteria.of(
				"week", 1, " TOURIST_ATTRACTION ", 10, NOW
		);
		PopularPlaceSearchCriteria monthly = PopularPlaceSearchCriteria.of(
				"month", 6, "restaurant", 10, NOW
		);

		assertThat(weekly.savedAfter()).isEqualTo(Instant.parse("2026-08-18T12:00:00Z"));
		assertThat(weekly.category()).isEqualTo("tourist_attraction");
		assertThat(monthly.savedAfter()).isEqualTo(Instant.parse("2026-07-26T12:00:00Z"));
	}

	@Test
	void rejectsUnsupportedFiltersAndLimits() {
		assertThatThrownBy(() -> PopularPlaceSearchCriteria.of(
				"year", null, null, 10, NOW
		))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("period");
		assertThatThrownBy(() -> PopularPlaceSearchCriteria.of(
				"total", null, "shopping", 10, NOW
		))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("category");
		assertThatThrownBy(() -> PopularPlaceSearchCriteria.of(
				"total", null, null, 31, NOW
		))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("limit");
	}
}
