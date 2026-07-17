package com.contest.kroute.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthRequests {

	private AuthRequests() {
	}

	public record Signup(
			@NotBlank @Pattern(regexp = "^[A-Za-z0-9_]{4,20}$", message = "Username must be 4-20 letters, numbers, or underscores") String username,
			@NotBlank @Email @Size(max = 254) String email,
			@NotBlank @Size(min = 8, max = 72) @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Password must contain both a letter and a number") String password
	) {
	}

	public record Login(@NotBlank String username, @NotBlank String password) {
	}

	public record EmailRequest(@NotBlank @Email @Size(max = 254) String email) {
	}

	public record PasswordReset(
			@NotBlank String token,
			@NotBlank @Size(min = 8, max = 72) @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Password must contain both a letter and a number") String newPassword
	) {
	}
}
