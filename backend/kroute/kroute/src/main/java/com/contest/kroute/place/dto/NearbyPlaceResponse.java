package com.contest.kroute.place.dto;

public record NearbyPlaceResponse(
		String contentId,
		String title,
		String category,
		String address,
		double latitude,
		double longitude,
		int distanceMeters,
		String imageUrl,
		Integer areaCode,
		Integer sigunguCode
) {
}
