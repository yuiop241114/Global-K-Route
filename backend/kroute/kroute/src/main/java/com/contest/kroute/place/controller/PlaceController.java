package com.contest.kroute.place.controller;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.contest.kroute.common.ApiResponse;
import com.contest.kroute.place.dto.NearbyPlaceResponse;
import com.contest.kroute.place.service.PlaceService;

@Validated
@RestController
@RequestMapping("/api/places")
public class PlaceController {

	private final PlaceService placeService;

	public PlaceController(PlaceService placeService) {
		this.placeService = placeService;
	}

	@GetMapping("/nearby")
	public ApiResponse<List<NearbyPlaceResponse>> getNearbyPlaces(
			@RequestParam @Min(-90) @Max(90) double lat,
			@RequestParam @Min(-180) @Max(180) double lng,
			@RequestParam(defaultValue = "1000") @Min(100) @Max(20000) int radius,
			@RequestParam(defaultValue = "en") @NotBlank String lang,
			@RequestParam(required = false) String contentType
	) {
		return ApiResponse.ok(placeService.findNearbyPlaces(lat, lng, radius, lang, contentType));
	}
}
