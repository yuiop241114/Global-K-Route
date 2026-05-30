package com.contest.kroute.place.controller;

import java.util.List;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.contest.kroute.common.ApiResponse;
import com.contest.kroute.place.dto.NearbyPlaceResponse;
import com.contest.kroute.place.dto.NearbyPlaceSearchRequest;
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
			@RequestParam(required = false) Double selectedLat,
			@RequestParam(required = false) Double selectedLng,
			@RequestParam(required = false) Integer areaCode,
			@RequestParam(required = false) Integer sigunguCode,
			@RequestParam(required = false) Integer radius,
			@RequestParam(defaultValue = "en") String lang,
			@RequestParam(required = false) String contentType
	) {
		NearbyPlaceSearchRequest request = NearbyPlaceSearchRequest.of(
				selectedLat,
				selectedLng,
				areaCode,
				sigunguCode,
				radius,
				lang,
				contentType
		);
		return ApiResponse.ok(placeService.findNearbyPlaces(request));
	}
}
