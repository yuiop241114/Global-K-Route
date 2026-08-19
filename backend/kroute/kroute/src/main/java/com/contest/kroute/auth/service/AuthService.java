package com.contest.kroute.auth.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.contest.kroute.auth.domain.AuthSession;
import com.contest.kroute.auth.domain.PasswordResetToken;
import com.contest.kroute.auth.domain.UserAccount;
import com.contest.kroute.auth.dto.AuthRequests;
import com.contest.kroute.auth.dto.AuthResponses;
import com.contest.kroute.auth.exception.AuthException;
import com.contest.kroute.auth.repository.AuthSessionRepository;
import com.contest.kroute.auth.repository.PasswordResetTokenRepository;
import com.contest.kroute.auth.repository.UserAccountRepository;
import com.contest.kroute.config.AppProperties;

@Service
@Profile("!local")
public class AuthService {
	private static final Logger log = LoggerFactory.getLogger(AuthService.class);

	private final UserAccountRepository userRepository;
	private final AuthSessionRepository sessionRepository;
	private final PasswordResetTokenRepository resetTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final TokenCodec tokenCodec;
	private final SmtpMailService mailService;
	private final AppProperties appProperties;

	public AuthService(UserAccountRepository userRepository, AuthSessionRepository sessionRepository,
			PasswordResetTokenRepository resetTokenRepository, PasswordEncoder passwordEncoder,
			TokenCodec tokenCodec, SmtpMailService mailService, AppProperties appProperties) {
		this.userRepository = userRepository;
		this.sessionRepository = sessionRepository;
		this.resetTokenRepository = resetTokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.tokenCodec = tokenCodec;
		this.mailService = mailService;
		this.appProperties = appProperties;
	}

	@Transactional
	public LoginResult signup(AuthRequests.Signup request) {
		String username = request.username().trim().toLowerCase(Locale.ROOT);
		String email = normalizeEmail(request.email());
		if (userRepository.existsByUsernameIgnoreCase(username)) {
			throw new AuthException(HttpStatus.CONFLICT, "Username is already in use");
		}
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new AuthException(HttpStatus.CONFLICT, "Email is already in use");
		}

		UserAccount user = userRepository.save(new UserAccount(
				username, email, passwordEncoder.encode(request.password())));
		return issueSession(user);
	}

	@Transactional
	public LoginResult login(AuthRequests.Login request) {
		UserAccount user = userRepository.findByUsernameIgnoreCase(request.username().trim())
				.orElseThrow(this::invalidCredentials);
		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw invalidCredentials();
		}
		return issueSession(user);
	}

	@Transactional
	public void logout(String rawToken) {
		if (rawToken != null && !rawToken.isBlank()) {
			sessionRepository.deleteByTokenHash(tokenCodec.hash(rawToken));
		}
	}

	@Transactional
	public void sendUsernameReminder(String rawEmail) {
		userRepository.findByEmailIgnoreCase(normalizeEmail(rawEmail))
				.ifPresent(user -> {
					try {
						mailService.sendUsernameReminder(user);
					} catch (AuthException exception) {
						log.warn("Username reminder delivery failed for user id {}", user.getId());
					}
				});
	}

	@Transactional
	public void sendPasswordReset(String rawEmail) {
		userRepository.findByEmailIgnoreCase(normalizeEmail(rawEmail)).ifPresent(user -> {
			resetTokenRepository.deleteByUserIdAndUsedAtIsNull(user.getId());
			String rawToken = tokenCodec.createToken();
			long validMinutes = appProperties.auth().passwordResetMinutes();
			PasswordResetToken token = resetTokenRepository.save(new PasswordResetToken(
					user, tokenCodec.hash(rawToken), Instant.now().plus(Duration.ofMinutes(validMinutes))));
			String resetUrl = appProperties.frontend().baseUrl() + "/?resetToken="
					+ URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
			try {
				mailService.sendPasswordReset(user, resetUrl, validMinutes);
			} catch (AuthException exception) {
				resetTokenRepository.delete(token);
				log.warn("Password reset delivery failed for user id {}; reset token removed", user.getId());
			}
		});
	}

	@Transactional
	public void resetPassword(AuthRequests.PasswordReset request) {
		PasswordResetToken token = resetTokenRepository.findByTokenHash(tokenCodec.hash(request.token()))
				.orElseThrow(this::invalidResetToken);
		if (token.getUsedAt() != null || !token.getExpiresAt().isAfter(Instant.now())) {
			throw invalidResetToken();
		}

		UserAccount user = token.getUser();
		user.changePassword(passwordEncoder.encode(request.newPassword()));
		token.markUsed();
		sessionRepository.deleteByUserId(user.getId());
	}

	public AuthResponses.User toResponse(UserAccount user) {
		return new AuthResponses.User(user.getId(), user.getUsername(), user.getEmail());
	}

	private LoginResult issueSession(UserAccount user) {
		String rawToken = tokenCodec.createToken();
		Instant expiresAt = Instant.now().plus(Duration.ofDays(appProperties.auth().sessionDays()));
		sessionRepository.save(new AuthSession(user, tokenCodec.hash(rawToken), expiresAt));
		return new LoginResult(rawToken, toResponse(user));
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

	private AuthException invalidCredentials() {
		return new AuthException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
	}

	private AuthException invalidResetToken() {
		return new AuthException(HttpStatus.BAD_REQUEST, "Password reset link is invalid or expired");
	}

	public record LoginResult(String token, AuthResponses.User user) {
	}
}
