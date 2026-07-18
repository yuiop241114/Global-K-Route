package com.contest.kroute.savedplace.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.contest.kroute.auth.domain.UserAccount;
import com.contest.kroute.auth.repository.UserAccountRepository;
import com.contest.kroute.savedplace.domain.SavedPlace;
import com.contest.kroute.savedplace.dto.SavePlaceRequest;
import com.contest.kroute.savedplace.dto.SavedPlaceResponse;
import com.contest.kroute.savedplace.repository.SavedPlaceRepository;

@ExtendWith(MockitoExtension.class)
class SavedPlaceServiceTest {

	@Mock
	private SavedPlaceRepository savedPlaceRepository;

	@Mock
	private UserAccountRepository userAccountRepository;

	@InjectMocks
	private SavedPlaceService savedPlaceService;

	@Test
	void savesPlaceSnapshotForAuthenticatedUser() {
		Long userId = 7L;
		SavePlaceRequest request = new SavePlaceRequest(
				"1001",
				"Seoul Museum",
				"tourist_attraction",
				"Seoul, Korea",
				37.5665,
				126.978,
				"https://images.example.com/place.jpg",
				"EN"
		);
		UserAccount user = new UserAccount("traveler", "traveler@example.com", "password-hash");

		when(savedPlaceRepository.findByUserIdAndContentId(userId, request.contentId()))
				.thenReturn(Optional.empty());
		when(userAccountRepository.getReferenceById(userId)).thenReturn(user);
		when(savedPlaceRepository.save(any(SavedPlace.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		SavedPlaceResponse response = savedPlaceService.save(userId, request);

		assertThat(response.contentId()).isEqualTo("1001");
		assertThat(response.title()).isEqualTo("Seoul Museum");
		assertThat(response.dataLanguage()).isEqualTo("en");
		verify(userAccountRepository).getReferenceById(userId);
		verify(savedPlaceRepository).save(any(SavedPlace.class));
	}

	@Test
	void deletesOnlyPlaceOwnedByAuthenticatedUser() {
		savedPlaceService.delete(7L, 42L);

		verify(savedPlaceRepository).deleteByIdAndUserId(42L, 7L);
	}
}
