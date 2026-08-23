package com.contest.kroute.route.service;

import java.util.List;
import java.util.Map;
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
import com.contest.kroute.route.dto.PopularPlaceResponse;
import com.contest.kroute.route.dto.PublicRoutePlaceResponse;
import com.contest.kroute.route.dto.PublicRouteResponse;
import com.contest.kroute.route.dto.PublicRouteSearchCriteria;
import com.contest.kroute.route.dto.RoutePlaceResponse;
import com.contest.kroute.route.dto.RouteResponse;
import com.contest.kroute.route.exception.RouteNotFoundException;
import com.contest.kroute.route.repository.CommunityRouteQueryRepository;
import com.contest.kroute.route.repository.PopularityRepository;
import com.contest.kroute.route.repository.PublicRouteQueryResult;
import com.contest.kroute.route.repository.RoutePlaceRepository;
import com.contest.kroute.route.repository.TravelRouteRepository;

@Service
@Profile("!local")
public class CommunityRouteService {
	private final TravelRouteRepository routeRepository;
	private final RoutePlaceRepository routePlaceRepository;
	private final UserAccountRepository userAccountRepository;
	private final PopularityRepository popularityRepository;
	private final CommunityRouteQueryRepository communityRouteQueryRepository;

	public CommunityRouteService(TravelRouteRepository routeRepository, RoutePlaceRepository routePlaceRepository,
			UserAccountRepository userAccountRepository, PopularityRepository popularityRepository,
			CommunityRouteQueryRepository communityRouteQueryRepository) {
		this.routeRepository = routeRepository;
		this.routePlaceRepository = routePlaceRepository;
		this.userAccountRepository = userAccountRepository;
		this.popularityRepository = popularityRepository;
		this.communityRouteQueryRepository = communityRouteQueryRepository;
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
				.findAllByRouteIdInOrderByRouteIdAscVisitOrderAsc(queryResult.routeIds());
		Map<Long, List<RoutePlace>> placesByRouteId = allPlaces.stream()
				.collect(Collectors.groupingBy(RoutePlace::getRouteId));
		Map<String, Long> saveCounts = popularityRepository.findSaveCountsByContentIds(
				allPlaces.stream().map(RoutePlace::getContentId).distinct().toList()
		);
		Map<Long, Long> copyCounts = communityRouteQueryRepository.findCopyCounts(queryResult.routeIds());
		List<PublicRouteResponse> content = queryResult.routeIds().stream()
				.map(routesById::get)
				.filter(java.util.Objects::nonNull)
				.map(route -> toPublicResponse(
						route,
						placesByRouteId.getOrDefault(route.getId(), List.of()),
						saveCounts,
						copyCounts.getOrDefault(route.getId(), 0L)
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
	public RouteResponse copyPublicRoute(Long userId, Long routeId) {
		TravelRoute source = routeRepository.findByIdAndPublicRouteTrue(routeId)
				.orElseThrow(RouteNotFoundException::new);
		UserAccount user = userAccountRepository.getReferenceById(userId);
		TravelRoute copiedRoute = new TravelRoute(user, source.getTitle());
		copiedRoute.copyDetailsFrom(source);
		copiedRoute.setSourceRoute(source);
		routeRepository.save(copiedRoute);

		List<RoutePlace> copiedPlaces = routePlaceRepository.findAllByRouteIdOrderByVisitOrder(source.getId()).stream()
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
	public List<PopularPlaceResponse> findPopularPlaces(int requestedLimit) {
		int limit = Math.max(1, Math.min(requestedLimit, 20));
		return popularityRepository.findPopularPlaces(limit);
	}

	private PublicRouteResponse toPublicResponse(TravelRoute route) {
		List<RoutePlace> routePlaces = routePlaceRepository.findAllByRouteIdOrderByVisitOrder(route.getId());
		Map<String, Long> saveCounts = popularityRepository.findSaveCountsByContentIds(
				routePlaces.stream().map(RoutePlace::getContentId).distinct().toList()
		);
		return toPublicResponse(
				route,
				routePlaces,
				saveCounts,
				routeRepository.countBySourceRouteId(route.getId())
		);
	}

	private PublicRouteResponse toPublicResponse(TravelRoute route, List<RoutePlace> routePlaces,
			Map<String, Long> saveCounts, long copyCount) {
		List<PublicRoutePlaceResponse> places = routePlaces.stream()
				.map(place -> PublicRoutePlaceResponse.from(
						place,
						saveCounts.getOrDefault(place.getContentId(), 0L)
				))
				.toList();
		return PublicRouteResponse.from(route, places, copyCount);
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
