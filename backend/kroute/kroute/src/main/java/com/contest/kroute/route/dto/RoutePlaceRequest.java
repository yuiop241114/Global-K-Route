package com.contest.kroute.route.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RoutePlaceRequest(
		@NotBlank @Size(max = 50) String contentId,
		@NotBlank @Size(max = 255) String title,
		@NotBlank @Size(max = 50) String category,
		@NotNull @Size(max = 500) String address,
		@NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
		@NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
		@Size(max = 2048) String imageUrl,
		@NotBlank @Size(max = 10) String dataLanguage,
		@Min(1) Integer areaCode,
		@Min(1) Integer sigunguCode,
		@Min(0) @Max(1440) Integer stayMinutes
) {
}
