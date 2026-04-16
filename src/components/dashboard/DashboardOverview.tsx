"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParks } from "@/components/providers/ParksProvider";
import type { NationalPark } from "@/types";

type DashboardOverviewProps = {
  totalParks: number;
  parks: NationalPark[];
};

type SortMode = "random" | "state";

function getSeededWeight(value: string, seed: number) {
  let hash = seed;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function DashboardOverview({ totalParks, parks }: DashboardOverviewProps) {
  const { visitedParkIds, wishlistParkIds } = useParks();
  const [sortMode, setSortMode] = useState<SortMode>("random");
  const [randomSeed, setRandomSeed] = useState(() => Date.now());

  const visitedCount = visitedParkIds.length;
  const wishlistCount = wishlistParkIds.length;
  const progressPercentage = totalParks === 0 ? 0 : Math.round((visitedCount / totalParks) * 100);
  const suggestions = useMemo(() => {
    const nonVisitedParks = parks.filter((park) => !visitedParkIds.includes(park.id));

    const sortedParks =
      sortMode === "state"
        ? [...nonVisitedParks].sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name))
        : [...nonVisitedParks].sort(
            (a, b) => getSeededWeight(a.id, randomSeed) - getSeededWeight(b.id, randomSeed),
          );

    return sortedParks.slice(0, 5);
  }, [parks, randomSeed, sortMode, visitedParkIds]);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-slate-600">Track your national park goals.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Parks Visited</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{visitedCount}</p>
          {visitedCount === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              Start your journey by marking your first national park
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Wishlist Parks</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{wishlistCount}</p>
          {wishlistCount === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              Add parks to your wishlist to plan your next adventure
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-slate-500">Progress</p>
          <p className="text-sm font-medium text-slate-900">{progressPercentage}%</p>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          You&apos;ve visited {visitedCount} out of {totalParks} parks
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Suggested Parks</p>
            <p className="text-sm text-slate-600">3-5 parks you have not visited yet.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSortMode("random")}
              className={`rounded-md px-3 py-1.5 text-sm ${
                sortMode === "random"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Random
            </button>
            <button
              type="button"
              onClick={() => setSortMode("state")}
              className={`rounded-md px-3 py-1.5 text-sm ${
                sortMode === "state"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              By State
            </button>
            {sortMode === "random" ? (
              <button
                type="button"
                onClick={() => setRandomSeed(Date.now())}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
              >
                Shuffle
              </button>
            ) : null}
          </div>
        </div>

        {suggestions.length === 0 ? (
          <p className="text-sm text-slate-600">You have visited all parks in this list.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((park) => (
              <Link
                key={park.id}
                href={`/parks/${park.id}`}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
              >
                <p className="font-medium text-slate-900">{park.name}</p>
                <p className="text-sm text-slate-600">{park.state}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
