"use client";

import { useParks } from "@/components/providers/ParksProvider";

type ParkStatusBadgeProps = {
  parkId: string;
};

export function ParkStatusBadge({ parkId }: ParkStatusBadgeProps) {
  const { isInWishlist, isVisited } = useParks();
  const visited = isVisited(parkId);
  const wishlist = isInWishlist(parkId);

  const label = visited ? "Visited" : wishlist ? "In Wishlist" : "Not added";
  const className = visited
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : wishlist
      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      : "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${className}`}>{label}</span>;
}
