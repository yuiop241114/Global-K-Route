package com.contest.kroute.route.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
		name = "route_places",
		uniqueConstraints = {
				@UniqueConstraint(name = "uk_route_places_route_content", columnNames = {"route_id", "content_id"}),
				@UniqueConstraint(name = "uk_route_places_route_order", columnNames = {"route_id", "visit_order"})
		}
)
public class RoutePlace {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "route_id", nullable = false)
	private TravelRoute route;

	@Column(name = "content_id", nullable = false, length = 50)
	private String contentId;

	@Column(nullable = false, length = 255)
	private String title;

	@Column(nullable = false, length = 50)
	private String category;

	@Column(nullable = false, length = 500)
	private String address;

	@Column(nullable = false)
	private Double latitude;

	@Column(nullable = false)
	private Double longitude;

	@Column(name = "image_url", length = 2048)
	private String imageUrl;

	@Column(name = "data_language", nullable = false, length = 10)
	private String dataLanguage;

	@Column(name = "visit_order", nullable = false)
	private Integer visitOrder;

	@Column(name = "stay_minutes")
	private Integer stayMinutes;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected RoutePlace() {
	}

	public RoutePlace(TravelRoute route, String contentId, String title, String category, String address,
			Double latitude, Double longitude, String imageUrl, String dataLanguage, Integer visitOrder,
			Integer stayMinutes) {
		this.route = route;
		this.contentId = contentId;
		this.title = title;
		this.category = category;
		this.address = address;
		this.latitude = latitude;
		this.longitude = longitude;
		this.imageUrl = imageUrl;
		this.dataLanguage = dataLanguage;
		this.visitOrder = visitOrder;
		this.stayMinutes = stayMinutes;
	}

	@PrePersist
	void onCreate() {
		createdAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public String getContentId() {
		return contentId;
	}

	public String getTitle() {
		return title;
	}

	public String getCategory() {
		return category;
	}

	public String getAddress() {
		return address;
	}

	public Double getLatitude() {
		return latitude;
	}

	public Double getLongitude() {
		return longitude;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public String getDataLanguage() {
		return dataLanguage;
	}

	public Integer getVisitOrder() {
		return visitOrder;
	}

	public Integer getStayMinutes() {
		return stayMinutes;
	}
}
