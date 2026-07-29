package com.contest.kroute.auth.security;

import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

import com.contest.kroute.config.AppProperties;

@Configuration
public class SecurityConfig {

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	@Profile("!local")
	public SecurityFilterChain securityFilterChain(HttpSecurity http,
			SessionAuthenticationFilter sessionFilter, AppProperties appProperties) throws Exception {
		CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
		csrfRepository.setCookieCustomizer(cookie -> cookie
				.path("/")
				.sameSite("Lax")
				.secure(appProperties.auth().secureCookie())
				.maxAge(Duration.ofDays(1)));

		return http
				.httpBasic(basic -> basic.disable())
				.formLogin(form -> form.disable())
				.logout(logout -> logout.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.csrf(csrf -> csrf.csrfTokenRepository(csrfRepository))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/api/health/**", "/actuator/health/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/places/**", "/api/public/**",
								"/api/auth/csrf", "/api/auth/me").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/auth/signup", "/api/auth/login",
								"/api/auth/username/reminder", "/api/auth/password/forgot",
								"/api/auth/password/reset").permitAll()
						.anyRequest().authenticated())
				.addFilterBefore(sessionFilter, AnonymousAuthenticationFilter.class)
				.build();
	}

	@Bean
	@Profile("local")
	public SecurityFilterChain localSecurityFilterChain(HttpSecurity http) throws Exception {
		return http.csrf(csrf -> csrf.disable())
				.authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
				.build();
	}
}
