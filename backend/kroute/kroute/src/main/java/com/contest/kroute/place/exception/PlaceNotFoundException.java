package com.contest.kroute.place.exception;

public class PlaceNotFoundException extends RuntimeException {

	public PlaceNotFoundException(String contentId) {
		super("Tourism detail was not found for contentId: " + contentId);
	}
}
