package com.contest.kroute.route.repository;

import java.util.List;

public record PublicRouteQueryResult(List<Long> routeIds, long totalElements) {
}
