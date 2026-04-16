import Image from "next/image";
import { notFound } from "next/navigation";
import { ParkActions, ParkStatusBadge } from "@/components/parks";
import { getParkImageUrl } from "@/lib/parkImages";
import { getParkById } from "@/lib/parks";

type ParkDetailPageProps = {
  params: {
    id: string;
  };
};

export default function ParkDetailPage({ params }: ParkDetailPageProps) {
  const park = getParkById(params.id);

  if (!park) {
    notFound();
  }

  return (
    <section className="space-y-8">
      <div className="relative h-72 overflow-hidden rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/60 sm:h-80">
        <Image
          src={getParkImageUrl(park.id)}
          alt={park.name}
          fill
          priority
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{park.name}</h2>
          <p className="mt-2 text-sm font-medium text-white/85">{park.state}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-500">Status</span>
        <ParkStatusBadge parkId={park.id} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <h3 className="text-sm font-medium text-slate-500">Description</h3>
        <p className="mt-3 max-w-3xl leading-7 text-slate-700">{park.description}</p>
      </div>

      <ParkActions parkId={park.id} />
    </section>
  );
}
