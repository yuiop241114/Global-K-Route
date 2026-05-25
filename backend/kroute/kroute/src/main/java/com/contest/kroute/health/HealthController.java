package com.contest.kroute.health;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.contest.kroute.common.ApiResponse;

@RestController
@RequestMapping("/api/health")
public class HealthController {

	@GetMapping
	public ApiResponse<Map<String, String>> health() {
		return ApiResponse.ok(Map.of(
				"status", "UP",
				"service", "global-k-route-api"
		));
	}
}
