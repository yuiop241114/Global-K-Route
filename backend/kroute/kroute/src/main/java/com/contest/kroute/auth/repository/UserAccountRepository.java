package com.contest.kroute.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.contest.kroute.auth.domain.UserAccount;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
	Optional<UserAccount> findByUsernameIgnoreCase(String username);
	Optional<UserAccount> findByEmailIgnoreCase(String email);
	boolean existsByUsernameIgnoreCase(String username);
	boolean existsByEmailIgnoreCase(String email);
}
