import type { NationalPark } from "@/types";

type NpsImage = {
  url?: string;
};

type NpsActivity = {
  name?: string;
};

type NpsEntranceFee = {
  cost?: string;
  title?: string;
  description?: string;
};

type NpsOperatingHours = {
  name?: string;
  description?: string;
  standardHours?: Record<string, string>;
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
  activities?: NpsActivity[];
  entranceFees?: NpsEntranceFee[];
  operatingHours?: NpsOperatingHours[];
};

type NpsParksResponse = {
  data?: NpsPark[];
};

type NpsAlert = {
  title?: string;
  description?: string;
  category?: string;
};

type NpsAlertsResponse = {
  data?: NpsAlert[];
};

export type ParkItineraryDay = {
  day: number;
  title: string;
  activities: string[];
  tips: string[];
};

export type ParkItinerary = {
  id: string;
  parkId: string;
  parkName: string;
  imageUrl?: string;
  title: string;
  duration: string;
  dateRange: string;
  fees: string[];
  alerts: string[];
  days: ParkItineraryDay[];
};

const NPS_API_BASE_URL = "https://developer.nps.gov/api/v1";
const NPS_PARKS_LIMIT = "500";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

async function requestNpsParkDetail(parkCode: string): Promise<NpsPark | null> {
  const response = await fetch(
    `${NPS_API_BASE_URL}/parks?${new URLSearchParams({
      parkCode,
      limit: "1",
      fields: "images,activities,entranceFees,operatingHours",
    }).toString()}`,
    {
      headers: getNpsHeaders(),
      next: { revalidate: 60 * 60 * 24 },
    },
  );

  if (!response.ok) {
    throw new Error(`NPS park detail request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as NpsParksResponse;
  return payload.data?.[0] ?? null;
}

async function requestNpsAlerts(parkCode: string): Promise<NpsAlert[]> {
  const response = await fetch(
    `${NPS_API_BASE_URL}/alerts?${new URLSearchParams({
      parkCode,
      limit: "10",
    }).toString()}`,
    {
      headers: getNpsHeaders(),
      next: { revalidate: 60 * 30 },
    },
  );

  if (!response.ok) {
    throw new Error(`NPS alerts request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as NpsAlertsResponse;
  return payload.data ?? [];
}

function parseDateValue(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTripLength(startDate: string, endDate: string): number {
  const parsedStartDate = parseDateValue(startDate);
  const parsedEndDate = parseDateValue(endDate);

  if (!parsedStartDate || !parsedEndDate) {
    return 0;
  }

  return Math.floor((parsedEndDate.getTime() - parsedStartDate.getTime()) / DAY_IN_MS) + 1;
}

function formatDateRange(startDate: string, endDate: string): string {
  const parsedStartDate = parseDateValue(startDate);
  const parsedEndDate = parseDateValue(endDate);

  if (!parsedStartDate || !parsedEndDate) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${formatter.format(parsedStartDate)} - ${formatter.format(parsedEndDate)}`;
}

function getDurationLabel(dayCount: number): string {
  return `${dayCount} ${dayCount === 1 ? "Day" : "Days"}`;
}

function getPrimaryFeeText(park: NpsPark): string[] {
  const fees = (park.entranceFees ?? [])
    .filter((fee) => fee.title || fee.cost)
    .slice(0, 3)
    .map((fee) => {
      const cost = fee.cost && fee.cost !== "0.00" ? `$${fee.cost}` : "Free";
      return `${fee.title ?? "Entrance fee"}: ${cost}`;
    });

  return fees.length > 0 ? fees : ["Fee details were unclear. Check the official park page before arrival."];
}

function getAlertText(alerts: NpsAlert[]): string[] {
  const alertText = alerts
    .filter((alert) => alert.title)
    .slice(0, 3)
    .map((alert) => `${alert.category ? `${alert.category}: ` : ""}${alert.title}`);

  return alertText.length > 0 ? alertText : [];
}

function getOpenHoursTip(park: NpsPark): string {
  const primaryHours = park.operatingHours?.find((hours) => hours.description || hours.name);

  if (!primaryHours) {
    return "Operating hours were unclear. Check current NPS hours before leaving.";
  }

  return primaryHours.description
    ? primaryHours.description.slice(0, 150)
    : `${primaryHours.name} hours can vary by season. Confirm same-day hours before arrival.`;
}

function getActivityNames(park: NpsPark, alerts: NpsAlert[]): string[] {
  const blockedTerms = ["closed", "closure", "limited", "unavailable"];
  const alertText = alerts
    .map((alert) => `${alert.title ?? ""} ${alert.description ?? ""}`)
    .join(" ")
    .toLowerCase();
  const priorityActivities = [
    "Hiking",
    "Scenic Driving",
    "Wildlife Watching",
    "Birdwatching",
    "Photography",
    "Stargazing",
    "Biking",
    "Boating",
    "Fishing",
    "Guided Tours",
    "Ranger Programs",
    "Picnicking",
  ];

  const activityNames = (park.activities ?? [])
    .map((activity) => activity.name)
    .filter((name): name is string => Boolean(name))
    .filter((name) => !blockedTerms.some((term) => name.toLowerCase().includes(term)))
    .filter((name) => !alertText.includes(name.toLowerCase()))
    .sort((a, b) => {
      const aPriority = priorityActivities.indexOf(a);
      const bPriority = priorityActivities.indexOf(b);

      if (aPriority === -1 && bPriority === -1) {
        return a.localeCompare(b);
      }

      if (aPriority === -1) {
        return 1;
      }

      if (bPriority === -1) {
        return -1;
      }

      return aPriority - bPriority;
    })
    .slice(0, 12);

  return activityNames.length > 0 ? activityNames : priorityActivities;
}

function pickActivities(activityNames: string[], offset: number): string[] {
  const fallbackActivities = [
    "Visitor center orientation",
    "Scenic overlooks",
    "Short nature walk",
    "Photography stops",
    "Ranger recommendations",
    "Picnic or rest stop",
  ];
  const sourceActivities = activityNames.length >= 3 ? activityNames : fallbackActivities;

  return Array.from({ length: 3 }, (_, index) => sourceActivities[(offset + index) % sourceActivities.length]);
}

function buildDayActivities(park: NpsPark, activityNames: string[], day: number, totalDays: number, offset: number) {
  const selectedActivities = pickActivities(activityNames, offset);

  if (day === 1) {
    return [
      `Arrive at ${park.fullName ?? park.name} and check current conditions.`,
      `Start with ${selectedActivities[0].toLowerCase()} at an easy pace.`,
      `Add ${selectedActivities[1].toLowerCase()} if time and weather are favorable.`,
    ];
  }

  if (day === totalDays) {
    return [
      `Return to a favorite area for ${selectedActivities[0].toLowerCase()}.`,
      `Keep ${selectedActivities[1].toLowerCase()} optional for a lighter final morning.`,
      "Leave buffer for packing, parking, and the drive out.",
    ];
  }

  return [
    `Make ${selectedActivities[0].toLowerCase()} the main focus of the day.`,
    `Pair it with ${selectedActivities[1].toLowerCase()} before peak afternoon crowds.`,
    `Use ${selectedActivities[2].toLowerCase()} as a flexible backup if conditions change.`,
  ];
}

function buildDayTips(park: NpsPark, day: number, totalDays: number, hasAlerts: boolean): string[] {
  const baseTips = [
    day === 1 ? "Arrive early enough to handle entrance lines and parking." : "Start early for easier parking.",
    "Carry layers, water, and sun protection; weather can shift quickly.",
    hasAlerts ? "Review active alerts before committing to the route." : getOpenHoursTip(park),
  ];

  if (day === totalDays) {
    return [
      "Keep the final day light and avoid long routes before departure.",
      "Save time for traffic, shuttle waits, or road construction.",
      baseTips[2],
    ];
  }

  return baseTips;
}

function buildItineraryDays(
  park: NpsPark,
  totalDays: number,
  variantOffset: number,
  hasAlerts: boolean,
  alerts: NpsAlert[],
): ParkItineraryDay[] {
  const activityNames = getActivityNames(park, alerts);

  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const title =
      day === 1
        ? "Arrival and easy orientation"
        : day === totalDays
          ? "Light wrap-up and departure"
          : "Main park exploration";

    return {
      day,
      title,
      activities: buildDayActivities(park, activityNames, day, totalDays, index + variantOffset),
      tips: buildDayTips(park, day, totalDays, hasAlerts),
    };
  });
}

export async function generateParkItineraries(
  parkCode: string,
  startDate: string,
  endDate: string,
): Promise<ParkItinerary[]> {
  const totalDays = Math.max(getTripLength(startDate, endDate), 1);
  const dateRange = formatDateRange(startDate, endDate);

  let park: NpsPark | null = null;
  let alerts: NpsAlert[] = [];

  if (hasNpsApiKey()) {
    try {
      park = (await requestNpsParkDetail(parkCode)) ?? park;
      alerts = await requestNpsAlerts(parkCode);
    } catch {
      alerts = [];
    }
  }

  if (!park?.parkCode || !(park.fullName ?? park.name)) {
    throw new Error("Park not found");
  }

  const fees = getPrimaryFeeText(park);
  const alertText = getAlertText(alerts);
  const hasAlerts = alertText.length > 0;
  const parkName = park.fullName ?? park.name ?? "Selected park";
  const imageUrl = park.images?.find((image) => image.url)?.url;

  return [
    { title: "Classic Highlights", offset: 0 },
    { title: "Trail-Focused Plan", offset: 2 },
    { title: "Relaxed Scenic Trip", offset: 4 },
  ].map((variant) => ({
    id: `${park.parkCode}-${startDate}-${endDate}-${variant.title.toLowerCase().replace(/\s+/g, "-")}`,
    parkId: park.parkCode ?? parkCode,
    parkName,
    imageUrl,
    title: variant.title,
    duration: getDurationLabel(totalDays),
    dateRange,
    fees,
    alerts: alertText,
    days: buildItineraryDays(park, totalDays, variant.offset, hasAlerts, alerts),
  }));
}

export async function getNationalParks(): Promise<NationalPark[]> {
  if (!hasNpsApiKey()) {
    throw new Error("NPS_API_KEY is required to load parks.");
  }

  return requestNpsParks(
    new URLSearchParams({
      limit: NPS_PARKS_LIMIT,
      fields: "images",
    }),
  );
}

export async function getNationalParkById(id: string): Promise<NationalPark | undefined> {
  if (!hasNpsApiKey()) {
    return undefined;
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
    return undefined;
  }
}
