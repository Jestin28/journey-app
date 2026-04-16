import parksData from "@/data/parks.json";
import type { NationalPark } from "@/types";

export const parks: NationalPark[] = parksData;

export function getParkById(id: string): NationalPark | undefined {
  return parks.find((park) => park.id === id);
}
