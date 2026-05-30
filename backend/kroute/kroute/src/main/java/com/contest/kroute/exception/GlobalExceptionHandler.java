package com.contest.kroute.exception;

import java.time.Instant;
import java.util.Map;

import jakarta.validation.ConstraintViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler({ ConstraintViolationException.class, MethodArgumentNotValidException.class })
	public ResponseEntity<Map<String, Object>> handleValidationException(Exception exception) {
		return ResponseEntity.badRequest().body(errorBody(HttpStatus.BAD_REQUEST, exception.getMessage()));
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException exception) {
		return ResponseEntity.badRequest().body(errorBody(HttpStatus.BAD_REQUEST, exception.getMessage()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> handleException(Exception exception) {
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
