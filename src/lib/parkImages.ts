const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&q=80";

const PARK_IMAGE_URLS: Record<string, string> = {
  acadia:
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
  arches:
    "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=1600&q=80",
  badlands:
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80",
  "bryce-canyon":
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  glacier:
    "https://images.unsplash.com/photo-1464822759844-d150ad6d1d23?auto=format&fit=crop&w=1600&q=80",
  "grand-canyon":
    "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=1600&q=80",
  "grand-teton":
    "https://images.unsplash.com/photo-1464823063530-08f10ed1a2dd?auto=format&fit=crop&w=1600&q=80",
  "rocky-mountain":
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
  yellowstone:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  yosemite:
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1600&q=80",
};

export function getParkImageUrl(parkId: string) {
  return PARK_IMAGE_URLS[parkId] ?? FALLBACK_IMAGE_URL;
}
