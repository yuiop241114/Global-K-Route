package com.contest.kroute.route.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.contest.kroute.auth.domain.UserAccount;
import com.contest.kroute.auth.repository.UserAccountRepository;
import com.contest.kroute.common.PageResponse;
import com.contest.kroute.route.domain.RoutePlace;
import com.contest.kroute.route.domain.TravelRoute;
import com.contest.kroute.route.dto.PopularPlaceSearchCriteria;
import com.contest.kroute.route.dto.PopularPlaceResponse;
import com.contest.kroute.route.dto.PublicRoutePlaceResponse;
import com.contest.kroute.route.dto.PublicRouteResponse;
import com.contest.kroute.route.dto.PublicRouteSearchCriteria;
import com.contest.kroute.route.dto.RoutePlaceResponse;
import com.contest.kroute.route.dto.RoutePopularityMetrics;
import com.contest.kroute.route.dto.RouteResponse;
import com.contest.kroute.route.exception.RouteNotFoundException;
import com.contest.kroute.route.repository.CommunityRouteQueryRepository;
import com.contest.kroute.route.repository.PopularityRepository;
import com.contest.kroute.route.repository.PublicRouteQueryResult;
import com.contest.kroute.route.repository.RoutePlaceRepository;
import com.contest.kroute.route.repository.RouteViewRepository;
import com.contest.kroute.route.repository.TravelRouteRepository;

@Service
@Profile("!local")
public class CommunityRouteService {
	private final TravelRouteRepository routeRepository;
	private final RoutePlaceRepository routePlaceRepository;
	private final UserAccountRepository userAccountRepository;
	private final PopularityRepository popularityRepository;
	private final CommunityRouteQueryRepository communityRouteQueryRepository;
	private final RouteViewRepository routeViewRepository;

	public CommunityRouteService(TravelRouteRepository routeRepository, RoutePlaceRepository routePlaceRepository,
			UserAccountRepository userAccountRepository, PopularityRepository popularityRepository,
			CommunityRouteQueryRepository communityRouteQueryRepository,
			RouteViewRepository routeViewRepository) {
		this.routeRepository = routeRepository;
		this.routePlaceRepository = routePlaceRepository;
		this.userAccountRepository = userAccountRepository;
		this.popularityRepository = popularityRepository;
		this.communityRouteQueryRepository = communityRouteQueryRepository;
		this.routeViewRepository = routeViewRepository;
	}

	@Transactional(readOnly = true)
	public PageResponse<PublicRouteResponse> findPublicRoutes(PublicRouteSearchCriteria criteria) {
		PublicRouteQueryResult queryResult = communityRouteQueryRepository.findPublicRouteIds(criteria);
		if (queryResult.routeIds().isEmpty()) {
			return PageResponse.of(List.of(), criteria.page(), criteria.size(), queryResult.totalElements());
		}
		Map<Long, TravelRoute> routesById = routeRepository.findAllById(queryResult.routeIds()).stream()
				.collect(Collectors.toMap(TravelRoute::getId, Function.identity()));
		List<RoutePlace> allPlaces = routePlaceRepository
				.findAllByRouteIdsOrderByRouteAndVisitOrder(queryResult.routeIds());
		Map<Long, List<RoutePlace>> placesByRouteId = allPlaces.stream()
				.collect(Collectors.groupingBy(RoutePlace::getRouteId));
		Map<String, Long> saveCounts = popularityRepository.findSaveCountsByContentIds(
				allPlaces.stream().map(RoutePlace::getContentId).distinct().toList()
		);
		Map<Long, RoutePopularityMetrics> metricsByRouteId = communityRouteQueryRepository
				.findPopularityMetrics(queryResult.routeIds(), criteria.scoredAt());
		List<PublicRouteResponse> content = queryResult.routeIds().stream()
				.map(routesById::get)
				.filter(java.util.Objects::nonNull)
				.map(route -> toPublicResponse(
						route,
						placesByRouteId.getOrDefault(route.getId(), List.of()),
						saveCounts,
						metricsByRouteId.getOrDefault(route.getId(), RoutePopularityMetrics.empty())
				))
				.toList();
		return PageResponse.of(content, criteria.page(), criteria.size(), queryResult.totalElements());
	}

	@Transactional(readOnly = true)
	public PublicRouteResponse findPublicRoute(Long routeId) {
		TravelRoute route = routeRepository.findByIdAndPublicRouteTrue(routeId)
				.orElseThrow(RouteNotFoundException::new);
		return toPublicResponse(route);
	}

	@Transactional
	public PublicRouteResponse recordPublicRouteView(Long routeId, String visitorId) {
		TravelRoute route = routeRepository.findByIdAndPublicRouteTrue(routeId)
				.orElseThrow(RouteNotFoundException::new);
		String normalizedVisitorId;
		try {
			normalizedVisitorId = UUID.fromString(visitorId.trim()).toString();
		} catch (IllegalArgumentException exception) {
			throw new IllegalArgumentException("visitorId must be a UUID");
		}
		Instant viewedAt = Instant.now();
		routeViewRepository.recordDailyView(
				routeId,
				hashVisitorId(normalizedVisitorId),
				LocalDate.ofInstant(viewedAt, ZoneOffset.UTC),
				viewedAt
		);
		return toPublicResponse(route, viewedAt);
	}

	@Transactional
	public RouteResponse copyPublicRoute(Long userId, Long routeId) {
		TravelRoute source = routeRepository.findByIdAndPublicRouteTrue(routeId)
				.orElseThrow(RouteNotFoundException::new);
		UserAccount user = userAccountRepository.getReferenceById(userId);
		TravelRoute copiedRoute = new TravelRoute(user, source.getTitle());
		copiedRoute.copyDetailsFrom(source);
		copiedRoute.setSourceRoute(source);
		routeRepository.save(copiedRoute);

		List<RoutePlace> copiedPlaces = routePlaceRepository.findAllByRoute_IdOrderByVisitOrder(source.getId()).stream()
				.map(place -> copyPlace(copiedRoute, place))
				.toList();
		routePlaceRepository.saveAll(copiedPlaces);

		return RouteResponse.from(
				copiedRoute,
				copiedPlaces.stream().map(RoutePlaceResponse::from).toList(),
				0
		);
	}

	@Transactional(readOnly = true)
	public List<PopularPlaceResponse> findPopularPlaces(PopularPlaceSearchCriteria criteria) {
		return popularityRepository.findPopularPlaces(criteria);
	}

	private PublicRouteResponse toPublicResponse(TravelRoute route) {
		return toPublicResponse(route, Instant.now());
	}

	private PublicRouteResponse toPublicResponse(TravelRoute route, Instant scoredAt) {
		List<RoutePlace> routePlaces = routePlaceRepository.findAllByRoute_IdOrderByVisitOrder(route.getId());
		Map<String, Long> saveCounts = popularityRepository.findSaveCountsByContentIds(
				routePlaces.stream().map(RoutePlace::getContentId).distinct().toList()
		);
		RoutePopularityMetrics metrics = communityRouteQueryRepository
				.findPopularityMetrics(List.of(route.getId()), scoredAt)
				.getOrDefault(route.getId(), RoutePopularityMetrics.empty());
		return toPublicResponse(
				route,
				routePlaces,
				saveCounts,
				metrics
		);
	}

	private PublicRouteResponse toPublicResponse(TravelRoute route, List<RoutePlace> routePlaces,
			Map<String, Long> saveCounts, RoutePopularityMetrics metrics) {
		List<PublicRoutePlaceResponse> places = routePlaces.stream()
				.map(place -> PublicRoutePlaceResponse.from(
						place,
						saveCounts.getOrDefault(place.getContentId(), 0L)
				))
				.toList();
		long placeSaveCount = places.stream().mapToLong(PublicRoutePlaceResponse::saveCount).sum();
		double popularityScore = RoutePopularityScore.calculate(metrics, placeSaveCount, places.size());
		return PublicRouteResponse.from(route, places, metrics, placeSaveCount, popularityScore);
	}

	private String hashVisitorId(String visitorId) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256")
					.digest(visitorId.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 is not available", exception);
		}
	}

	private RoutePlace copyPlace(TravelRoute copiedRoute, RoutePlace sourcePlace) {
		return new RoutePlace(
				copiedRoute,
				sourcePlace.getContentId(),
				sourcePlace.getTitle(),
				sourcePlace.getCategory(),
				sourcePlace.getAddress(),
				sourcePlace.getLatitude(),
				sourcePlace.getLongitude(),
				sourcePlace.getImageUrl(),
				sourcePlace.getDataLanguage(),
				sourcePlace.getAreaCode(),
				sourcePlace.getSigunguCode(),
				sourcePlace.getVisitOrder(),
				sourcePlace.getStayMinutes()
		);
	}
}
