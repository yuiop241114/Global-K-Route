package com.contest.kroute.route.service;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.contest.kroute.auth.domain.UserAccount;
import com.contest.kroute.auth.repository.UserAccountRepository;
import com.contest.kroute.route.domain.RoutePlace;
import com.contest.kroute.route.domain.TravelRoute;
import com.contest.kroute.route.dto.PopularPlaceResponse;
import com.contest.kroute.route.dto.PublicRouteResponse;
import com.contest.kroute.route.dto.RoutePlaceResponse;
import com.contest.kroute.route.dto.RouteResponse;
import com.contest.kroute.route.exception.RouteNotFoundException;
import com.contest.kroute.route.repository.PopularityRepository;
import com.contest.kroute.route.repository.RoutePlaceRepository;
import com.contest.kroute.route.repository.TravelRouteRepository;

@Service
@Profile("!local")
public class CommunityRouteService {
	private final TravelRouteRepository routeRepository;
	private final RoutePlaceRepository routePlaceRepository;
	private final UserAccountRepository userAccountRepository;
	private final PopularityRepository popularityRepository;

	public CommunityRouteService(TravelRouteRepository routeRepository, RoutePlaceRepository routePlaceRepository,
			UserAccountRepository userAccountRepository, PopularityRepository popularityRepository) {
		this.routeRepository = routeRepository;
		this.routePlaceRepository = routePlaceRepository;
		this.userAccountRepository = userAccountRepository;
		this.popularityRepository = popularityRepository;
	}

	@Transactional(readOnly = true)
	public List<PublicRouteResponse> findPublicRoutes() {
		return routeRepository.findTop30ByPublicRouteTrueOrderByPublishedAtDesc().stream()
				.map(this::toPublicResponse)
				.toList();
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
		List<RoutePlaceResponse> places = routePlaceRepository.findAllByRouteIdOrderByVisitOrder(route.getId()).stream()
				.map(RoutePlaceResponse::from)
				.toList();
		return PublicRouteResponse.from(route, places, routeRepository.countBySourceRouteId(route.getId()));
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
				sourcePlace.getVisitOrder(),
				sourcePlace.getStayMinutes()
		);
	}
}
