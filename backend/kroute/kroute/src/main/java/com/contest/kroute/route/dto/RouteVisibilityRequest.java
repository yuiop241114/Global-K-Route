package com.contest.kroute.route.dto;

import jakarta.validation.constraints.NotNull;

public record RouteVisibilityRequest(@NotNull Boolean publicRoute) {
}
