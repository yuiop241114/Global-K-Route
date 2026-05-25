package com.contest.kroute.place.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.contest.kroute.external.tour.TourApiClient;
import com.contest.kroute.place.dto.NearbyPlaceResponse;

@Service
public class PlaceService {

	private final TourApiClient tourApiClient;

	public PlaceService(TourApiClient tourApiClient) {
		this.tourApiClient = tourApiClient;
	}

	public List<NearbyPlaceResponse> findNearbyPlaces(
			double latitude,
			double longitude,
			int radius,
			String language,
			String contentType
	) {
		return tourApiClient.findNearbyPlaces(latitude, longitude, radius, language, contentType);
	}
}
