package com.contest.kroute.route.repository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import com.contest.kroute.route.dto.PublicRouteSearchCriteria;

@Repository
@Profile("!local")
public class CommunityRouteQueryRepository {
	private static final String PLACE_COUNT_SQL = "(SELECT COUNT(*) FROM route_places count_place "
			+ "WHERE count_place.route_id = tr.id)";

	private final EntityManager entityManager;

	public CommunityRouteQueryRepository(EntityManager entityManager) {
		this.entityManager = entityManager;
	}

	public PublicRouteQueryResult findPublicRouteIds(PublicRouteSearchCriteria criteria) {
		Map<String, Object> parameters = new LinkedHashMap<>();
		String whereClause = buildWhereClause(criteria, parameters);
		String selectSql = "SELECT tr.id FROM travel_routes tr" + whereClause + orderBy(criteria);
		String countSql = "SELECT COUNT(*) FROM travel_routes tr" + whereClause;

		Query routeQuery = entityManager.createNativeQuery(selectSql);
		Query countQuery = entityManager.createNativeQuery(countSql);
		parameters.forEach((name, value) -> {
			routeQuery.setParameter(name, value);
			countQuery.setParameter(name, value);
		});
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

	public Map<Long, Long> findCopyCounts(List<Long> routeIds) {
		if (routeIds.isEmpty()) {
			return Map.of();
		}
		String sql = "SELECT source_route_id, COUNT(*) FROM travel_routes "
				+ "WHERE source_route_id IN (:routeIds) GROUP BY source_route_id";
		@SuppressWarnings("unchecked")
		List<Object[]> rows = entityManager.createNativeQuery(sql)
				.setParameter("routeIds", routeIds)
				.getResultList();
		return rows.stream().collect(java.util.stream.Collectors.toMap(
				row -> ((Number) row[0]).longValue(),
				row -> ((Number) row[1]).longValue()
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

	private String orderBy(PublicRouteSearchCriteria criteria) {
		return switch (criteria.sort()) {
			case POPULAR -> " ORDER BY (SELECT COUNT(*) FROM travel_routes copied "
					+ "WHERE copied.source_route_id = tr.id) DESC, tr.published_at DESC, tr.id DESC";
			case PLACE_COUNT -> " ORDER BY " + PLACE_COUNT_SQL
					+ " DESC, tr.published_at DESC, tr.id DESC";
			case LATEST -> " ORDER BY tr.published_at DESC, tr.id DESC";
		};
	}
}
