package com.contest.kroute.search.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "search_logs")
public class SearchLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Enumerated(EnumType.STRING)
	@Column(name = "search_basis", nullable = false, length = 20)
	private SearchBasis searchBasis;

	@Column(name = "area_code")
	private Integer areaCode;

	@Column(name = "sigungu_code")
	private Integer sigunguCode;

	@Column(name = "selected_latitude")
	private Double selectedLatitude;

	@Column(name = "selected_longitude")
	private Double selectedLongitude;

	@Column(nullable = false)
	private Integer radius;

	@Column(nullable = false, length = 10)
	private String language;

	@Column(name = "content_type", length = 50)
	private String contentType;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected SearchLog() {
	}

	private SearchLog(
			SearchBasis searchBasis,
			Integer areaCode,
			Integer sigunguCode,
			Double selectedLatitude,
			Double selectedLongitude,
			Integer radius,
			String language,
			String contentType
	) {
		this.searchBasis = searchBasis;
		this.areaCode = areaCode;
		this.sigunguCode = sigunguCode;
		this.selectedLatitude = selectedLatitude;
		this.selectedLongitude = selectedLongitude;
		this.radius = radius;
		this.language = language;
		this.contentType = contentType;
		this.createdAt = Instant.now();
	}

	public static SearchLog of(
			SearchBasis searchBasis,
			Integer areaCode,
			Integer sigunguCode,
			Double selectedLatitude,
			Double selectedLongitude,
			Integer radius,
			String language,
			String contentType
	) {
		return new SearchLog(
				searchBasis,
				areaCode,
				sigunguCode,
				selectedLatitude,
				selectedLongitude,
				radius,
				language,
				contentType
		);
	}

	public Long getId() {
		return id;
	}
}
