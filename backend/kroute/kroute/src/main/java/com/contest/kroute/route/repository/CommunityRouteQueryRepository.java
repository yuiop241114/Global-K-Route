package com.contest.kroute.route.repository;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import com.contest.kroute.route.dto.PublicRouteSearchCriteria;
import com.contest.kroute.route.dto.RoutePopularityMetrics;

@Repository
@Profile("!local")
public class CommunityRouteQueryRepository {
	private static final String PLACE_COUNT_SQL = "(SELECT COUNT(*) FROM route_places count_place "
			+ "WHERE count_place.route_id = tr.id)";
	private static final String COPY_COUNT_SQL = "(SELECT COUNT(*) FROM travel_routes copied "
			+ "WHERE copied.source_route_id = tr.id "
			+ "AND copied.user_id <> (SELECT original.user_id FROM travel_routes original "
			+ "WHERE original.id = copied.source_route_id))";
	private static final String VIEW_COUNT_SQL = "(SELECT COUNT(*) FROM route_view_events viewed "
			+ "WHERE viewed.route_id = tr.id)";
	private static final String PLACE_SAVE_COUNT_SQL = "(SELECT COUNT(*) FROM saved_places place_save "
			+ "JOIN route_places scored_place ON scored_place.content_id = place_save.content_id "
			+ "WHERE scored_place.route_id = tr.id)";

	private final EntityManager entityManager;

	public CommunityRouteQueryRepository(EntityManager entityManager) {
		this.entityManager = entityManager;
	}

	public PublicRouteQueryResult findPublicRouteIds(PublicRouteSearchCriteria criteria) {
		Map<String, Object> parameters = new LinkedHashMap<>();
		String whereClause = buildWhereClause(criteria, parameters);
		Map<String, Object> orderParameters = new LinkedHashMap<>();
		String selectSql = "SELECT tr.id FROM travel_routes tr" + whereClause
				+ orderBy(criteria, orderParameters);
		String countSql = "SELECT COUNT(*) FROM travel_routes tr" + whereClause;

		Query routeQuery = entityManager.createNativeQuery(selectSql);
		Query countQuery = entityManager.createNativeQuery(countSql);
		parameters.forEach((name, value) -> {
			routeQuery.setParameter(name, value);
			countQuery.setParameter(name, value);
		});
		orderParameters.forEach(routeQuery::setParameter);
		long totalElements = ((Number) countQuery.getSingleResult()).longValue();

		long offset = (long) criteria.page() * criteria.size();
		if (offset > Integer.MAX_VALUE) {
			return new PublicRouteQueryResult(List.of(), totalElements);
		}
		routeQuery.setFirstResult((int) offset);
		routeQuery.setMaxResults(criteria.size());

		@SuppressWarnings("unchecked")
		List<Number> rows = routeQuery.getResultList();
		return new PublicRouteQueryResult(
				rows.stream().map(Number::longValue).toList(),
				totalElements
		);
	}

	public Map<Long, RoutePopularityMetrics> findPopularityMetrics(List<Long> routeIds, Instant scoredAt) {
		if (routeIds.isEmpty()) {
			return Map.of();
		}
		Instant weekAfter = scoredAt.minus(Duration.ofDays(7));
		Instant monthAfter = scoredAt.minus(Duration.ofDays(30));
		String sql = """
				SELECT tr.id,
				       COUNT(DISTINCT CASE WHEN copied.user_id <> tr.user_id THEN copied.id END),
				       COUNT(DISTINCT viewed.id),
				       COUNT(DISTINCT CASE WHEN copied.user_id <> tr.user_id
				             AND copied.created_at >= :weekAfter THEN copied.id END),
				       COUNT(DISTINCT CASE WHEN copied.user_id <> tr.user_id
				             AND copied.created_at >= :monthAfter THEN copied.id END),
				       COUNT(DISTINCT CASE WHEN viewed.viewed_at >= :weekAfter THEN viewed.id END),
				       COUNT(DISTINCT CASE WHEN viewed.viewed_at >= :monthAfter THEN viewed.id END)
				FROM travel_routes tr
				LEFT JOIN travel_routes copied ON copied.source_route_id = tr.id
				LEFT JOIN route_view_events viewed ON viewed.route_id = tr.id
				WHERE tr.id IN (:routeIds)
				GROUP BY tr.id
				""";
		@SuppressWarnings("unchecked")
		List<Object[]> rows = entityManager.createNativeQuery(sql)
				.setParameter("routeIds", routeIds)
				.setParameter("weekAfter", Timestamp.from(weekAfter))
				.setParameter("monthAfter", Timestamp.from(monthAfter))
				.getResultList();
		return rows.stream().collect(java.util.stream.Collectors.toMap(
				row -> ((Number) row[0]).longValue(),
				row -> new RoutePopularityMetrics(
						((Number) row[1]).longValue(),
						((Number) row[2]).longValue(),
						((Number) row[3]).longValue(),
						((Number) row[4]).longValue(),
						((Number) row[5]).longValue(),
						((Number) row[6]).longValue()
				)
		));
	}

	private String buildWhereClause(PublicRouteSearchCriteria criteria, Map<String, Object> parameters) {
		StringBuilder where = new StringBuilder(" WHERE tr.is_public = 1");
		if (criteria.query() != null) {
			where.append(" AND LOWER(tr.title) LIKE :titleQuery");
			parameters.put("titleQuery", "%" + criteria.query().toLowerCase(java.util.Locale.ROOT) + "%");
		}
		if (criteria.areaCode() != null) {
			where.append(" AND EXISTS (SELECT 1 FROM route_places area_place")
					.append(" WHERE area_place.route_id = tr.id AND area_place.area_code = :areaCode)");
			parameters.put("areaCode", criteria.areaCode());
		}
		if (criteria.minPlaces() != null) {
			where.append(" AND ").append(PLACE_COUNT_SQL).append(" >= :minPlaces");
			parameters.put("minPlaces", criteria.minPlaces());
		}
		if (criteria.maxPlaces() != null) {
			where.append(" AND ").append(PLACE_COUNT_SQL).append(" <= :maxPlaces");
			parameters.put("maxPlaces", criteria.maxPlaces());
		}
		return where.toString();
	}

	private String orderBy(PublicRouteSearchCriteria criteria, Map<String, Object> parameters) {
		return switch (criteria.sort()) {
			case POPULAR -> popularOrderBy(criteria, parameters);
			case PLACE_COUNT -> " ORDER BY " + PLACE_COUNT_SQL
					+ " DESC, tr.published_at DESC, tr.id DESC";
			case LATEST -> " ORDER BY tr.published_at DESC, tr.id DESC";
		};
	}

	private String popularOrderBy(PublicRouteSearchCriteria criteria, Map<String, Object> parameters) {
		Instant weekAfter = criteria.scoredAt().minus(Duration.ofDays(7));
		Instant monthAfter = criteria.scoredAt().minus(Duration.ofDays(30));
		parameters.put("weekAfter", Timestamp.from(weekAfter));
		parameters.put("monthAfter", Timestamp.from(monthAfter));
		String weeklyCopyCount = recentCopyCountSql("weekAfter");
		String monthlyCopyCount = recentCopyCountSql("monthAfter");
		String weeklyViewCount = recentViewCountSql("weekAfter");
		String monthlyViewCount = recentViewCountSql("monthAfter");
		String averagePlaceSaves = "(" + PLACE_SAVE_COUNT_SQL + " / GREATEST(" + PLACE_COUNT_SQL + ", 1))";
		String score = "(" + COPY_COUNT_SQL + " * 10.0"
				+ " + " + VIEW_COUNT_SQL
				+ " + " + averagePlaceSaves + " * 2.0"
				+ " + LEAST(" + PLACE_COUNT_SQL + ", 8) * 0.5"
				+ " + " + weeklyCopyCount + " * 6.0"
				+ " + " + monthlyCopyCount + " * 3.0"
				+ " + " + weeklyViewCount + " * 0.6"
				+ " + " + monthlyViewCount + " * 0.3)";
		return " ORDER BY " + score + " DESC, tr.published_at DESC, tr.id DESC";
	}

	private String recentCopyCountSql(String parameterName) {
		return "(SELECT COUNT(*) FROM travel_routes recent_copy "
				+ "WHERE recent_copy.source_route_id = tr.id "
				+ "AND recent_copy.user_id <> (SELECT original.user_id FROM travel_routes original "
				+ "WHERE original.id = recent_copy.source_route_id) "
				+ "AND recent_copy.created_at >= :" + parameterName + ")";
	}

	private String recentViewCountSql(String parameterName) {
		return "(SELECT COUNT(*) FROM route_view_events recent_view "
				+ "WHERE recent_view.route_id = tr.id "
				+ "AND recent_view.viewed_at >= :" + parameterName + ")";
	}
}
