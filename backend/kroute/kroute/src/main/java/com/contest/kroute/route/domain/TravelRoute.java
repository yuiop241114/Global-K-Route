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
	}

	public void changeTitle(String title) {
		this.title = title;
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
