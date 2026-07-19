package com.contest.kroute.exception;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.validation.ConstraintViolationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.contest.kroute.place.exception.PlaceNotFoundException;
import com.contest.kroute.auth.exception.AuthException;

@RestControllerAdvice
public class GlobalExceptionHandler {
	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValidException(
			MethodArgumentNotValidException exception) {
		String message = exception.getBindingResult().getFieldErrors().stream()
				.map(error -> error.getField() + ": " + error.getDefaultMessage())
				.distinct()
				.collect(Collectors.joining(", "));
		return ResponseEntity.badRequest().body(errorBody(HttpStatus.BAD_REQUEST, message));
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<Map<String, Object>> handleConstraintViolationException(
			ConstraintViolationException exception) {
		String message = exception.getConstraintViolations().stream()
				.map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
				.distinct()
				.collect(Collectors.joining(", "));
		return ResponseEntity.badRequest().body(errorBody(HttpStatus.BAD_REQUEST, message));
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException exception) {
		return ResponseEntity.badRequest().body(errorBody(HttpStatus.BAD_REQUEST, exception.getMessage()));
	}

	@ExceptionHandler(PlaceNotFoundException.class)
	public ResponseEntity<Map<String, Object>> handlePlaceNotFoundException(PlaceNotFoundException exception) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(errorBody(HttpStatus.NOT_FOUND, exception.getMessage()));
	}

	@ExceptionHandler(AuthException.class)
	public ResponseEntity<Map<String, Object>> handleAuthException(AuthException exception) {
		return ResponseEntity.status(exception.getStatus())
				.body(errorBody(exception.getStatus(), exception.getMessage()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> handleException(Exception exception) {
		log.error("Unhandled server error", exception);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(errorBody(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error"));
	}

	private Map<String, Object> errorBody(HttpStatus status, String message) {
		return Map.of(
				"success", false,
				"status", status.value(),
				"message", message,
				"timestamp", Instant.now()
		);
	}
}
