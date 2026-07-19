package com.contest.kroute.route.exception;

public class RouteNotFoundException extends RuntimeException {
	public RouteNotFoundException() {
		super("Route not found");
	}
}
