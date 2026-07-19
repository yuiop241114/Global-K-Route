package com.contest.kroute.route.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record RouteUpsertRequest(
		@NotBlank @Size(max = 100) String title,
		@NotEmpty @Size(max = 30) List<@Valid RoutePlaceRequest> places
) {
}
