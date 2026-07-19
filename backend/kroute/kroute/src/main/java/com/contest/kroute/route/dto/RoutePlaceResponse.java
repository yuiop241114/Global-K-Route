package com.contest.kroute.route.dto;

import com.contest.kroute.route.domain.RoutePlace;

public record RoutePlaceResponse(
		Long id,
		String contentId,
		String title,
		String category,
		String address,
		Double latitude,
		Double longitude,
		String imageUrl,
		String dataLanguage,
		Integer visitOrder,
		Integer stayMinutes
) {
	public static RoutePlaceResponse from(RoutePlace place) {
		return new RoutePlaceResponse(
				place.getId(),
				place.getContentId(),
				place.getTitle(),
				place.getCategory(),
				place.getAddress(),
				place.getLatitude(),
				place.getLongitude(),
				place.getImageUrl(),
				place.getDataLanguage(),
				place.getVisitOrder(),
				place.getStayMinutes()
		);
	}
}
