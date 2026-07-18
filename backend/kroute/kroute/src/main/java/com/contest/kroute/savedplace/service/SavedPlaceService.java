package com.contest.kroute.savedplace.service;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.contest.kroute.auth.domain.UserAccount;
import com.contest.kroute.auth.repository.UserAccountRepository;
import com.contest.kroute.savedplace.domain.SavedPlace;
import com.contest.kroute.savedplace.dto.SavePlaceRequest;
import com.contest.kroute.savedplace.dto.SavedPlaceResponse;
import com.contest.kroute.savedplace.repository.SavedPlaceRepository;

@Service
@Profile("!local")
public class SavedPlaceService {
	private final SavedPlaceRepository savedPlaceRepository;
	private final UserAccountRepository userAccountRepository;

	public SavedPlaceService(SavedPlaceRepository savedPlaceRepository, UserAccountRepository userAccountRepository) {
		this.savedPlaceRepository = savedPlaceRepository;
		this.userAccountRepository = userAccountRepository;
	}

	@Transactional(readOnly = true)
	public List<SavedPlaceResponse> findAll(Long userId) {
		return savedPlaceRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
				.map(SavedPlaceResponse::from)
				.toList();
	}

	@Transactional
	public SavedPlaceResponse save(Long userId, SavePlaceRequest request) {
		SavedPlace place = savedPlaceRepository.findByUserIdAndContentId(userId, request.contentId())
				.orElseGet(() -> createPlace(userId, request));
		place.updateSnapshot(
				request.title().trim(),
				request.category().trim(),
				request.address().trim(),
				request.latitude(),
				request.longitude(),
				normalizeNullable(request.imageUrl()),
				request.dataLanguage().trim().toLowerCase()
		);
		return SavedPlaceResponse.from(savedPlaceRepository.save(place));
	}

	@Transactional
	public void delete(Long userId, Long savedPlaceId) {
		savedPlaceRepository.deleteByIdAndUserId(savedPlaceId, userId);
	}

	private SavedPlace createPlace(Long userId, SavePlaceRequest request) {
		UserAccount user = userAccountRepository.getReferenceById(userId);
		return new SavedPlace(
				user,
				request.contentId().trim(),
				request.title().trim(),
				request.category().trim(),
				request.address().trim(),
				request.latitude(),
				request.longitude(),
				normalizeNullable(request.imageUrl()),
				request.dataLanguage().trim().toLowerCase()
		);
	}

	private String normalizeNullable(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
