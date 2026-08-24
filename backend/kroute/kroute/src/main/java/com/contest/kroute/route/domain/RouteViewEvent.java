package com.contest.kroute.route.domain;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
		name = "route_view_events",
		uniqueConstraints = @UniqueConstraint(
				name = "uk_route_view_daily_visitor",
				columnNames = {"route_id", "viewer_hash", "viewed_on"}
		),
		indexes = @Index(
				name = "idx_route_view_route_time",
				columnList = "route_id, viewed_at"
		)
)
public class RouteViewEvent {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "route_id", nullable = false)
	private TravelRoute route;

	@Column(name = "viewer_hash", nullable = false, length = 64)
	private String viewerHash;

	@Column(name = "viewed_on", nullable = false)
	private LocalDate viewedOn;

	@Column(name = "viewed_at", nullable = false)
	private Instant viewedAt;

	protected RouteViewEvent() {
	}
}
