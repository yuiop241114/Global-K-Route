package com.contest.kroute.search.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.contest.kroute.search.domain.SearchLog;

public interface SearchLogRepository extends JpaRepository<SearchLog, Long> {
}
