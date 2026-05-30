package com.contest.kroute.place.dto;

import com.contest.kroute.search.domain.SearchBasis;

public record NearbyPlaceSearchRequest(
		Double selectedLatitude,
		Double selectedLongitude,
		Integer areaCode,
		Integer sigunguCode,
		Integer radius,
		String language,
		String contentType
) {
	private static final int DEFAULT_RADIUS = 1000;
	private static final String DEFAULT_LANGUAGE = "en";

	public static NearbyPlaceSearchRequest of(
			Double selectedLatitude,
			Double selectedLongitude,
			Integer areaCode,
			Integer sigunguCode,
			Integer radius,
			String language,
			String contentType
	) {
		NearbyPlaceSearchRequest request = new NearbyPlaceSearchRequest(
				selectedLatitude,
				selectedLongitude,
				areaCode,
				sigunguCode,
				radius == null ? DEFAULT_RADIUS : radius,
				language == null || language.isBlank() ? DEFAULT_LANGUAGE : language,
				contentType
		);
		request.validate();
		return request;
	}

	public SearchBasis searchBasis() {
		if (selectedLatitude != null && selectedLongitude != null) {
			return SearchBasis.MAP_POINT;
		}
		return SearchBasis.AREA;
	}

	private void validate() {
		boolean hasMapPoint = selectedLatitude != null || selectedLongitude != null;
		if (hasMapPoint && (selectedLatitude == null || selectedLongitude == null)) {
			throw new IllegalArgumentException("selectedLat and selectedLng must be provided together.");
		}
		if (selectedLatitude != null && (selectedLatitude < -90 || selectedLatitude > 90)) {
			throw new IllegalArgumentException("selectedLat must be between -90 and 90.");
		}
		if (selectedLongitude != null && (selectedLongitude < -180 || selectedLongitude > 180)) {
			throw new IllegalArgumentException("selectedLng must be between -180 and 180.");
		}
		if (!hasMapPoint && areaCode == null) {
			throw new IllegalArgumentException("selectedLat/selectedLng or areaCode is required.");
		}
		if (radius < 100 || radius > 20000) {
			throw new IllegalArgumentException("radius must be between 100 and 20000.");
		}
		if (language == null || language.isBlank()) {
			throw new IllegalArgumentException("lang is required.");
		}
	}
}
