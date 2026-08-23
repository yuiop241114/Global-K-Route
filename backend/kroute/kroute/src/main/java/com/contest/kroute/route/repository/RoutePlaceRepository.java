package com.contest.kroute.route.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.contest.kroute.route.domain.RoutePlace;

public interface RoutePlaceRepository extends JpaRepository<RoutePlace, Long> {
	List<RoutePlace> findAllByRouteIdOrderByVisitOrder(Long routeId);
	List<RoutePlace> findAllByRouteIdInOrderByRouteIdAscVisitOrderAsc(List<Long> routeIds);
	long deleteAllByRouteId(Long routeId);
}
