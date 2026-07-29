"use client";

import { useState } from "react";
import {
  Copy,
  Eye,
  MapPin,
  RefreshCw,
  Route as RouteIcon,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import type {
  RouteDraftPlace,
} from "@/app/components/RoutePlannerPanel";

export type PublicRoute = {
  id: number;
  title: string;
  places: Array<RouteDraftPlace & { id: number; visitOrder: number }>;
  copyCount: number;
  publishedAt: string;
  updatedAt: string;
};

export type PopularPlace = RouteDraftPlace & {
  saveCount: number;
};

type CommunityBoardProps = {
  language: "ko" | "en";
  routes: PublicRoute[];
  popularPlaces: PopularPlace[];
  selectedRouteId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onPreviewRoute: (route: PublicRoute) => void;
  onCopyRoute: (routeId: number) => void;
  onOpenPlace: (place: PopularPlace) => void;
};

const COPY_TEXT = {
  ko: {
    title: "여행 코스 둘러보기",
    routes: "공개 코스",
    popular: "인기 장소",
    emptyRoutes: "아직 공개된 코스가 없습니다.",
    emptyPopular: "인기 장소를 계산할 저장 기록이 아직 없습니다.",
    places: "개 장소",
    copies: "회 복사",
    savedBy: "명이 저장",
    preview: "지도에서 보기",
    copy: "내 코스로 복사",
    signInCopy: "로그인 후 복사",
    refresh: "새로고침",
    close: "닫기",
    popularityNote: "장소를 저장하거나 코스에 담은 고유 사용자 수입니다.",
  },
  en: {
    title: "Explore community routes",
    routes: "Public routes",
    popular: "Popular places",
    emptyRoutes: "No public routes yet.",
    emptyPopular: "There is not enough saved-place activity yet.",
    places: "places",
    copies: "copies",
    savedBy: "travelers saved",
    preview: "Preview on map",
    copy: "Copy to my routes",
    signInCopy: "Sign in to copy",
    refresh: "Refresh",
    close: "Close",
    popularityNote: "Counts unique users who saved a place or added it to a route.",
  },
} as const;

export default function CommunityBoard({
  language,
  routes,
  popularPlaces,
  selectedRouteId,
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
  const copy = COPY_TEXT[language];

  return (
    <aside className="absolute inset-3 z-50 flex flex-col overflow-hidden border border-white/80 bg-white/96 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur md:bottom-5 md:left-auto md:right-5 md:top-24 md:w-[520px]">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#e1e7ef] bg-white/96 p-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-[#2563eb]">
            Global K-Route Community
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-[#101828]">
            <Users aria-hidden="true" size={20} />
            <span className="truncate">{copy.title}</span>
          </h2>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            aria-label={copy.refresh}
            className="flex h-9 w-9 items-center justify-center border border-[#d0d5dd] text-[#475467] transition hover:text-[#2563eb]"
            title={copy.refresh}
            type="button"
            onClick={onRefresh}
          >
            <RefreshCw aria-hidden="true" size={17} />
          </button>
          <button
            aria-label={copy.close}
            className="flex h-9 w-9 items-center justify-center border border-[#d0d5dd] text-[#475467] transition hover:bg-[#f2f4f7]"
            title={copy.close}
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-2 border-b border-[#e1e7ef] bg-white p-2">
        <button
          className={`flex h-10 items-center justify-center gap-2 text-sm font-semibold transition ${
            tab === "routes"
              ? "bg-[#101828] text-white"
              : "text-[#667085] hover:bg-[#f8fafc]"
          }`}
          type="button"
          onClick={() => setTab("routes")}
        >
          <RouteIcon aria-hidden="true" size={17} />
          {copy.routes}
        </button>
        <button
          className={`flex h-10 items-center justify-center gap-2 text-sm font-semibold transition ${
            tab === "popular"
              ? "bg-[#101828] text-white"
              : "text-[#667085] hover:bg-[#f8fafc]"
          }`}
          type="button"
          onClick={() => setTab("popular")}
        >
          <TrendingUp aria-hidden="true" size={17} />
          {copy.popular}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-[#667085]">
            Loading...
          </div>
        ) : null}

        {error ? (
          <p className="border border-[#fecaca] bg-[#fff1f2] p-3 text-sm text-[#b42318]">
            {error}
          </p>
        ) : null}

        {!isLoading && !error && tab === "routes" ? (
          routes.length === 0 ? (
            <div className="border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-8 text-center text-sm text-[#667085]">
              {copy.emptyRoutes}
            </div>
          ) : (
            <div className="space-y-3">
              {routes.map((route) => {
                const previewImage = route.places.find(
                  (place) => place.imageUrl,
                )?.imageUrl;
                return (
                  <article
                    className={`border bg-white transition ${
                      selectedRouteId === route.id
                        ? "border-[#2563eb] ring-2 ring-[#dbeafe]"
                        : "border-[#e1e7ef]"
                    }`}
                    key={route.id}
                  >
                    <div className="flex gap-3 p-3">
                      {previewImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          className="h-24 w-28 shrink-0 object-cover"
                          src={previewImage}
                        />
                      ) : (
                        <div className="flex h-24 w-28 shrink-0 items-center justify-center bg-[#edf3f8] text-[#667085]">
                          <RouteIcon aria-hidden="true" size={24} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-[#101828]">
                          {route.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-[#667085]">
                          <span>{route.places.length} {copy.places}</span>
                          <span>{route.copyCount} {copy.copies}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#667085]">
                          {route.places.map((place) => place.title).join(" → ")}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 border-t border-[#e1e7ef]">
                      <button
                        className="flex h-10 items-center justify-center gap-2 text-sm font-semibold text-[#2563eb] transition hover:bg-[#eff6ff]"
                        type="button"
                        onClick={() => onPreviewRoute(route)}
                      >
                        <Eye aria-hidden="true" size={16} />
                        {copy.preview}
                      </button>
                      <button
                        className="flex h-10 items-center justify-center gap-2 border-l border-[#e1e7ef] text-sm font-semibold text-[#0f766e] transition hover:bg-[#f0fdfa]"
                        type="button"
                        onClick={() => onCopyRoute(route.id)}
                      >
                        <Copy aria-hidden="true" size={16} />
                        {isAuthenticated ? copy.copy : copy.signInCopy}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : null}

        {!isLoading && !error && tab === "popular" ? (
          <section>
            <p className="mb-3 border-l-2 border-[#2563eb] pl-3 text-xs leading-5 text-[#667085]">
              {copy.popularityNote}
            </p>
            {popularPlaces.length === 0 ? (
              <div className="border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-8 text-center text-sm text-[#667085]">
                {copy.emptyPopular}
              </div>
            ) : (
              <ol className="space-y-2">
                {popularPlaces.map((place, index) => (
                  <li key={place.contentId}>
                    <button
                      className="grid w-full grid-cols-[36px_64px_minmax(0,1fr)] items-center gap-3 border border-[#e1e7ef] bg-white p-2 text-left transition hover:border-[#98a2b3]"
                      type="button"
                      onClick={() => onOpenPlace(place)}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101828] text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      {place.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          className="h-16 w-16 object-cover"
                          src={place.imageUrl}
                        />
                      ) : (
                        <span className="flex h-16 w-16 items-center justify-center bg-[#edf3f8] text-[#667085]">
                          <MapPin aria-hidden="true" size={20} />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#101828]">
                          {place.title}
                        </span>
                        <span className="mt-1 block truncate text-xs text-[#667085]">
                          {place.address}
                        </span>
                        <span className="mt-2 block text-xs font-semibold text-[#2563eb]">
                          {place.saveCount} {copy.savedBy}
                        </span>
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
