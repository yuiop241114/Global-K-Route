package com.contest.kroute.auth.security;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.contest.kroute.auth.repository.AuthSessionRepository;
import com.contest.kroute.auth.service.TokenCodec;

@Component
@Profile("!local")
public class SessionAuthenticationFilter extends OncePerRequestFilter {
	public static final String COOKIE_NAME = "KROUTE_SESSION";

	private final AuthSessionRepository sessionRepository;
	private final TokenCodec tokenCodec;

	public SessionAuthenticationFilter(AuthSessionRepository sessionRepository, TokenCodec tokenCodec) {
		this.sessionRepository = sessionRepository;
		this.tokenCodec = tokenCodec;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		String rawToken = readCookie(request);
		if (rawToken != null && SecurityContextHolder.getContext().getAuthentication() == null) {
			sessionRepository.findByTokenHash(tokenCodec.hash(rawToken))
					.filter(session -> session.getExpiresAt().isAfter(Instant.now()))
					.ifPresent(session -> {
						var user = session.getUser();
						var principal = new UserPrincipal(user.getId(), user.getUsername(), user.getEmail());
						SecurityContextHolder.getContext().setAuthentication(
								new UsernamePasswordAuthenticationToken(principal, null, java.util.List.of()));
					});
		}
		filterChain.doFilter(request, response);
	}

	public static String readCookie(HttpServletRequest request) {
		if (request.getCookies() == null) {
			return null;
		}
		return Arrays.stream(request.getCookies())
				.filter(cookie -> COOKIE_NAME.equals(cookie.getName()))
				.map(Cookie::getValue)
				.findFirst()
				.orElse(null);
	}
}
