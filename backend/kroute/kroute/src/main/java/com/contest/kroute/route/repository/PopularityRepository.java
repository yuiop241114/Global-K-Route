package com.contest.kroute.route.repository;

import java.util.List;

import jakarta.persistence.EntityManager;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import com.contest.kroute.route.dto.PopularPlaceResponse;

@Repository
@Profile("!local")
public class PopularityRepository {
	private final EntityManager entityManager;

	public PopularityRepository(EntityManager entityManager) {
		this.entityManager = entityManager;
	}

	public List<PopularPlaceResponse> findPopularPlaces(int limit) {
		String sql = """
				SELECT place_data.content_id,
				       MAX(place_data.title) AS title,
				       MAX(place_data.category) AS category,
				       MAX(place_data.address) AS address,
				       MAX(place_data.latitude) AS latitude,
				       MAX(place_data.longitude) AS longitude,
				       MAX(place_data.image_url) AS image_url,
				       MAX(place_data.data_language) AS data_language,
				       COUNT(DISTINCT place_data.user_id) AS save_count
				FROM (
				    SELECT sp.user_id, sp.content_id, sp.title, sp.category, sp.address,
				           sp.latitude, sp.longitude, sp.image_url, sp.data_language
				    FROM saved_places sp
				    UNION ALL
				    SELECT tr.user_id, rp.content_id, rp.title, rp.category, rp.address,
				           rp.latitude, rp.longitude, rp.image_url, rp.data_language
				    FROM route_places rp
				    JOIN travel_routes tr ON tr.id = rp.route_id
				) place_data
				GROUP BY place_data.content_id
				ORDER BY save_count DESC, title ASC
				""";

		@SuppressWarnings("unchecked")
		List<Object[]> rows = entityManager.createNativeQuery(sql)
				.setMaxResults(limit)
				.getResultList();

		return rows.stream().map(this::toResponse).toList();
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
				((Number) row[8]).longValue()
		);
	}
}
