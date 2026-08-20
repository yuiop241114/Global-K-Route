package com.contest.kroute.route.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import com.contest.kroute.route.domain.RouteTransportMode;

public record RouteUpsertRequest(
		@NotBlank @Size(max = 100) String title,
		@Size(max = 1000) String description,
		LocalDate travelDate,
		RouteTransportMode transportMode,
		@NotEmpty @Size(max = 30) List<@Valid RoutePlaceRequest> places
) {
	public RouteUpsertRequest(String title, List<RoutePlaceRequest> places) {
		this(title, null, null, null, places);
	}
}
