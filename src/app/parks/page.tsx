import { ParksPageClient } from "@/app/parks/ParksPageClient";
import { getNationalParks } from "@/lib/nps";

export default async function ParksPage() {
  const parks = await getNationalParks();

  return <ParksPageClient parks={parks} />;
}
