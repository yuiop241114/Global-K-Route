package com.contest.kroute.route.controller;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.contest.kroute.common.ApiResponse;
import com.contest.kroute.external.kakao.KakaoWalkingRouteClient;
import com.contest.kroute.route.dto.WalkingRouteRequest;
import com.contest.kroute.route.dto.WalkingRouteResponse;

@RestController
@RequestMapping("/api/public/routes")
public class WalkingRouteController {
	private final KakaoWalkingRouteClient walkingRouteClient;

	public WalkingRouteController(KakaoWalkingRouteClient walkingRouteClient) {
		this.walkingRouteClient = walkingRouteClient;
	}

	@PostMapping("/walking-path")
	public ApiResponse<WalkingRouteResponse> findWalkingPath(
			@Valid @RequestBody WalkingRouteRequest request) {
		return ApiResponse.ok(walkingRouteClient.findWalkingRoute(request.points()));
	}
}
