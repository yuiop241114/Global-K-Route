package com.contest.kroute.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

	private final AppProperties appProperties;

	public CorsConfig(AppProperties appProperties) {
		this.appProperties = appProperties;
	}

	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/api/**")
						.allowedOrigins(resolveAllowedOrigins())
						.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
						.allowedHeaders("*")
						.allowCredentials(true);
			}
		};
	}

	private String[] resolveAllowedOrigins() {
		String configuredOrigins = appProperties.cors().allowedOrigins();
		if (configuredOrigins == null || configuredOrigins.isBlank()) {
			return new String[] { "http://localhost:3000" };
		}
		return Arrays.stream(configuredOrigins.split(","))
				.map(String::trim)
				.filter(origin -> !origin.isBlank())
				.toArray(String[]::new);
	}
}
