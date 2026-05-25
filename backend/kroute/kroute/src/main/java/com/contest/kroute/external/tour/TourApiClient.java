package com.contest.kroute.external.tour;

import java.util.List;

import org.springframework.stereotype.Component;

import com.contest.kroute.place.dto.NearbyPlaceResponse;

@Component
public class TourApiClient {

	public List<NearbyPlaceResponse> findNearbyPlaces(
			double latitude,
			double longitude,
			int radius,
			String language,
			String contentType
	) {
		return List.of(
				new NearbyPlaceResponse(
						"sample-1",
						"Sample K-Route Place",
						contentType == null || contentType.isBlank() ? "tourist_attraction" : contentType,
						"Seoul, Korea",
						latitude,
						longitude,
						120,
						null
				)
		);
	}
}
