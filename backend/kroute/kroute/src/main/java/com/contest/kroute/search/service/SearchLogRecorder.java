package com.contest.kroute.search.service;

import com.contest.kroute.place.dto.NearbyPlaceSearchRequest;

public interface SearchLogRecorder {
	void record(NearbyPlaceSearchRequest request);
}
