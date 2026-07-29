package com.contest.kroute.route.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
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
import com.contest.kroute.route.domain.RoutePlace;
import com.contest.kroute.route.domain.TravelRoute;
import com.contest.kroute.route.dto.RouteResponse;
import com.contest.kroute.route.repository.PopularityRepository;
import com.contest.kroute.route.repository.RoutePlaceRepository;
import com.contest.kroute.route.repository.TravelRouteRepository;

@ExtendWith(MockitoExtension.class)
class CommunityRouteServiceTest {

	@Mock
	private TravelRouteRepository routeRepository;

	@Mock
	private RoutePlaceRepository routePlaceRepository;

	@Mock
	private UserAccountRepository userAccountRepository;

	@Mock
	private PopularityRepository popularityRepository;

	@InjectMocks
	private CommunityRouteService communityRouteService;

	@Test
	void copiesPublicRouteAsIndependentMemberRoute() {
		UserAccount sourceUser = new UserAccount("source", "source@example.com", "password-hash");
		UserAccount targetUser = new UserAccount("target", "target@example.com", "password-hash");
		TravelRoute sourceRoute = new TravelRoute(sourceUser, "Seoul day trip");
		sourceRoute.changeVisibility(true);
		RoutePlace sourcePlace = new RoutePlace(
				sourceRoute,
				"1001",
				"Palace",
				"tourist_attraction",
				"Seoul, Korea",
				37.5665,
				126.978,
				null,
				"ko",
				1,
				null
		);

		when(routeRepository.findByIdAndPublicRouteTrue(10L)).thenReturn(Optional.of(sourceRoute));
		when(userAccountRepository.getReferenceById(7L)).thenReturn(targetUser);
		when(routeRepository.save(any(TravelRoute.class))).thenAnswer(invocation -> invocation.getArgument(0));
		when(routePlaceRepository.findAllByRouteIdOrderByVisitOrder(null)).thenReturn(List.of(sourcePlace));
		when(routePlaceRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

		RouteResponse response = communityRouteService.copyPublicRoute(7L, 10L);

		assertThat(response.title()).isEqualTo("Seoul day trip");
		assertThat(response.publicRoute()).isFalse();
		assertThat(response.places()).extracting(place -> place.contentId())
				.containsExactly("1001");
	}
}
