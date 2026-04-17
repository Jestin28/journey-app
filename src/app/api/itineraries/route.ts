import { NextResponse } from "next/server";
import { generateParkItineraries } from "@/lib/nps";

type ItineraryRequestBody = {
  parkId?: string;
  startDate?: string;
  endDate?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ItineraryRequestBody;

  if (!body.parkId || !body.startDate || !body.endDate) {
    return NextResponse.json(
      { message: "parkId, startDate, and endDate are required." },
      { status: 400 },
    );
  }

  try {
    const itineraries = await generateParkItineraries(body.parkId, body.startDate, body.endDate);
    return NextResponse.json({ itineraries });
  } catch {
    return NextResponse.json({ message: "Unable to generate itinerary." }, { status: 500 });
  }
}
