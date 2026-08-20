package com.contest.kroute.route.domain;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import com.contest.kroute.auth.domain.UserAccount;

@Entity
@Table(name = "travel_routes")
public class TravelRoute {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private UserAccount user;

	@Column(nullable = false, length = 100)
	private String title;

	@Column(length = 1000)
	private String description;

	@Column(name = "travel_date")
	private LocalDate travelDate;

	@Enumerated(EnumType.STRING)
	@Column(name = "transport_mode", nullable = false, length = 20)
	private RouteTransportMode transportMode;

	@Column(name = "is_public", nullable = false)
	private boolean publicRoute;

	@Column(name = "published_at")
	private Instant publishedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "source_route_id")
	private TravelRoute sourceRoute;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected TravelRoute() {
	}

	public TravelRoute(UserAccount user, String title) {
		this.user = user;
		this.title = title;
		this.transportMode = RouteTransportMode.WALKING;
	}

	public void changeDetails(String title, String description, LocalDate travelDate,
			RouteTransportMode transportMode) {
		this.title = title;
		this.description = description;
		this.travelDate = travelDate;
		this.transportMode = transportMode == null ? RouteTransportMode.WALKING : transportMode;
	}

	public void copyDetailsFrom(TravelRoute source) {
		changeDetails(source.title, source.description, source.travelDate, source.transportMode);
	}

	public void touch() {
		updatedAt = Instant.now();
	}

	public void changeVisibility(boolean publicRoute) {
		this.publicRoute = publicRoute;
		this.publishedAt = publicRoute ? Instant.now() : null;
	}

	public void setSourceRoute(TravelRoute sourceRoute) {
		this.sourceRoute = sourceRoute;
	}

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public String getTitle() {
		return title;
	}

	public String getDescription() {
		return description;
	}

	public LocalDate getTravelDate() {
		return travelDate;
	}

	public RouteTransportMode getTransportMode() {
		return transportMode;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public boolean isPublicRoute() {
		return publicRoute;
	}

	public Instant getPublishedAt() {
		return publishedAt;
	}
}
