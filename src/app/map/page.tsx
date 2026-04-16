"use client";

import dynamic from "next/dynamic";
import { parks } from "@/lib/parks";

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
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-4xl font-semibold tracking-tight text-slate-900">Park Map</h2>
        <p className="text-slate-600">View all parks and track your progress by status.</p>
      </div>
      <ParksMap parks={parks} />
    </section>
  );
}
