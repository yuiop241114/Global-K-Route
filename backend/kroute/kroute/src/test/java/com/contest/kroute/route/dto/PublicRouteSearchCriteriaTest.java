package com.contest.kroute.route.dto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class PublicRouteSearchCriteriaTest {

	@Test
	void normalizesFiltersAndCamelCaseSort() {
		PublicRouteSearchCriteria criteria = PublicRouteSearchCriteria.of(
				"  서울 하루  ",
				1,
				4,
				6,
				"placeCount",
				2,
				10
		);

		assertThat(criteria.query()).isEqualTo("서울 하루");
		assertThat(criteria.areaCode()).isEqualTo(1);
		assertThat(criteria.minPlaces()).isEqualTo(4);
		assertThat(criteria.maxPlaces()).isEqualTo(6);
		assertThat(criteria.sort()).isEqualTo(PublicRouteSort.PLACE_COUNT);
		assertThat(criteria.page()).isEqualTo(2);
	}

	@Test
	void rejectsInvertedPlaceRange() {
		assertThatThrownBy(() -> PublicRouteSearchCriteria.of(
				null,
				null,
				7,
				3,
				"latest",
				0,
				10
		))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("minPlaces");
	}

	@Test
	void rejectsUnsupportedSort() {
		assertThatThrownBy(() -> PublicRouteSearchCriteria.of(
				null,
				null,
				null,
				null,
				"distance",
				0,
				10
		))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("Unsupported public route sort");
	}
}
