package com.contest.kroute.external.tour;

import java.util.List;

import org.springframework.stereotype.Component;

import com.contest.kroute.place.dto.NearbyPlaceResponse;
import com.contest.kroute.place.dto.NearbyPlaceSearchRequest;

@Component
public class TourApiClient {

	public List<NearbyPlaceResponse> findNearbyPlaces(NearbyPlaceSearchRequest request) {
		double latitude = request.selectedLatitude() == null ? 37.5665 : request.selectedLatitude();
		double longitude = request.selectedLongitude() == null ? 126.9780 : request.selectedLongitude();

		return List.of(
				new NearbyPlaceResponse(
						"sample-1",
						"Sample K-Route Place",
						request.contentType() == null || request.contentType().isBlank()
								? "tourist_attraction"
								: request.contentType(),
						"Seoul, Korea",
						latitude,
						longitude,
						120,
						null
				)
		);
	}
}
