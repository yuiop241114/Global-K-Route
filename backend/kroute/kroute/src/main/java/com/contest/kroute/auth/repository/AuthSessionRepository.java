package com.contest.kroute.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.contest.kroute.auth.domain.AuthSession;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {
	Optional<AuthSession> findByTokenHash(String tokenHash);
	void deleteByTokenHash(String tokenHash);
	void deleteByUserId(Long userId);
}
