import { useEffect, useRef, useState } from "react";
import { Navigation, Clock, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    ymaps: any;
    _ymapsReady?: Promise<void>;
  }
}

function loadYmaps(apiKey: string): Promise<void> {
  if (window._ymapsReady) return window._ymapsReady;
  window._ymapsReady = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existing) {
      const poll = () => (window.ymaps ? resolve() : setTimeout(poll, 100));
      poll();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${apiKey ? `&apikey=${apiKey}` : ""}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return window._ymapsReady;
}

interface RouteInfo {
  distance: string;
  minutes: number;
}

interface LiveTrackingMapProps {
  performerLat: number;
  performerLng: number;
  performerName: string;
  performerAvatar?: string;
  destinationAddress: string;
  performerLastSeen?: string | null;
}

export function LiveTrackingMap({
  performerLat,
  performerLng,
  performerName,
  destinationAddress,
  performerLastSeen,
}: LiveTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const buildingRef = useRef(false);

  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [mapError, setMapError] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const apiKey = (import.meta as any).env?.VITE_YMAPS_KEY ?? "";

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    loadYmaps(apiKey)
      .then(() => {
        if (destroyed || !containerRef.current) return;
        window.ymaps.ready(() => {
          if (destroyed || !containerRef.current) return;
          try {
            const map = new window.ymaps.Map(
              containerRef.current,
              { center: [performerLat, performerLng], zoom: 13, controls: ["zoomControl"] },
              { suppressMapOpenBlock: true }
            );

            const mark = new window.ymaps.Placemark(
              [performerLat, performerLng],
              { hintContent: performerName },
              { preset: "islands#redCircleDotIcon" }
            );
            map.geoObjects.add(mark);

            mapRef.current = map;
            markerRef.current = mark;
            setMapReady(true);
          } catch {
            setMapError(true);
          }
        });
      })
      .catch(() => setMapError(true));

    return () => {
      destroyed = true;
      mapRef.current?.destroy();
      mapRef.current = null;
      markerRef.current = null;
      routeRef.current = null;
    };
  }, []);

  // Build route when map is ready (address-based — no geocode step needed)
  useEffect(() => {
    if (!mapReady || !destinationAddress) return;
    buildRoute(performerLat, performerLng, destinationAddress);
  }, [mapReady, destinationAddress]);

  // Rebuild route and update marker when performer moves
  useEffect(() => {
    if (!mapReady) return;

    if (markerRef.current) {
      markerRef.current.geometry.setCoordinates([performerLat, performerLng]);
    }

    buildRoute(performerLat, performerLng, destinationAddress);
  }, [performerLat, performerLng, mapReady]);

  function buildRoute(fromLat: number, fromLng: number, toAddress: string) {
    if (!mapRef.current || buildingRef.current) return;
    buildingRef.current = true;

    if (routeRef.current) {
      mapRef.current.geoObjects.remove(routeRef.current);
      routeRef.current = null;
    }

    // Pass address string directly — Yandex resolves it internally, no geocode step needed
    window.ymaps.route(
      [[fromLat, fromLng], toAddress],
      { routingMode: "auto" }
    ).then(
      (route: any) => {
        if (!mapRef.current) { buildingRef.current = false; return; }

        route.getPaths().each((path: any) => {
          path.options.set({ strokeColor: "#111111", opacity: 0.75, strokeWidth: 5 });
        });
        route.getWayPoints().each((wp: any) => {
          wp.options.set("visible", false);
        });

        mapRef.current.geoObjects.add(route);
        routeRef.current = route;

        const meters: number = route.getLength();
        const seconds: number = route.getTime();

        if (meters > 0) {
          setRouteInfo({
            distance: meters < 1000 ? `${Math.round(meters)} м` : `${(meters / 1000).toFixed(1)} км`,
            minutes: Math.max(1, Math.round(seconds / 60)),
          });
        }

        try {
          const bounds = mapRef.current.geoObjects.getBounds();
          if (bounds) mapRef.current.setBounds(bounds, { checkZoomRange: true, zoomMargin: 60 });
        } catch {}

        buildingRef.current = false;
      },
      () => {
        buildingRef.current = false;
      }
    );
  }

  const isStale =
    performerLastSeen != null &&
    Date.now() - new Date(performerLastSeen).getTime() > 60_000;

  if (mapError) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-50 text-sm text-gray-500">
        <AlertCircle size={14} className="text-gray-400 shrink-0" />
        Не удалось загрузить карту
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Route info strip */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-blue-50">
        <div className="flex items-center gap-2 text-sm text-blue-800 font-medium">
          <Navigation size={14} className="text-blue-500" />
          {routeInfo ? routeInfo.distance : "Строим маршрут..."}
        </div>
        {routeInfo && (
          <div className="flex items-center gap-1.5 text-sm text-blue-700 ml-auto font-semibold">
            <Clock size={13} className="text-blue-400" />
            ~{routeInfo.minutes} мин
          </div>
        )}
        {isStale && !routeInfo && (
          <span className="text-xs text-amber-600 ml-auto">Сигнал устарел</span>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: 240 }}>
        <div ref={containerRef} className="w-full h-full" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
