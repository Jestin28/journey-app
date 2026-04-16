"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParks } from "@/components/providers/ParksProvider";
import { parks } from "@/lib/parks";

function shuffleArray<T>(items: T[]): T[] {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
  }

  return nextItems;
}

export default function Home() {
  const { visitedParkIds, wishlistParkIds } = useParks();
  const [suggestionSeed, setSuggestionSeed] = useState(0);
  const [heroOffsetY, setHeroOffsetY] = useState(0);
  const totalParks = parks.length;
  const visitedCount = visitedParkIds.length;
  const wishlistCount = wishlistParkIds.length;
  const progressPercentage = totalParks === 0 ? 0 : Math.round((visitedCount / totalParks) * 100);
  const progressMessage =
    progressPercentage < 20
      ? "Just getting started"
      : progressPercentage < 50
        ? "You're building momentum"
        : progressPercentage < 80
          ? "Halfway there"
          : "Almost completed your journey";
  const progressEmoji =
    progressPercentage < 20 ? "🌱" : progressPercentage < 50 ? "🚶" : progressPercentage < 80 ? "⛰️" : "✨";
  const suggestedParks = useMemo(() => {
    void suggestionSeed;
    const unvisitedParks = parks.filter((park) => !visitedParkIds.includes(park.id));
    const preferredParks = unvisitedParks.filter((park) => !wishlistParkIds.includes(park.id));
    const fallbackParks = unvisitedParks.filter((park) => wishlistParkIds.includes(park.id));

    const prioritizedParks = [...shuffleArray(preferredParks), ...shuffleArray(fallbackParks)];
    return prioritizedParks.slice(0, 3);
  }, [suggestionSeed, visitedParkIds, wishlistParkIds]);

  useEffect(() => {
    let animationFrameId = 0;

    const handleScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => {
        setHeroOffsetY(window.scrollY);
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section className="space-y-8">
      <div
        className="relative overflow-hidden rounded-b-3xl px-6 py-14 sm:px-10"
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translateY(${Math.min(heroOffsetY * 0.08, 24)}px) scale(1.08)`,
          }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80')",
            }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/65 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold tracking-tight text-white [text-shadow:0_1px_18px_rgba(0,0,0,0.55)]">
              Track Your National Park Journey
            </h2>
            <p className="text-base text-white/90 [text-shadow:0_1px_14px_rgba(0,0,0,0.45)]">
              Explore, plan, and complete your adventure
            </p>
          </div>

          <Link
            href="/parks"
            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm shadow-black/10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/95 active:translate-y-0 active:shadow-none"
          >
            Explore Parks
          </Link>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-medium text-slate-500">Total parks visited</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">{visitedCount}</p>
          {visitedCount === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              Start your journey by marking your first national park
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/60">
          <p className="text-sm font-medium text-slate-500">Total wishlist parks</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">{wishlistCount}</p>
          {wishlistCount === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              Add parks to your wishlist to plan your next adventure
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">Progress</p>
          <p className="text-sm font-medium text-slate-900">{progressPercentage}%</p>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          You&apos;ve visited {visitedCount} out of {totalParks} parks
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          <span className="mr-1" aria-hidden="true">
            {progressEmoji}
          </span>
          {progressMessage}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Suggested Parks</p>
            <p className="text-sm text-slate-600">Three parks to explore next.</p>
          </div>
          <button
            type="button"
            onClick={() => setSuggestionSeed((previous) => previous + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Refresh suggestions
          </button>
        </div>
        {suggestedParks.length === 0 ? (
          <p className="text-sm text-slate-600">You have visited all parks in this list.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {suggestedParks.map((park) => (
              <Link
                key={park.id}
                href={`/parks/${park.id}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
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
