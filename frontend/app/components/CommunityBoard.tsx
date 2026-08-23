"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Eye,
  MapPin,
  Navigation,
  RefreshCw,
  Route as RouteIcon,
  Search,
  Share2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import type { RouteDraftPlace } from "@/app/components/RoutePlannerPanel";

export type PublicRoute = {
  id: number;
  title: string;
  description: string | null;
  travelDate: string | null;
  transportMode: "WALKING" | "DRIVING" | "TRANSIT";
  places: Array<
    RouteDraftPlace & { id: number; visitOrder: number; saveCount: number }
  >;
  copyCount: number;
  publishedAt: string;
  updatedAt: string;
};

export type PopularPlace = RouteDraftPlace & { saveCount: number };

type CommunityBoardProps = {
  language: "ko" | "en";
  routes: PublicRoute[];
  popularPlaces: PopularPlace[];
  selectedRouteId: number | null;
  initialDetailRouteId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onPreviewRoute: (route: PublicRoute) => void;
  onCopyRoute: (routeId: number) => void;
  onOpenPlace: (place: RouteDraftPlace) => void;
};

type RouteSort = "latest" | "popular" | "placeCount";

const COPY_TEXT = {
  ko: {
    title: "여행 코스 둘러보기",
    routes: "공개 코스",
    popular: "인기 장소",
    emptyRoutes: "아직 공개된 코스가 없습니다.",
    noSearchResults: "검색 조건에 맞는 코스가 없습니다.",
    emptyPopular: "인기 장소를 계산할 저장 기록이 아직 없습니다.",
    places: "개 장소",
    copies: "회 복사",
    savedBy: "명이 저장",
    details: "상세 보기",
    preview: "지도 미리보기",
    copy: "내 코스로 복사",
    signInCopy: "로그인 후 복사",
    share: "코스 공유",
    linkCopied: "링크 복사됨",
    copyLinkPrompt: "아래 코스 공유 링크를 복사하세요.",
    refresh: "새로고침",
    close: "닫기",
    backToRoutes: "공개 코스 목록으로 돌아가기",
    search: "코스 검색",
    searchPlaceholder: "제목, 장소 또는 주소 검색",
    sort: "정렬",
    latest: "최신순",
    mostPopular: "인기순",
    mostPlaces: "장소 많은 순",
    routeDescription: "코스 소개",
    noDescription: "작성된 코스 소개가 없습니다.",
    travelDate: "여행 날짜",
    dateUndecided: "날짜 미정",
    transport: "이동 방식",
    walking: "도보",
    driving: "자동차",
    transit: "대중교통",
    totalStay: "총 체류 시간",
    minutes: "분",
    directDistance: "직선거리",
    directDistanceNote: "장소 간 직선거리를 순서대로 합산한 값이며 실제 이동거리와 다릅니다.",
    stops: "방문 순서",
    stop: "번째 장소",
    addressUnavailable: "주소 정보 없음",
    published: "공개",
    popularityNote: "장소를 저장하거나 코스에 넣은 고유 사용자 수입니다.",
    loading: "불러오는 중...",
  },
  en: {
    title: "Explore community routes",
    routes: "Public routes",
    popular: "Popular places",
    emptyRoutes: "No public routes yet.",
    noSearchResults: "No routes match your search.",
    emptyPopular: "There is not enough saved-place activity yet.",
    places: "places",
    copies: "copies",
    savedBy: "travelers saved",
    details: "View details",
    preview: "Preview on map",
    copy: "Copy to my routes",
    signInCopy: "Sign in to copy",
    share: "Share route",
    linkCopied: "Link copied",
    copyLinkPrompt: "Copy this route link.",
    refresh: "Refresh",
    close: "Close",
    backToRoutes: "Back to public routes",
    search: "Search routes",
    searchPlaceholder: "Search title, place, or address",
    sort: "Sort routes",
    latest: "Latest",
    mostPopular: "Most popular",
    mostPlaces: "Most places",
    routeDescription: "About this route",
    noDescription: "No route description was provided.",
    travelDate: "Travel date",
    dateUndecided: "Date not set",
    transport: "Transport",
    walking: "Walking",
    driving: "Driving",
    transit: "Public transit",
    totalStay: "Total stay",
    minutes: "min",
    directDistance: "Direct distance",
    directDistanceNote: "Sum of straight-line distances between stops, not actual travel distance.",
    stops: "Ordered stops",
    stop: "Stop",
    addressUnavailable: "Address unavailable",
    published: "Published",
    popularityNote: "Counts unique users who saved a place or added it to a route.",
    loading: "Loading...",
  },
} as const;

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function calculateDirectDistance(places: PublicRoute["places"]) {
  return places.slice(1).reduce((total, place, index) => {
    const previous = places[index];
    const latitudeDelta = toRadians(place.latitude - previous.latitude);
    const longitudeDelta = toRadians(place.longitude - previous.longitude);
    const previousLatitude = toRadians(previous.latitude);
    const latitude = toRadians(place.latitude);
    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(previousLatitude) *
        Math.cos(latitude) *
        Math.sin(longitudeDelta / 2) ** 2;
    const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    return total + EARTH_RADIUS_KM * centralAngle;
  }, 0);
}

function formatDate(value: string, language: "ko" | "en") {
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function CommunityBoard({
  language,
  routes,
  popularPlaces,
  selectedRouteId,
  initialDetailRouteId,
  isAuthenticated,
  isLoading,
  error,
  onClose,
  onRefresh,
  onPreviewRoute,
  onCopyRoute,
  onOpenPlace,
}: CommunityBoardProps) {
  const [tab, setTab] = useState<"routes" | "popular">("routes");
  const [searchQuery, setSearchQuery] = useState("");
  const [routeSort, setRouteSort] = useState<RouteSort>("latest");
  const [detailRouteId, setDetailRouteId] = useState<number | null>(null);
  const [copiedShareRouteId, setCopiedShareRouteId] = useState<number | null>(null);
  const copy = COPY_TEXT[language];

  useEffect(() => {
    if (
      initialDetailRouteId === null ||
      !routes.some((route) => route.id === initialDetailRouteId)
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setTab("routes");
      setDetailRouteId(initialDetailRouteId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialDetailRouteId, routes]);

  const visibleRoutes = useMemo(() => {
    const locale = language === "ko" ? "ko-KR" : "en-US";
    const query = searchQuery.trim().toLocaleLowerCase(locale);
    const filtered = query
      ? routes.filter((route) =>
          [route.title, ...route.places.flatMap((place) => [place.title, place.address])]
            .join(" ")
            .toLocaleLowerCase(locale)
            .includes(query),
        )
      : routes;

    return [...filtered].sort((left, right) => {
      if (routeSort === "popular") {
        return right.copyCount - left.copyCount || right.id - left.id;
      }
      if (routeSort === "placeCount") {
        return right.places.length - left.places.length || right.copyCount - left.copyCount;
      }
      return (
        new Date(right.publishedAt || right.updatedAt).getTime() -
        new Date(left.publishedAt || left.updatedAt).getTime()
      );
    });
  }, [language, routeSort, routes, searchQuery]);

  const detailRoute =
    detailRouteId === null
      ? null
      : routes.find((route) => route.id === detailRouteId) ?? null;
  const orderedDetailPlaces = useMemo(
    () =>
      detailRoute
        ? [...detailRoute.places].sort((left, right) => left.visitOrder - right.visitOrder)
        : [],
    [detailRoute],
  );
  const totalStayMinutes = orderedDetailPlaces.reduce(
    (total, place) => total + (place.stayMinutes ?? 0),
    0,
  );
  const directDistance = calculateDirectDistance(orderedDetailPlaces);

  function changeTab(nextTab: "routes" | "popular") {
    setTab(nextTab);
    setDetailRouteId(null);
  }

  function transportLabel(mode: PublicRoute["transportMode"]) {
    if (mode === "DRIVING") return copy.driving;
    if (mode === "TRANSIT") return copy.transit;
    return copy.walking;
  }

  async function shareRoute(route: PublicRoute) {
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set("route", String(route.id));

    try {
      if (navigator.share) {
        await navigator.share({ title: route.title, url: url.toString() });
        return;
      }
      await navigator.clipboard.writeText(url.toString());
      setCopiedShareRouteId(route.id);
      window.setTimeout(() => setCopiedShareRouteId(null), 2000);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      window.prompt(copy.copyLinkPrompt, url.toString());
    }
  }

  return (
    <aside className="absolute inset-3 z-50 flex flex-col overflow-hidden border border-white/80 bg-white/96 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur md:bottom-5 md:left-auto md:right-5 md:top-24 md:w-[520px]">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#e1e7ef] bg-white/96 p-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-[#2563eb]">Global K-Route Community</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-[#101828]">
            <Users aria-hidden="true" size={20} />
            <span className="truncate">{copy.title}</span>
          </h2>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            aria-label={copy.refresh}
            className="flex h-9 w-9 items-center justify-center border border-[#d0d5dd] text-[#475467] transition hover:text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            title={copy.refresh}
            type="button"
            onClick={onRefresh}
          >
            <RefreshCw aria-hidden="true" size={17} />
          </button>
          <button
            aria-label={copy.close}
            className="flex h-9 w-9 items-center justify-center border border-[#d0d5dd] text-[#475467] transition hover:bg-[#f2f4f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            title={copy.close}
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-2 border-b border-[#e1e7ef] bg-white p-2" role="tablist">
        <button
          aria-selected={tab === "routes"}
          className={`flex h-10 items-center justify-center gap-2 text-sm font-semibold transition ${tab === "routes" ? "bg-[#101828] text-white" : "text-[#667085] hover:bg-[#f8fafc]"}`}
          role="tab"
          type="button"
          onClick={() => changeTab("routes")}
        >
          <RouteIcon aria-hidden="true" size={17} />
          {copy.routes}
        </button>
        <button
          aria-selected={tab === "popular"}
          className={`flex h-10 items-center justify-center gap-2 text-sm font-semibold transition ${tab === "popular" ? "bg-[#101828] text-white" : "text-[#667085] hover:bg-[#f8fafc]"}`}
          role="tab"
          type="button"
          onClick={() => changeTab("popular")}
        >
          <TrendingUp aria-hidden="true" size={17} />
          {copy.popular}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-[#667085]">{copy.loading}</div>
        ) : null}

        {error ? (
          <p className="border border-[#fecaca] bg-[#fff1f2] p-3 text-sm text-[#b42318]" role="alert">{error}</p>
        ) : null}

        {!isLoading && !error && tab === "routes" && !detailRoute ? (
          <section aria-label={copy.routes}>
            <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px]">
              <label className="relative block">
                <span className="sr-only">{copy.search}</span>
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" size={17} />
                <input
                  className="h-11 w-full border border-[#d0d5dd] bg-white pl-10 pr-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]"
                  placeholder={copy.searchPlaceholder}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
              <label>
                <span className="sr-only">{copy.sort}</span>
                <select
                  className="h-11 w-full border border-[#d0d5dd] bg-white px-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#dbeafe]"
                  value={routeSort}
                  onChange={(event) => setRouteSort(event.target.value as RouteSort)}
                >
                  <option value="latest">{copy.latest}</option>
                  <option value="popular">{copy.mostPopular}</option>
                  <option value="placeCount">{copy.mostPlaces}</option>
                </select>
              </label>
            </div>

            {routes.length === 0 ? (
              <div className="border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-8 text-center text-sm text-[#667085]">{copy.emptyRoutes}</div>
            ) : visibleRoutes.length === 0 ? (
              <div className="border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-8 text-center text-sm text-[#667085]">{copy.noSearchResults}</div>
            ) : (
              <div className="space-y-3">
                {visibleRoutes.map((route) => {
                  const orderedPlaces = [...route.places].sort((left, right) => left.visitOrder - right.visitOrder);
                  const previewImage = orderedPlaces.find((place) => place.imageUrl)?.imageUrl;
                  return (
                    <article
                      className={`border bg-white transition ${selectedRouteId === route.id ? "border-[#2563eb] ring-2 ring-[#dbeafe]" : "border-[#e1e7ef]"}`}
                      key={route.id}
                    >
                      <div className="flex gap-3 p-3">
                        {previewImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="" className="h-24 w-28 shrink-0 object-cover" src={previewImage} />
                        ) : (
                          <div className="flex h-24 w-28 shrink-0 items-center justify-center bg-[#edf3f8] text-[#667085]"><RouteIcon aria-hidden="true" size={24} /></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <button
                            className="max-w-full text-left text-base font-semibold text-[#101828] hover:text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                            type="button"
                            onClick={() => setDetailRouteId(route.id)}
                          >
                            <span className="line-clamp-2">{route.title}</span>
                          </button>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-[#667085]">
                            <span>{route.places.length} {copy.places}</span>
                            <span>{route.copyCount} {copy.copies}</span>
                            <span>{transportLabel(route.transportMode)}</span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#667085]">{orderedPlaces.map((place) => place.title).join(" → ")}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 border-t border-[#e1e7ef]">
                        <button className="flex h-11 items-center justify-center gap-1 px-2 text-xs font-semibold text-[#344054] transition hover:bg-[#f8fafc] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] sm:gap-2 sm:text-sm" type="button" onClick={() => setDetailRouteId(route.id)}>
                          <RouteIcon aria-hidden="true" size={16} />{copy.details}
                        </button>
                        <button className="flex h-11 items-center justify-center gap-1 border-l border-[#e1e7ef] px-2 text-xs font-semibold text-[#2563eb] transition hover:bg-[#eff6ff] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] sm:gap-2 sm:text-sm" type="button" onClick={() => onPreviewRoute(route)}>
                          <Eye aria-hidden="true" size={16} />{copy.preview}
                        </button>
                        <button className="flex h-11 items-center justify-center gap-1 border-l border-[#e1e7ef] px-2 text-xs font-semibold text-[#0f766e] transition hover:bg-[#f0fdfa] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] sm:gap-2 sm:text-sm" type="button" onClick={() => onCopyRoute(route.id)}>
                          <Copy aria-hidden="true" size={16} />{isAuthenticated ? copy.copy : copy.signInCopy}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {!isLoading && !error && tab === "routes" && detailRoute ? (
          <section aria-labelledby="community-route-detail-title">
            <button className="mb-4 flex min-h-10 items-center gap-2 text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]" type="button" onClick={() => setDetailRouteId(null)}>
              <ArrowLeft aria-hidden="true" size={18} />{copy.backToRoutes}
            </button>

            <div className="border-b border-[#e1e7ef] pb-5">
              <p className="text-xs font-semibold uppercase text-[#2563eb]">{copy.published} · {formatDate(detailRoute.publishedAt, language)}</p>
              <h3 className="mt-2 break-words text-2xl font-semibold text-[#101828]" id="community-route-detail-title">{detailRoute.title}</h3>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-[#667085]">
                <span>{detailRoute.places.length} {copy.places}</span><span>{detailRoute.copyCount} {copy.copies}</span>
              </div>
            </div>

            <div className="border-b border-[#e1e7ef] py-5">
              <h4 className="text-sm font-semibold text-[#101828]">{copy.routeDescription}</h4>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#475467]">{detailRoute.description?.trim() || copy.noDescription}</p>
            </div>

            <dl className="grid grid-cols-2 border-b border-[#e1e7ef] sm:grid-cols-4">
              <div className="border-b border-r border-[#e1e7ef] px-3 py-4 sm:border-b-0">
                <dt className="flex items-center gap-1 text-xs font-semibold text-[#667085]"><CalendarDays aria-hidden="true" size={15} />{copy.travelDate}</dt>
                <dd className="mt-2 text-sm font-semibold text-[#101828]">{detailRoute.travelDate ? formatDate(detailRoute.travelDate, language) : copy.dateUndecided}</dd>
              </div>
              <div className="border-b border-[#e1e7ef] px-3 py-4 sm:border-b-0 sm:border-r">
                <dt className="flex items-center gap-1 text-xs font-semibold text-[#667085]"><Navigation aria-hidden="true" size={15} />{copy.transport}</dt>
                <dd className="mt-2 text-sm font-semibold text-[#101828]">{transportLabel(detailRoute.transportMode)}</dd>
              </div>
              <div className="border-r border-[#e1e7ef] px-3 py-4">
                <dt className="flex items-center gap-1 text-xs font-semibold text-[#667085]"><Clock3 aria-hidden="true" size={15} />{copy.totalStay}</dt>
                <dd className="mt-2 text-sm font-semibold text-[#101828]">{totalStayMinutes} {copy.minutes}</dd>
              </div>
              <div className="px-3 py-4">
                <dt className="flex items-center gap-1 text-xs font-semibold text-[#667085]"><RouteIcon aria-hidden="true" size={15} />{copy.directDistance}</dt>
                <dd className="mt-2 text-sm font-semibold text-[#101828]">{directDistance.toFixed(1)} km</dd>
              </div>
            </dl>
            <p className="border-b border-[#e1e7ef] py-3 text-xs leading-5 text-[#667085]">{copy.directDistanceNote}</p>

            <div className="py-5">
              <h4 className="text-sm font-semibold text-[#101828]">{copy.stops}</h4>
              <ol className="mt-3 space-y-2">
                {orderedDetailPlaces.map((place, index) => (
                  <li key={`${place.id}-${place.contentId}`}>
                    <button className="grid w-full grid-cols-[36px_56px_minmax(0,1fr)] items-center gap-3 border border-[#e1e7ef] bg-white p-2 text-left transition hover:border-[#98a2b3] hover:bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]" type="button" onClick={() => onOpenPlace(place)}>
                      <span aria-label={`${copy.stop} ${index + 1}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101828] text-xs font-bold text-white">{index + 1}</span>
                      {place.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" className="h-14 w-14 object-cover" src={place.imageUrl} />
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center bg-[#edf3f8] text-[#667085]"><MapPin aria-hidden="true" size={19} /></span>
                      )}
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-semibold text-[#101828]">{place.title}</span>
                        <span className="mt-1 block break-words text-xs leading-5 text-[#667085]">{place.address || copy.addressUnavailable}</span>
                        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
                          {place.stayMinutes !== null ? <span className="text-[#2563eb]">{place.stayMinutes} {copy.minutes}</span> : null}
                          <span className="text-[#0f766e]">{place.saveCount} {copy.savedBy}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="sticky bottom-0 grid grid-cols-3 border border-[#d0d5dd] bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
              <button className="flex min-h-12 items-center justify-center gap-2 px-3 text-sm font-semibold text-[#2563eb] transition hover:bg-[#eff6ff] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]" type="button" onClick={() => onPreviewRoute(detailRoute)}>
                <Eye aria-hidden="true" size={17} />{copy.preview}
              </button>
              <button className="flex min-h-12 items-center justify-center gap-2 border-l border-[#d0d5dd] px-2 text-xs font-semibold text-[#344054] transition hover:bg-[#f8fafc] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb] sm:px-3 sm:text-sm" type="button" onClick={() => void shareRoute(detailRoute)}>
                {copiedShareRouteId === detailRoute.id ? <Check aria-hidden="true" size={17} /> : <Share2 aria-hidden="true" size={17} />}
                {copiedShareRouteId === detailRoute.id ? copy.linkCopied : copy.share}
              </button>
              <button className="flex min-h-12 items-center justify-center gap-2 border-l border-[#d0d5dd] px-3 text-sm font-semibold text-[#0f766e] transition hover:bg-[#f0fdfa] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]" type="button" onClick={() => onCopyRoute(detailRoute.id)}>
                <Copy aria-hidden="true" size={17} />{isAuthenticated ? copy.copy : copy.signInCopy}
              </button>
            </div>
          </section>
        ) : null}

        {!isLoading && !error && tab === "popular" ? (
          <section aria-label={copy.popular}>
            <p className="mb-3 border-l-2 border-[#2563eb] pl-3 text-xs leading-5 text-[#667085]">{copy.popularityNote}</p>
            {popularPlaces.length === 0 ? (
              <div className="border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-8 text-center text-sm text-[#667085]">{copy.emptyPopular}</div>
            ) : (
              <ol className="space-y-2">
                {popularPlaces.map((place, index) => (
                  <li key={place.contentId}>
                    <button className="grid w-full grid-cols-[36px_64px_minmax(0,1fr)] items-center gap-3 border border-[#e1e7ef] bg-white p-2 text-left transition hover:border-[#98a2b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]" type="button" onClick={() => onOpenPlace(place)}>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101828] text-xs font-bold text-white">{index + 1}</span>
                      {place.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" className="h-16 w-16 object-cover" src={place.imageUrl} />
                      ) : (
                        <span className="flex h-16 w-16 items-center justify-center bg-[#edf3f8] text-[#667085]"><MapPin aria-hidden="true" size={20} /></span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#101828]">{place.title}</span>
                        <span className="mt-1 block truncate text-xs text-[#667085]">{place.address}</span>
                        <span className="mt-2 block text-xs font-semibold text-[#2563eb]">{place.saveCount} {copy.savedBy}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : null}
      </div>
    </aside>
  );
}
