"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ParkCard } from "@/components/parks";
import { useParks } from "@/components/providers/ParksProvider";
import type { NationalPark } from "@/types";

type ParkFilter = "all" | "visited" | "wishlist" | "not-added";
type ParksTab = "explore" | "milestones";
type MilestoneStatus = "visited" | "available" | "locked";

const TOTAL_MILESTONES: number = 63;
const TIMELINE_VIEWBOX_WIDTH = 1000;
const TIMELINE_START_Y = 56;
const TIMELINE_LEVEL_SPACING = 152;
const TIMELINE_END_PADDING = 96;
const TIMELINE_LEFT_X = 420;
const TIMELINE_RIGHT_X = 580;

type TimelineNodePosition = {
  x: number;
  y: number;
};

function buildTimelinePath(positions: TimelineNodePosition[]): string {
  if (positions.length === 0) {
    return "";
  }

  const [firstPosition, ...remainingPositions] = positions;

  return remainingPositions.reduce((path, position, index) => {
    const previousPosition = positions[index];
    const controlOffsetY = (position.y - previousPosition.y) * 0.46;

    return `${path} C ${previousPosition.x} ${previousPosition.y + controlOffsetY}, ${position.x} ${
      position.y - controlOffsetY
    }, ${position.x} ${position.y}`;
  }, `M ${firstPosition.x} ${firstPosition.y}`);
}

type ParksPageClientProps = {
  parks: NationalPark[];
};

export function ParksPageClient({ parks }: ParksPageClientProps) {
  const { isInWishlist, isVisited } = useParks();
  const [activeTab, setActiveTab] = useState<ParksTab>("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ParkFilter>("all");

  const filteredParks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return parks.filter((park) => {
      const matchesSearch = park.name.toLowerCase().includes(normalizedQuery);
      if (!matchesSearch) {
        return false;
      }

      const visited = isVisited(park.id);
      const wishlist = isInWishlist(park.id);

      if (activeFilter === "visited") {
        return visited;
      }

      if (activeFilter === "wishlist") {
        return wishlist;
      }

      if (activeFilter === "not-added") {
        return !visited && !wishlist;
      }

      return true;
    });
  }, [activeFilter, isInWishlist, isVisited, parks, searchQuery]);

  const milestones = useMemo(() => {
    let canUnlockLevel = true;
    let currentMilestoneAssigned = false;

    return Array.from({ length: TOTAL_MILESTONES }, (_, index) => {
      const level = index + 1;
      const park = parks[index] ?? null;
      const levelName = park?.name ?? `Future National Park ${level}`;
      const levelVisited = park ? isVisited(park.id) : false;
      const isCurrentMilestone = !levelVisited && canUnlockLevel && !currentMilestoneAssigned;

      let status: MilestoneStatus = "locked";
      if (levelVisited) {
        status = "visited";
      } else if (isCurrentMilestone) {
        status = "available";
      }

      if (isCurrentMilestone) {
        currentMilestoneAssigned = true;
      }

      canUnlockLevel = canUnlockLevel && levelVisited;

      return {
        level,
        name: levelName,
        status,
        isCurrent: isCurrentMilestone,
      };
    });
  }, [isVisited, parks]);

  const completedMilestones = milestones.filter((milestone) => milestone.status === "visited").length;
  const milestoneProgress =
    TOTAL_MILESTONES === 0 ? 0 : Math.round((completedMilestones / TOTAL_MILESTONES) * 100);
  const timelineNodePositions = useMemo(
    () =>
      milestones.map((_, index) => ({
        x: index % 2 === 0 ? TIMELINE_LEFT_X : TIMELINE_RIGHT_X,
        y: TIMELINE_START_Y + index * TIMELINE_LEVEL_SPACING,
      })),
    [milestones],
  );
  const timelinePath = useMemo(() => buildTimelinePath(timelineNodePositions), [timelineNodePositions]);
  const timelineHeight =
    timelineNodePositions.length === 0
      ? TIMELINE_START_Y + TIMELINE_END_PADDING
      : timelineNodePositions[timelineNodePositions.length - 1].y + TIMELINE_END_PADDING;

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-4xl font-semibold tracking-tight text-slate-900">National Parks</h2>
        <p className="max-w-2xl text-base text-slate-600">
          Explore iconic U.S. parks and plan your next adventure.
        </p>
        <p className="text-sm text-slate-500">{parks.length} parks loaded from the National Park Service</p>
      </div>

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {[
          { id: "explore", label: "Explore" },
          { id: "milestones", label: "Milestones" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as ParksTab)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "explore" ? (
        <>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search parks by name..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 sm:max-w-sm"
              />
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "All" },
                  { id: "visited", label: "Visited" },
                  { id: "wishlist", label: "Wishlist" },
                  { id: "not-added", label: "Not added" },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id as ParkFilter)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      activeFilter === filter.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredParks.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-sm text-slate-600 shadow-sm shadow-slate-200/60">
              No parks match your current search and filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredParks.map((park) => (
                <ParkCard key={park.id} park={park} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Milestone Progress</p>
              <p className="text-sm font-medium text-slate-900">{milestoneProgress}%</p>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-lime-400 to-cyan-500 transition-all duration-700 ease-out"
                style={{ width: `${milestoneProgress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Completed {completedMilestones} out of {TOTAL_MILESTONES} levels
            </p>
          </div>

          <div className="relative overflow-hidden sm:overflow-visible" style={{ height: timelineHeight }}>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              viewBox={`0 0 ${TIMELINE_VIEWBOX_WIDTH} ${timelineHeight}`}
            >
              <defs>
                <linearGradient id="milestone-timeline-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="52%" stopColor="#84cc16" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path
                d={timelinePath}
                fill="none"
                pathLength={100}
                stroke="#e2e8f0"
                strokeLinecap="round"
                strokeWidth={10}
              />
              <path
                d={timelinePath}
                fill="none"
                pathLength={100}
                stroke="url(#milestone-timeline-gradient)"
                strokeDasharray="100"
                strokeDashoffset={100 - milestoneProgress}
                strokeLinecap="round"
                strokeWidth={8}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>

            {milestones.map((milestone, index) => {
              const position = timelineNodePositions[index];
              const nodeXPercent = (position.x / TIMELINE_VIEWBOX_WIDTH) * 100;
              const cardPositionClassName =
                position.x < TIMELINE_VIEWBOX_WIDTH / 2
                  ? "right-[calc(100%-var(--node-x)+2.25rem)] max-sm:right-0"
                  : "left-[calc(var(--node-x)+2.25rem)] max-sm:left-0";
              const nodeStyle = {
                left: `${nodeXPercent}%`,
                top: position.y,
              };
              const cardStyle = {
                "--node-x": `${nodeXPercent}%`,
                "--node-y": `${position.y}px`,
              } as CSSProperties;
              const cardClassName =
                milestone.status === "visited"
                  ? "border-emerald-100 bg-emerald-50/35"
                  : milestone.status === "available"
                    ? "border-slate-200 bg-white/95"
                    : "border-slate-200 bg-slate-100/80 opacity-60";
              const nodeClassName =
                milestone.status === "visited"
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : milestone.status === "available"
                    ? "border-slate-300 bg-white text-slate-700"
                    : "border-slate-300 bg-slate-300 text-slate-500 opacity-80";

              return (
                <div key={milestone.level}>
                  <article
                    className={`animate-node-fade-in absolute top-[var(--node-y)] w-[min(34%,18rem)] -translate-y-1/2 rounded-xl border p-3.5 shadow-sm shadow-slate-200/30 transition duration-200 hover:scale-[1.01] max-sm:left-0 max-sm:right-0 max-sm:top-[calc(var(--node-y)+2.75rem)] max-sm:w-auto max-sm:translate-y-0 ${cardPositionClassName} ${cardClassName} ${
                      milestone.isCurrent ? "ring-1 ring-amber-300/70" : ""
                    }`}
                    style={{
                      ...cardStyle,
                      animationDelay: `${index * 22}ms`,
                    }}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Level {milestone.level}
                    </p>
                    <h3 className="mt-1 font-medium text-slate-900">{milestone.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {milestone.status === "visited"
                        ? "Visited"
                        : milestone.status === "available"
                          ? "Available"
                          : "Locked"}
                    </p>
                  </article>

                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={nodeStyle}
                  >
                    <div
                      className={`animate-node-fade-in flex h-11 w-11 items-center justify-center rounded-full border text-xs font-semibold shadow-md transition duration-200 hover:scale-105 ${
                        nodeClassName
                      } ${
                        milestone.isCurrent
                          ? "scale-110 ring-4 ring-amber-300/50 shadow-[0_0_0_8px_rgba(251,191,36,0.14)]"
                          : ""
                      }`}
                      style={{ animationDelay: `${index * 22 + 80}ms` }}
                    >
                      {milestone.status === "locked" ? "\uD83D\uDD12" : milestone.level}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
