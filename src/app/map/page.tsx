import { ParksMap } from "@/components/parks";
import { parks } from "@/lib/parks";

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
