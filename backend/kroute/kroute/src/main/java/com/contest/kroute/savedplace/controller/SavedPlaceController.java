package com.contest.kroute.savedplace.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.context.annotation.Profile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.contest.kroute.auth.security.UserPrincipal;
import com.contest.kroute.common.ApiResponse;
import com.contest.kroute.savedplace.dto.SavePlaceRequest;
import com.contest.kroute.savedplace.dto.SavedPlaceResponse;
import com.contest.kroute.savedplace.service.SavedPlaceService;

@RestController
@RequestMapping("/api/saved-places")
@Profile("!local")
public class SavedPlaceController {
	private final SavedPlaceService savedPlaceService;

	public SavedPlaceController(SavedPlaceService savedPlaceService) {
		this.savedPlaceService = savedPlaceService;
	}

	@GetMapping
	public ApiResponse<List<SavedPlaceResponse>> findAll(@AuthenticationPrincipal UserPrincipal user) {
		return ApiResponse.ok(savedPlaceService.findAll(user.id()));
	}

	@PostMapping
	public ApiResponse<SavedPlaceResponse> save(@AuthenticationPrincipal UserPrincipal user,
			@Valid @RequestBody SavePlaceRequest request) {
		return ApiResponse.ok(savedPlaceService.save(user.id(), request), "Place saved");
	}

	@DeleteMapping("/{savedPlaceId}")
	public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal user,
			@PathVariable Long savedPlaceId) {
		savedPlaceService.delete(user.id(), savedPlaceId);
		return ApiResponse.ok(null, "Saved place removed");
	}
}
