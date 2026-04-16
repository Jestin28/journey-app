"use client";

import { FormEvent, useMemo, useState } from "react";
import { getParkImageUrl } from "@/lib/parkImages";
import { parks } from "@/lib/parks";
import type { NationalPark } from "@/types";

type ItineraryDay = {
  label: string;
  title: string;
  activities: string[];
};

type TripItinerary = {
  id: string;
  parkId: string;
  title: string;
  parkName: string;
  dateRange: string;
  days: ItineraryDay[];
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

function getSavedTripImageUrl(trip: TripItinerary): string {
  return getParkImageUrl(trip.parkId);
}

function buildDays(park: NationalPark, tripLength: number, theme: "classic" | "active" | "relaxed"): ItineraryDay[] {
  const dayTemplates = {
    classic: [
      {
        title: "Arrival and orientation",
        activities: [
          `Arrive near ${park.name} and check current park conditions.`,
          "Stop by the visitor center for maps and ranger recommendations.",
          "End with an easy scenic overlook or short nature walk.",
        ],
      },
      {
        title: "Signature park day",
        activities: [
          `Spend the morning exploring a top trail or landmark in ${park.name}.`,
          "Pack lunch and leave time for overlooks, photos, and rest stops.",
          "Return before dark and review tomorrow's route.",
        ],
      },
      {
        title: "Scenic wrap-up",
        activities: [
          "Choose a slower drive, picnic area, or wildlife viewing stop.",
          `Revisit a favorite viewpoint in ${park.state}.`,
          "Depart with extra buffer for traffic and park entrance lines.",
        ],
      },
    ],
    active: [
      {
        title: "Trail warm-up",
        activities: [
          `Start with a moderate route in ${park.name}.`,
          "Check water, layers, and trail timing before heading out.",
          "Add a sunset viewpoint if conditions are clear.",
        ],
      },
      {
        title: "Full exploration day",
        activities: [
          "Begin early with the longest planned hike or scenic loop.",
          "Break the day into morning and afternoon zones to reduce backtracking.",
          "Keep the evening flexible for recovery and dinner nearby.",
        ],
      },
      {
        title: "Second-look route",
        activities: [
          "Pick a shorter trail, ranger talk, or photography stop.",
          `Use ${park.description.slice(0, 90).trim()}${park.description.length > 90 ? "..." : ""} as inspiration for one final stop.`,
          "Wrap up with a low-effort overlook before departure.",
        ],
      },
    ],
    relaxed: [
      {
        title: "Easy arrival",
        activities: [
          `Arrive at ${park.name} without packing the first day too tightly.`,
          "Visit the main visitor center or a nearby scenic pullout.",
          "Save the best-known route for tomorrow.",
        ],
      },
      {
        title: "Flexible park loop",
        activities: [
          "Choose a scenic drive or accessible trail for the morning.",
          "Take a long lunch break near a picnic area or gateway town.",
          "Finish with golden-hour views if weather cooperates.",
        ],
      },
      {
        title: "Slow final morning",
        activities: [
          "Return to one favorite spot before crowds build.",
          "Leave time for a gift shop, stamp, or ranger recommendation.",
          "Depart after a low-stress final stop.",
        ],
      },
    ],
  };

  return Array.from({ length: tripLength }, (_, index) => {
    const template = dayTemplates[theme][index % dayTemplates[theme].length];

    return {
      label: `Day ${index + 1}`,
      title: template.title,
      activities: template.activities,
    };
  });
}

function generateItineraries(park: NationalPark, startDate: string, endDate: string): TripItinerary[] {
  const tripLength = getTripLength(startDate, endDate);
  const dateRange = formatDateRange(startDate, endDate);

  return [
    {
      id: `${park.id}-${startDate}-${endDate}-classic`,
      parkId: park.id,
      title: "Classic Highlights",
      parkName: park.name,
      dateRange,
      days: buildDays(park, tripLength, "classic"),
    },
    {
      id: `${park.id}-${startDate}-${endDate}-active`,
      parkId: park.id,
      title: "Trail-Focused Plan",
      parkName: park.name,
      dateRange,
      days: buildDays(park, tripLength, "active"),
    },
    {
      id: `${park.id}-${startDate}-${endDate}-relaxed`,
      parkId: park.id,
      title: "Relaxed Scenic Trip",
      parkName: park.name,
      dateRange,
      days: buildDays(park, tripLength, "relaxed"),
    },
  ];
}

export default function PlanTripPage() {
  const [selectedParkId, setSelectedParkId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [itineraries, setItineraries] = useState<TripItinerary[]>([]);
  const [savedTrips, setSavedTrips] = useState<TripItinerary[]>([]);
  const [expandedItineraryIds, setExpandedItineraryIds] = useState<string[]>([]);

  const selectedPark = useMemo(
    () => parks.find((park) => park.id === selectedParkId) ?? null,
    [selectedParkId],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPark) {
      setErrorMessage("Choose a national park.");
      return;
    }

    const parsedStartDate = parseDateValue(startDate);
    const parsedEndDate = parseDateValue(endDate);

    if (!parsedStartDate || !parsedEndDate) {
      setErrorMessage("Choose a start date and end date.");
      return;
    }

    if (parsedEndDate < parsedStartDate) {
      setErrorMessage("End date cannot be before start date.");
      return;
    }

    setErrorMessage("");
    setExpandedItineraryIds([]);
    setItineraries(generateItineraries(selectedPark, startDate, endDate));
  }

  function handleSaveTrip(itinerary: TripItinerary) {
    setSavedTrips((previousTrips) => {
      if (previousTrips.some((trip) => trip.id === itinerary.id)) {
        return previousTrips;
      }

      return [...previousTrips, itinerary];
    });
  }

  function handleToggleItinerary(itineraryId: string) {
    setExpandedItineraryIds((previousIds) =>
      previousIds.includes(itineraryId)
        ? previousIds.filter((id) => id !== itineraryId)
        : [...previousIds, itineraryId],
    );
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-4xl font-semibold tracking-tight text-slate-900">Plan Trip</h2>
        <p className="max-w-2xl text-base text-slate-600">
          Choose a park and travel dates to draft a simple day-by-day plan.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60"
      >
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">National park</span>
            <select
              value={selectedParkId}
              onChange={(event) => setSelectedParkId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Select a park</option>
              {parks.map((park) => (
                <option key={park.id} value={park.id}>
                  {park.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">End date</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </label>
        </div>

        {errorMessage ? <p className="mt-4 text-sm font-medium text-red-600">{errorMessage}</p> : null}

        <button
          type="submit"
          className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Generate Itineraries
        </button>
      </form>

      {itineraries.length > 0 ? (
        <div className="space-y-5">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Itinerary Options</h3>
            <p className="text-sm text-slate-600">Choose the plan that fits your pace.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-4 py-3 text-sm shadow-sm shadow-slate-200/60">
            <span className="font-medium text-slate-900">{itineraries[0].parkName}</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-flex" />
            <span className="text-slate-600">{itineraries[0].dateRange}</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-flex" />
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
              {getDurationLabel(itineraries[0].days.length)}
            </span>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-3">
            {itineraries.map((itinerary, index) => {
              const isSaved = savedTrips.some((trip) => trip.id === itinerary.id);
              const isExpanded = expandedItineraryIds.includes(itinerary.id);
              const isRecommended = index === 1;
              const firstDay = itinerary.days[0];
              const imageUrl = getParkImageUrl(itinerary.parkId);

              return (
                <article
                  key={itinerary.id}
                  className={`group flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isRecommended
                      ? "border-slate-900 shadow-xl shadow-slate-200/80 lg:scale-[1.03]"
                      : "border-slate-200/80 shadow-slate-200/60"
                  }`}
                >
                  <div
                    className="relative h-52 bg-cover bg-center"
                    style={{
                      backgroundImage: `url("${imageUrl}")`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
                    <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                      {isRecommended ? (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
                          Recommended
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-800 shadow-sm backdrop-blur">
                          {itinerary.parkName}
                        </span>
                      )}
                      <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
                        {getDurationLabel(itinerary.days.length)}
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-sm font-medium text-white/80">{itinerary.dateRange}</p>
                      <h4 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                        {itinerary.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {firstDay.label} Preview
                      </p>
                      <p className="mt-1 font-medium text-slate-900">{firstDay.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{firstDay.activities[0]}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleItinerary(itinerary.id)}
                      className="mt-4 text-left text-sm font-medium text-slate-900 transition hover:text-slate-600"
                    >
                      {isExpanded ? "Hide full itinerary" : "View full itinerary"}
                    </button>

                    {isExpanded ? (
                      <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                        {itinerary.days.map((day) => (
                          <div key={`${itinerary.id}-${day.label}`} className="space-y-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              {day.label}
                            </p>
                            <p className="text-sm font-medium text-slate-900">{day.title}</p>
                            <p className="text-sm leading-6 text-slate-600">{day.activities[0]}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleSaveTrip(itinerary)}
                      className={`mt-5 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                        isSaved
                          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                          : "bg-slate-900 text-white shadow-sm shadow-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {isSaved ? "✓ Plan Selected" : "Choose Plan"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Saved Trips</h3>
          <p className="text-sm text-slate-600">Saved trips stay here until refresh.</p>
        </div>

        {savedTrips.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm shadow-slate-200/60">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <svg
                aria-hidden="true"
                className="h-11 w-11 text-slate-500"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M14 34c4-10 10-16 20-20M18 16h16v16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />
                <path
                  d="M12 38h24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
            </div>
            <p className="mt-4 text-base font-medium text-slate-900">Start planning your first adventure</p>
            <p className="mt-1 text-sm text-slate-600">Choose a park, generate plans, and save your favorite.</p>
          </div>
        ) : (
          <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-3 sm:-mx-6 sm:px-6">
            {savedTrips.map((trip) => (
              <article
                key={trip.id}
                className="min-w-[17rem] overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60"
              >
                <div
                  className="h-28 bg-cover bg-center"
                  style={{
                    backgroundImage: `url("${getSavedTripImageUrl(trip)}")`,
                  }}
                />
                <div className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {getDurationLabel(trip.days.length)}
                  </p>
                  <h4 className="mt-1 font-semibold text-slate-900">{trip.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">{trip.parkName}</p>
                  <p className="mt-3 text-sm font-medium text-slate-700">{trip.dateRange}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
