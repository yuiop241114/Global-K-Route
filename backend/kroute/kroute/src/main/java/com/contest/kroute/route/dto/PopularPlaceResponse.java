package com.contest.kroute.route.dto;

public record PopularPlaceResponse(
		String contentId,
		String title,
		String category,
		String address,
		Double latitude,
		Double longitude,
		String imageUrl,
		String dataLanguage,
		Integer areaCode,
		Integer sigunguCode,
		long saveCount
) {
}
