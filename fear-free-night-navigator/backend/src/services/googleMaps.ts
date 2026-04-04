import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function getMapsKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY;
}

export interface SegmentData {
  segmentId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  polyline: string;
  durationSeconds: number;
  distanceMeters: number;
}

function encodeValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let result = '';
  while (v >= 0x20) {
    result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  result += String.fromCharCode(v + 63);
  return result;
}

function encodePolyline(points: { lat: number; lng: number }[]): string {
  let result = '';
  let prevLat = 0;
  let prevLng = 0;
  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    result += encodeValue(lat - prevLat);
    result += encodeValue(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }
  return result;
}

function parseDuration(d: string | undefined): number {
  if (!d) return 0;
  const match = d.match(/^(\d+)s$/);
  return match ? parseInt(match[1]) : 0;
}

export async function fetchRouteAlternatives(
  origin: string,
  destination: string
): Promise<SegmentData[][]> {
  const key = getMapsKey();

  if (!key) {
    console.warn('⚠️  GOOGLE_MAPS_API_KEY not set in .env — using synthetic fallback routes');
    return generateSyntheticRoutes(origin, destination);
  }

  try {
    console.log(`🔑 Calling Routes API: ${origin} → ${destination}`);

    const res = await axios.post(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        origin: { address: origin },
        destination: { address: destination },
        travelMode: 'DRIVE',
        computeAlternativeRoutes: true,
        routingPreference: 'TRAFFIC_AWARE',
      },
      {
        httpsAgent,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'routes.legs,routes.polyline,routes.duration,routes.distanceMeters',
        },
      }
    );

    const routes = res.data?.routes;

    if (!routes || routes.length === 0) {
      console.warn('⚠️  Routes API returned no routes — falling back to synthetic');
      return generateSyntheticRoutes(origin, destination);
    }

    console.log(`✅ Got ${routes.length} real route(s) from Routes API`);

    return routes.map((route: any, routeIdx: number) =>
      route.legs.flatMap((leg: any, legIdx: number) =>
        leg.steps.map((step: any, stepIdx: number) => ({
          segmentId: `${origin}_${destination}_r${routeIdx}_l${legIdx}_s${stepIdx}`,
          startLat: step.startLocation.latLng.latitude,
          startLng: step.startLocation.latLng.longitude,
          endLat: step.endLocation.latLng.latitude,
          endLng: step.endLocation.latLng.longitude,
          polyline: step.polyline?.encodedPolyline || encodePolyline([
            { lat: step.startLocation.latLng.latitude, lng: step.startLocation.latLng.longitude },
            { lat: step.endLocation.latLng.latitude, lng: step.endLocation.latLng.longitude },
          ]),
          durationSeconds: parseDuration(step.staticDuration),
          distanceMeters: step.distanceMeters || 0,
        }))
      )
    );

  } catch (error: any) {
    if (error.response) {
      console.error('❌ Routes API HTTP error:');
      console.error('   Status:', error.response.status);
      console.error('   Body:', JSON.stringify(error.response.data, null, 2));
      if (error.response.status === 403) {
        console.error('   👉 FIX: Enable "Routes API" at https://console.cloud.google.com/apis/library');
      } else if (error.response.status === 401) {
        console.error('   👉 FIX: API key is invalid — check GOOGLE_MAPS_API_KEY in backend/.env');
      }
    } else {
      console.error('❌ Routes API network error:', error.message);
    }
    console.warn('⚙️  Falling back to synthetic routes');
    return generateSyntheticRoutes(origin, destination);
  }
}

export async function fetchPOIDensity(lat: number, lng: number): Promise<number> {
  const delhiCenterLat = 28.6139, delhiCenterLng = 77.2090;
  const distKm = haversineDistanceKm(lat, lng, delhiCenterLat, delhiCenterLng);
  const geoDensity = Math.max(0, 1 - distKm / 30);

  const key = getMapsKey();
  if (!key) return geoDensity;

  try {
    const res = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        httpsAgent,
        params: { location: `${lat},${lng}`, radius: 100, key },
        timeout: 5000,
      }
    );
    const apiDensity = Math.min(res.data.results.length / 15, 1.0);
    const blended = (geoDensity + apiDensity) / 2;
    console.log(`📍 POI (${lat.toFixed(3)},${lng.toFixed(3)}): geo=${geoDensity.toFixed(2)} api=${apiDensity.toFixed(2)} blended=${blended.toFixed(2)}`);
    return blended;
  } catch (error: any) {
    console.warn(`⚠️  POI density fetch failed for (${lat}, ${lng}):`, error.message);
    return geoDensity;
  }
}

export async function fetchNearbyPoliceStations(
  lat: number,
  lng: number,
  radiusMeters: number = 2000
): Promise<{ lat: number; lng: number }[]> {
  const key = getMapsKey();
  try {
    if (key) {
      const res = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          httpsAgent,
          params: { location: `${lat},${lng}`, radius: radiusMeters, type: 'police', key },
          timeout: 5000,
        }
      );
      if (res.data.results) {
        return res.data.results.map((r: any) => ({
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
        }));
      }
      return [];
    }
    const numStations = Math.floor(1 + Math.random() * 4);
    return Array.from({ length: numStations }, () => ({
      lat: lat + (Math.random() - 0.5) * 0.04,
      lng: lng + (Math.random() - 0.5) * 0.04,
    }));
  } catch (error: any) {
    console.warn(`⚠️  Police stations fetch failed for (${lat}, ${lng}):`, error.message);
    return [];
  }
}

export async function fetchNearbyHospitals(
  lat: number,
  lng: number,
  radiusMeters: number = 2000
): Promise<{ lat: number; lng: number }[]> {
  const key = getMapsKey();
  try {
    if (key) {
      const res = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          httpsAgent,
          params: { location: `${lat},${lng}`, radius: radiusMeters, type: 'hospital', key },
          timeout: 5000,
        }
      );
      if (res.data.results) {
        return res.data.results.map((r: any) => ({
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
        }));
      }
      return [];
    }
    const numHospitals = Math.floor(1 + Math.random() * 3);
    return Array.from({ length: numHospitals }, () => ({
      lat: lat + (Math.random() - 0.5) * 0.05,
      lng: lng + (Math.random() - 0.5) * 0.05,
    }));
  } catch (error: any) {
    console.warn(`⚠️  Hospitals fetch failed for (${lat}, ${lng}):`, error.message);
    return [];
  }
}

export async function fetchNearbyBusinesses(
  lat: number,
  lng: number,
  radiusMeters: number = 1000
): Promise<{ count: number; openRatio: number }> {
  const key = getMapsKey();
  try {
    if (key) {
      const res = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          httpsAgent,
          params: {
            location: `${lat},${lng}`,
            radius: radiusMeters,
            type: 'establishment',
            key,
          },
          timeout: 5000,
        }
      );
      const results = res.data.results || [];
      const openCount = results.filter(
        (r: any) => r.opening_hours?.open_now === true
      ).length;
      return {
        count: results.length,
        openRatio: results.length > 0 ? openCount / results.length : 0,
      };
    }
    const count = Math.floor(5 + Math.random() * 15);
    return { count, openRatio: 0.3 + Math.random() * 0.5 };
  } catch (error: any) {
    console.warn(`⚠️  Businesses fetch failed for (${lat}, ${lng}):`, error.message);
    return { count: 5, openRatio: 0.3 };
  }
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function decodePolylineToPoints(encoded: string): { lat: number; lng: number }[] {
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

function generateSyntheticRoutes(origin: string, destination: string): SegmentData[][] {
  console.log(`⚙️  Generating synthetic routes for: ${origin} → ${destination}`);
  const routes: SegmentData[][] = [];
  const baseLat = 28.6139;
  const baseLng = 77.2090;

  for (let routeIdx = 0; routeIdx < 3; routeIdx++) {
    const segments: SegmentData[] = [];
    const offsetLat = (routeIdx - 1) * 0.05;
    const offsetLng = (routeIdx - 1) * 0.03;

    for (let i = 0; i < 4; i++) {
      const progress = i / 4;
      const nextProgress = (i + 1) / 4;
      const startLat = baseLat + offsetLat + progress * 0.3;
      const startLng = baseLng + offsetLng + progress * 0.2;
      const endLat = baseLat + offsetLat + nextProgress * 0.3;
      const endLng = baseLng + offsetLng + nextProgress * 0.2;

      segments.push({
        segmentId: `synthetic_${origin}_${destination}_r${routeIdx}_s${i}`,
        startLat,
        startLng,
        endLat,
        endLng,
        polyline: encodePolyline([
          { lat: startLat, lng: startLng },
          { lat: endLat, lng: endLng },
        ]),
        durationSeconds: 600 + Math.random() * 900,
        distanceMeters: 8000 + Math.random() * 5000,
      });
    }
    routes.push(segments);
  }
  return routes;
}