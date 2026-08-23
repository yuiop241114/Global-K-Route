package com.contest.kroute.route.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.contest.kroute.route.domain.TravelRoute;

public interface TravelRouteRepository extends JpaRepository<TravelRoute, Long> {
	List<TravelRoute> findAllByUserIdOrderByUpdatedAtDesc(Long userId);
	Optional<TravelRoute> findByIdAndUserId(Long id, Long userId);
	Optional<TravelRoute> findByIdAndPublicRouteTrue(Long id);
	long countBySourceRouteId(Long sourceRouteId);
	long deleteByIdAndUserId(Long id, Long userId);
}
