package com.contest.kroute.route.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.contest.kroute.auth.domain.UserAccount;
import com.contest.kroute.auth.repository.UserAccountRepository;
import com.contest.kroute.route.domain.TravelRoute;
import com.contest.kroute.route.dto.RoutePlaceRequest;
import com.contest.kroute.route.dto.RouteResponse;
import com.contest.kroute.route.dto.RouteUpsertRequest;
import com.contest.kroute.route.dto.RouteVisibilityRequest;
import com.contest.kroute.route.exception.RouteNotFoundException;
import com.contest.kroute.route.repository.RoutePlaceRepository;
import com.contest.kroute.route.repository.TravelRouteRepository;

@ExtendWith(MockitoExtension.class)
class TravelRouteServiceTest {

	@Mock
	private TravelRouteRepository routeRepository;

	@Mock
	private RoutePlaceRepository routePlaceRepository;

	@Mock
	private UserAccountRepository userAccountRepository;

	@InjectMocks
	private TravelRouteService routeService;

	@Test
	void createsRouteFromPlacesInRequestedOrder() {
		Long userId = 7L;
		UserAccount user = new UserAccount("traveler", "traveler@example.com", "password-hash");
		RouteUpsertRequest request = new RouteUpsertRequest("Seoul day trip", List.of(
				place("1001", "Palace"),
				place("1002", "Market")
		));

		when(userAccountRepository.getReferenceById(userId)).thenReturn(user);
		when(routeRepository.save(any(TravelRoute.class))).thenAnswer(invocation -> invocation.getArgument(0));
		when(routePlaceRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

		RouteResponse response = routeService.create(userId, request);

		assertThat(response.title()).isEqualTo("Seoul day trip");
		assertThat(response.places()).extracting(place -> place.contentId())
				.containsExactly("1001", "1002");
		assertThat(response.places()).extracting(place -> place.visitOrder())
				.containsExactly(1, 2);
		verify(routePlaceRepository).saveAll(anyList());
	}

	@Test
	void rejectsDuplicatePlaceInSameRoute() {
		RoutePlaceRequest place = place("1001", "Palace");
		RouteUpsertRequest request = new RouteUpsertRequest("Duplicate route", List.of(place, place));

		assertThatThrownBy(() -> routeService.create(7L, request))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("same place");
	}

	@Test
	void throwsWhenDeletingRouteOwnedByAnotherUser() {
		when(routeRepository.deleteByIdAndUserId(42L, 7L)).thenReturn(0L);

		assertThatThrownBy(() -> routeService.delete(7L, 42L))
				.isInstanceOf(RouteNotFoundException.class);
	}

	@Test
	void publishesOnlyRouteOwnedByCurrentUser() {
		TravelRoute route = new TravelRoute(
				new UserAccount("traveler", "traveler@example.com", "password-hash"),
				"Seoul day trip"
		);
		when(routeRepository.findByIdAndUserId(42L, 7L)).thenReturn(Optional.of(route));
		when(routePlaceRepository.findAllByRouteIdOrderByVisitOrder(null)).thenReturn(List.of());

		RouteResponse response = routeService.changeVisibility(7L, 42L, new RouteVisibilityRequest(true));

		assertThat(response.publicRoute()).isTrue();
		assertThat(response.publishedAt()).isNotNull();
	}

	private RoutePlaceRequest place(String contentId, String title) {
		return new RoutePlaceRequest(
				contentId,
				title,
				"tourist_attraction",
				"Seoul, Korea",
				37.5665,
				126.978,
				null,
				"ko",
				null
		);
	}
}
