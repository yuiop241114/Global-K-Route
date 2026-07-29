package com.contest.kroute.route.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.contest.kroute.auth.domain.UserAccount;
import com.contest.kroute.auth.repository.UserAccountRepository;
import com.contest.kroute.route.domain.RoutePlace;
import com.contest.kroute.route.domain.TravelRoute;
import com.contest.kroute.route.dto.RoutePlaceRequest;
import com.contest.kroute.route.dto.RoutePlaceResponse;
import com.contest.kroute.route.dto.RouteResponse;
import com.contest.kroute.route.dto.RouteUpsertRequest;
import com.contest.kroute.route.dto.RouteVisibilityRequest;
import com.contest.kroute.route.exception.RouteNotFoundException;
import com.contest.kroute.route.repository.RoutePlaceRepository;
import com.contest.kroute.route.repository.TravelRouteRepository;

@Service
@Profile("!local")
public class TravelRouteService {
	private final TravelRouteRepository routeRepository;
	private final RoutePlaceRepository routePlaceRepository;
	private final UserAccountRepository userAccountRepository;

	public TravelRouteService(TravelRouteRepository routeRepository, RoutePlaceRepository routePlaceRepository,
			UserAccountRepository userAccountRepository) {
		this.routeRepository = routeRepository;
		this.routePlaceRepository = routePlaceRepository;
		this.userAccountRepository = userAccountRepository;
	}

	@Transactional(readOnly = true)
	public List<RouteResponse> findAll(Long userId) {
		return routeRepository.findAllByUserIdOrderByUpdatedAtDesc(userId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public RouteResponse create(Long userId, RouteUpsertRequest request) {
		validateUniquePlaces(request.places());
		UserAccount user = userAccountRepository.getReferenceById(userId);
		TravelRoute route = routeRepository.save(new TravelRoute(user, normalizeRequired(request.title())));
		List<RoutePlace> places = savePlaces(route, request.places());
		return RouteResponse.from(route, places.stream().map(RoutePlaceResponse::from).toList(), 0);
	}

	@Transactional
	public RouteResponse update(Long userId, Long routeId, RouteUpsertRequest request) {
		validateUniquePlaces(request.places());
		TravelRoute route = routeRepository.findByIdAndUserId(routeId, userId)
				.orElseThrow(RouteNotFoundException::new);
		route.changeTitle(normalizeRequired(request.title()));
		route.touch();
		routePlaceRepository.deleteAllByRouteId(routeId);
		routePlaceRepository.flush();
		List<RoutePlace> places = savePlaces(route, request.places());
		return RouteResponse.from(
				route,
				places.stream().map(RoutePlaceResponse::from).toList(),
				routeRepository.countBySourceRouteId(route.getId())
		);
	}

	@Transactional
	public RouteResponse changeVisibility(Long userId, Long routeId, RouteVisibilityRequest request) {
		TravelRoute route = routeRepository.findByIdAndUserId(routeId, userId)
				.orElseThrow(RouteNotFoundException::new);
		route.changeVisibility(request.publicRoute());
		route.touch();
		return toResponse(route);
	}

	@Transactional
	public void delete(Long userId, Long routeId) {
		if (routeRepository.deleteByIdAndUserId(routeId, userId) == 0) {
			throw new RouteNotFoundException();
		}
	}

	private RouteResponse toResponse(TravelRoute route) {
		List<RoutePlaceResponse> places = routePlaceRepository.findAllByRouteIdOrderByVisitOrder(route.getId()).stream()
				.map(RoutePlaceResponse::from)
				.toList();
		return RouteResponse.from(route, places, routeRepository.countBySourceRouteId(route.getId()));
	}

	private List<RoutePlace> savePlaces(TravelRoute route, List<RoutePlaceRequest> requests) {
		List<RoutePlace> places = java.util.stream.IntStream.range(0, requests.size())
				.mapToObj(index -> toEntity(route, requests.get(index), index + 1))
				.toList();
		return routePlaceRepository.saveAll(places);
	}

	private RoutePlace toEntity(TravelRoute route, RoutePlaceRequest request, int visitOrder) {
		return new RoutePlace(
				route,
				normalizeRequired(request.contentId()),
				normalizeRequired(request.title()),
				normalizeRequired(request.category()),
				request.address().trim(),
				request.latitude(),
				request.longitude(),
				normalizeNullable(request.imageUrl()),
				normalizeRequired(request.dataLanguage()).toLowerCase(),
				visitOrder,
				request.stayMinutes()
		);
	}

	private void validateUniquePlaces(List<RoutePlaceRequest> places) {
		Set<String> contentIds = new HashSet<>();
		for (RoutePlaceRequest place : places) {
			if (!contentIds.add(normalizeRequired(place.contentId()))) {
				throw new IllegalArgumentException("A route cannot contain the same place more than once");
			}
		}
	}

	private String normalizeRequired(String value) {
		return value.trim();
	}

	private String normalizeNullable(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
