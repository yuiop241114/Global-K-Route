package com.contest.kroute.route.controller;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.contest.kroute.auth.security.UserPrincipal;
import com.contest.kroute.common.ApiResponse;
import com.contest.kroute.route.dto.PopularPlaceResponse;
import com.contest.kroute.route.dto.PublicRouteResponse;
import com.contest.kroute.route.dto.RouteResponse;
import com.contest.kroute.route.service.CommunityRouteService;

@RestController
@RequestMapping("/api/public")
@Profile("!local")
public class CommunityRouteController {
	private final CommunityRouteService communityRouteService;

	public CommunityRouteController(CommunityRouteService communityRouteService) {
		this.communityRouteService = communityRouteService;
	}

	@GetMapping("/routes")
	public ApiResponse<List<PublicRouteResponse>> findPublicRoutes() {
		return ApiResponse.ok(communityRouteService.findPublicRoutes());
	}

	@PostMapping("/routes/{routeId}/copy")
	public ApiResponse<RouteResponse> copyPublicRoute(@AuthenticationPrincipal UserPrincipal user,
			@PathVariable Long routeId) {
		return ApiResponse.ok(communityRouteService.copyPublicRoute(user.id(), routeId), "Route copied");
	}

	@GetMapping("/places/popular")
	public ApiResponse<List<PopularPlaceResponse>> findPopularPlaces(
			@RequestParam(defaultValue = "10") int limit) {
		return ApiResponse.ok(communityRouteService.findPopularPlaces(limit));
	}
}
