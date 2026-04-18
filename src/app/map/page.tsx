"use client";

import dynamic from "next/dynamic";
import { useParks } from "@/components/providers/ParksProvider";

const ParksMap = dynamic(
  () => import("@/components/parks/ParksMap").then((module) => module.ParksMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Loading map...
      </div>
    ),
  },
);

export default function MapPage() {
  const { isParksLoading, parks, parksError } = useParks();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-4xl font-semibold tracking-tight text-slate-900">Park Map</h2>
        <p className="text-slate-600">View all parks and track your progress by status.</p>
        <p className="text-sm text-slate-500">
          {isParksLoading
            ? "Loading parks from the National Park Service..."
            : parksError || `${parks.length} parks loaded from the National Park Service`}
        </p>
      </div>
      {parks.length > 0 ? (
        <ParksMap parks={parks} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          {isParksLoading ? "Loading map..." : parksError || "No parks available."}
        </div>
      )}
    </section>
  );
}
