package com.contest.kroute.route.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RouteViewRequest(
		@NotBlank
		@Size(max = 100)
		String visitorId
) {
}
