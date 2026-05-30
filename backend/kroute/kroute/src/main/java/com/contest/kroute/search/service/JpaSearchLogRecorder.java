package com.contest.kroute.search.service;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.contest.kroute.place.dto.NearbyPlaceSearchRequest;
import com.contest.kroute.search.domain.SearchLog;
import com.contest.kroute.search.repository.SearchLogRepository;

@Service
@Profile("!local")
public class JpaSearchLogRecorder implements SearchLogRecorder {

	private final SearchLogRepository searchLogRepository;

	public JpaSearchLogRecorder(SearchLogRepository searchLogRepository) {
		this.searchLogRepository = searchLogRepository;
	}

	@Override
	@Transactional
	public void record(NearbyPlaceSearchRequest request) {
		searchLogRepository.save(SearchLog.of(
				request.searchBasis(),
				request.areaCode(),
				request.sigunguCode(),
				request.selectedLatitude(),
				request.selectedLongitude(),
				request.radius(),
				request.language(),
				request.contentType()
		));
	}
}
