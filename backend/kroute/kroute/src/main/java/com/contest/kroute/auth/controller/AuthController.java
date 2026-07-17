package com.contest.kroute.auth.controller;

import java.time.Duration;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.contest.kroute.auth.dto.AuthRequests;
import com.contest.kroute.auth.dto.AuthResponses;
import com.contest.kroute.auth.security.SessionAuthenticationFilter;
import com.contest.kroute.auth.security.UserPrincipal;
import com.contest.kroute.auth.service.AuthService;
import com.contest.kroute.common.ApiResponse;
import com.contest.kroute.config.AppProperties;

@RestController
@RequestMapping("/api/auth")
@Profile("!local")
public class AuthController {
	private final AuthService authService;
	private final AppProperties appProperties;

	public AuthController(AuthService authService, AppProperties appProperties) {
		this.authService = authService;
		this.appProperties = appProperties;
	}

	@GetMapping("/csrf")
	public ApiResponse<AuthResponses.Csrf> csrf(CsrfToken csrfToken) {
		return ApiResponse.ok(new AuthResponses.Csrf(csrfToken.getToken(), csrfToken.getHeaderName()));
	}

	@PostMapping("/signup")
	public ApiResponse<AuthResponses.User> signup(@Valid @RequestBody AuthRequests.Signup request,
			HttpServletResponse response) {
		AuthService.LoginResult result = authService.signup(request);
		setSessionCookie(response, result.token());
		return ApiResponse.ok(result.user(), "Account created");
	}

	@PostMapping("/login")
	public ApiResponse<AuthResponses.User> login(@Valid @RequestBody AuthRequests.Login request,
			HttpServletResponse response) {
		AuthService.LoginResult result = authService.login(request);
		setSessionCookie(response, result.token());
		return ApiResponse.ok(result.user(), "Signed in");
	}

	@PostMapping("/logout")
	public ApiResponse<AuthResponses.Message> logout(HttpServletRequest request, HttpServletResponse response) {
		authService.logout(SessionAuthenticationFilter.readCookie(request));
		clearSessionCookie(response);
		return ApiResponse.ok(new AuthResponses.Message("Signed out"));
	}

	@GetMapping("/me")
	public ApiResponse<AuthResponses.Session> me(Authentication authentication) {
		if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
			return ApiResponse.ok(new AuthResponses.Session(false, null));
		}
		return ApiResponse.ok(new AuthResponses.Session(true,
				new AuthResponses.User(principal.id(), principal.username(), principal.email())));
	}

	@PostMapping("/username/reminder")
	public ApiResponse<AuthResponses.Message> usernameReminder(
			@Valid @RequestBody AuthRequests.EmailRequest request) {
		authService.sendUsernameReminder(request.email());
		return genericRecoveryResponse();
	}

	@PostMapping("/password/forgot")
	public ApiResponse<AuthResponses.Message> forgotPassword(
			@Valid @RequestBody AuthRequests.EmailRequest request) {
		authService.sendPasswordReset(request.email());
		return genericRecoveryResponse();
	}

	@PostMapping("/password/reset")
	public ApiResponse<AuthResponses.Message> resetPassword(
			@Valid @RequestBody AuthRequests.PasswordReset request, HttpServletResponse response) {
		authService.resetPassword(request);
		clearSessionCookie(response);
		return ApiResponse.ok(new AuthResponses.Message("Password changed"));
	}

	private ApiResponse<AuthResponses.Message> genericRecoveryResponse() {
		return ApiResponse.ok(new AuthResponses.Message(
				"If a matching account exists, an email has been sent"));
	}

	private void setSessionCookie(HttpServletResponse response, String token) {
		ResponseCookie cookie = ResponseCookie.from(SessionAuthenticationFilter.COOKIE_NAME, token)
				.httpOnly(true)
				.secure(appProperties.auth().secureCookie())
				.sameSite("Lax")
				.path("/")
				.maxAge(Duration.ofDays(appProperties.auth().sessionDays()))
				.build();
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
	}

	private void clearSessionCookie(HttpServletResponse response) {
		ResponseCookie cookie = ResponseCookie.from(SessionAuthenticationFilter.COOKIE_NAME, "")
				.httpOnly(true)
				.secure(appProperties.auth().secureCookie())
				.sameSite("Lax")
				.path("/")
				.maxAge(Duration.ZERO)
				.build();
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
	}
}
