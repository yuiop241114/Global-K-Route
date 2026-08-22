package com.contest.kroute.route.exception;

public class WalkingRouteUnavailableException extends RuntimeException {
	public WalkingRouteUnavailableException(String message) {
		super(message);
	}

	public WalkingRouteUnavailableException(String message, Throwable cause) {
		super(message, cause);
	}
}
