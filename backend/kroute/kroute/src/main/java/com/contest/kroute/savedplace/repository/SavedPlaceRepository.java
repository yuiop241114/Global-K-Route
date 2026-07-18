package com.contest.kroute.savedplace.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.contest.kroute.savedplace.domain.SavedPlace;

public interface SavedPlaceRepository extends JpaRepository<SavedPlace, Long> {
	List<SavedPlace> findAllByUserIdOrderByCreatedAtDesc(Long userId);
	Optional<SavedPlace> findByUserIdAndContentId(Long userId, String contentId);
	long deleteByIdAndUserId(Long id, Long userId);
}
