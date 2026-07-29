"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Route as RouteIcon,
  Trash2,
  Users,
  X,
} from "lucide-react";
import AccountAccess, { type AccountUser } from "@/app/components/AccountAccess";
import CommunityBoard, {
  type PopularPlace,
  type PublicRoute,
} from "@/app/components/CommunityBoard";
import RoutePlannerPanel, {
  type RouteDraftPlace,
  type TravelRoute,
} from "@/app/components/RoutePlannerPanel";
import { backendApi } from "@/app/lib/backend-api";

type Area = {
  code: number;
  text: Record<SupportedUiLanguage, AreaText>;
  lat: number;
  lng: number;
  mapX: string;
  mapY: string;
  accent: string;
};

type AreaPreset = {
  areaCode: number;
  text: Record<SupportedUiLanguage, AreaText>;
  lat: number;
  lng: number;
};

type AreaText = {
  name: string;
  label: string;
  description: string;
};

type SupportedUiLanguage = "ko" | "en";

type Place = {
  contentId: string;
  title: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  imageUrl: string | null;
};

type SavedPlace = {
  id: number;
  contentId: string;
  title: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  dataLanguage: string;
  createdAt: string;
};

type PlaceDetail = {
  contentId: string;
  category: string;
  dataLanguage: string;
  fallbackUsed: boolean;
  title: string | null;
  overview: string | null;
  address: string | null;
  phone: string | null;
  homepage: string | null;
  latitude: number | null;
  longitude: number | null;
  primaryImageUrl: string | null;
  imageUrls: string[];
  visitInfo: {
    openingHours: string | null;
    closedDays: string | null;
    useFee: string | null;
    parking: string | null;
    reservation: string | null;
    informationCenter: string | null;
    experienceGuide: string | null;
    creditCard: string | null;
    petAllowed: string | null;
  };
  restaurantInfo: {
    firstMenu: string | null;
    menu: string | null;
    packing: string | null;
    kidsFacility: string | null;
    smoking: string | null;
  } | null;
  accommodationInfo: {
    checkInTime: string | null;
    checkOutTime: string | null;
    roomCount: string | null;
    roomType: string | null;
    foodPlace: string | null;
    subFacilities: string | null;
    pickup: string | null;
    bookingUrl: string | null;
  } | null;
  additionalInfo: Array<{
    title: string | null;
    description: string | null;
    imageUrl: string | null;
    attributes: Record<string, string>;
  }>;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string | null;
  timestamp: string;
};

type SelectedPoint = {
  lat: number;
  lng: number;
};

type KakaoLatLng = {
  getLat: () => number;
  getLng: () => number;
};

type KakaoMap = {
  setCenter: (latLng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  setBounds: (bounds: KakaoLatLngBounds) => void;
};

type KakaoMarker = {
  setMap: (map: KakaoMap | null) => void;
  setPosition: (latLng: KakaoLatLng) => void;
};

type KakaoCustomOverlay = {
  setMap: (map: KakaoMap | null) => void;
};

type KakaoPolyline = {
  setMap: (map: KakaoMap | null) => void;
};

type KakaoLatLngBounds = {
  extend: (latLng: KakaoLatLng) => void;
};

type KakaoGeocoderResult = {
  address_name: string;
  x: string;
  y: string;
};

type KakaoMapsApi = {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMap;
  Marker: new (options: { map?: KakaoMap; position: KakaoLatLng }) => KakaoMarker;
  CustomOverlay: new (options: {
    map?: KakaoMap;
    position: KakaoLatLng;
    content: HTMLElement;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
  }) => KakaoCustomOverlay;
  Polyline: new (options: {
    map?: KakaoMap;
    path: KakaoLatLng[];
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
    strokeStyle: string;
  }) => KakaoPolyline;
  LatLngBounds: new () => KakaoLatLngBounds;
  services: {
    Status: {
      OK: string;
    };
    Geocoder: new () => {
      addressSearch: (
        query: string,
        callback: (result: KakaoGeocoderResult[], status: string) => void,
      ) => void;
    };
  };
  event: {
    addListener: (
      target: KakaoMap | KakaoMarker,
      type: "click",
      callback: (event: { latLng: KakaoLatLng }) => void,
    ) => void;
  };
};

declare global {
  interface Window {
    kakao?: {
      maps: KakaoMapsApi;
    };
  }
}

const AREAS: Area[] = [
  {
    code: 1,
    text: {
      ko: {
        name: "서울",
        label: "도심",
        description: "궁궐, 디자인 거리, 먹거리 골목",
      },
      en: {
        name: "Seoul",
        label: "Urban",
        description: "Palaces, design districts, food alleys",
      },
    },
    lat: 37.5665,
    lng: 126.978,
    mapX: "48%",
    mapY: "34%",
    accent: "#2563eb",
  },
  {
    code: 6,
    text: {
      ko: {
        name: "부산",
        label: "해안",
        description: "바다 코스, 시장, 야경",
      },
      en: {
        name: "Busan",
        label: "Coast",
        description: "Ocean routes, markets, night views",
      },
    },
    lat: 35.1796,
    lng: 129.0756,
    mapX: "68%",
    mapY: "73%",
    accent: "#0891b2",
  },
  {
    code: 39,
    text: {
      ko: {
        name: "제주",
        label: "섬",
        description: "자연 산책로, 카페, 드라이브 코스",
      },
      en: {
        name: "Jeju",
        label: "Island",
        description: "Nature trails, cafes, scenic drives",
      },
    },
    lat: 33.4996,
    lng: 126.5312,
    mapX: "42%",
    mapY: "88%",
    accent: "#16a34a",
  },
  {
    code: 31,
    text: {
      ko: {
        name: "경기",
        label: "근교",
        description: "역사 명소, 테마 관광지",
      },
      en: {
        name: "Gyeonggi",
        label: "Day trip",
        description: "Historic stops, theme attractions",
      },
    },
    lat: 37.4138,
    lng: 127.5183,
    mapX: "53%",
    mapY: "39%",
    accent: "#7c3aed",
  },
  {
    code: 32,
    text: {
      ko: {
        name: "강원",
        label: "자연",
        description: "산, 바다, 웰니스 숙소",
      },
      en: {
        name: "Gangwon",
        label: "Nature",
        description: "Mountains, beaches, wellness stays",
      },
    },
    lat: 37.8228,
    lng: 128.1555,
    mapX: "64%",
    mapY: "31%",
    accent: "#d97706",
  },
];

const AREA_PRESETS: AreaPreset[] = [
  {
    areaCode: 1,
    text: {
      ko: {
        name: "궁궐·종로",
        label: "역사",
        description: "경복궁, 북촌, 인사동 주변",
      },
      en: {
        name: "Palaces·Jongno",
        label: "Heritage",
        description: "Gyeongbokgung, Bukchon, Insadong",
      },
    },
    lat: 37.5796,
    lng: 126.977,
  },
  {
    areaCode: 1,
    text: {
      ko: {
        name: "홍대·연남",
        label: "문화",
        description: "거리 공연, 카페, 편집숍",
      },
      en: {
        name: "Hongdae·Yeonnam",
        label: "Culture",
        description: "Street music, cafes, indie shops",
      },
    },
    lat: 37.5563,
    lng: 126.9238,
  },
  {
    areaCode: 1,
    text: {
      ko: {
        name: "강남·코엑스",
        label: "도심",
        description: "쇼핑, 전시, 도심 음식점",
      },
      en: {
        name: "Gangnam·COEX",
        label: "City",
        description: "Shopping, exhibitions, city dining",
      },
    },
    lat: 37.5126,
    lng: 127.0588,
  },
  {
    areaCode: 1,
    text: {
      ko: {
        name: "잠실·석촌호수",
        label: "호수",
        description: "호수 산책, 전망, 테마 명소",
      },
      en: {
        name: "Jamsil·Seokchon",
        label: "Lake",
        description: "Lake walks, views, theme spots",
      },
    },
    lat: 37.5112,
    lng: 127.0982,
  },
  {
    areaCode: 1,
    text: {
      ko: {
        name: "강동·한강 동부",
        label: "로컬",
        description: "한강 동부, 강동 생활권",
      },
      en: {
        name: "Gangdong·East Han",
        label: "Local",
        description: "East Han River and Gangdong area",
      },
    },
    lat: 37.5505,
    lng: 127.1238,
  },
  {
    areaCode: 6,
    text: {
      ko: {
        name: "해운대·달맞이",
        label: "바다",
        description: "해변, 달맞이길, 오션뷰",
      },
      en: {
        name: "Haeundae·Dalmaji",
        label: "Beach",
        description: "Beach, Dalmaji road, ocean views",
      },
    },
    lat: 35.1587,
    lng: 129.1604,
  },
  {
    areaCode: 6,
    text: {
      ko: {
        name: "광안리·수영",
        label: "야경",
        description: "광안대교, 해변 카페, 야경",
      },
      en: {
        name: "Gwangalli·Suyeong",
        label: "Night view",
        description: "Bridge views, beach cafes, nightlife",
      },
    },
    lat: 35.1532,
    lng: 129.1186,
  },
  {
    areaCode: 6,
    text: {
      ko: {
        name: "남포·자갈치",
        label: "시장",
        description: "시장, 먹거리, 원도심 산책",
      },
      en: {
        name: "Nampo·Jagalchi",
        label: "Market",
        description: "Markets, seafood, old downtown walks",
      },
    },
    lat: 35.0969,
    lng: 129.0305,
  },
  {
    areaCode: 6,
    text: {
      ko: {
        name: "서면",
        label: "중심",
        description: "쇼핑, 음식점, 도심 이동 거점",
      },
      en: {
        name: "Seomyeon",
        label: "Center",
        description: "Shopping, restaurants, transit hub",
      },
    },
    lat: 35.1577,
    lng: 129.0592,
  },
  {
    areaCode: 6,
    text: {
      ko: {
        name: "영도",
        label: "섬",
        description: "해안 산책, 전망, 로컬 카페",
      },
      en: {
        name: "Yeongdo",
        label: "Island",
        description: "Coastal walks, viewpoints, local cafes",
      },
    },
    lat: 35.0781,
    lng: 129.0645,
  },
  {
    areaCode: 39,
    text: {
      ko: {
        name: "제주시·공항",
        label: "도착",
        description: "공항 주변, 도심 맛집, 용두암",
      },
      en: {
        name: "Jeju City·Airport",
        label: "Arrival",
        description: "Airport area, city food, Yongduam",
      },
    },
    lat: 33.5066,
    lng: 126.493,
  },
  {
    areaCode: 39,
    text: {
      ko: {
        name: "애월",
        label: "해안",
        description: "해안도로, 카페, 노을",
      },
      en: {
        name: "Aewol",
        label: "Coast",
        description: "Coastal roads, cafes, sunset views",
      },
    },
    lat: 33.4628,
    lng: 126.3091,
  },
  {
    areaCode: 39,
    text: {
      ko: {
        name: "성산·우도",
        label: "일출",
        description: "성산일출봉, 우도, 동부 해안",
      },
      en: {
        name: "Seongsan·Udo",
        label: "Sunrise",
        description: "Seongsan Ilchulbong, Udo, east coast",
      },
    },
    lat: 33.4589,
    lng: 126.9421,
  },
  {
    areaCode: 39,
    text: {
      ko: {
        name: "서귀포·중문",
        label: "휴양",
        description: "폭포, 리조트, 중문 관광단지",
      },
      en: {
        name: "Seogwipo·Jungmun",
        label: "Resort",
        description: "Waterfalls, resorts, Jungmun complex",
      },
    },
    lat: 33.2539,
    lng: 126.4149,
  },
  {
    areaCode: 39,
    text: {
      ko: {
        name: "한림·협재",
        label: "해변",
        description: "협재해변, 비양도, 서부 카페",
      },
      en: {
        name: "Hallim·Hyeopjae",
        label: "Beach",
        description: "Hyeopjae beach, Biyangdo, west cafes",
      },
    },
    lat: 33.3936,
    lng: 126.2398,
  },
  {
    areaCode: 31,
    text: {
      ko: {
        name: "수원 화성",
        label: "역사",
        description: "화성행궁, 성곽길, 행리단길",
      },
      en: {
        name: "Suwon Hwaseong",
        label: "Heritage",
        description: "Fortress, palace, Haengnidan-gil",
      },
    },
    lat: 37.2852,
    lng: 127.0142,
  },
  {
    areaCode: 31,
    text: {
      ko: {
        name: "가평·청평",
        label: "자연",
        description: "호수, 수목원, 근교 여행",
      },
      en: {
        name: "Gapyeong·Cheongpyeong",
        label: "Nature",
        description: "Lakes, gardens, day trips",
      },
    },
    lat: 37.7353,
    lng: 127.4265,
  },
  {
    areaCode: 31,
    text: {
      ko: {
        name: "파주·헤이리",
        label: "예술",
        description: "출판단지, 헤이리, 임진각",
      },
      en: {
        name: "Paju·Heyri",
        label: "Art",
        description: "Book city, Heyri, Imjingak",
      },
    },
    lat: 37.7894,
    lng: 126.6976,
  },
  {
    areaCode: 31,
    text: {
      ko: {
        name: "용인·에버랜드",
        label: "테마",
        description: "테마파크, 가족 여행, 리조트",
      },
      en: {
        name: "Yongin·Everland",
        label: "Theme",
        description: "Theme park, family trip, resorts",
      },
    },
    lat: 37.2936,
    lng: 127.2022,
  },
  {
    areaCode: 32,
    text: {
      ko: {
        name: "춘천·남이섬",
        label: "호수",
        description: "호수, 섬 여행, 닭갈비",
      },
      en: {
        name: "Chuncheon·Nami",
        label: "Lake",
        description: "Lakes, island trips, local food",
      },
    },
    lat: 37.7919,
    lng: 127.525,
  },
  {
    areaCode: 32,
    text: {
      ko: {
        name: "강릉·경포",
        label: "바다",
        description: "경포해변, 커피거리, 호수",
      },
      en: {
        name: "Gangneung·Gyeongpo",
        label: "Sea",
        description: "Beach, coffee street, lake",
      },
    },
    lat: 37.8056,
    lng: 128.9088,
  },
  {
    areaCode: 32,
    text: {
      ko: {
        name: "속초·설악",
        label: "산",
        description: "설악산, 속초해변, 중앙시장",
      },
      en: {
        name: "Sokcho·Seorak",
        label: "Mountain",
        description: "Seoraksan, beaches, central market",
      },
    },
    lat: 38.2043,
    lng: 128.5918,
  },
  {
    areaCode: 32,
    text: {
      ko: {
        name: "평창·대관령",
        label: "고원",
        description: "목장, 고원 풍경, 겨울 여행",
      },
      en: {
        name: "Pyeongchang·Daegwallyeong",
        label: "Highland",
        description: "Ranches, highlands, winter trips",
      },
    },
    lat: 37.6771,
    lng: 128.7063,
  },
];

const CONTENT_TYPES = [
  { value: "tourist_attraction", labels: { ko: "관광지", en: "Spots" } },
  { value: "restaurant", labels: { ko: "음식점", en: "Food" } },
  { value: "accommodation", labels: { ko: "숙박", en: "Stays" } },
];

const CATEGORY_LABELS: Record<string, Record<SupportedUiLanguage, string>> = {
  tourist_attraction: { ko: "관광지", en: "Spot" },
  restaurant: { ko: "음식점", en: "Food" },
  accommodation: { ko: "숙박", en: "Stay" },
  cultural_facility: { ko: "문화시설", en: "Culture" },
  festival: { ko: "축제", en: "Festival" },
  travel_course: { ko: "여행코스", en: "Course" },
  shopping: { ko: "쇼핑", en: "Shopping" },
  sports: { ko: "레포츠", en: "Sports" },
  transportation: { ko: "교통", en: "Transit" },
  unknown: { ko: "기타", en: "Other" },
};

const ADDITIONAL_ATTRIBUTE_LABELS: Record<
  string,
  Record<SupportedUiLanguage, string>
> = {
  roomSize: { ko: "객실 크기", en: "Room size" },
  baseOccupancy: { ko: "기준 인원", en: "Base occupancy" },
  maxOccupancy: { ko: "최대 인원", en: "Maximum occupancy" },
  offseasonFee: { ko: "비수기 요금", en: "Off-season rate" },
  peakSeasonFee: { ko: "성수기 요금", en: "Peak-season rate" },
};

const LANGUAGES = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh-cn", label: "中文(简体)" },
  { value: "zh-tw", label: "中文(繁體)" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "ru", label: "Русский" },
];

const UI_MESSAGES = {
  ko: {
    heroTitle: "지도에서 고르는 한국 여행",
    privacyNotice: "현재 위치 자동 수집 없음",
    searchOptions: "검색 옵션",
    collapseSearchOptions: "옵션 접기",
    expandSearchOptions: "옵션 펼치기",
    searchBase: "기준 지역",
    recommendedAreas: "추천 관광권역",
    addressSearch: "상세 주소 검색",
    addressPlaceholder: "예: 서울특별시 강동구 천중로",
    addressSearchButton: "주소 이동",
    addressSearching: "이동 중...",
    addressMapNotReady: "지도가 준비된 뒤 주소를 검색할 수 있습니다.",
    addressNoResults: "해당 주소를 찾지 못했습니다. 도로명이나 지번을 조금 더 자세히 입력해 주세요.",
    addressSearchFailed: "주소 검색 중 문제가 발생했습니다.",
    radius: "반경",
    language: "언어",
    searchButton: "이 위치로 검색",
    searching: "검색 중...",
    resultsTitle: "검색 결과",
    emptyHint: "지도에서 지역을 선택하고 검색하세요.",
    emptyResults: "검색 후 관광지 결과가 여기에 표시됩니다.",
    savedPlaces: "저장 장소",
    savedEmpty: "저장한 장소가 없습니다. 검색 결과에서 북마크 버튼을 눌러 담아보세요.",
    savePlace: "장소 저장",
    removeSavedPlace: "저장 취소",
    savedLoadError: "저장 장소를 처리하지 못했습니다.",
    routePlanner: "코스 편집",
    addToRoute: "코스에 추가",
    removeFromRoute: "코스에서 제거",
    routePlaceLimit: "한 코스에는 장소를 최대 30개까지 추가할 수 있습니다.",
    routeDuplicate: "이미 현재 코스에 포함된 장소입니다.",
    routeSaveError: "코스를 처리하지 못했습니다.",
    routeSignIn: "로그인하면 현재 코스를 영구 저장합니다.",
    defaultRouteTitle: "나의 한국 여행",
    community: "코스 둘러보기",
    communityLoadError: "공개 코스와 인기 장소를 불러오지 못했습니다.",
    publishRoute: "이 코스를 공개 게시판에 올리시겠습니까?",
    privateRoute: "이 코스를 비공개로 전환하시겠습니까?",
    routeCopyError: "공개 코스를 복사하지 못했습니다.",
    popularSavedBy: "명이 저장",
    fallbackCategory: "관광지",
    imageFallback: "이미지 없음",
    detailLoading: "상세 정보를 불러오는 중입니다.",
    detailLoadError: "상세 정보를 불러오지 못했습니다.",
    closeDetail: "상세 정보 닫기",
    detailOverview: "소개",
    visitInformation: "이용 정보",
    openingHours: "운영 시간",
    closedDays: "휴무일",
    useFee: "이용 요금",
    parking: "주차",
    reservation: "예약",
    informationCenter: "문의처",
    experienceGuide: "체험 안내",
    creditCard: "카드 사용",
    petAllowed: "반려동물",
    restaurantInformation: "음식점 정보",
    firstMenu: "대표 메뉴",
    menu: "취급 메뉴",
    packing: "포장",
    kidsFacility: "어린이 시설",
    smoking: "흡연",
    accommodationInformation: "숙박 정보",
    checkInTime: "체크인",
    checkOutTime: "체크아웃",
    roomCount: "객실 수",
    roomType: "객실 유형",
    foodPlace: "식음료장",
    subFacilities: "부대시설",
    pickup: "픽업",
    booking: "예약 페이지",
    additionalInformation: "추가 정보",
    gallery: "추가 이미지",
    website: "홈페이지",
    phone: "전화",
    sourceLanguage: "관광 데이터 언어",
    fallbackNotice: "선택 언어의 상세 정보가 없어 다른 언어 정보가 표시됩니다.",
    roomSize: "객실 크기",
    baseOccupancy: "기준 인원",
    maxOccupancy: "최대 인원",
    offseasonFee: "비수기 요금",
    peakSeasonFee: "성수기 요금",
    mapMissingKeyTitle: "Kakao Maps 키가 필요합니다",
    mapLoadErrorTitle: "Kakao Maps를 불러오지 못했습니다",
    mapLoadingTitle: "Kakao Maps를 불러오는 중입니다",
    mapSetupGuide:
      "프론트 환경변수에 NEXT_PUBLIC_KAKAO_MAP_APP_KEY를 설정한 뒤 Next 개발 서버를 다시 시작하세요.",
    selectedSuffix: "선택됨",
    selectedRouteBase: "선택한 탐색 기준",
    areaCode: "지역",
    selectedBaseDescription:
      "현재 위치가 아니라 지도에서 선택한 좌표와 공공 관광데이터를 기준으로 검색합니다.",
  },
  en: {
    heroTitle: "Discover Korea by map",
    privacyNotice: "No live GPS collection",
    searchOptions: "Search options",
    collapseSearchOptions: "Collapse",
    expandSearchOptions: "Expand",
    searchBase: "Search base",
    recommendedAreas: "Recommended zones",
    addressSearch: "Detailed address",
    addressPlaceholder: "e.g. Cheonjung-ro, Gangdong-gu, Seoul",
    addressSearchButton: "Move",
    addressSearching: "Moving...",
    addressMapNotReady: "Search by address after the map is ready.",
    addressNoResults: "No address result found. Try a more specific road or lot address.",
    addressSearchFailed: "Address search failed.",
    radius: "Radius",
    language: "Lang",
    searchButton: "Search this map area",
    searching: "Searching...",
    resultsTitle: "Nearby results",
    emptyHint: "Select an area on the map, then search.",
    emptyResults: "Nearby tourism results will appear here after search.",
    savedPlaces: "Saved places",
    savedEmpty: "No saved places yet. Use the bookmark button in search results to add one.",
    savePlace: "Save place",
    removeSavedPlace: "Remove saved place",
    savedLoadError: "Saved places could not be updated.",
    routePlanner: "Route planner",
    addToRoute: "Add to route",
    removeFromRoute: "Remove from route",
    routePlaceLimit: "A route can contain up to 30 places.",
    routeDuplicate: "This place is already in the current route.",
    routeSaveError: "The route could not be updated.",
    routeSignIn: "Sign in to save the current route permanently.",
    defaultRouteTitle: "My Korea route",
    community: "Explore routes",
    communityLoadError: "Public routes and popular places could not be loaded.",
    publishRoute: "Publish this route to the community board?",
    privateRoute: "Make this route private?",
    routeCopyError: "The public route could not be copied.",
    popularSavedBy: "travelers saved",
    fallbackCategory: "Spots",
    imageFallback: "No image",
    detailLoading: "Loading place details.",
    detailLoadError: "Could not load place details.",
    closeDetail: "Close details",
    detailOverview: "Overview",
    visitInformation: "Visitor information",
    openingHours: "Opening hours",
    closedDays: "Closed days",
    useFee: "Admission",
    parking: "Parking",
    reservation: "Reservation",
    informationCenter: "Information",
    experienceGuide: "Experience",
    creditCard: "Credit cards",
    petAllowed: "Pets",
    restaurantInformation: "Restaurant information",
    firstMenu: "Signature menu",
    menu: "Menu",
    packing: "Takeout",
    kidsFacility: "Kids facilities",
    smoking: "Smoking",
    accommodationInformation: "Accommodation information",
    checkInTime: "Check-in",
    checkOutTime: "Check-out",
    roomCount: "Rooms",
    roomType: "Room types",
    foodPlace: "Dining",
    subFacilities: "Facilities",
    pickup: "Pickup",
    booking: "Booking page",
    additionalInformation: "Additional information",
    gallery: "More photos",
    website: "Website",
    phone: "Phone",
    sourceLanguage: "Tourism data language",
    fallbackNotice: "Details are shown in another language because selected-language data was unavailable.",
    roomSize: "Room size",
    baseOccupancy: "Base occupancy",
    maxOccupancy: "Maximum occupancy",
    offseasonFee: "Off-season rate",
    peakSeasonFee: "Peak-season rate",
    mapMissingKeyTitle: "Kakao Maps key is required",
    mapLoadErrorTitle: "Kakao Maps could not be loaded",
    mapLoadingTitle: "Loading Kakao Maps",
    mapSetupGuide:
      "Set NEXT_PUBLIC_KAKAO_MAP_APP_KEY in the frontend environment, then restart the Next dev server.",
    selectedSuffix: "selected",
    selectedRouteBase: "Selected route base",
    areaCode: "area",
    selectedBaseDescription:
      "Search uses selected map coordinates and public tourism data, not the visitor's current location.",
  },
} satisfies Record<SupportedUiLanguage, Record<string, string>>;

type DetailRow = [label: string, value: string];

function compactDetailRows(
  rows: Array<[label: string, value: string | null | undefined]>,
): DetailRow[] {
  return rows.filter((row): row is DetailRow => Boolean(row[1]?.trim()));
}

function isExternalUrl(value: string | null | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

const ROUTE_DRAFT_STORAGE_KEY = "kroute.route-draft.v1";
const MAX_ROUTE_PLACES = 30;

function isRouteDraftPlace(value: unknown): value is RouteDraftPlace {
  if (!value || typeof value !== "object") return false;
  const place = value as Partial<RouteDraftPlace>;
  return (
    typeof place.contentId === "string" &&
    typeof place.title === "string" &&
    typeof place.category === "string" &&
    typeof place.address === "string" &&
    typeof place.latitude === "number" &&
    typeof place.longitude === "number" &&
    typeof place.dataLanguage === "string"
  );
}

export default function Home() {
  const [selectedArea, setSelectedArea] = useState<Area>(AREAS[0]);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint>({
    lat: AREAS[0].lat,
    lng: AREAS[0].lng,
  });
  const [radius, setRadius] = useState("1000");
  const [language, setLanguage] = useState("ko");
  const [isSearchOptionsCollapsed, setIsSearchOptionsCollapsed] =
    useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0].value);
  const [places, setPlaces] = useState<Place[]>([]);
  const [currentUser, setCurrentUser] = useState<AccountUser | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isSavedPlacesOpen, setIsSavedPlacesOpen] = useState(false);
  const [savingContentIds, setSavingContentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [savedPlacesError, setSavedPlacesError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<TravelRoute[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<number | null>(null);
  const [routeDraftTitle, setRouteDraftTitle] = useState("나의 한국 여행");
  const [routeDraftPlaces, setRouteDraftPlaces] = useState<RouteDraftPlace[]>([]);
  const [isRoutePlannerOpen, setIsRoutePlannerOpen] = useState(false);
  const [isRouteSaving, setIsRouteSaving] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [publicRoutes, setPublicRoutes] = useState<PublicRoute[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<PopularPlace[]>([]);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isCommunityLoading, setIsCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [previewPublicRouteId, setPreviewPublicRouteId] = useState<number | null>(
    null,
  );
  const [communityPreviewPlaces, setCommunityPreviewPlaces] = useState<
    RouteDraftPlace[] | null
  >(null);
  const [saveRouteAfterLogin, setSaveRouteAfterLogin] = useState(false);
  const [isRouteDraftHydrated, setIsRouteDraftHydrated] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressSearching, setIsAddressSearching] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(
    null,
  );
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [failedDetailImageUrls, setFailedDetailImageUrls] = useState<Set<string>>(
    () => new Set(),
  );
  const [mapStatus, setMapStatus] = useState<
    "missing-key" | "loading" | "ready" | "error"
  >(() =>
    process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ? "loading" : "missing-key",
  );
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(
    null,
  );
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const selectedMarkerRef = useRef<KakaoMarker | null>(null);
  const placeMarkersRef = useRef<KakaoMarker[]>([]);
  const routeMarkersRef = useRef<KakaoCustomOverlay[]>([]);
  const routePolylineRef = useRef<KakaoPolyline | null>(null);
  const openPlaceDetailRef = useRef<(place: Place) => void>(() => undefined);
  const detailRequestIdRef = useRef(0);
  const savedPlacesRequestIdRef = useRef(0);
  const routesRequestIdRef = useRef(0);

  const apiBaseUrl = useMemo(() => {
    return "/backend-api";
  }, []);

  const kakaoMapAppKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
  const uiLanguage: SupportedUiLanguage = language === "ko" ? "ko" : "en";
  const messages = UI_MESSAGES[uiLanguage];
  const selectedAreaText = selectedArea.text[uiLanguage];

  const selectedContentType = useMemo(() => {
    return CONTENT_TYPES.find((type) => type.value === contentType);
  }, [contentType]);

  const areaPresets = useMemo(() => {
    return AREA_PRESETS.filter((preset) => preset.areaCode === selectedArea.code);
  }, [selectedArea.code]);

  const savedPlaceByContentId = useMemo(() => {
    return new Map(savedPlaces.map((place) => [place.contentId, place]));
  }, [savedPlaces]);

  const routeContentIds = useMemo(
    () => new Set(routeDraftPlaces.map((place) => place.contentId)),
    [routeDraftPlaces],
  );

  const mapRoutePlaces = communityPreviewPlaces ?? routeDraftPlaces;

  const popularPlaceByContentId = useMemo(
    () => new Map(popularPlaces.map((place) => [place.contentId, place])),
    [popularPlaces],
  );

  const loadCommunity = useCallback(async () => {
    setIsCommunityLoading(true);
    setCommunityError(null);
    try {
      const [routeResponse, popularResponse] = await Promise.all([
        backendApi<PublicRoute[]>("/public/routes"),
        backendApi<PopularPlace[]>("/public/places/popular?limit=12"),
      ]);
      setPublicRoutes(routeResponse.data);
      setPopularPlaces(popularResponse.data);
    } catch (error) {
      setCommunityError(
        error instanceof Error
          ? error.message
          : "Community data could not be loaded",
      );
    } finally {
      setIsCommunityLoading(false);
    }
  }, []);

  const handleSessionChange = useCallback((user: AccountUser | null) => {
    setCurrentUser(user);
    setSavedPlacesError(null);
    const requestId = savedPlacesRequestIdRef.current + 1;
    const routeRequestId = routesRequestIdRef.current + 1;
    savedPlacesRequestIdRef.current = requestId;
    routesRequestIdRef.current = routeRequestId;

    if (!user) {
      setSavedPlaces([]);
      setRoutes([]);
      setIsSavedPlacesOpen(false);
      return;
    }

    backendApi<SavedPlace[]>("/saved-places")
      .then((response) => {
        if (savedPlacesRequestIdRef.current === requestId) {
          setSavedPlaces(response.data);
        }
      })
      .catch((error) => {
        if (savedPlacesRequestIdRef.current === requestId) {
          setSavedPlaces([]);
          setSavedPlacesError(
            error instanceof Error ? error.message : "Saved places could not be loaded",
          );
        }
      });

    backendApi<TravelRoute[]>("/routes")
      .then((response) => {
        if (routesRequestIdRef.current === routeRequestId) {
          setRoutes(response.data);
        }
      })
      .catch((error) => {
        if (routesRequestIdRef.current === routeRequestId) {
          setRoutes([]);
          setRouteError(
            error instanceof Error ? error.message : "Routes could not be loaded",
          );
        }
      });
  }, []);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(ROUTE_DRAFT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as {
            title?: unknown;
            places?: unknown;
          };
          if (typeof parsed.title === "string" && parsed.title.trim()) {
            setRouteDraftTitle(parsed.title.slice(0, 100));
          }
          if (Array.isArray(parsed.places)) {
            setRouteDraftPlaces(
              parsed.places.filter(isRouteDraftPlace).slice(0, MAX_ROUTE_PLACES),
            );
          }
        }
      } catch {
        window.localStorage.removeItem(ROUTE_DRAFT_STORAGE_KEY);
      } finally {
        setIsRouteDraftHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!isRouteDraftHydrated) return;
    window.localStorage.setItem(
      ROUTE_DRAFT_STORAGE_KEY,
      JSON.stringify({ title: routeDraftTitle, places: routeDraftPlaces }),
    );
  }, [isRouteDraftHydrated, routeDraftPlaces, routeDraftTitle]);

  const persistRoute = useCallback(
    async () => {
      if (!routeDraftTitle.trim() || routeDraftPlaces.length === 0) return;
      setIsRouteSaving(true);
      setRouteError(null);
      try {
        const path = activeRouteId ? `/routes/${activeRouteId}` : "/routes";
        const response = await backendApi<TravelRoute>(path, {
          method: activeRouteId ? "PUT" : "POST",
          body: JSON.stringify({
            title: routeDraftTitle.trim(),
            places: routeDraftPlaces,
          }),
        });
        setActiveRouteId(response.data.id);
        setRoutes((previous) => [
          response.data,
          ...previous.filter((route) => route.id !== response.data.id),
        ]);
      } catch (error) {
        setRouteError(
          error instanceof Error
            ? error.message
            : uiLanguage === "ko"
              ? "코스를 처리하지 못했습니다."
              : "The route could not be updated.",
        );
      } finally {
        setIsRouteSaving(false);
      }
    },
    [activeRouteId, routeDraftPlaces, routeDraftTitle, uiLanguage],
  );

  useEffect(() => {
    if (!currentUser || !saveRouteAfterLogin) return;
    const saveTimer = window.setTimeout(() => {
      setSaveRouteAfterLogin(false);
      void persistRoute();
    }, 0);
    return () => window.clearTimeout(saveTimer);
  }, [currentUser, persistRoute, saveRouteAfterLogin]);

  const visitRows = placeDetail
    ? compactDetailRows([
        [messages.openingHours, placeDetail.visitInfo.openingHours],
        [messages.closedDays, placeDetail.visitInfo.closedDays],
        [messages.useFee, placeDetail.visitInfo.useFee],
        [messages.parking, placeDetail.visitInfo.parking],
        [messages.reservation, placeDetail.visitInfo.reservation],
        [messages.informationCenter, placeDetail.visitInfo.informationCenter],
        [messages.experienceGuide, placeDetail.visitInfo.experienceGuide],
        [messages.creditCard, placeDetail.visitInfo.creditCard],
        [messages.petAllowed, placeDetail.visitInfo.petAllowed],
      ])
    : [];

  const restaurantRows = placeDetail?.restaurantInfo
    ? compactDetailRows([
        [messages.firstMenu, placeDetail.restaurantInfo.firstMenu],
        [messages.menu, placeDetail.restaurantInfo.menu],
        [messages.packing, placeDetail.restaurantInfo.packing],
        [messages.kidsFacility, placeDetail.restaurantInfo.kidsFacility],
        [messages.smoking, placeDetail.restaurantInfo.smoking],
      ])
    : [];

  const accommodationRows = placeDetail?.accommodationInfo
    ? compactDetailRows([
        [messages.checkInTime, placeDetail.accommodationInfo.checkInTime],
        [messages.checkOutTime, placeDetail.accommodationInfo.checkOutTime],
        [messages.roomCount, placeDetail.accommodationInfo.roomCount],
        [messages.roomType, placeDetail.accommodationInfo.roomType],
        [messages.foodPlace, placeDetail.accommodationInfo.foodPlace],
        [messages.subFacilities, placeDetail.accommodationInfo.subFacilities],
        [messages.pickup, placeDetail.accommodationInfo.pickup],
      ])
    : [];

  function closePlaceDetail() {
    detailRequestIdRef.current += 1;
    setSelectedPlace(null);
    setPlaceDetail(null);
    setDetailErrorMessage(null);
    setIsDetailLoading(false);
    setFailedDetailImageUrls(new Set());
  }

  function changeLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);
    closePlaceDetail();
  }

  function selectArea(area: Area) {
    closePlaceDetail();
    setSelectedArea(area);
    setSelectedPoint({ lat: area.lat, lng: area.lng });
    setSelectedLocationName(null);
  }

  function selectPreset(preset: AreaPreset) {
    closePlaceDetail();
    const presetText = preset.text[uiLanguage];
    setSelectedPoint({ lat: preset.lat, lng: preset.lng });
    setSelectedLocationName(presetText.name);
    setPlaces([]);
    setLastQuery(null);
    mapRef.current?.setLevel(5);
  }

  function getCategoryLabel(category: string) {
    return (
      CATEGORY_LABELS[category]?.[uiLanguage] ??
      (category ? category : CATEGORY_LABELS.unknown[uiLanguage])
    );
  }

  function getAdditionalAttributeLabel(key: string) {
    return ADDITIONAL_ATTRIBUTE_LABELS[key]?.[uiLanguage] ?? key;
  }

  function toPlace(savedPlace: SavedPlace): Place {
    return {
      contentId: savedPlace.contentId,
      title: savedPlace.title,
      category: savedPlace.category,
      address: savedPlace.address,
      latitude: savedPlace.latitude,
      longitude: savedPlace.longitude,
      distanceMeters: 0,
      imageUrl: savedPlace.imageUrl,
    };
  }

  function toRouteDraftPlace(
    place: Place,
    detail?: PlaceDetail | null,
  ): RouteDraftPlace {
    return {
      contentId: place.contentId,
      title: detail?.title || place.title,
      category: place.category,
      address: detail?.address ?? place.address ?? "",
      latitude: detail?.latitude ?? place.latitude,
      longitude: detail?.longitude ?? place.longitude,
      imageUrl: detail?.primaryImageUrl ?? place.imageUrl,
      dataLanguage: detail?.dataLanguage ?? language,
      stayMinutes: null,
    };
  }

  function toggleRoutePlace(place: Place, detail?: PlaceDetail | null) {
    if (routeContentIds.has(place.contentId)) {
      setRouteDraftPlaces((previous) =>
        previous.filter((item) => item.contentId !== place.contentId),
      );
      setRouteError(null);
      return;
    }
    if (routeDraftPlaces.length >= MAX_ROUTE_PLACES) {
      setRouteError(messages.routePlaceLimit);
      setIsRoutePlannerOpen(true);
      return;
    }
    setRouteDraftPlaces((previous) => [
      ...previous,
      toRouteDraftPlace(place, detail),
    ]);
    setRouteError(null);
    setIsSavedPlacesOpen(false);
    closePlaceDetail();
    setIsRoutePlannerOpen(true);
  }

  function moveRoutePlace(index: number, direction: -1 | 1) {
    setRouteDraftPlaces((previous) => {
      const target = index + direction;
      if (target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function startNewRoute() {
    setActiveRouteId(null);
    setRouteDraftTitle(messages.defaultRouteTitle);
    setRouteDraftPlaces([]);
    setRouteError(null);
  }

  function openRoute(route: TravelRoute) {
    setActiveRouteId(route.id);
    setRouteDraftTitle(route.title);
    setRouteDraftPlaces(
      [...route.places]
        .sort((left, right) => left.visitOrder - right.visitOrder)
        .map((place) => ({
          contentId: place.contentId,
          title: place.title,
          category: place.category,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          imageUrl: place.imageUrl,
          dataLanguage: place.dataLanguage,
          stayMinutes: place.stayMinutes,
        })),
    );
    setRouteError(null);
    setIsSavedPlacesOpen(false);
    setIsCommunityOpen(false);
    setPreviewPublicRouteId(null);
    setCommunityPreviewPlaces(null);
    closePlaceDetail();
    setIsRoutePlannerOpen(true);
  }

  function closeCommunity() {
    setIsCommunityOpen(false);
    setPreviewPublicRouteId(null);
    setCommunityPreviewPlaces(null);
  }

  function previewPublicRoute(route: PublicRoute) {
    setPreviewPublicRouteId(route.id);
    setCommunityPreviewPlaces(
      [...route.places]
        .sort((left, right) => left.visitOrder - right.visitOrder)
        .map((place) => ({
          contentId: place.contentId,
          title: place.title,
          category: place.category,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          imageUrl: place.imageUrl,
          dataLanguage: place.dataLanguage,
          stayMinutes: place.stayMinutes,
        })),
    );
  }

  async function copyPublicRoute(routeId: number) {
    if (!currentUser) {
      window.dispatchEvent(new Event("kroute:open-login"));
      return;
    }

    setCommunityError(null);
    try {
      const response = await backendApi<TravelRoute>(
        `/public/routes/${routeId}/copy`,
        { method: "POST" },
      );
      setRoutes((previous) => [response.data, ...previous]);
      openRoute(response.data);
      void loadCommunity();
    } catch (error) {
      setCommunityError(
        error instanceof Error ? error.message : messages.routeCopyError,
      );
    }
  }

  async function toggleRouteVisibility(route: TravelRoute) {
    const confirmed = window.confirm(
      route.publicRoute ? messages.privateRoute : messages.publishRoute,
    );
    if (!confirmed) return;

    setRouteError(null);
    try {
      const response = await backendApi<TravelRoute>(
        `/routes/${route.id}/visibility`,
        {
          method: "PATCH",
          body: JSON.stringify({ publicRoute: !route.publicRoute }),
        },
      );
      setRoutes((previous) =>
        previous.map((item) =>
          item.id === response.data.id ? response.data : item,
        ),
      );
      void loadCommunity();
    } catch (error) {
      setRouteError(
        error instanceof Error ? error.message : messages.routeSaveError,
      );
    }
  }

  function openPopularPlace(place: PopularPlace) {
    closeCommunity();
    void openPlaceDetail({
      contentId: place.contentId,
      title: place.title,
      category: place.category,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      distanceMeters: 0,
      imageUrl: place.imageUrl,
    });
  }

  function requestRouteSave() {
    if (!currentUser) {
      setSaveRouteAfterLogin(true);
      setRouteError(messages.routeSignIn);
      window.dispatchEvent(new Event("kroute:open-login"));
      return;
    }
    void persistRoute();
  }

  async function deleteRoute(routeId: number) {
    const confirmed = window.confirm(
      uiLanguage === "ko"
        ? "이 코스를 삭제하시겠습니까?"
        : "Delete this route?",
    );
    if (!confirmed) return;
    setRouteError(null);
    try {
      await backendApi(`/routes/${routeId}`, { method: "DELETE" });
      setRoutes((previous) => previous.filter((route) => route.id !== routeId));
      if (activeRouteId === routeId) startNewRoute();
    } catch (error) {
      setRouteError(
        error instanceof Error ? error.message : messages.routeSaveError,
      );
    }
  }

  async function toggleSavedPlace(place: Place, detail?: PlaceDetail | null) {
    if (!currentUser) {
      window.dispatchEvent(new Event("kroute:open-login"));
      return;
    }

    const existing = savedPlaceByContentId.get(place.contentId);
    setSavedPlacesError(null);
    setSavingContentIds((previous) => new Set(previous).add(place.contentId));

    try {
      if (existing) {
        await backendApi(`/saved-places/${existing.id}`, { method: "DELETE" });
        setSavedPlaces((previous) =>
          previous.filter((savedPlace) => savedPlace.id !== existing.id),
        );
        return;
      }

      const response = await backendApi<SavedPlace>("/saved-places", {
        method: "POST",
        body: JSON.stringify({
          contentId: place.contentId,
          title: detail?.title || place.title,
          category: place.category,
          address: detail?.address ?? place.address ?? "",
          latitude: detail?.latitude ?? place.latitude,
          longitude: detail?.longitude ?? place.longitude,
          imageUrl: detail?.primaryImageUrl ?? place.imageUrl,
          dataLanguage: detail?.dataLanguage ?? language,
        }),
      });
      setSavedPlaces((previous) => [
        response.data,
        ...previous.filter(
          (savedPlace) => savedPlace.contentId !== response.data.contentId,
        ),
      ]);
    } catch (error) {
      setSavedPlacesError(
        error instanceof Error ? error.message : messages.savedLoadError,
      );
    } finally {
      setSavingContentIds((previous) => {
        const next = new Set(previous);
        next.delete(place.contentId);
        return next;
      });
    }
  }

  async function openPlaceDetail(place: Place) {
    const requestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = requestId;
    setSelectedPlace(place);
    setPlaceDetail(null);
    setDetailErrorMessage(null);
    setIsDetailLoading(true);
    setFailedDetailImageUrls(new Set());
    setIsSavedPlacesOpen(false);
    setIsRoutePlannerOpen(false);
    setIsCommunityOpen(false);
    setPreviewPublicRouteId(null);
    setCommunityPreviewPlaces(null);

    if (window.kakao?.maps && mapRef.current) {
      mapRef.current.setCenter(
        new window.kakao.maps.LatLng(place.latitude, place.longitude),
      );
    }

    const params = new URLSearchParams({
      lang: language,
      contentType: place.category,
    });

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/places/${encodeURIComponent(place.contentId)}?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`${messages.detailLoadError} (${response.status})`);
      }

      const result = (await response.json()) as ApiResponse<PlaceDetail>;
      if (detailRequestIdRef.current === requestId) {
        setPlaceDetail(result.data);
      }
    } catch (error) {
      if (detailRequestIdRef.current === requestId) {
        setDetailErrorMessage(
          error instanceof Error ? error.message : messages.detailLoadError,
        );
      }
    } finally {
      if (detailRequestIdRef.current === requestId) {
        setIsDetailLoading(false);
      }
    }
  }

  function searchAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = addressQuery.trim();
    if (!query) {
      return;
    }

    if (!window.kakao?.maps?.services || !mapRef.current) {
      setErrorMessage(messages.addressMapNotReady);
      return;
    }

    setIsAddressSearching(true);
    setErrorMessage(null);

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(query, (result, status) => {
      setIsAddressSearching(false);

      if (
        status !== window.kakao?.maps.services.Status.OK ||
        result.length === 0
      ) {
        setErrorMessage(messages.addressNoResults);
        return;
      }

      const matchedAddress = result[0];
      const nextPoint = {
        lat: Number(Number(matchedAddress.y).toFixed(6)),
        lng: Number(Number(matchedAddress.x).toFixed(6)),
      };

      setSelectedPoint(nextPoint);
      setSelectedLocationName(matchedAddress.address_name || query);
      setPlaces([]);
      setLastQuery(null);
      closePlaceDetail();
      mapRef.current?.setLevel(5);
    });
  }

  async function searchNearbyPlaces() {
    closePlaceDetail();
    setIsLoading(true);
    setErrorMessage(null);
    setFailedImageIds(new Set());

    const params = new URLSearchParams({
      selectedLat: selectedPoint.lat.toString(),
      selectedLng: selectedPoint.lng.toString(),
      areaCode: selectedArea.code.toString(),
      radius,
      lang: language,
      contentType,
    });

    const requestUrl = `${apiBaseUrl}/api/places/nearby?${params.toString()}`;

    try {
      const response = await fetch(requestUrl, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const result = (await response.json()) as ApiResponse<Place[]>;
      setPlaces(result.data);
      setIsSearchOptionsCollapsed(true);
      setLastQuery(
        `${selectedLocationName ?? selectedAreaText.name} / ${
          selectedContentType?.labels[uiLanguage] ?? messages.fallbackCategory
        } / ${radius}m`,
      );
    } catch (error) {
      setPlaces([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to fetch nearby places.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!kakaoMapAppKey) {
      return;
    }

    if (!mapContainerRef.current) {
      return;
    }

    const initializeMap = () => {
      if (!window.kakao?.maps || !mapContainerRef.current) {
        setMapStatus("error");
        return;
      }

      const kakaoMaps = window.kakao.maps;
      const center = new kakaoMaps.LatLng(AREAS[0].lat, AREAS[0].lng);
      const map = new kakaoMaps.Map(mapContainerRef.current, {
        center,
        level: 8,
      });
      const marker = new kakaoMaps.Marker({
        map,
        position: center,
      });

      kakaoMaps.event.addListener(map, "click", (event) => {
        setSelectedPoint({
          lat: Number(event.latLng.getLat().toFixed(6)),
          lng: Number(event.latLng.getLng().toFixed(6)),
        });
        setSelectedLocationName(null);
      });

      mapRef.current = map;
      selectedMarkerRef.current = marker;
      setMapStatus("ready");
    };

    if (window.kakao?.maps) {
      window.kakao.maps.load(initializeMap);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-kakao-map-sdk="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.kakao?.maps.load(initializeMap);
      });
      return;
    }

    const script = document.createElement("script");
    script.dataset.kakaoMapSdk = "true";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapAppKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao?.maps.load(initializeMap);
    };
    script.onerror = () => {
      setMapStatus("error");
    };
    document.head.appendChild(script);
  }, [kakaoMapAppKey]);

  useEffect(() => {
    if (!window.kakao?.maps || !mapRef.current || !selectedMarkerRef.current) {
      return;
    }

    const nextCenter = new window.kakao.maps.LatLng(
      selectedPoint.lat,
      selectedPoint.lng,
    );
    mapRef.current.setCenter(nextCenter);
    selectedMarkerRef.current.setPosition(nextCenter);
  }, [selectedPoint]);

  useEffect(() => {
    if (!window.kakao?.maps || !mapRef.current) {
      return;
    }

    placeMarkersRef.current.forEach((marker) => marker.setMap(null));
    placeMarkersRef.current = places.map((place) => {
      const marker = new window.kakao!.maps.Marker({
        map: mapRef.current ?? undefined,
        position: new window.kakao!.maps.LatLng(place.latitude, place.longitude),
      });
      window.kakao!.maps.event.addListener(marker, "click", () => {
        openPlaceDetailRef.current(place);
      });
      return marker;
    });
  }, [places]);

  useEffect(() => {
    openPlaceDetailRef.current = openPlaceDetail;
  });

  useEffect(() => {
    if (!window.kakao?.maps || !mapRef.current || mapStatus !== "ready") {
      return;
    }

    routeMarkersRef.current.forEach((marker) => marker.setMap(null));
    routeMarkersRef.current = [];
    routePolylineRef.current?.setMap(null);
    routePolylineRef.current = null;

    if (mapRoutePlaces.length === 0) return;

    const kakaoMaps = window.kakao.maps;
    const map = mapRef.current;
    const path = mapRoutePlaces.map(
      (place) => new kakaoMaps.LatLng(place.latitude, place.longitude),
    );

    routeMarkersRef.current = path.map((position, index) => {
      const badge = document.createElement("button");
      badge.type = "button";
      badge.textContent = String(index + 1);
      badge.title = mapRoutePlaces[index].title;
      badge.setAttribute(
        "aria-label",
        `${index + 1}. ${mapRoutePlaces[index].title}`,
      );
      Object.assign(badge.style, {
        alignItems: "center",
        background: "#0f766e",
        border: "3px solid #ffffff",
        borderRadius: "50%",
        boxShadow: "0 8px 20px rgba(15, 23, 42, 0.28)",
        color: "#ffffff",
        cursor: "pointer",
        display: "flex",
        fontSize: "13px",
        fontWeight: "700",
        height: "34px",
        justifyContent: "center",
        letterSpacing: "0",
        width: "34px",
      });
      badge.addEventListener("click", () => {
        const routePlace = mapRoutePlaces[index];
        openPlaceDetailRef.current({
          contentId: routePlace.contentId,
          title: routePlace.title,
          category: routePlace.category,
          address: routePlace.address,
          latitude: routePlace.latitude,
          longitude: routePlace.longitude,
          distanceMeters: 0,
          imageUrl: routePlace.imageUrl,
        });
      });

      return new kakaoMaps.CustomOverlay({
        map,
        position,
        content: badge,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 20,
      });
    });

    if (path.length > 1) {
      routePolylineRef.current = new kakaoMaps.Polyline({
        map,
        path,
        strokeWeight: 5,
        strokeColor: "#0f766e",
        strokeOpacity: 0.82,
        strokeStyle: "solid",
      });
      const bounds = new kakaoMaps.LatLngBounds();
      path.forEach((position) => bounds.extend(position));
      map.setBounds(bounds);
    } else {
      map.setCenter(path[0]);
      map.setLevel(5);
    }
  }, [mapRoutePlaces, mapStatus]);

  return (
    <main className="min-h-screen min-w-0 overflow-x-hidden bg-[#e9eef3] text-[#101828] lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden">
      <div className="grid min-h-screen min-w-0 w-full lg:h-full lg:min-h-0 lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="relative z-20 flex min-w-0 w-full flex-col border-r border-[#d4dce7] bg-white/90 px-4 py-4 shadow-[12px_0_40px_rgba(15,23,42,0.08)] backdrop-blur md:px-5 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
          <header className="border-b border-[#e1e7ef] pb-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                Global K-Route
              </p>
              <AccountAccess
                language={uiLanguage}
                savedCount={savedPlaces.length}
                onOpenSavedPlaces={() => {
                  closePlaceDetail();
                  closeCommunity();
                  setIsRoutePlannerOpen(false);
                  setIsSavedPlacesOpen(true);
                }}
                onSessionChange={handleSessionChange}
              />
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#101828]">
              {messages.heroTitle}
            </h1>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#667085]">
              <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
              <span>{messages.privacyNotice}</span>
              <span className="h-1 w-1 rounded-full bg-[#98a2b3]" />
              <span>{apiBaseUrl}</span>
            </div>
          </header>

          <section className="shrink-0 border-b border-[#e1e7ef] py-3">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#101828]">
                  {messages.searchOptions}
                </p>
                {isSearchOptionsCollapsed ? (
                  <p className="mt-1 truncate text-xs text-[#667085]">
                    {selectedLocationName ?? selectedAreaText.name} ·{" "}
                    {selectedContentType?.labels[uiLanguage] ??
                      messages.fallbackCategory}{" "}
                    · {radius}m
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-end gap-2">
                <label className="flex w-[126px] flex-col gap-1 text-xs font-semibold text-[#344054]">
                  {messages.language}
                  <select
                    aria-label={messages.language}
                    className="h-9 w-full border border-[#d0d5dd] bg-white px-2 text-sm font-semibold text-[#101828] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
                    value={language}
                    onChange={(event) => changeLanguage(event.target.value)}
                  >
                    {LANGUAGES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  aria-expanded={!isSearchOptionsCollapsed}
                  aria-label={
                    isSearchOptionsCollapsed
                      ? messages.expandSearchOptions
                      : messages.collapseSearchOptions
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#d0d5dd] bg-white text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
                  title={
                    isSearchOptionsCollapsed
                      ? messages.expandSearchOptions
                      : messages.collapseSearchOptions
                  }
                  type="button"
                  onClick={() =>
                    setIsSearchOptionsCollapsed((previous) => !previous)
                  }
                >
                  <span aria-hidden="true">
                    {isSearchOptionsCollapsed ? "▾" : "▴"}
                  </span>
                </button>
              </div>
            </div>

            {!isSearchOptionsCollapsed ? (
              <div className="mt-4">
                <label className="text-sm font-semibold text-[#344054]">
                  {messages.searchBase}
                </label>
                <select
              className="mt-2 h-12 w-full border border-[#d0d5dd] bg-white px-3 text-sm font-medium text-[#101828] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
              value={selectedArea.code}
              onChange={(event) => {
                const nextArea = AREAS.find(
                  (area) => area.code === Number(event.target.value),
                );
                if (nextArea) {
                  selectArea(nextArea);
                }
              }}
            >
              {AREAS.map((area) => (
                <option key={area.code} value={area.code}>
                  {area.text[uiLanguage].name}
                </option>
              ))}
            </select>

            <div className="mt-4">
              <p className="text-sm font-semibold text-[#344054]">
                {messages.recommendedAreas}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {areaPresets.map((preset) => {
                  const presetText = preset.text[uiLanguage];
                  const isSelected =
                    selectedLocationName === presetText.name &&
                    selectedPoint.lat === preset.lat &&
                    selectedPoint.lng === preset.lng;

                  return (
                    <button
                      className={`min-h-16 border p-2 text-left transition ${
                        isSelected
                          ? "border-[#2563eb] bg-[#eff6ff] text-[#101828]"
                          : "border-[#d0d5dd] bg-white text-[#475467] hover:border-[#98a2b3]"
                      }`}
                      key={`${preset.areaCode}-${presetText.name}`}
                      type="button"
                      onClick={() => selectPreset(preset)}
                    >
                      <span className="block truncate text-sm font-semibold">
                        {presetText.name}
                      </span>
                      <span className="mt-1 block truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-[#2563eb]">
                        {presetText.label}
                      </span>
                      <span className="mt-1 block line-clamp-2 text-xs leading-4 text-[#667085]">
                        {presetText.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form className="mt-3" onSubmit={searchAddress}>
              <label className="text-sm font-semibold text-[#344054]">
                {messages.addressSearch}
              </label>
              <div className="mt-2 grid grid-cols-[1fr_86px] gap-2">
                <input
                  className="h-11 min-w-0 border border-[#d0d5dd] bg-white px-3 text-sm font-medium text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
                  placeholder={messages.addressPlaceholder}
                  type="search"
                  value={addressQuery}
                  onChange={(event) => setAddressQuery(event.target.value)}
                />
                <button
                  className="h-11 border border-[#2563eb] bg-white px-3 text-sm font-semibold text-[#2563eb] transition hover:bg-[#eff6ff] disabled:border-[#bfdbfe] disabled:text-[#93c5fd]"
                  disabled={isAddressSearching || mapStatus !== "ready"}
                  type="submit"
                >
                  {isAddressSearching
                    ? messages.addressSearching
                    : messages.addressSearchButton}
                </button>
              </div>
            </form>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  className={`h-11 border text-sm font-semibold transition ${
                    contentType === type.value
                      ? "border-[#101828] bg-[#101828] text-white"
                      : "border-[#d0d5dd] bg-white text-[#475467] hover:border-[#98a2b3]"
                  }`}
                  type="button"
                  onClick={() => setContentType(type.value)}
                >
                  {type.labels[uiLanguage]}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <div>
                <label className="text-sm font-semibold text-[#344054]">
                  {messages.radius}
                </label>
                <div className="mt-2 flex h-12 items-center border border-[#d0d5dd] bg-white px-3 focus-within:border-[#2563eb] focus-within:ring-4 focus-within:ring-[#dbeafe]">
                  <input
                    className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
                    max="20000"
                    min="100"
                    step="100"
                    type="number"
                    value={radius}
                    onChange={(event) => setRadius(event.target.value)}
                  />
                  <span className="text-sm text-[#667085]">m</span>
                </div>
              </div>
            </div>

            <button
              className="mt-5 h-12 w-full bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)] transition hover:bg-[#1d4ed8] disabled:bg-[#9db7ee]"
              disabled={isLoading}
              type="button"
              onClick={searchNearbyPlaces}
                >
                  {isLoading ? messages.searching : messages.searchButton}
                </button>
              </div>
            ) : null}
          </section>

          <section className="flex min-h-0 flex-1 flex-col py-4 lg:min-h-[360px] lg:flex-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{messages.resultsTitle}</h2>
                <p className="mt-1 text-sm text-[#667085]">
                  {lastQuery ?? messages.emptyHint}
                </p>
              </div>
              <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
                {places.length}
              </span>
            </div>

            {errorMessage ? (
              <div className="mt-4 border border-[#fecaca] bg-[#fff1f2] p-3 text-sm text-[#b42318]">
                {errorMessage}
              </div>
            ) : null}

            {savedPlacesError ? (
              <div className="mt-4 border border-[#fecaca] bg-[#fff1f2] p-3 text-sm text-[#b42318]">
                {savedPlacesError}
              </div>
            ) : null}

            <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain pr-1 lg:overflow-visible">
              {places.length === 0 && !errorMessage ? (
                <div className="flex flex-1 items-center justify-center border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center text-sm leading-6 text-[#667085]">
                  {messages.emptyResults}
                </div>
              ) : null}

              {places.map((place) => {
                const isSaved = savedPlaceByContentId.has(place.contentId);
                const isSaving = savingContentIds.has(place.contentId);
                const isInRoute = routeContentIds.has(place.contentId);
                const popularity = popularPlaceByContentId.get(place.contentId);

                return (
                  <article
                    className={`relative border bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition ${
                      selectedPlace?.contentId === place.contentId
                        ? "border-[#2563eb] ring-2 ring-[#dbeafe]"
                        : "border-[#e1e7ef] hover:border-[#98a2b3]"
                    }`}
                    key={place.contentId}
                  >
                    <button
                      className="w-full p-3 pr-24 text-left"
                      type="button"
                      onClick={() => openPlaceDetail(place)}
                    >
                      <div className="flex gap-3">
                    {place.imageUrl && !failedImageIds.has(place.contentId) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={place.title}
                        className="h-20 w-20 shrink-0 object-cover"
                        loading="lazy"
                        src={place.imageUrl}
                        onError={() => {
                          setFailedImageIds((previous) => {
                            const next = new Set(previous);
                            next.add(place.contentId);
                            return next;
                          });
                        }}
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center bg-[#edf3f8] px-2 text-center">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2563eb]">
                          {getCategoryLabel(place.category)}
                        </span>
                        <span className="mt-1 text-[11px] leading-4 text-[#667085]">
                          {messages.imageFallback}
                        </span>
                      </div>
                    )}
                        <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold text-[#101828]">
                          {place.title}
                        </h3>
                        <span className="shrink-0 rounded-full bg-[#f2f4f7] px-2 py-1 text-xs font-medium text-[#475467]">
                          {place.distanceMeters}m
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#667085]">
                        {place.address}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#2563eb]">
                        {getCategoryLabel(place.category)}
                      </p>
                      {popularity ? (
                        <p className="mt-1 text-xs font-semibold text-[#0f766e]">
                          {popularity.saveCount} {messages.popularSavedBy}
                        </p>
                      ) : null}
                        </div>
                      </div>
                    </button>
                    <button
                      aria-label={
                        isInRoute
                          ? messages.removeFromRoute
                          : messages.addToRoute
                      }
                      className={`absolute bottom-3 right-14 flex h-9 w-9 items-center justify-center border bg-white transition ${
                        isInRoute
                          ? "border-[#0f766e] bg-[#f0fdfa] text-[#0f766e]"
                          : "border-[#d0d5dd] text-[#667085] hover:border-[#0f766e] hover:text-[#0f766e]"
                      }`}
                      title={
                        isInRoute
                          ? messages.removeFromRoute
                          : messages.addToRoute
                      }
                      type="button"
                      onClick={() => toggleRoutePlace(place)}
                    >
                      <RouteIcon aria-hidden="true" size={18} />
                    </button>
                    <button
                      aria-label={isSaved ? messages.removeSavedPlace : messages.savePlace}
                      className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center border bg-white transition disabled:cursor-wait disabled:opacity-50 ${
                        isSaved
                          ? "border-[#2563eb] text-[#2563eb]"
                          : "border-[#d0d5dd] text-[#667085] hover:border-[#2563eb] hover:text-[#2563eb]"
                      }`}
                      disabled={isSaving}
                      title={isSaved ? messages.removeSavedPlace : messages.savePlace}
                      type="button"
                      onClick={() => toggleSavedPlace(place)}
                    >
                      {isSaved ? (
                        <BookmarkCheck aria-hidden="true" size={18} />
                      ) : (
                        <Bookmark aria-hidden="true" size={18} />
                      )}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </aside>

          <section className="relative min-h-[720px] min-w-0 w-full overflow-hidden bg-[#dfe8ef] lg:h-full lg:min-h-0">
          <div ref={mapContainerRef} className="absolute inset-0 z-0" />
          <div
            className={`absolute inset-0 bg-[linear-gradient(#cfdbe5_1px,transparent_1px),linear-gradient(90deg,#cfdbe5_1px,transparent_1px)] bg-[size:56px_56px] ${
              mapStatus === "ready" ? "hidden" : ""
            }`}
          />
          <div
            className={`absolute inset-0 bg-[radial-gradient(circle_at_25%_22%,rgba(255,255,255,0.78)_0,rgba(255,255,255,0.52)_28%,transparent_58%)] ${
              mapStatus === "ready" ? "hidden" : ""
            }`}
          />

          <div className={`absolute left-[12%] top-[18%] h-[62%] w-[62%] rotate-[-8deg] rounded-[48%] border border-[#b6c7d4] bg-[#eef4f7]/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)] ${mapStatus === "ready" ? "hidden" : ""}`} />
          <div className={`absolute right-[8%] top-[10%] h-[42%] w-[28%] rotate-[9deg] rounded-[46%] border border-[#bdd1dc] bg-[#f7fafc]/75 ${mapStatus === "ready" ? "hidden" : ""}`} />
          <div className={`absolute bottom-[4%] left-[24%] h-[18%] w-[22%] rotate-[5deg] rounded-[44%] border border-[#b7c9d4] bg-[#f8fafc]/80 ${mapStatus === "ready" ? "hidden" : ""}`} />

          <svg
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full ${mapStatus === "ready" ? "hidden" : ""}`}
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <path
              d="M18 28 C30 32 34 45 45 50 C58 56 63 68 78 75"
              fill="none"
              stroke="#2563eb"
              strokeDasharray="2 2"
              strokeLinecap="round"
              strokeWidth="0.45"
            />
            <path
              d="M30 74 C39 67 44 59 50 48 C55 38 64 29 76 21"
              fill="none"
              stroke="#0f766e"
              strokeDasharray="1.8 2.4"
              strokeLinecap="round"
              strokeWidth="0.35"
            />
          </svg>

          {mapStatus !== "ready" ? (
            <div className="absolute inset-0 z-[1] flex items-center justify-center bg-[#dfe8ef]/70 px-6 text-center backdrop-blur-sm">
              <div className="max-w-md border border-white/80 bg-white/92 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.16)]">
                <p className="text-sm font-semibold text-[#101828]">
                  {mapStatus === "missing-key"
                    ? messages.mapMissingKeyTitle
                    : mapStatus === "error"
                      ? messages.mapLoadErrorTitle
                      : messages.mapLoadingTitle}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  {messages.mapSetupGuide}
                </p>
              </div>
            </div>
          ) : null}

          <div className="absolute left-5 right-5 top-5 z-10 flex flex-col gap-3 md:left-6 md:right-6 md:flex-row md:items-center md:justify-between">
            <div className="flex max-w-xl items-center gap-3 border border-white/80 bg-white/88 px-4 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.12)] backdrop-blur">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: selectedArea.accent }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#101828]">
                  {selectedLocationName ??
                    `${selectedAreaText.name} ${messages.selectedSuffix}`}
                </p>
                <p className="truncate text-xs text-[#667085]">
                  {selectedPoint.lat}, {selectedPoint.lng}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className={`flex h-10 items-center gap-2 border px-3 text-sm font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition ${
                  isCommunityOpen
                    ? "border-[#2563eb] bg-[#2563eb] text-white"
                    : "border-white/80 bg-white/88 text-[#2563eb] hover:bg-white"
                }`}
                title={messages.community}
                type="button"
                onClick={() => {
                  closePlaceDetail();
                  setIsSavedPlacesOpen(false);
                  setIsRoutePlannerOpen(false);
                  setIsCommunityOpen(true);
                  void loadCommunity();
                }}
              >
                <Users aria-hidden="true" size={17} />
                <span>{messages.community}</span>
              </button>
              <button
                className={`flex h-10 items-center gap-2 border px-3 text-sm font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition ${
                  isRoutePlannerOpen
                    ? "border-[#0f766e] bg-[#0f766e] text-white"
                    : "border-white/80 bg-white/88 text-[#0f766e] hover:bg-white"
                }`}
                title={messages.routePlanner}
                type="button"
                onClick={() => {
                  closePlaceDetail();
                  setIsSavedPlacesOpen(false);
                  closeCommunity();
                  setIsRoutePlannerOpen(true);
                }}
              >
                <RouteIcon aria-hidden="true" size={17} />
                <span>{messages.routePlanner}</span>
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                    isRoutePlannerOpen
                      ? "bg-white text-[#0f766e]"
                      : "bg-[#0f766e] text-white"
                  }`}
                >
                  {routeDraftPlaces.length}
                </span>
              </button>
              {AREAS.map((area) => (
                <button
                  className={`h-10 border px-3 text-sm font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition ${
                    selectedArea.code === area.code
                      ? "border-[#101828] bg-[#101828] text-white"
                      : "border-white/80 bg-white/88 text-[#344054] hover:bg-white"
                  }`}
                  key={area.code}
                  type="button"
                  onClick={() => selectArea(area)}
                >
                  {area.text[uiLanguage].name}
                </button>
              ))}
            </div>
          </div>

          {isCommunityOpen ? (
            <CommunityBoard
              error={communityError}
              isAuthenticated={currentUser !== null}
              isLoading={isCommunityLoading}
              language={uiLanguage}
              popularPlaces={popularPlaces}
              routes={publicRoutes}
              selectedRouteId={previewPublicRouteId}
              onClose={closeCommunity}
              onCopyRoute={(routeId) => void copyPublicRoute(routeId)}
              onOpenPlace={openPopularPlace}
              onPreviewRoute={previewPublicRoute}
              onRefresh={() => void loadCommunity()}
            />
          ) : null}

          {isRoutePlannerOpen ? (
            <RoutePlannerPanel
              activeRouteId={activeRouteId}
              error={routeError}
              isAuthenticated={currentUser !== null}
              isSaving={isRouteSaving}
              language={uiLanguage}
              places={routeDraftPlaces}
              routes={routes}
              title={routeDraftTitle}
              onClose={() => setIsRoutePlannerOpen(false)}
              onDeleteRoute={(routeId) => void deleteRoute(routeId)}
              onMovePlace={moveRoutePlace}
              onNewRoute={startNewRoute}
              onOpenRoute={openRoute}
              onRemovePlace={(contentId) => {
                setRouteDraftPlaces((previous) =>
                  previous.filter((place) => place.contentId !== contentId),
                );
                setRouteError(null);
              }}
              onSaveRoute={requestRouteSave}
              onTitleChange={setRouteDraftTitle}
              onToggleVisibility={(route) =>
                void toggleRouteVisibility(route)
              }
            />
          ) : null}

          {isSavedPlacesOpen ? (
            <aside className="absolute inset-3 z-30 overflow-y-auto border border-white/80 bg-white/96 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur md:bottom-5 md:left-auto md:right-5 md:top-24 md:w-[420px]">
              <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#e1e7ef] bg-white/96 p-4 backdrop-blur">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2563eb]">
                    Global K-Route
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-[#101828]">
                    {messages.savedPlaces}
                    <span className="ml-2 text-sm font-medium text-[#667085]">
                      {savedPlaces.length}
                    </span>
                  </h2>
                </div>
                <button
                  aria-label={messages.closeDetail}
                  className="flex h-9 w-9 items-center justify-center border border-[#d0d5dd] bg-white text-[#475467] transition hover:bg-[#f2f4f7]"
                  title={messages.closeDetail}
                  type="button"
                  onClick={() => setIsSavedPlacesOpen(false)}
                >
                  <X aria-hidden="true" size={18} />
                </button>
              </header>

              {savedPlacesError ? (
                <div className="m-4 border border-[#fecaca] bg-[#fff1f2] p-3 text-sm text-[#b42318]">
                  {savedPlacesError}
                </div>
              ) : null}

              {savedPlaces.length === 0 ? (
                <div className="m-4 border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-8 text-center text-sm leading-6 text-[#667085]">
                  {messages.savedEmpty}
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {savedPlaces.map((savedPlace) => {
                    const isInRoute = routeContentIds.has(savedPlace.contentId);
                    return (
                    <article
                      className="relative border border-[#e1e7ef] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
                      key={savedPlace.id}
                    >
                      <button
                        className="flex w-full gap-3 p-3 pr-24 text-left"
                        type="button"
                        onClick={() => openPlaceDetail(toPlace(savedPlace))}
                      >
                        {savedPlace.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={savedPlace.title}
                            className="h-20 w-20 shrink-0 object-cover"
                            loading="lazy"
                            src={savedPlace.imageUrl}
                          />
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-[#edf3f8] px-2 text-center text-xs font-semibold text-[#667085]">
                            {getCategoryLabel(savedPlace.category)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-[#101828]">
                            {savedPlace.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#667085]">
                            {savedPlace.address}
                          </p>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#2563eb]">
                            {getCategoryLabel(savedPlace.category)} · {savedPlace.dataLanguage.toUpperCase()}
                          </p>
                        </div>
                      </button>
                      <button
                        aria-label={
                          isInRoute
                            ? messages.removeFromRoute
                            : messages.addToRoute
                        }
                        className={`absolute bottom-3 right-14 flex h-9 w-9 items-center justify-center border bg-white transition ${
                          isInRoute
                            ? "border-[#0f766e] bg-[#f0fdfa] text-[#0f766e]"
                            : "border-[#d0d5dd] text-[#667085] hover:border-[#0f766e] hover:text-[#0f766e]"
                        }`}
                        title={
                          isInRoute
                            ? messages.removeFromRoute
                            : messages.addToRoute
                        }
                        type="button"
                        onClick={() => toggleRoutePlace(toPlace(savedPlace))}
                      >
                        <RouteIcon aria-hidden="true" size={17} />
                      </button>
                      <button
                        aria-label={messages.removeSavedPlace}
                        className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center border border-[#d0d5dd] bg-white text-[#667085] transition hover:border-[#dc2626] hover:text-[#dc2626] disabled:cursor-wait disabled:opacity-50"
                        disabled={savingContentIds.has(savedPlace.contentId)}
                        title={messages.removeSavedPlace}
                        type="button"
                        onClick={() => toggleSavedPlace(toPlace(savedPlace))}
                      >
                        <Trash2 aria-hidden="true" size={17} />
                      </button>
                    </article>
                    );
                  })}
                </div>
              )}
            </aside>
          ) : null}

          {selectedPlace ? (
            <aside className="absolute inset-3 z-30 overflow-y-auto border border-white/80 bg-white/96 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur md:bottom-5 md:left-auto md:right-5 md:top-24 md:w-[460px]">
              <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e1e7ef] bg-white/96 p-4 backdrop-blur">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2563eb]">
                    {getCategoryLabel(selectedPlace.category)}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-[#101828]">
                    {placeDetail?.title || selectedPlace.title}
                  </h2>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    aria-label={
                      routeContentIds.has(selectedPlace.contentId)
                        ? messages.removeFromRoute
                        : messages.addToRoute
                    }
                    className={`flex h-9 w-9 items-center justify-center border bg-white transition ${
                      routeContentIds.has(selectedPlace.contentId)
                        ? "border-[#0f766e] bg-[#f0fdfa] text-[#0f766e]"
                        : "border-[#d0d5dd] text-[#667085] hover:border-[#0f766e] hover:text-[#0f766e]"
                    }`}
                    title={
                      routeContentIds.has(selectedPlace.contentId)
                        ? messages.removeFromRoute
                        : messages.addToRoute
                    }
                    type="button"
                    onClick={() => toggleRoutePlace(selectedPlace, placeDetail)}
                  >
                    <RouteIcon aria-hidden="true" size={18} />
                  </button>
                  <button
                    aria-label={
                      savedPlaceByContentId.has(selectedPlace.contentId)
                        ? messages.removeSavedPlace
                        : messages.savePlace
                    }
                    className={`flex h-9 w-9 items-center justify-center border bg-white transition disabled:cursor-wait disabled:opacity-50 ${
                      savedPlaceByContentId.has(selectedPlace.contentId)
                        ? "border-[#2563eb] text-[#2563eb]"
                        : "border-[#d0d5dd] text-[#667085] hover:border-[#2563eb] hover:text-[#2563eb]"
                    }`}
                    disabled={savingContentIds.has(selectedPlace.contentId)}
                    title={
                      savedPlaceByContentId.has(selectedPlace.contentId)
                        ? messages.removeSavedPlace
                        : messages.savePlace
                    }
                    type="button"
                    onClick={() => toggleSavedPlace(selectedPlace, placeDetail)}
                  >
                    {savedPlaceByContentId.has(selectedPlace.contentId) ? (
                      <BookmarkCheck aria-hidden="true" size={18} />
                    ) : (
                      <Bookmark aria-hidden="true" size={18} />
                    )}
                  </button>
                  <button
                    aria-label={messages.closeDetail}
                    className="flex h-9 w-9 items-center justify-center border border-[#d0d5dd] bg-white text-[#475467] transition hover:bg-[#f2f4f7]"
                    title={messages.closeDetail}
                    type="button"
                    onClick={closePlaceDetail}
                  >
                    <X aria-hidden="true" size={18} />
                  </button>
                </div>
              </header>

              {isDetailLoading ? (
                <div
                  aria-live="polite"
                  className="flex min-h-64 items-center justify-center p-6 text-center text-sm text-[#667085]"
                >
                  {messages.detailLoading}
                </div>
              ) : null}

              {detailErrorMessage ? (
                <div className="m-4 border border-[#fecaca] bg-[#fff1f2] p-4 text-sm leading-6 text-[#b42318]">
                  {detailErrorMessage}
                </div>
              ) : null}

              {placeDetail ? (
                <div>
                  {placeDetail.primaryImageUrl &&
                  !failedDetailImageUrls.has(placeDetail.primaryImageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={placeDetail.title || selectedPlace.title}
                      className="h-56 w-full object-cover"
                      src={placeDetail.primaryImageUrl}
                      onError={() => {
                        setFailedDetailImageUrls((previous) => {
                          const next = new Set(previous);
                          next.add(placeDetail.primaryImageUrl!);
                          return next;
                        });
                      }}
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-[#edf3f8] text-sm font-semibold text-[#667085]">
                      {messages.imageFallback}
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-[#eef4ff] px-2 py-1 text-xs font-semibold text-[#2563eb]">
                        {messages.sourceLanguage}:{" "}
                        {placeDetail.dataLanguage.toUpperCase()}
                      </span>
                      {placeDetail.fallbackUsed ? (
                        <span className="bg-[#fff7ed] px-2 py-1 text-xs font-semibold text-[#b54708]">
                          {messages.fallbackNotice}
                        </span>
                      ) : null}
                    </div>

                    {placeDetail.address ? (
                      <p className="mt-3 text-sm leading-6 text-[#475467]">
                        {placeDetail.address}
                      </p>
                    ) : null}

                    {placeDetail.overview ? (
                      <section className="mt-5 border-t border-[#e1e7ef] pt-5">
                        <h3 className="text-base font-semibold text-[#101828]">
                          {messages.detailOverview}
                        </h3>
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#475467]">
                          {placeDetail.overview}
                        </p>
                      </section>
                    ) : null}

                    {visitRows.length > 0 ? (
                      <section className="mt-5 border-t border-[#e1e7ef] pt-5">
                        <h3 className="text-base font-semibold text-[#101828]">
                          {messages.visitInformation}
                        </h3>
                        <dl className="mt-3 divide-y divide-[#eef2f6]">
                          {visitRows.map(([label, value]) => (
                            <div
                              className="grid grid-cols-[112px_1fr] gap-3 py-3 text-sm"
                              key={label}
                            >
                              <dt className="font-semibold text-[#344054]">
                                {label}
                              </dt>
                              <dd className="whitespace-pre-line leading-5 text-[#667085]">
                                {value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    ) : null}

                    {restaurantRows.length > 0 ? (
                      <section className="mt-5 border-t border-[#e1e7ef] pt-5">
                        <h3 className="text-base font-semibold text-[#101828]">
                          {messages.restaurantInformation}
                        </h3>
                        <dl className="mt-3 divide-y divide-[#eef2f6]">
                          {restaurantRows.map(([label, value]) => (
                            <div
                              className="grid grid-cols-[112px_1fr] gap-3 py-3 text-sm"
                              key={label}
                            >
                              <dt className="font-semibold text-[#344054]">
                                {label}
                              </dt>
                              <dd className="whitespace-pre-line leading-5 text-[#667085]">
                                {value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    ) : null}

                    {accommodationRows.length > 0 ||
                    isExternalUrl(placeDetail.accommodationInfo?.bookingUrl) ? (
                      <section className="mt-5 border-t border-[#e1e7ef] pt-5">
                        <h3 className="text-base font-semibold text-[#101828]">
                          {messages.accommodationInformation}
                        </h3>
                        <dl className="mt-3 divide-y divide-[#eef2f6]">
                          {accommodationRows.map(([label, value]) => (
                            <div
                              className="grid grid-cols-[112px_1fr] gap-3 py-3 text-sm"
                              key={label}
                            >
                              <dt className="font-semibold text-[#344054]">
                                {label}
                              </dt>
                              <dd className="whitespace-pre-line leading-5 text-[#667085]">
                                {value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        {isExternalUrl(
                          placeDetail.accommodationInfo?.bookingUrl,
                        ) ? (
                          <a
                            className="mt-3 inline-flex min-h-10 items-center border border-[#2563eb] px-3 text-sm font-semibold text-[#2563eb] transition hover:bg-[#eff6ff]"
                            href={placeDetail.accommodationInfo.bookingUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {messages.booking}
                          </a>
                        ) : null}
                      </section>
                    ) : null}

                    {placeDetail.phone ||
                    isExternalUrl(placeDetail.homepage) ? (
                      <section className="mt-5 border-t border-[#e1e7ef] pt-5">
                        <h3 className="text-base font-semibold text-[#101828]">
                          {messages.informationCenter}
                        </h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {placeDetail.phone ? (
                            <a
                              className="inline-flex min-h-10 items-center border border-[#d0d5dd] px-3 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
                              href={`tel:${placeDetail.phone}`}
                            >
                              {messages.phone}: {placeDetail.phone}
                            </a>
                          ) : null}
                          {isExternalUrl(placeDetail.homepage) ? (
                            <a
                              className="inline-flex min-h-10 items-center border border-[#2563eb] px-3 text-sm font-semibold text-[#2563eb] transition hover:bg-[#eff6ff]"
                              href={placeDetail.homepage}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {messages.website}
                            </a>
                          ) : null}
                        </div>
                      </section>
                    ) : null}

                    {placeDetail.additionalInfo.length > 0 ? (
                      <section className="mt-5 border-t border-[#e1e7ef] pt-5">
                        <h3 className="text-base font-semibold text-[#101828]">
                          {messages.additionalInformation}
                        </h3>
                        <div className="mt-3 grid gap-3">
                          {placeDetail.additionalInfo.map((item, index) => (
                            <article
                              className="border border-[#e1e7ef] bg-[#f8fafc] p-3"
                              key={`${item.title ?? "detail"}-${index}`}
                            >
                              {item.imageUrl &&
                              !failedDetailImageUrls.has(item.imageUrl) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  alt={item.title ?? ""}
                                  className="mb-3 h-36 w-full object-cover"
                                  src={item.imageUrl}
                                  onError={() => {
                                    setFailedDetailImageUrls((previous) => {
                                      const next = new Set(previous);
                                      next.add(item.imageUrl!);
                                      return next;
                                    });
                                  }}
                                />
                              ) : null}
                              {item.title ? (
                                <h4 className="text-sm font-semibold text-[#101828]">
                                  {item.title}
                                </h4>
                              ) : null}
                              {item.description ? (
                                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#667085]">
                                  {item.description}
                                </p>
                              ) : null}
                              {Object.keys(item.attributes).length > 0 ? (
                                <dl className="mt-3 divide-y divide-[#e1e7ef]">
                                  {Object.entries(item.attributes).map(
                                    ([key, value]) => (
                                      <div
                                        className="grid grid-cols-[110px_1fr] gap-2 py-2 text-xs"
                                        key={key}
                                      >
                                        <dt className="font-semibold text-[#344054]">
                                          {getAdditionalAttributeLabel(key)}
                                        </dt>
                                        <dd className="text-[#667085]">
                                          {value}
                                        </dd>
                                      </div>
                                    ),
                                  )}
                                </dl>
                              ) : null}
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {placeDetail.imageUrls.filter(
                      (imageUrl) =>
                        imageUrl !== placeDetail.primaryImageUrl &&
                        !failedDetailImageUrls.has(imageUrl),
                    ).length > 0 ? (
                      <section className="mt-5 border-t border-[#e1e7ef] pt-5">
                        <h3 className="text-base font-semibold text-[#101828]">
                          {messages.gallery}
                        </h3>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {placeDetail.imageUrls
                            .filter(
                              (imageUrl) =>
                                imageUrl !== placeDetail.primaryImageUrl &&
                                !failedDetailImageUrls.has(imageUrl),
                            )
                            .map((imageUrl) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                alt=""
                                className="aspect-[4/3] w-full object-cover"
                                key={imageUrl}
                                loading="lazy"
                                src={imageUrl}
                                onError={() => {
                                  setFailedDetailImageUrls((previous) => {
                                    const next = new Set(previous);
                                    next.add(imageUrl);
                                    return next;
                                  });
                                }}
                              />
                            ))}
                        </div>
                      </section>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </aside>
          ) : null}

          {AREAS.map((area) => {
            const isSelected = selectedArea.code === area.code;

            return (
              <button
                className={`group absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left ${
                  mapStatus === "ready" ? "hidden" : ""
                }`}
                key={area.code}
                style={{ left: area.mapX, top: area.mapY }}
                type="button"
                onClick={() => selectArea(area)}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white text-sm font-bold text-white shadow-[0_16px_32px_rgba(15,23,42,0.22)] transition ${
                    isSelected ? "scale-110" : "group-hover:scale-105"
                  }`}
                  style={{ backgroundColor: area.accent }}
                >
                  {area.code}
                </span>
                <span
                  className={`absolute left-14 top-1/2 hidden w-52 -translate-y-1/2 border border-white/80 bg-white/92 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur md:block ${
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <span className="block text-sm font-semibold text-[#101828]">
                    {area.text[uiLanguage].name}
                  </span>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#2563eb]">
                    {area.text[uiLanguage].label}
                  </span>
                  <span className="mt-2 block text-sm leading-5 text-[#667085]">
                    {area.text[uiLanguage].description}
                  </span>
                </span>
              </button>
            );
          })}

          <div className="absolute bottom-5 left-5 right-5 z-10 grid gap-3 md:left-auto md:w-[420px]">
            <div className="border border-white/80 bg-white/90 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.16)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#667085]">
                    {messages.selectedRouteBase}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    {selectedLocationName ?? selectedAreaText.name}
                  </h2>
                </div>
                <span className="rounded-full bg-[#f2f4f7] px-3 py-1 text-xs font-semibold text-[#475467]">
                  {messages.areaCode} {selectedArea.code}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#475467]">
                {selectedAreaText.description}. {messages.selectedBaseDescription}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#f8fafc] px-3 py-2">
                  <p className="text-xs text-[#667085]">Lat</p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedPoint.lat}
                  </p>
                </div>
                <div className="bg-[#f8fafc] px-3 py-2">
                  <p className="text-xs text-[#667085]">Lng</p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedPoint.lng}
                  </p>
                </div>
                <div className="bg-[#f8fafc] px-3 py-2">
                  <p className="text-xs text-[#667085]">{messages.radius}</p>
                  <p className="mt-1 text-sm font-semibold">{radius}m</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
