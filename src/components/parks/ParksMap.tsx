"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { useParks } from "@/components/providers/ParksProvider";
import type { NationalPark } from "@/types";

type ParksMapProps = {
  parks: NationalPark[];
};

const defaultCenter: [number, number] = [39.8283, -98.5795];

function getMarkerColor(isVisited: boolean, isInWishlist: boolean) {
  if (isVisited) {
    return "#16a34a";
  }

  if (isInWishlist) {
    return "#eab308";
  }

  return "#64748b";
}

export function ParksMap({ parks }: ParksMapProps) {
  const { isInWishlist, isVisited } = useParks();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="font-semibold text-slate-900">Map View</h3>
        <p className="text-sm text-slate-600">
          Green: visited, Yellow: wishlist, Gray: not added
        </p>
      </div>
      <MapContainer
        center={defaultCenter}
        zoom={4}
        scrollWheelZoom={false}
        className="h-[420px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {parks.map((park) => {
          const visited = isVisited(park.id);
          const wishlist = isInWishlist(park.id);
          const color = getMarkerColor(visited, wishlist);

          return (
            <CircleMarker
              key={park.id}
              center={[park.coordinates.lat, park.coordinates.lng]}
              radius={8}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.8 }}
            >
              <Popup>
                <p className="font-semibold">{park.name}</p>
                <p>{park.state}</p>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
