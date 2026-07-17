package com.contest.kroute.auth.dto;

public final class AuthResponses {

	private AuthResponses() {
	}

	public record User(Long id, String username, String email) {
	}

	public record Session(boolean authenticated, User user) {
	}

	public record Message(String message) {
	}

	public record Csrf(String token, String headerName) {
	}
}
