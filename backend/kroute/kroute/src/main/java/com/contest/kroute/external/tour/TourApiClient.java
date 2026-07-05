package com.contest.kroute.external.tour;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.util.UriComponentsBuilder;

import com.contest.kroute.config.AppProperties;
import com.contest.kroute.place.dto.NearbyPlaceResponse;
import com.contest.kroute.place.dto.NearbyPlaceSearchRequest;
import com.contest.kroute.place.dto.PlaceDetailResponse;
import com.contest.kroute.place.dto.PlaceDetailResponse.AccommodationInfo;
import com.contest.kroute.place.dto.PlaceDetailResponse.AdditionalInfoItem;
import com.contest.kroute.place.dto.PlaceDetailResponse.RestaurantInfo;
import com.contest.kroute.place.dto.PlaceDetailResponse.VisitInfo;
import com.contest.kroute.place.exception.PlaceNotFoundException;
import com.fasterxml.jackson.databind.JsonNode;

@Component
public class TourApiClient {

	private static final Logger log = LoggerFactory.getLogger(TourApiClient.class);

	private static final String LOCATION_BASED_LIST_OPERATION = "locationBasedList2";
	private static final String DETAIL_COMMON_OPERATION = "detailCommon2";
	private static final String DETAIL_INTRO_OPERATION = "detailIntro2";
	private static final String DETAIL_INFO_OPERATION = "detailInfo2";
	private static final String DETAIL_IMAGE_OPERATION = "detailImage2";
	private static final String MOBILE_OS = "ETC";
	private static final String MOBILE_APP = "GlobalKRoute";
	private static final int DEFAULT_NUM_OF_ROWS = 20;
	private static final Pattern HREF_PATTERN = Pattern.compile(
			"href\\s*=\\s*[\"']([^\"']+)[\"']",
			Pattern.CASE_INSENSITIVE
	);

	private static final Map<String, String> SERVICE_NAMES_BY_LANGUAGE = Map.of(
			"ko", "KorService2",
			"en", "EngService2",
			"ja", "JpnService2",
			"zh-cn", "ChsService2",
			"zh-tw", "ChtService2",
			"fr", "FreService2",
			"es", "SpnService2",
			"de", "GerService2",
			"ru", "RusService2"
	);

	private static final Map<String, String> KOREAN_CONTENT_TYPE_IDS = Map.of(
			"tourist_attraction", "12",
			"restaurant", "39",
			"accommodation", "32"
	);

	private static final Map<String, String> GLOBAL_CONTENT_TYPE_IDS = Map.of(
			"tourist_attraction", "76",
			"restaurant", "82",
			"accommodation", "80"
	);

	private final RestClient restClient;
	private final AppProperties appProperties;

	public TourApiClient(RestClient.Builder restClientBuilder, AppProperties appProperties) {
		this.restClient = restClientBuilder.build();
		this.appProperties = appProperties;
	}

	public List<NearbyPlaceResponse> findNearbyPlaces(NearbyPlaceSearchRequest request) {
		validateServiceKey();
		if (request.selectedLatitude() == null || request.selectedLongitude() == null) {
			return List.of();
		}

		URI requestUri = buildLocationBasedListUri(request);
		JsonNode response = restClient.get()
				.uri(requestUri)
				.retrieve()
				.body(JsonNode.class);

		logTourApiResponse(request, response);
		return toNearbyPlaces(response);
	}

	public PlaceDetailResponse findPlaceDetail(String contentId, String language, String contentType) {
		validateServiceKey();

		String normalizedLanguage = normalizeLanguage(language);
		String contentTypeId = resolveContentTypeId(normalizedLanguage, contentType)
				.orElseThrow(() -> new IllegalArgumentException("Unsupported contentType: " + contentType));

		JsonNode commonResponse = requestDetailCommon(contentId, normalizedLanguage);
		JsonNode common = firstItem(commonResponse)
				.orElseThrow(() -> new PlaceNotFoundException(contentId));
		JsonNode introResponse = requestOptionalDetail(
				DETAIL_INTRO_OPERATION,
				contentId,
				() -> requestDetailWithContentType(
						DETAIL_INTRO_OPERATION,
						contentId,
						normalizedLanguage,
						contentTypeId
				)
		);
		JsonNode infoResponse = requestOptionalDetail(
				DETAIL_INFO_OPERATION,
				contentId,
				() -> requestDetailWithContentType(
						DETAIL_INFO_OPERATION,
						contentId,
						normalizedLanguage,
						contentTypeId
				)
		);
		JsonNode imageResponse = requestOptionalDetail(
				DETAIL_IMAGE_OPERATION,
				contentId,
				() -> requestDetailImages(contentId, normalizedLanguage)
		);

		JsonNode intro = firstItem(introResponse).orElse(null);
		List<JsonNode> repeatedItems = extractItems(infoResponse);
		List<JsonNode> imageItems = extractItems(imageResponse);

		log.info(
				"TourAPI detail search completed. contentId={}, language={}, service={}, contentType={}, introCount={}, infoCount={}, imageCount={}",
				contentId,
				normalizedLanguage,
				resolveServiceName(normalizedLanguage),
				contentType,
				intro == null ? 0 : 1,
				repeatedItems.size(),
				imageItems.size()
		);

		return toPlaceDetail(
				contentId,
				contentType,
				normalizedLanguage,
				common,
				intro,
				repeatedItems,
				imageItems
		);
	}

	private void validateServiceKey() {
		if (appProperties.tourApi().serviceKey() == null || appProperties.tourApi().serviceKey().isBlank()) {
			throw new IllegalStateException("TOUR_API_KEY is required.");
		}
	}

	private URI buildLocationBasedListUri(NearbyPlaceSearchRequest request) {
		String serviceName = resolveServiceName(request.language());
		UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(appProperties.tourApi().baseUrl())
				.pathSegment(serviceName, LOCATION_BASED_LIST_OPERATION)
				.queryParam("serviceKey", appProperties.tourApi().serviceKey())
				.queryParam("MobileOS", MOBILE_OS)
				.queryParam("MobileApp", MOBILE_APP)
				.queryParam("_type", "json")
				.queryParam("numOfRows", DEFAULT_NUM_OF_ROWS)
				.queryParam("pageNo", 1)
				.queryParam("arrange", "E")
				.queryParam("mapX", request.selectedLongitude())
				.queryParam("mapY", request.selectedLatitude())
				.queryParam("radius", request.radius());

		resolveContentTypeId(request.language(), request.contentType())
				.ifPresent(contentTypeId -> builder.queryParam("contentTypeId", contentTypeId));

		return builder.build(true).toUri();
	}

	private JsonNode requestDetailCommon(String contentId, String language) {
		UriComponentsBuilder builder = createTourApiUriBuilder(language, DETAIL_COMMON_OPERATION)
				.queryParam("contentId", contentId);
		return requestJson(builder);
	}

	private JsonNode requestDetailWithContentType(
			String operation,
			String contentId,
			String language,
			String contentTypeId
	) {
		UriComponentsBuilder builder = createTourApiUriBuilder(language, operation)
				.queryParam("contentId", contentId)
				.queryParam("contentTypeId", contentTypeId)
				.queryParam("numOfRows", 30)
				.queryParam("pageNo", 1);
		return requestJson(builder);
	}

	private JsonNode requestDetailImages(String contentId, String language) {
		UriComponentsBuilder builder = createTourApiUriBuilder(language, DETAIL_IMAGE_OPERATION)
				.queryParam("contentId", contentId)
				.queryParam("numOfRows", 30)
				.queryParam("pageNo", 1);
		return requestJson(builder);
	}

	private UriComponentsBuilder createTourApiUriBuilder(String language, String operation) {
		return UriComponentsBuilder.fromUriString(appProperties.tourApi().baseUrl())
				.pathSegment(resolveServiceName(language), operation)
				.queryParam("serviceKey", appProperties.tourApi().serviceKey())
				.queryParam("MobileOS", MOBILE_OS)
				.queryParam("MobileApp", MOBILE_APP)
				.queryParam("_type", "json");
	}

	private JsonNode requestJson(UriComponentsBuilder builder) {
		JsonNode response = restClient.get()
				.uri(builder.build(true).toUri())
				.retrieve()
				.body(JsonNode.class);
		validateTourApiResponse(response);
		return response;
	}

	private void validateTourApiResponse(JsonNode response) {
		if (response == null) {
			throw new IllegalStateException("TourAPI returned an empty response.");
		}

		String topLevelCode = response.path("resultCode").asText("");
		if (!topLevelCode.isBlank() && !"0000".equals(topLevelCode)) {
			throw new IllegalStateException(
					"TourAPI request failed: " + response.path("resultMsg").asText(topLevelCode)
			);
		}

		JsonNode header = response.path("response").path("header");
		String headerCode = header.path("resultCode").asText("");
		if (!headerCode.isBlank() && !"0000".equals(headerCode)) {
			throw new IllegalStateException(
					"TourAPI request failed: " + header.path("resultMsg").asText(headerCode)
			);
		}
	}

	private JsonNode requestOptionalDetail(
			String operation,
			String contentId,
			Supplier<JsonNode> request
	) {
		try {
			return request.get();
		} catch (RestClientException | IllegalStateException exception) {
			log.warn(
					"Optional TourAPI detail request failed. operation={}, contentId={}, reason={}",
					operation,
					contentId,
					exception.getClass().getSimpleName()
			);
			return null;
		}
	}

	private String resolveServiceName(String language) {
		return SERVICE_NAMES_BY_LANGUAGE.get(normalizeLanguage(language));
	}

	private String normalizeLanguage(String language) {
		String normalizedLanguage = language == null ? "ko" : language.toLowerCase(Locale.ROOT);
		return SERVICE_NAMES_BY_LANGUAGE.containsKey(normalizedLanguage) ? normalizedLanguage : "ko";
	}

	private Optional<String> resolveContentTypeId(String language, String contentType) {
		if (contentType == null || contentType.isBlank()) {
			return Optional.empty();
		}
		if ("ko".equalsIgnoreCase(language)) {
			return Optional.ofNullable(KOREAN_CONTENT_TYPE_IDS.get(contentType));
		}
		return Optional.ofNullable(GLOBAL_CONTENT_TYPE_IDS.get(contentType));
	}

	private List<NearbyPlaceResponse> toNearbyPlaces(JsonNode response) {
		JsonNode items = response.path("response").path("body").path("items").path("item");
		if (items.isMissingNode() || items.isNull()) {
			return List.of();
		}

		List<NearbyPlaceResponse> places = new ArrayList<>();
		if (items.isArray()) {
			items.forEach(item -> toNearbyPlace(item).ifPresent(places::add));
			return places;
		}

		toNearbyPlace(items).ifPresent(places::add);
		return places;
	}

	private void logTourApiResponse(NearbyPlaceSearchRequest request, JsonNode response) {
		JsonNode header = response.path("response").path("header");
		JsonNode body = response.path("response").path("body");
		log.info(
				"TourAPI location search completed. language={}, service={}, contentType={}, radius={}, resultCode={}, resultMsg={}, totalCount={}",
				request.language(),
				resolveServiceName(request.language()),
				request.contentType(),
				request.radius(),
				header.path("resultCode").asText(""),
				header.path("resultMsg").asText(""),
				body.path("totalCount").asInt(0)
		);
	}

	private Optional<NearbyPlaceResponse> toNearbyPlace(JsonNode item) {
		Optional<Double> latitude = parseDouble(item.path("mapy").asText(null));
		Optional<Double> longitude = parseDouble(item.path("mapx").asText(null));
		if (latitude.isEmpty() || longitude.isEmpty()) {
			return Optional.empty();
		}

		return Optional.of(new NearbyPlaceResponse(
				item.path("contentid").asText(""),
				item.path("title").asText(""),
				resolveCategory(item.path("contenttypeid").asText("")),
				item.path("addr1").asText(""),
				latitude.get(),
				longitude.get(),
				parseDouble(item.path("dist").asText(null))
						.map(Double::intValue)
						.orElse(0),
				resolveImageUrl(item)
		));
	}

	private PlaceDetailResponse toPlaceDetail(
			String contentId,
			String category,
			String language,
			JsonNode common,
			JsonNode intro,
			List<JsonNode> repeatedItems,
			List<JsonNode> imageItems
	) {
		List<String> imageUrls = collectImageUrls(common, imageItems);
		String primaryImageUrl = imageUrls.isEmpty() ? null : imageUrls.get(0);

		return new PlaceDetailResponse(
				contentId,
				category,
				language,
				false,
				text(common, "title"),
				text(common, "overview"),
				joinText(text(common, "addr1"), text(common, "addr2")),
				text(common, "tel"),
				extractHomepage(common),
				parseDouble(rawText(common, "mapy")).orElse(null),
				parseDouble(rawText(common, "mapx")).orElse(null),
				primaryImageUrl,
				imageUrls,
				toVisitInfo(intro),
				"restaurant".equals(category) ? toRestaurantInfo(intro) : null,
				"accommodation".equals(category) ? toAccommodationInfo(intro) : null,
				toAdditionalInfo(repeatedItems)
		);
	}

	private VisitInfo toVisitInfo(JsonNode intro) {
		return new VisitInfo(
				text(intro, "usetime", "opentimefood", "usetimeculture", "usetimeleports"),
				text(intro, "restdate", "restdatefood", "restdateculture", "restdateleports"),
				text(intro, "usefee", "usefeeleports"),
				text(intro, "parking", "parkingfood", "parkinglodging", "parkingculture"),
				text(intro, "reservation", "reservationfood", "reservationlodging"),
				text(intro, "infocenter", "infocenterfood", "infocenterlodging", "infocenterculture"),
				text(intro, "expguide", "experienceguide"),
				text(intro, "chkcreditcard", "chkcreditcardfood", "chkcreditcardculture"),
				text(intro, "chkpet", "chkpetleports")
		);
	}

	private RestaurantInfo toRestaurantInfo(JsonNode intro) {
		return new RestaurantInfo(
				text(intro, "firstmenu"),
				text(intro, "treatmenu"),
				text(intro, "packing"),
				text(intro, "kidsfacility"),
				text(intro, "smoking")
		);
	}

	private AccommodationInfo toAccommodationInfo(JsonNode intro) {
		return new AccommodationInfo(
				text(intro, "checkintime"),
				text(intro, "checkouttime"),
				text(intro, "roomcount"),
				text(intro, "roomtype"),
				text(intro, "foodplace"),
				text(intro, "subfacility"),
				text(intro, "pickup"),
				firstPresentText(intro, "reservationurl")
						.map(this::normalizeUrl)
						.orElse(null)
		);
	}

	private List<AdditionalInfoItem> toAdditionalInfo(List<JsonNode> repeatedItems) {
		List<AdditionalInfoItem> additionalInfo = new ArrayList<>();
		for (JsonNode item : repeatedItems) {
			Map<String, String> attributes = new LinkedHashMap<>();
			putAttribute(attributes, "roomSize", text(item, "roomsize1", "roomsize2"));
			putAttribute(attributes, "baseOccupancy", text(item, "roombasecount"));
			putAttribute(attributes, "maxOccupancy", text(item, "roommaxcount"));
			putAttribute(attributes, "offseasonFee", text(item, "roomoffseasonminfee1", "roomoffseasonminfee2"));
			putAttribute(attributes, "peakSeasonFee", text(item, "roompeakseasonminfee1", "roompeakseasonminfee2"));

			String title = text(item, "infoname", "roomtitle");
			String description = text(item, "infotext", "roomintro");
			String imageUrl = firstPresentText(
					item,
					"roomimg1",
					"roomimg2",
					"roomimg3",
					"roomimg4",
					"roomimg5"
			).map(this::normalizeImageUrl).orElse(null);

			if (title != null || description != null || imageUrl != null || !attributes.isEmpty()) {
				additionalInfo.add(new AdditionalInfoItem(
						title,
						description,
						imageUrl,
						Map.copyOf(attributes)
				));
			}
		}
		return List.copyOf(additionalInfo);
	}

	private void putAttribute(Map<String, String> attributes, String key, String value) {
		if (value != null && !value.isBlank()) {
			attributes.put(key, value);
		}
	}

	private List<String> collectImageUrls(JsonNode common, List<JsonNode> imageItems) {
		Set<String> imageUrls = new LinkedHashSet<>();
		firstPresentText(common, "firstimage", "firstimage2")
				.map(this::normalizeImageUrl)
				.ifPresent(imageUrls::add);

		for (JsonNode imageItem : imageItems) {
			firstPresentText(imageItem, "originimgurl", "smallimageurl")
					.map(this::normalizeImageUrl)
					.ifPresent(imageUrls::add);
		}
		return List.copyOf(imageUrls);
	}

	private Optional<JsonNode> firstItem(JsonNode response) {
		List<JsonNode> items = extractItems(response);
		return items.isEmpty() ? Optional.empty() : Optional.of(items.get(0));
	}

	private List<JsonNode> extractItems(JsonNode response) {
		if (response == null) {
			return List.of();
		}
		JsonNode item = response.path("response").path("body").path("items").path("item");
		if (item.isMissingNode() || item.isNull()) {
			return List.of();
		}
		if (item.isArray()) {
			List<JsonNode> items = new ArrayList<>();
			item.forEach(items::add);
			return items;
		}
		return List.of(item);
	}

	private String resolveImageUrl(JsonNode item) {
		String imageUrl = firstPresentText(item, "firstimage", "firstimage2").orElse(null);
		return imageUrl == null ? null : normalizeImageUrl(imageUrl);
	}

	private String normalizeImageUrl(String imageUrl) {
		String normalized = normalizeUrl(imageUrl);
		if (normalized.startsWith("http://")) {
			return "https://" + normalized.substring("http://".length());
		}
		return normalized;
	}

	private String normalizeUrl(String url) {
		String normalized = HtmlUtils.htmlUnescape(url).trim();
		if (normalized.startsWith("//")) {
			return "https:" + normalized;
		}
		return normalized;
	}

	private String extractHomepage(JsonNode common) {
		String homepage = rawText(common, "homepage");
		if (homepage == null || homepage.isBlank()) {
			return null;
		}
		Matcher matcher = HREF_PATTERN.matcher(homepage);
		if (matcher.find()) {
			return normalizeUrl(matcher.group(1));
		}
		String text = cleanText(homepage);
		return text == null ? null : normalizeUrl(text);
	}

	private String text(JsonNode item, String... fieldNames) {
		return firstPresentText(item, fieldNames)
				.map(this::cleanText)
				.orElse(null);
	}

	private String rawText(JsonNode item, String fieldName) {
		return firstPresentText(item, fieldName).orElse(null);
	}

	private String cleanText(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		String withLineBreaks = value.replaceAll("(?i)<br\\s*/?>", "\n");
		String withoutTags = withLineBreaks.replaceAll("<[^>]+>", " ");
		String unescaped = HtmlUtils.htmlUnescape(withoutTags).replace('\u00a0', ' ');
		String cleaned = unescaped
				.replaceAll("[\\t\\x0B\\f\\r ]+", " ")
				.replaceAll(" *\\n *", "\n")
				.trim();
		return cleaned.isBlank() ? null : cleaned;
	}

	private String joinText(String first, String second) {
		if (first == null || first.isBlank()) {
			return second;
		}
		if (second == null || second.isBlank()) {
			return first;
		}
		return first + " " + second;
	}

	private Optional<String> firstPresentText(JsonNode item, String... fieldNames) {
		if (item == null) {
			return Optional.empty();
		}
		for (String fieldName : fieldNames) {
			String value = item.path(fieldName).asText(null);
			if (value != null && !value.isBlank()) {
				return Optional.of(value);
			}
		}
		return Optional.empty();
	}

	private String resolveCategory(String contentTypeId) {
		return switch (contentTypeId) {
			case "12" -> "tourist_attraction";
			case "14" -> "cultural_facility";
			case "15" -> "festival";
			case "25" -> "travel_course";
			case "28" -> "sports";
			case "32" -> "accommodation";
			case "38" -> "shopping";
			case "39" -> "restaurant";
			case "75" -> "sports";
			case "76" -> "tourist_attraction";
			case "77" -> "transportation";
			case "78" -> "cultural_facility";
			case "79" -> "shopping";
			case "80" -> "accommodation";
			case "82" -> "restaurant";
			case "85" -> "festival";
			default -> contentTypeId == null || contentTypeId.isBlank() ? "unknown" : contentTypeId;
		};
	}

	private Optional<Double> parseDouble(String value) {
		if (value == null || value.isBlank()) {
			return Optional.empty();
		}
		try {
			return Optional.of(Double.parseDouble(value));
		} catch (NumberFormatException exception) {
			return Optional.empty();
		}
	}
}
