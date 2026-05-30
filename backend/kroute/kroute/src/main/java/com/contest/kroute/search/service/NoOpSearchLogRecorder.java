package com.contest.kroute.search.service;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.contest.kroute.place.dto.NearbyPlaceSearchRequest;

@Service
@Profile("local")
public class NoOpSearchLogRecorder implements SearchLogRecorder {

	@Override
	public void record(NearbyPlaceSearchRequest request) {
	}
}
