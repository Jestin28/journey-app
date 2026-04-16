"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useParks } from "@/components/providers/ParksProvider";
import { getParkImageUrl } from "@/lib/parkImages";
import type { NationalPark } from "@/types";

type ParkCardProps = {
  park: NationalPark;
};

const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&q=80";

export function ParkCard({ park }: ParkCardProps) {
  const router = useRouter();
  const { addToVisited, addToWishlist, isInWishlist, isVisited } = useParks();
  const [hasImageError, setHasImageError] = useState(false);
  const visited = isVisited(park.id);
  const wishlist = isInWishlist(park.id);
  const imageUrl = useMemo(() => {
    if (hasImageError) {
      return FALLBACK_IMAGE_URL;
    }

    return getParkImageUrl(park.id);
  }, [hasImageError, park.id]);

  const statusLabel = visited ? "Visited" : wishlist ? "Wishlist" : "Not added";
  const statusClassName = visited
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : wishlist
      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      : "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

  const parkHref = `/parks/${park.id}`;

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => router.push(parkHref)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(parkHref);
        }
      }}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border shadow-sm shadow-slate-200/60 transition-all duration-300 ease-out will-change-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 ${
        visited
          ? "border-emerald-200/90 bg-emerald-50/20"
          : wishlist
            ? "border-blue-200/90 bg-blue-50/20"
            : "border-slate-200/80 bg-white"
      }`}
    >
      <div className="pointer-events-none absolute right-3 top-3 z-20 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        {!visited ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              addToVisited(park.id);
            }}
            className="pointer-events-auto rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all duration-200 ease-out hover:bg-white active:scale-[0.98]"
          >
            Visited
          </button>
        ) : null}
        {!wishlist ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              addToWishlist(park.id);
            }}
            className="pointer-events-auto rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all duration-200 ease-out hover:bg-white active:scale-[0.98]"
          >
            Wishlist
          </button>
        ) : null}
      </div>

      <div className="relative h-44 w-full">
        <Image
          src={imageUrl}
          alt={park.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          onError={() => setHasImageError(true)}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <span
            key={statusLabel}
            className={`animate-fade-in-soft inline-flex rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm transition-colors duration-200 ${statusClassName}`}
          >
            {statusLabel}
          </span>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">{park.name}</h3>
          <p className="text-sm font-medium text-white/85">{park.state}</p>
        </div>
      </div>
    </article>
  );
}
