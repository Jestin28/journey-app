import { PlanTripPageClient } from "@/app/plan-trip/PlanTripPageClient";
import { getNationalParks } from "@/lib/nps";

export default async function PlanTripPage() {
  const parks = await getNationalParks();

  return <PlanTripPageClient parks={parks} />;
}
