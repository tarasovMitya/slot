import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

interface OrderLocationMapProps {
  address: string;
}

interface Coords {
  lat: number;
  lon: number;
}

async function geocode(address: string): Promise<Coords | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", /москва/i.test(address) ? address : `${address}, Москва`);
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "ru");
    const res = await fetch(url.toString());
    const data = await res.json() as { lat: string; lon: string }[];
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export function OrderLocationMap({ address }: OrderLocationMapProps) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    geocode(address).then((c) => {
      setCoords(c);
      setLoading(false);
    });
  }, [address]);

  const navigatorUrl = coords
    ? `https://yandex.ru/maps/?pt=${coords.lon},${coords.lat}&z=17&l=map`
    : `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;

  if (loading) {
    return (
      <div className="h-44 rounded-2xl bg-gray-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!coords) {
    return (
      <a
        href={navigatorUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-gray-50 text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <ExternalLink size={15} />
        Открыть в Яндекс Картах
      </a>
    );
  }

  const d = 0.008;
  const bbox = `${coords.lon - d},${coords.lat - d},${coords.lon + d},${coords.lat + d}`;
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lon}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100">
      <iframe
        src={embedSrc}
        className="w-full h-44 block"
        loading="lazy"
        title="Адрес заказа"
      />
      <a
        href={navigatorUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <ExternalLink size={14} />
        Открыть в Яндекс Навигаторе
      </a>
    </div>
  );
}
