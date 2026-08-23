package com.contest.kroute.route.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.contest.kroute.route.domain.RoutePlace;

public interface RoutePlaceRepository extends JpaRepository<RoutePlace, Long> {
	@Query("SELECT place FROM RoutePlace place WHERE place.route.id = :routeId ORDER BY place.visitOrder")
	List<RoutePlace> findAllByRoute_IdOrderByVisitOrder(@Param("routeId") Long routeId);

	@Query("""
			SELECT place
			FROM RoutePlace place
			WHERE place.route.id IN :routeIds
			ORDER BY place.route.id ASC, place.visitOrder ASC
			""")
	List<RoutePlace> findAllByRouteIdsOrderByRouteAndVisitOrder(@Param("routeIds") List<Long> routeIds);

	@Modifying
	@Query("DELETE FROM RoutePlace place WHERE place.route.id = :routeId")
	long deleteAllByRouteId(@Param("routeId") Long routeId);
}
