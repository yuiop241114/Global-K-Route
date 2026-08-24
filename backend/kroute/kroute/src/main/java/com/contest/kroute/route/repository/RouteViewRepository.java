package com.contest.kroute.route.repository;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.EntityManager;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!local")
public class RouteViewRepository {
	private final EntityManager entityManager;

	public RouteViewRepository(EntityManager entityManager) {
		this.entityManager = entityManager;
	}

	public boolean recordDailyView(Long routeId, String viewerHash, LocalDate viewedOn, Instant viewedAt) {
		String sql = """
				INSERT IGNORE INTO route_view_events
				    (route_id, viewer_hash, viewed_on, viewed_at)
				VALUES (:routeId, :viewerHash, :viewedOn, :viewedAt)
				""";
		int inserted = entityManager.createNativeQuery(sql)
				.setParameter("routeId", routeId)
				.setParameter("viewerHash", viewerHash)
				.setParameter("viewedOn", Date.valueOf(viewedOn))
				.setParameter("viewedAt", Timestamp.from(viewedAt))
				.executeUpdate();
		return inserted > 0;
	}
}
