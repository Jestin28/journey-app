import { DashboardOverview } from "@/components/dashboard";
import { parks } from "@/lib/parks";

export default function DashboardPage() {
  return <DashboardOverview totalParks={parks.length} parks={parks} />;
}
