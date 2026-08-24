package com.contest.kroute.route.dto;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

public enum PopularityPeriod {
	TOTAL(null),
	WEEK(Duration.ofDays(7)),
	MONTH(Duration.ofDays(30));

	private final Duration duration;

	PopularityPeriod(Duration duration) {
		this.duration = duration;
	}

	public static PopularityPeriod from(String value) {
		if (value == null || value.isBlank()) {
			return TOTAL;
		}
		return switch (value.trim().toLowerCase(Locale.ROOT)) {
			case "total" -> TOTAL;
			case "week" -> WEEK;
			case "month" -> MONTH;
			default -> throw new IllegalArgumentException("Unsupported popularity period: " + value);
		};
	}

	public Instant savedAfter(Instant now) {
		return duration == null ? null : now.minus(duration);
	}
}
