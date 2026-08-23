package com.contest.kroute.savedplace.dto;

import java.time.Instant;

import com.contest.kroute.savedplace.domain.SavedPlace;

public record SavedPlaceResponse(
		Long id,
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
		Instant createdAt
) {
	public static SavedPlaceResponse from(SavedPlace place) {
		return new SavedPlaceResponse(
				place.getId(),
				place.getContentId(),
				place.getTitle(),
				place.getCategory(),
				place.getAddress(),
				place.getLatitude(),
				place.getLongitude(),
				place.getImageUrl(),
				place.getDataLanguage(),
				place.getAreaCode(),
				place.getSigunguCode(),
				place.getCreatedAt()
		);
	}
}
