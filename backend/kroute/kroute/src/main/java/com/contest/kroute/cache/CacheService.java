package com.contest.kroute.cache;

import java.time.Duration;
import java.util.Optional;

public interface CacheService {
	Optional<String> get(String key);

	void set(String key, String value, Duration ttl);
}
