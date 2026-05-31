"use client";

import { useMemo, useState } from "react";

type Area = {
  code: number;
  name: string;
  description: string;
  lat: number;
  lng: number;
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

const AREAS: Area[] = [
  {
    code: 1,
    name: "Seoul",
    description: "City culture, palaces, shopping, food",
    lat: 37.5665,
    lng: 126.978,
  },
  {
    code: 6,
    name: "Busan",
    description: "Coast, markets, night views, festivals",
    lat: 35.1796,
    lng: 129.0756,
  },
  {
    code: 39,
    name: "Jeju",
    description: "Nature, trails, cafes, scenic drives",
    lat: 33.4996,
    lng: 126.5312,
  },
  {
    code: 31,
    name: "Gyeonggi",
    description: "Day trips, history, theme attractions",
    lat: 37.4138,
    lng: 127.5183,
  },
  {
    code: 32,
    name: "Gangwon",
    description: "Mountains, beaches, wellness routes",
    lat: 37.8228,
    lng: 128.1555,
  },
];

const CONTENT_TYPES = [
  { value: "tourist_attraction", label: "Tourist spots" },
  { value: "restaurant", label: "Restaurants" },
  { value: "accommodation", label: "Stays" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
];

export default function Home() {
  const [selectedArea, setSelectedArea] = useState<Area>(AREAS[0]);
  const [radius, setRadius] = useState("1000");
  const [language, setLanguage] = useState("en");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0].value);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  const apiBaseUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";
  }, []);

  async function searchNearbyPlaces() {
    setIsLoading(true);
    setErrorMessage(null);

    const params = new URLSearchParams({
      selectedLat: selectedArea.lat.toString(),
      selectedLng: selectedArea.lng.toString(),
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
      setLastQuery(`${selectedArea.name} / ${radius}m / ${language}`);
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

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#111827]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-4 lg:px-6">
        <header className="flex flex-col justify-between gap-3 border-b border-[#d7dde8] pb-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-[#2f6f62]">
              Global K-Route
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#111827] md:text-3xl">
              Map-selected travel discovery
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-[#526070]">
            <span className="border border-[#cfd6e3] bg-white px-3 py-2">
              Backend: {apiBaseUrl}
            </span>
            <span className="border border-[#cfd6e3] bg-white px-3 py-2">
              GPS auto-collection disabled
            </span>
          </div>
        </header>

        <section className="grid flex-1 gap-5 lg:grid-cols-[380px_1fr]">
          <aside className="flex flex-col gap-4">
            <div className="border border-[#d7dde8] bg-white p-4">
              <h2 className="text-base font-semibold">Search conditions</h2>

              <label className="mt-4 block text-sm font-medium text-[#374151]">
                Area
              </label>
              <select
                className="mt-2 h-11 w-full border border-[#cfd6e3] bg-white px-3 text-sm outline-none focus:border-[#2f6f62]"
                value={selectedArea.code}
                onChange={(event) => {
                  const nextArea = AREAS.find(
                    (area) => area.code === Number(event.target.value),
                  );
                  if (nextArea) {
                    setSelectedArea(nextArea);
                  }
                }}
              >
                {AREAS.map((area) => (
                  <option key={area.code} value={area.code}>
                    {area.name}
                  </option>
                ))}
              </select>

              <label className="mt-4 block text-sm font-medium text-[#374151]">
                Category
              </label>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {CONTENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    className={`h-10 border px-3 text-left text-sm ${
                      contentType === type.value
                        ? "border-[#2f6f62] bg-[#e7f3ef] text-[#1f594e]"
                        : "border-[#cfd6e3] bg-white text-[#344054]"
                    }`}
                    type="button"
                    onClick={() => setContentType(type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <label className="mt-4 block text-sm font-medium text-[#374151]">
                Language
              </label>
              <select
                className="mt-2 h-11 w-full border border-[#cfd6e3] bg-white px-3 text-sm outline-none focus:border-[#2f6f62]"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {LANGUAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <label className="mt-4 block text-sm font-medium text-[#374151]">
                Radius
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  className="h-11 w-full border border-[#cfd6e3] bg-white px-3 text-sm outline-none focus:border-[#2f6f62]"
                  max="20000"
                  min="100"
                  step="100"
                  type="number"
                  value={radius}
                  onChange={(event) => setRadius(event.target.value)}
                />
                <span className="min-w-10 text-sm text-[#526070]">m</span>
              </div>

              <button
                className="mt-5 h-11 w-full bg-[#2f6f62] px-4 text-sm font-semibold text-white disabled:bg-[#9fbab3]"
                disabled={isLoading}
                type="button"
                onClick={searchNearbyPlaces}
              >
                {isLoading ? "Searching..." : "Search selected area"}
              </button>
            </div>

            <div className="border border-[#d7dde8] bg-white p-4">
              <h2 className="text-base font-semibold">Results</h2>
              {lastQuery ? (
                <p className="mt-1 text-sm text-[#667085]">{lastQuery}</p>
              ) : (
                <p className="mt-1 text-sm text-[#667085]">
                  Select an area and run a search.
                </p>
              )}

              {errorMessage ? (
                <div className="mt-4 border border-[#efb4b4] bg-[#fff1f1] p-3 text-sm text-[#9f1f1f]">
                  {errorMessage}
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-3">
                {places.map((place) => (
                  <article
                    className="border border-[#d7dde8] bg-[#fbfcfe] p-3"
                    key={place.contentId}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[#111827]">
                          {place.title}
                        </h3>
                        <p className="mt-1 text-sm text-[#667085]">
                          {place.address}
                        </p>
                      </div>
                      <span className="whitespace-nowrap border border-[#cfd6e3] bg-white px-2 py-1 text-xs text-[#526070]">
                        {place.distanceMeters}m
                      </span>
                    </div>
                    <p className="mt-3 text-xs uppercase text-[#2f6f62]">
                      {place.category}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </aside>

          <section className="flex min-h-[560px] flex-col border border-[#d7dde8] bg-white">
            <div className="flex flex-col justify-between gap-3 border-b border-[#d7dde8] p-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-base font-semibold">Map selection</h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Selected point: {selectedArea.name} ({selectedArea.lat},{" "}
                  {selectedArea.lng})
                </p>
              </div>
              <span className="border border-[#cfd6e3] px-3 py-2 text-sm text-[#526070]">
                areaCode {selectedArea.code}
              </span>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#edf3f5] p-5">
              <div className="absolute inset-0 bg-[linear-gradient(#d9e4e8_1px,transparent_1px),linear-gradient(90deg,#d9e4e8_1px,transparent_1px)] bg-[size:44px_44px]" />
              <div className="relative grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-2">
                {AREAS.map((area) => (
                  <button
                    className={`min-h-28 border p-4 text-left transition ${
                      selectedArea.code === area.code
                        ? "border-[#2f6f62] bg-white shadow-[0_0_0_3px_#d9eee8]"
                        : "border-[#c7d4dc] bg-white/80 hover:border-[#2f6f62]"
                    }`}
                    key={area.code}
                    type="button"
                    onClick={() => setSelectedArea(area)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-[#111827]">
                          {area.name}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#526070]">
                          {area.description}
                        </p>
                      </div>
                      <span className="border border-[#cfd6e3] px-2 py-1 text-xs text-[#526070]">
                        {area.code}
                      </span>
                    </div>
                    <p className="mt-4 text-xs text-[#667085]">
                      {area.lat}, {area.lng}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
