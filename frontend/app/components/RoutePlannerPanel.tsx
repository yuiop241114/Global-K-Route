"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bus,
  CalendarDays,
  Car,
  Clock3,
  Footprints,
  Globe2,
  GripVertical,
  Lock,
  Plus,
  Route as RouteIcon,
  Save,
  Trash2,
  X,
} from "lucide-react";

export type RouteDraftPlace = {
  contentId: string;
  title: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  dataLanguage: string;
  areaCode: number | null;
  sigunguCode: number | null;
  stayMinutes: number | null;
};

export type RouteTransportMode = "WALKING" | "DRIVING" | "TRANSIT";

export type WalkingRouteSummary = {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
};

export type WalkingRouteStatus = "idle" | "loading" | "ready" | "error";

export type TravelRoute = {
  id: number;
  title: string;
  description: string | null;
  travelDate: string | null;
  transportMode: RouteTransportMode;
  places: Array<RouteDraftPlace & { id: number; visitOrder: number }>;
  publicRoute: boolean;
  publishedAt: string | null;
  copyCount: number;
  createdAt: string;
  updatedAt: string;
};

type RoutePlannerPanelProps = {
  language: "ko" | "en";
  isAuthenticated: boolean;
  routes: TravelRoute[];
  activeRouteId: number | null;
  title: string;
  description: string;
  travelDate: string;
  transportMode: RouteTransportMode;
  places: RouteDraftPlace[];
  walkingRouteSummary: WalkingRouteSummary | null;
  walkingRouteStatus: WalkingRouteStatus;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onTravelDateChange: (travelDate: string) => void;
  onTransportModeChange: (transportMode: RouteTransportMode) => void;
  onMovePlace: (index: number, direction: -1 | 1) => void;
  onReorderPlace: (fromIndex: number, toIndex: number) => void;
  onStayMinutesChange: (contentId: string, stayMinutes: number | null) => void;
  onRemovePlace: (contentId: string) => void;
  onOpenRoute: (route: TravelRoute) => void;
  onNewRoute: () => void;
  onSaveRoute: () => void;
  onDeleteRoute: (routeId: number) => void;
  onToggleVisibility: (route: TravelRoute) => void;
};

const COPY = {
  ko: {
    planner: "코스 편집",
    draft: "현재 코스",
    savedRoutes: "저장된 코스",
    routeTitle: "코스 이름",
    routeTitlePlaceholder: "예: 서울 하루 여행",
    description: "코스 설명",
    descriptionPlaceholder: "코스의 테마나 방문 계획을 간단히 작성하세요.",
    travelDate: "여행일",
    transportMode: "이동수단",
    walking: "도보",
    driving: "자동차",
    transit: "대중교통",
    stayMinutes: "체류시간",
    minutes: "분",
    totalStay: "총 체류",
    directDistance: "직선거리",
    walkingRoute: "도보 동선",
    walkingRouteLoading: "계산 중",
    walkingRouteUnavailable: "직선거리로 대체",
    empty: "검색 결과나 상세 정보에서 코스 추가 버튼을 눌러 장소를 담아보세요.",
    guest: "코스 초안은 이 브라우저에 임시 저장됩니다. 영구 저장할 때 로그인이 필요합니다.",
    newRoute: "새 코스",
    saveRoute: "코스 저장",
    signInToSave: "로그인 후 저장",
    deleteRoute: "코스 삭제",
    openRoute: "코스 열기",
    removePlace: "코스에서 제거",
    moveUp: "위로 이동",
    moveDown: "아래로 이동",
    stop: "번째 장소",
    places: "개 장소",
    publicRoute: "공개 코스",
    privateRoute: "비공개 코스",
    copies: "회 복사",
  },
  en: {
    planner: "Route planner",
    draft: "Current route",
    savedRoutes: "Saved routes",
    routeTitle: "Route name",
    routeTitlePlaceholder: "e.g. One day in Seoul",
    description: "Description",
    descriptionPlaceholder: "Describe the theme or plan for this route.",
    travelDate: "Travel date",
    transportMode: "Transport",
    walking: "Walk",
    driving: "Drive",
    transit: "Transit",
    stayMinutes: "Stay",
    minutes: "min",
    totalStay: "Total stay",
    directDistance: "Direct distance",
    walkingRoute: "Walking route",
    walkingRouteLoading: "Calculating",
    walkingRouteUnavailable: "Using direct distance",
    empty: "Add places from search results or place details to start a route.",
    guest: "This draft stays in this browser. Sign in when you want to save it permanently.",
    newRoute: "New route",
    saveRoute: "Save route",
    signInToSave: "Sign in to save",
    deleteRoute: "Delete route",
    openRoute: "Open route",
    removePlace: "Remove from route",
    moveUp: "Move up",
    moveDown: "Move down",
    stop: "stop",
    places: "places",
    publicRoute: "Public route",
    privateRoute: "Private route",
    copies: "copies",
  },
} as const;

const TRANSPORT_OPTIONS = [
  { value: "WALKING" as const, icon: Footprints, labelKey: "walking" as const },
  { value: "DRIVING" as const, icon: Car, labelKey: "driving" as const },
  { value: "TRANSIT" as const, icon: Bus, labelKey: "transit" as const },
];

function directDistanceKm(places: RouteDraftPlace[]) {
  const earthRadiusKm = 6371;
  return places.slice(1).reduce((total, place, index) => {
    const previous = places[index];
    const lat1 = (previous.latitude * Math.PI) / 180;
    const lat2 = (place.latitude * Math.PI) / 180;
    const deltaLat = ((place.latitude - previous.latitude) * Math.PI) / 180;
    const deltaLng = ((place.longitude - previous.longitude) * Math.PI) / 180;
    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    return total + earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, 0);
}

export default function RoutePlannerPanel({
  language,
  isAuthenticated,
  routes,
  activeRouteId,
  title,
  description,
  travelDate,
  transportMode,
  places,
  walkingRouteSummary,
  walkingRouteStatus,
  error,
  isSaving,
  onClose,
  onTitleChange,
  onDescriptionChange,
  onTravelDateChange,
  onTransportModeChange,
  onMovePlace,
  onReorderPlace,
  onStayMinutesChange,
  onRemovePlace,
  onOpenRoute,
  onNewRoute,
  onSaveRoute,
  onDeleteRoute,
  onToggleVisibility,
}: RoutePlannerPanelProps) {
  const copy = COPY[language];
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const totalStayMinutes = places.reduce(
    (total, place) => total + (place.stayMinutes ?? 0),
    0,
  );
  const distanceKm = directDistanceKm(places);
  const walkingDistanceKm = (walkingRouteSummary?.totalDistanceMeters ?? 0) / 1000;
  const walkingMinutes = Math.max(
    1,
    Math.ceil((walkingRouteSummary?.totalDurationSeconds ?? 0) / 60),
  );

  return (
    <aside className="absolute inset-3 z-40 flex flex-col overflow-hidden border border-white/80 bg-white/96 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur md:bottom-5 md:left-auto md:right-5 md:top-24 md:w-[440px]">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#e1e7ef] bg-white/96 p-4">
        <div>
          <p className="text-xs font-semibold uppercase text-[#0f766e]">
            Global K-Route
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-[#101828]">
            <RouteIcon aria-hidden="true" size={20} />
            {copy.planner}
            <span className="text-sm font-medium text-[#667085]">
              {places.length}
            </span>
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            aria-label={copy.newRoute}
            className="flex h-9 w-9 items-center justify-center border border-[#d0d5dd] bg-white text-[#475467] transition hover:border-[#0f766e] hover:text-[#0f766e]"
            title={copy.newRoute}
            type="button"
            onClick={onNewRoute}
          >
            <Plus aria-hidden="true" size={18} />
          </button>
          <button
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center border border-[#d0d5dd] bg-white text-[#475467] transition hover:bg-[#f2f4f7]"
            title="Close"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isAuthenticated && routes.length > 0 ? (
          <section className="border-b border-[#e1e7ef] p-4">
            <h3 className="text-xs font-semibold uppercase text-[#667085]">
              {copy.savedRoutes}
            </h3>
            <div className="mt-2 grid gap-2">
              {routes.map((route) => (
                <div
                  className={`grid grid-cols-[1fr_36px_36px] border ${
                    activeRouteId === route.id
                      ? "border-[#0f766e] bg-[#f0fdfa]"
                      : "border-[#e1e7ef] bg-white"
                  }`}
                  key={route.id}
                >
                  <button
                    className="min-w-0 px-3 py-2 text-left"
                    title={copy.openRoute}
                    type="button"
                    onClick={() => onOpenRoute(route)}
                  >
                    <span className="block truncate text-sm font-semibold text-[#101828]">
                      {route.title}
                    </span>
                    <span className="mt-1 block text-xs text-[#667085]">
                      {route.places.length} {copy.places}
                      {route.publicRoute
                        ? ` · ${route.copyCount} ${copy.copies}`
                        : ""}
                    </span>
                  </button>
                  <button
                    aria-label={
                      route.publicRoute ? copy.publicRoute : copy.privateRoute
                    }
                    className={`flex items-center justify-center border-l border-[#e1e7ef] transition ${
                      route.publicRoute
                        ? "bg-[#f0fdfa] text-[#0f766e]"
                        : "text-[#667085] hover:text-[#0f766e]"
                    }`}
                    title={
                      route.publicRoute ? copy.publicRoute : copy.privateRoute
                    }
                    type="button"
                    onClick={() => onToggleVisibility(route)}
                  >
                    {route.publicRoute ? (
                      <Globe2 aria-hidden="true" size={16} />
                    ) : (
                      <Lock aria-hidden="true" size={16} />
                    )}
                  </button>
                  <button
                    aria-label={copy.deleteRoute}
                    className="flex items-center justify-center border-l border-[#e1e7ef] text-[#667085] transition hover:text-[#dc2626]"
                    title={copy.deleteRoute}
                    type="button"
                    onClick={() => onDeleteRoute(route.id)}
                  >
                    <Trash2 aria-hidden="true" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="p-4">
          <label className="block text-sm font-semibold text-[#344054]">
            {copy.routeTitle}
            <input
              className="mt-2 h-11 w-full border border-[#d0d5dd] bg-white px-3 text-sm font-medium text-[#101828] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#ccfbf1]"
              maxLength={100}
              placeholder={copy.routeTitlePlaceholder}
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-[#344054]">
            {copy.description}
            <textarea
              className="mt-2 min-h-20 w-full resize-y border border-[#d0d5dd] bg-white px-3 py-2 text-sm leading-6 text-[#101828] outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#ccfbf1]"
              maxLength={1000}
              placeholder={copy.descriptionPlaceholder}
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <label className="block text-sm font-semibold text-[#344054]">
              {copy.travelDate}
              <span className="relative mt-2 block">
                <CalendarDays
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]"
                  size={16}
                />
                <input
                  className="h-11 w-full border border-[#d0d5dd] bg-white pl-9 pr-2 text-sm text-[#101828] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#ccfbf1]"
                  type="date"
                  value={travelDate}
                  onChange={(event) => onTravelDateChange(event.target.value)}
                />
              </span>
            </label>
            <fieldset>
              <legend className="text-sm font-semibold text-[#344054]">
                {copy.transportMode}
              </legend>
              <div className="mt-2 grid h-11 grid-cols-3 border border-[#d0d5dd] bg-white p-1">
                {TRANSPORT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      className={`flex min-w-0 items-center justify-center gap-1 px-1 text-xs font-semibold transition ${
                        transportMode === option.value
                          ? "bg-[#0f766e] text-white"
                          : "text-[#667085] hover:bg-[#f0fdfa]"
                      }`}
                      key={option.value}
                      type="button"
                      onClick={() => onTransportModeChange(option.value)}
                    >
                      <Icon aria-hidden="true" size={14} />
                      <span className="truncate">{copy[option.labelKey]}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <dl className="mt-4 grid grid-cols-2 border border-[#d8e1ea] bg-[#f8fafc]">
            <div className="border-r border-[#d8e1ea] p-3">
              <dt className="flex items-center gap-1 text-xs font-semibold text-[#667085]">
                <Clock3 aria-hidden="true" size={14} />
                {copy.totalStay}
              </dt>
              <dd className="mt-1 text-sm font-bold text-[#101828]">
                {totalStayMinutes} {copy.minutes}
              </dd>
            </div>
            <div className="p-3">
              <dt className="text-xs font-semibold text-[#667085]">
                {transportMode === "WALKING" ? copy.walkingRoute : copy.directDistance}
              </dt>
              <dd className="mt-1 text-sm font-bold text-[#101828]">
                {transportMode === "WALKING" && walkingRouteStatus === "ready" ? (
                  <>
                    {walkingDistanceKm.toFixed(walkingDistanceKm < 10 ? 1 : 0)} km
                    <span className="ml-1 font-semibold text-[#667085]">
                      · {walkingMinutes} {copy.minutes}
                    </span>
                  </>
                ) : transportMode === "WALKING" &&
                  (walkingRouteStatus === "loading" || walkingRouteStatus === "idle") &&
                  places.length > 1 ? (
                  copy.walkingRouteLoading
                ) : (
                  <>
                    {distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km
                    {transportMode === "WALKING" && walkingRouteStatus === "error" ? (
                      <span className="ml-1 block text-xs font-semibold text-[#b54708]">
                        {copy.walkingRouteUnavailable}
                      </span>
                    ) : null}
                  </>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[#101828]">{copy.draft}</h3>
            <span className="text-xs font-semibold text-[#0f766e]">
              {places.length} {copy.places}
            </span>
          </div>

          {places.length === 0 ? (
            <div className="mt-3 border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center text-sm leading-6 text-[#667085]">
              {copy.empty}
            </div>
          ) : (
            <ol className="mt-3 space-y-2">
              {places.map((place, index) => (
                <li
                  className={`grid grid-cols-[28px_36px_minmax(0,1fr)_72px] items-center border bg-white p-2 transition ${
                    draggedIndex === index
                      ? "border-[#0f766e] opacity-60"
                      : "border-[#e1e7ef]"
                  }`}
                  key={place.contentId}
                  onDragEnd={() => setDraggedIndex(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
                    if (Number.isInteger(fromIndex) && fromIndex !== index) {
                      onReorderPlace(fromIndex, index);
                    }
                    setDraggedIndex(null);
                  }}
                >
                  <button
                    aria-label={`${place.title} drag`}
                    className="flex h-8 w-6 cursor-grab items-center justify-center text-[#98a2b3] active:cursor-grabbing"
                    draggable
                    title={language === "ko" ? "드래그해 순서 변경" : "Drag to reorder"}
                    type="button"
                    onDragStart={(event) => {
                      setDraggedIndex(index);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", String(index));
                    }}
                  >
                    <GripVertical aria-hidden="true" size={18} />
                  </button>
                  <span
                    aria-label={`${index + 1} ${copy.stop}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f766e] text-xs font-bold text-white"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 pr-2">
                    <p className="truncate text-sm font-semibold text-[#101828]">
                      {place.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#667085]">
                      {place.address}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      aria-label={copy.moveUp}
                      className="flex h-7 items-center justify-center border border-[#d0d5dd] text-[#667085] disabled:opacity-30"
                      disabled={index === 0}
                      title={copy.moveUp}
                      type="button"
                      onClick={() => onMovePlace(index, -1)}
                    >
                      <ArrowUp aria-hidden="true" size={14} />
                    </button>
                    <button
                      aria-label={copy.moveDown}
                      className="flex h-7 items-center justify-center border border-[#d0d5dd] text-[#667085] disabled:opacity-30"
                      disabled={index === places.length - 1}
                      title={copy.moveDown}
                      type="button"
                      onClick={() => onMovePlace(index, 1)}
                    >
                      <ArrowDown aria-hidden="true" size={14} />
                    </button>
                    <button
                      aria-label={copy.removePlace}
                      className="flex h-7 items-center justify-center border border-[#d0d5dd] text-[#667085] transition hover:text-[#dc2626]"
                      title={copy.removePlace}
                      type="button"
                      onClick={() => onRemovePlace(place.contentId)}
                    >
                      <X aria-hidden="true" size={14} />
                    </button>
                  </div>
                  <label className="col-start-3 col-span-2 mt-2 flex items-center justify-end gap-2 border-t border-[#eef2f6] pt-2 text-xs font-semibold text-[#667085]">
                    {copy.stayMinutes}
                    <input
                      aria-label={`${place.title} ${copy.stayMinutes}`}
                      className="h-8 w-20 border border-[#d0d5dd] px-2 text-right text-sm text-[#101828] outline-none focus:border-[#0f766e]"
                      inputMode="numeric"
                      max={720}
                      min={0}
                      step={10}
                      type="number"
                      value={place.stayMinutes ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        onStayMinutesChange(
                          place.contentId,
                          value === ""
                            ? null
                            : Math.min(720, Math.max(0, Number(value))),
                        );
                      }}
                    />
                    {copy.minutes}
                  </label>
                </li>
              ))}
            </ol>
          )}

          {!isAuthenticated ? (
            <p className="mt-4 border-l-2 border-[#0f766e] pl-3 text-xs leading-5 text-[#475467]">
              {copy.guest}
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 border border-[#fecaca] bg-[#fff1f2] p-3 text-sm text-[#b42318]">
              {error}
            </p>
          ) : null}
        </section>
      </div>

      <footer className="shrink-0 border-t border-[#e1e7ef] bg-white p-4">
        <button
          className="flex h-11 w-full items-center justify-center gap-2 bg-[#0f766e] px-4 text-sm font-semibold text-white transition hover:bg-[#0b5f59] disabled:bg-[#94c7c2]"
          disabled={isSaving || places.length === 0 || !title.trim()}
          type="button"
          onClick={onSaveRoute}
        >
          <Save aria-hidden="true" size={17} />
          {isAuthenticated ? copy.saveRoute : copy.signInToSave}
        </button>
      </footer>
    </aside>
  );
}
