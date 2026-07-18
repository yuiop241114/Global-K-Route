package com.contest.kroute.savedplace.domain;

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
import jakarta.persistence.UniqueConstraint;

import com.contest.kroute.auth.domain.UserAccount;

@Entity
@Table(
		name = "saved_places",
		uniqueConstraints = @UniqueConstraint(
				name = "uk_saved_places_user_content",
				columnNames = {"user_id", "content_id"}
		)
)
public class SavedPlace {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private UserAccount user;

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

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected SavedPlace() {
	}

	public SavedPlace(UserAccount user, String contentId, String title, String category, String address,
			Double latitude, Double longitude, String imageUrl, String dataLanguage) {
		this.user = user;
		this.contentId = contentId;
		updateSnapshot(title, category, address, latitude, longitude, imageUrl, dataLanguage);
	}

	public void updateSnapshot(String title, String category, String address, Double latitude, Double longitude,
			String imageUrl, String dataLanguage) {
		this.title = title;
		this.category = category;
		this.address = address;
		this.latitude = latitude;
		this.longitude = longitude;
		this.imageUrl = imageUrl;
		this.dataLanguage = dataLanguage;
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

	public Instant getCreatedAt() {
		return createdAt;
	}
}
