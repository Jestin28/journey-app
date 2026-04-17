import fallbackParks from "@/data/parks.json";
import type { NationalPark } from "@/types";

type NpsImage = {
  url?: string;
};

type NpsPark = {
  id?: string;
  parkCode?: string;
  fullName?: string;
  name?: string;
  states?: string;
  designation?: string;
  description?: string;
  latLong?: string;
  latitude?: string;
  longitude?: string;
  images?: NpsImage[];
};

type NpsParksResponse = {
  data?: NpsPark[];
};

const NPS_API_BASE_URL = "https://developer.nps.gov/api/v1";
const NPS_PARKS_LIMIT = "500";

function getFallbackParks(): NationalPark[] {
  return fallbackParks as NationalPark[];
}

function getNpsHeaders(): HeadersInit {
  const apiKey = process.env.NPS_API_KEY;

  return apiKey ? { "X-Api-Key": apiKey } : {};
}

function hasNpsApiKey() {
  return Boolean(process.env.NPS_API_KEY);
}

function parseCoordinate(value?: string): number | null {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseLatLong(latLong?: string): { lat: number; lng: number } | null {
  if (!latLong) {
    return null;
  }

  const latMatch = latLong.match(/lat:\s*(-?\d+(?:\.\d+)?)/i);
  const lngMatch = latLong.match(/(?:long|lng):\s*(-?\d+(?:\.\d+)?)/i);

  if (!latMatch?.[1] || !lngMatch?.[1]) {
    return null;
  }

  const lat = parseCoordinate(latMatch[1]);
  const lng = parseCoordinate(lngMatch[1]);

  if (lat === null || lng === null) {
    return null;
  }

  return { lat, lng };
}

function getParkCoordinates(park: NpsPark): { lat: number; lng: number } {
  const lat = parseCoordinate(park.latitude);
  const lng = parseCoordinate(park.longitude);

  if (lat !== null && lng !== null) {
    return { lat, lng };
  }

  return parseLatLong(park.latLong) ?? { lat: 39.8283, lng: -98.5795 };
}

function isNationalPark(park: NpsPark): boolean {
  return /\bnational parks?\b/i.test(park.designation ?? "");
}

function mapNpsPark(park: NpsPark): NationalPark | null {
  const id = park.parkCode;
  const name = park.fullName ?? park.name;

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    state: park.states ?? "",
    coordinates: getParkCoordinates(park),
    description: park.description ?? "No description available.",
    imageUrl: park.images?.find((image) => image.url)?.url,
  };
}

async function requestNpsParks(searchParams: URLSearchParams): Promise<NationalPark[]> {
  const response = await fetch(`${NPS_API_BASE_URL}/parks?${searchParams.toString()}`, {
    headers: getNpsHeaders(),
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    throw new Error(`NPS API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as NpsParksResponse;

  return (payload.data ?? [])
    .filter(isNationalPark)
    .map(mapNpsPark)
    .filter((park): park is NationalPark => Boolean(park))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getNationalParks(): Promise<NationalPark[]> {
  if (!hasNpsApiKey()) {
    return getFallbackParks();
  }

  try {
    return await requestNpsParks(
      new URLSearchParams({
        limit: NPS_PARKS_LIMIT,
        fields: "images",
      }),
    );
  } catch {
    return getFallbackParks();
  }
}

export async function getNationalParkById(id: string): Promise<NationalPark | undefined> {
  if (!hasNpsApiKey()) {
    return getFallbackParks().find((park) => park.id === id);
  }

  try {
    const parks = await requestNpsParks(
      new URLSearchParams({
        parkCode: id,
        limit: "1",
        fields: "images",
      }),
    );

    return parks[0];
  } catch {
    return getFallbackParks().find((park) => park.id === id);
  }
}
