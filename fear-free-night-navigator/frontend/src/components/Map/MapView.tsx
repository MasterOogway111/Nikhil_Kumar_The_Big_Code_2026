import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useRouteStore } from '../../store/routeStore';
import { ScoredSegment } from '../../types';

const loader = new Loader({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  libraries: ['places', 'geometry'],
});

function riskToColor(risk: number): string {
  if (risk < 0.3) return '#22c55e';
  if (risk < 0.6) return '#f59e0b';
  return '#ef4444';
}

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<google.maps.Map | null>(null);
  const safePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const shortPolylinesRef = useRef<google.maps.Polyline[]>([]);

  // ✅ FIX: use activeRoute object directly, not activeRouteIdx
  const { routeData, activeRoute, setExplanation, showComparison } = useRouteStore();

  // Init map once
  useEffect(() => {
    loader.load().then(() => {
      if (!mapRef.current) return;
      mapObjRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: 28.6139, lng: 77.209 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });
    });
  }, []);

  // Draw SHORTEST reference route — solid blue, always alternatives[0]
  useEffect(() => {
    shortPolylinesRef.current.forEach((p) => p.setMap(null));
    shortPolylinesRef.current = [];

    if (!mapObjRef.current || !routeData || !showComparison) return;

    const shortestRoute = routeData.alternatives[0];
    if (!shortestRoute) return;

    shortestRoute.segments.forEach((seg: ScoredSegment) => {
      const path = google.maps.geometry.encoding.decodePath(seg.polyline);

      const border = new google.maps.Polyline({
        path,
        strokeColor: '#ffffff',
        strokeOpacity: 0.9,
        strokeWeight: 9,
        map: mapObjRef.current!,
        zIndex: 90,
        clickable: false,
      });

      const poly = new google.maps.Polyline({
        path,
        strokeColor: '#2563eb',
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map: mapObjRef.current!,
        zIndex: 95,
        clickable: false,
      });

      shortPolylinesRef.current.push(border, poly);
    });
  }, [routeData, showComparison]);

  // ✅ FIX: Draw ACTIVE route — reacts to activeRoute object, not activeRouteIdx
  useEffect(() => {
    if (!mapObjRef.current || !activeRoute) return;

    safePolylinesRef.current.forEach((p) => p.setMap(null));
    safePolylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    activeRoute.segments.forEach((seg: ScoredSegment) => {
      const path = google.maps.geometry.encoding.decodePath(seg.polyline);
      path.forEach((p) => bounds.extend(p));

      const border = new google.maps.Polyline({
        path,
        strokeColor: '#ffffff',
        strokeOpacity: 0.9,
        strokeWeight: 11,
        map: mapObjRef.current!,
        zIndex: 100,
        clickable: false,
      });

      const poly = new google.maps.Polyline({
        path,
        strokeColor: riskToColor(seg.risk_score),
        strokeOpacity: 0.95,
        strokeWeight: 7,
        map: mapObjRef.current!,
        zIndex: 110,
      });

      poly.addListener('click', async () => {
        const { explainSegment } = await import('../../api/client');
        try {
          const exp = await explainSegment(seg.segmentId);
          setExplanation(exp);
        } catch (e) {
          console.error('Failed to explain segment:', e);
        }
      });

      safePolylinesRef.current.push(border, poly);
    });

    mapObjRef.current.fitBounds(bounds);
  }, [activeRoute, setExplanation]); // ✅ depends on activeRoute, not activeRouteIdx

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
}