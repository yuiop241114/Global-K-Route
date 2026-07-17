package com.contest.kroute.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.contest.kroute.auth.domain.PasswordResetToken;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
	Optional<PasswordResetToken> findByTokenHash(String tokenHash);
	void deleteByUserIdAndUsedAtIsNull(Long userId);
}
