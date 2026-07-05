package com.contest.kroute.place.dto;

import java.util.List;
import java.util.Map;

public record PlaceDetailResponse(
		String contentId,
		String category,
		String dataLanguage,
		boolean fallbackUsed,
		String title,
		String overview,
		String address,
		String phone,
		String homepage,
		Double latitude,
		Double longitude,
		String primaryImageUrl,
		List<String> imageUrls,
		VisitInfo visitInfo,
		RestaurantInfo restaurantInfo,
		AccommodationInfo accommodationInfo,
		List<AdditionalInfoItem> additionalInfo
) {
	public record VisitInfo(
			String openingHours,
			String closedDays,
			String useFee,
			String parking,
			String reservation,
			String informationCenter,
			String experienceGuide,
			String creditCard,
			String petAllowed
	) {
	}

	public record RestaurantInfo(
			String firstMenu,
			String menu,
			String packing,
			String kidsFacility,
			String smoking
	) {
	}

	public record AccommodationInfo(
			String checkInTime,
			String checkOutTime,
			String roomCount,
			String roomType,
			String foodPlace,
			String subFacilities,
			String pickup,
			String bookingUrl
	) {
	}

	public record AdditionalInfoItem(
			String title,
			String description,
			String imageUrl,
			Map<String, String> attributes
	) {
	}
}
