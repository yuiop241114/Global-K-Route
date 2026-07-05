package com.contest.kroute.place.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.contest.kroute.external.tour.TourApiClient;
import com.contest.kroute.place.dto.NearbyPlaceResponse;
import com.contest.kroute.place.dto.NearbyPlaceSearchRequest;
import com.contest.kroute.place.dto.PlaceDetailResponse;
import com.contest.kroute.search.service.SearchLogRecorder;

@Service
public class PlaceService {

	private final TourApiClient tourApiClient;
	private final SearchLogRecorder searchLogRecorder;

	public PlaceService(TourApiClient tourApiClient, SearchLogRecorder searchLogRecorder) {
		this.tourApiClient = tourApiClient;
		this.searchLogRecorder = searchLogRecorder;
	}

	public List<NearbyPlaceResponse> findNearbyPlaces(NearbyPlaceSearchRequest request) {
		searchLogRecorder.record(request);
		return tourApiClient.findNearbyPlaces(request);
	}

	public PlaceDetailResponse findPlaceDetail(String contentId, String language, String contentType) {
		return tourApiClient.findPlaceDetail(contentId, language, contentType);
	}
}
