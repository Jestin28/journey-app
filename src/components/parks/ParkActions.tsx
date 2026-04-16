"use client";

import { Button } from "@/components/ui";
import { useParks } from "@/components/providers/ParksProvider";

type ParkActionsProps = {
  parkId: string;
};

export function ParkActions({ parkId }: ParkActionsProps) {
  const {
    addToVisited,
    addToWishlist,
    isInWishlist,
    isVisited,
    removeFromVisited,
    removeFromWishlist,
  } = useParks();

  const visited = isVisited(parkId);
  const inWishlist = isInWishlist(parkId);
  const statusLabel = visited ? "Visited" : inWishlist ? "In Wishlist" : "Not added";
  const statusClassName = visited
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : inWishlist
      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      : "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

  return (
    <div className="space-y-3">
      <span
        key={statusLabel}
        className={`animate-fade-in-soft inline-flex rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 ${statusClassName}`}
      >
        {statusLabel}
      </span>

      <div className="animate-fade-in-soft flex flex-wrap gap-3">
        {visited ? (
          <Button variant="secondary" onClick={() => removeFromVisited(parkId)}>
            Remove from Visited
          </Button>
        ) : (
          <Button onClick={() => addToVisited(parkId)}>Mark as Visited</Button>
        )}

        {!visited ? (
          inWishlist ? (
            <Button variant="secondary" onClick={() => removeFromWishlist(parkId)}>
              Remove from Wishlist
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => addToWishlist(parkId)}>
              Add to Wishlist
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}
