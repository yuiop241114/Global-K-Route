"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Area = {
  code: number;
  name: string;
  label: string;
  description: string;
  lat: number;
  lng: number;
  mapX: string;
  mapY: string;
  accent: string;
};

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
};

type KakaoMarker = {
  setMap: (map: KakaoMap | null) => void;
  setPosition: (latLng: KakaoLatLng) => void;
};

type KakaoMapsApi = {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMap;
  Marker: new (options: { map?: KakaoMap; position: KakaoLatLng }) => KakaoMarker;
  event: {
    addListener: (
      target: KakaoMap,
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
    name: "Seoul",
    label: "Urban",
    description: "Palaces, design districts, food alleys",
    lat: 37.5665,
    lng: 126.978,
    mapX: "48%",
    mapY: "34%",
    accent: "#2563eb",
  },
  {
    code: 6,
    name: "Busan",
    label: "Coast",
    description: "Ocean routes, markets, night views",
    lat: 35.1796,
    lng: 129.0756,
    mapX: "68%",
    mapY: "73%",
    accent: "#0891b2",
  },
  {
    code: 39,
    name: "Jeju",
    label: "Island",
    description: "Nature trails, cafes, scenic drives",
    lat: 33.4996,
    lng: 126.5312,
    mapX: "42%",
    mapY: "88%",
    accent: "#16a34a",
  },
  {
    code: 31,
    name: "Gyeonggi",
    label: "Day trip",
    description: "Historic stops, theme attractions",
    lat: 37.4138,
    lng: 127.5183,
    mapX: "53%",
    mapY: "39%",
    accent: "#7c3aed",
  },
  {
    code: 32,
    name: "Gangwon",
    label: "Nature",
    description: "Mountains, beaches, wellness stays",
    lat: 37.8228,
    lng: 128.1555,
    mapX: "64%",
    mapY: "31%",
    accent: "#d97706",
  },
];

const CONTENT_TYPES = [
  { value: "tourist_attraction", label: "관광지" },
  { value: "restaurant", label: "음식점" },
  { value: "accommodation", label: "숙박" },
];

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

export default function Home() {
  const [selectedArea, setSelectedArea] = useState<Area>(AREAS[0]);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint>({
    lat: AREAS[0].lat,
    lng: AREAS[0].lng,
  });
  const [radius, setRadius] = useState("1000");
  const [language, setLanguage] = useState("ko");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0].value);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mapStatus, setMapStatus] = useState<
    "missing-key" | "loading" | "ready" | "error"
  >(() =>
    process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ? "loading" : "missing-key",
  );
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const selectedMarkerRef = useRef<KakaoMarker | null>(null);
  const placeMarkersRef = useRef<KakaoMarker[]>([]);

  const apiBaseUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";
  }, []);

  const kakaoMapAppKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

  const selectedContentType = useMemo(() => {
    return CONTENT_TYPES.find((type) => type.value === contentType);
  }, [contentType]);

  function selectArea(area: Area) {
    setSelectedArea(area);
    setSelectedPoint({ lat: area.lat, lng: area.lng });
  }

  async function searchNearbyPlaces() {
    setIsLoading(true);
    setErrorMessage(null);

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
      setLastQuery(
        `${selectedArea.name} / ${selectedContentType?.label ?? "Spots"} / ${radius}m`,
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
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapAppKey}&autoload=false`;
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
      return new window.kakao!.maps.Marker({
        map: mapRef.current ?? undefined,
        position: new window.kakao!.maps.LatLng(place.latitude, place.longitude),
      });
    });
  }, [places]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#e9eef3] text-[#101828]">
      <div className="grid min-h-screen lg:grid-cols-[390px_1fr]">
        <aside className="relative z-20 flex h-full flex-col border-r border-[#d4dce7] bg-white/90 px-4 py-4 shadow-[12px_0_40px_rgba(15,23,42,0.08)] backdrop-blur md:px-5">
          <header className="border-b border-[#e1e7ef] pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              Global K-Route
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#101828]">
              지도에서 고르는 한국 여행
            </h1>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#667085]">
              <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
              <span>현재 위치 자동 수집 없음</span>
              <span className="h-1 w-1 rounded-full bg-[#98a2b3]" />
              <span>{apiBaseUrl}</span>
            </div>
          </header>

          <section className="border-b border-[#e1e7ef] py-4">
            <label className="text-sm font-semibold text-[#344054]">
              기준 지역
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
                  {area.name}
                </option>
              ))}
            </select>

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
                  {type.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-[1fr_108px] gap-3">
              <div>
                <label className="text-sm font-semibold text-[#344054]">
                  반경
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

              <div>
                <label className="text-sm font-semibold text-[#344054]">
                  언어
                </label>
                <select
                  className="mt-2 h-12 w-full border border-[#d0d5dd] bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  {LANGUAGES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="mt-5 h-12 w-full bg-[#2563eb] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)] transition hover:bg-[#1d4ed8] disabled:bg-[#9db7ee]"
              disabled={isLoading}
              type="button"
              onClick={searchNearbyPlaces}
            >
              {isLoading ? "검색 중..." : "이 위치로 검색"}
            </button>
          </section>

          <section className="flex min-h-0 flex-1 flex-col py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">검색 결과</h2>
                <p className="mt-1 text-sm text-[#667085]">
                  {lastQuery ?? "지도에서 지역을 선택하고 검색하세요."}
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

            <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {places.length === 0 && !errorMessage ? (
                <div className="flex flex-1 items-center justify-center border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center text-sm leading-6 text-[#667085]">
                  검색 후 관광지 결과가 여기에 표시됩니다.
                </div>
              ) : null}

              {places.map((place) => (
                <article
                  className="border border-[#e1e7ef] bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                  key={place.contentId}
                >
                  <div className="flex gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#edf3f8] text-xs font-semibold text-[#475467]">
                      MAP
                    </div>
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
                        {place.category}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>

        <section className="relative min-h-[720px] overflow-hidden bg-[#dfe8ef]">
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
                    ? "Kakao Maps key is required"
                    : mapStatus === "error"
                      ? "Kakao Maps could not be loaded"
                      : "Loading Kakao Maps"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  Set NEXT_PUBLIC_KAKAO_MAP_APP_KEY in the frontend environment,
                  then restart the Next dev server.
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
                  {selectedArea.name} 선택됨
                </p>
                <p className="truncate text-xs text-[#667085]">
                  {selectedPoint.lat}, {selectedPoint.lng}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
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
                  {area.name}
                </button>
              ))}
            </div>
          </div>

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
                    {area.name}
                  </span>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#2563eb]">
                    {area.label}
                  </span>
                  <span className="mt-2 block text-sm leading-5 text-[#667085]">
                    {area.description}
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
                    선택한 탐색 기준
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    {selectedArea.name}
                  </h2>
                </div>
                <span className="rounded-full bg-[#f2f4f7] px-3 py-1 text-xs font-semibold text-[#475467]">
                  지역 {selectedArea.code}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#475467]">
                {selectedArea.description}. 현재 위치가 아니라 지도에서 선택한
                좌표와 공공 관광데이터를 기준으로 검색합니다.
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
                  <p className="text-xs text-[#667085]">반경</p>
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
