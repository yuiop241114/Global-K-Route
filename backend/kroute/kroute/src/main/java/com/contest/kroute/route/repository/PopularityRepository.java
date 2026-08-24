package com.contest.kroute.route.repository;

import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import com.contest.kroute.route.dto.PopularPlaceSearchCriteria;
import com.contest.kroute.route.dto.PopularPlaceResponse;

@Repository
@Profile("!local")
public class PopularityRepository {
	private final EntityManager entityManager;

	public PopularityRepository(EntityManager entityManager) {
		this.entityManager = entityManager;
	}

	public List<PopularPlaceResponse> findPopularPlaces(PopularPlaceSearchCriteria criteria) {
		Map<String, Object> parameters = new LinkedHashMap<>();
		String whereClause = buildWhereClause(criteria, parameters);
		String sql = """
				WITH popularity AS (
				    SELECT sp.content_id, COUNT(DISTINCT sp.user_id) AS save_count
				    FROM saved_places sp
				    %s
				    GROUP BY sp.content_id
				), latest_snapshot AS (
				    SELECT sp.content_id, sp.title, sp.category, sp.address,
				           sp.latitude, sp.longitude, sp.image_url, sp.data_language,
				           sp.area_code, sp.sigungu_code,
				           ROW_NUMBER() OVER (
				               PARTITION BY sp.content_id
				               ORDER BY sp.updated_at DESC, sp.id DESC
				           ) AS snapshot_order
				    FROM saved_places sp
				    JOIN popularity popularity_result ON popularity_result.content_id = sp.content_id
				)
				SELECT snapshot.content_id, snapshot.title, snapshot.category, snapshot.address,
				       snapshot.latitude, snapshot.longitude, snapshot.image_url,
				       snapshot.data_language, snapshot.area_code, snapshot.sigungu_code,
				       popularity_result.save_count
				FROM popularity popularity_result
				JOIN latest_snapshot snapshot
				  ON snapshot.content_id = popularity_result.content_id
				 AND snapshot.snapshot_order = 1
				ORDER BY popularity_result.save_count DESC, snapshot.title ASC, snapshot.content_id ASC
				""".formatted(whereClause);

		Query query = entityManager.createNativeQuery(sql);
		parameters.forEach(query::setParameter);
		@SuppressWarnings("unchecked")
		List<Object[]> rows = query.setMaxResults(criteria.limit()).getResultList();

		return rows.stream().map(this::toResponse).toList();
	}

	private String buildWhereClause(PopularPlaceSearchCriteria criteria, Map<String, Object> parameters) {
		StringBuilder where = new StringBuilder("WHERE 1 = 1");
		if (criteria.savedAfter() != null) {
			where.append(" AND sp.created_at >= :savedAfter");
			parameters.put("savedAfter", Timestamp.from(criteria.savedAfter()));
		}
		if (criteria.areaCode() != null) {
			where.append(" AND sp.area_code = :areaCode");
			parameters.put("areaCode", criteria.areaCode());
		}
		if (criteria.category() != null) {
			where.append(" AND sp.category = :category");
			parameters.put("category", criteria.category());
		}
		return where.toString();
	}

	public Map<String, Long> findSaveCountsByContentIds(List<String> contentIds) {
		if (contentIds.isEmpty()) {
			return Map.of();
		}

		String sql = """
				SELECT sp.content_id, COUNT(DISTINCT sp.user_id) AS save_count
				FROM saved_places sp
				WHERE sp.content_id IN (:contentIds)
				GROUP BY sp.content_id
				""";

		@SuppressWarnings("unchecked")
		List<Object[]> rows = entityManager.createNativeQuery(sql)
				.setParameter("contentIds", contentIds)
				.getResultList();

		return rows.stream().collect(Collectors.toMap(
				row -> (String) row[0],
				row -> ((Number) row[1]).longValue()
		));
	}

	private PopularPlaceResponse toResponse(Object[] row) {
		return new PopularPlaceResponse(
				(String) row[0],
				(String) row[1],
				(String) row[2],
				(String) row[3],
				((Number) row[4]).doubleValue(),
				((Number) row[5]).doubleValue(),
				(String) row[6],
				(String) row[7],
				row[8] == null ? null : ((Number) row[8]).intValue(),
				row[9] == null ? null : ((Number) row[9]).intValue(),
				((Number) row[10]).longValue()
		);
	}
}
