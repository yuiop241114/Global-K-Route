package com.contest.kroute.route.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.context.annotation.Profile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.contest.kroute.auth.security.UserPrincipal;
import com.contest.kroute.common.ApiResponse;
import com.contest.kroute.route.dto.RouteResponse;
import com.contest.kroute.route.dto.RouteUpsertRequest;
import com.contest.kroute.route.dto.RouteVisibilityRequest;
import com.contest.kroute.route.service.TravelRouteService;

@RestController
@RequestMapping("/api/routes")
@Profile("!local")
public class TravelRouteController {
	private final TravelRouteService routeService;

	public TravelRouteController(TravelRouteService routeService) {
		this.routeService = routeService;
	}

	@GetMapping
	public ApiResponse<List<RouteResponse>> findAll(@AuthenticationPrincipal UserPrincipal user) {
		return ApiResponse.ok(routeService.findAll(user.id()));
	}

	@PostMapping
	public ApiResponse<RouteResponse> create(@AuthenticationPrincipal UserPrincipal user,
			@Valid @RequestBody RouteUpsertRequest request) {
		return ApiResponse.ok(routeService.create(user.id(), request), "Route created");
	}

	@PutMapping("/{routeId}")
	public ApiResponse<RouteResponse> update(@AuthenticationPrincipal UserPrincipal user,
			@PathVariable Long routeId, @Valid @RequestBody RouteUpsertRequest request) {
		return ApiResponse.ok(routeService.update(user.id(), routeId, request), "Route updated");
	}

	@PatchMapping("/{routeId}/visibility")
	public ApiResponse<RouteResponse> changeVisibility(@AuthenticationPrincipal UserPrincipal user,
			@PathVariable Long routeId, @Valid @RequestBody RouteVisibilityRequest request) {
		return ApiResponse.ok(
				routeService.changeVisibility(user.id(), routeId, request),
				request.publicRoute() ? "Route published" : "Route made private"
		);
	}

	@DeleteMapping("/{routeId}")
	public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal user, @PathVariable Long routeId) {
		routeService.delete(user.id(), routeId);
		return ApiResponse.ok(null, "Route deleted");
	}
}
