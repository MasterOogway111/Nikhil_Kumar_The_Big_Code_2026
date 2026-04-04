import axios from 'axios';
import Segment from '../models/Segment';
import {
  fetchNearbyPoliceStations,
  fetchNearbyHospitals,
  fetchNearbyBusinesses,
  fetchPOIDensity,
  haversineDistanceKm,
  decodePolylineToPoints,
} from './googleMaps';

const ML_URL = process.env.ML_SIDECAR_URL || 'http://localhost:5001';

interface FeatureVector {
  poi_density: number;
  commercial_activity: number;
  road_isolation: number;
  connectivity: number;
  lighting_proxy: number;
  time_of_day: number;
  police_distance_score?: number;
  police_density?: number;
  police_coverage?: number;
  hospital_score?: number;
  business_density?: number;
  open_now_ratio?: number;
}

export async function scoreSegment(
  segmentId: string,
  polyline: string,
  features: FeatureVector
): Promise<{ risk_score: number; uncertainty: number }> {
  try {
    // Check cache first
    const cached = await Segment.findOne({ segmentId });
    if (cached) {
      console.log(`📦 Cache hit for segment: ${segmentId}`);
      return { risk_score: cached.risk_score, uncertainty: cached.uncertainty };
    }

    // Decode polyline to get midpoint for API calls
    const points = decodePolylineToPoints(polyline);
    const mid = points[Math.floor(points.length / 2)] || { lat: 0, lng: 0 };

    // ── Fetch POI density (Bug 2 fix) ─────────
    const poiDensity = await fetchPOIDensity(mid.lat, mid.lng);

    // ── Fetch hospital score + businesses ─────
    const [hospitals, biz] = await Promise.all([
      fetchNearbyHospitals(mid.lat, mid.lng, 2000),
      fetchNearbyBusinesses(mid.lat, mid.lng, 1000),
    ]);

    let hospital_score = features.hospital_score ?? 0.2;
    try {
      if (hospitals.length > 0) {
        const closest = Math.min(
          ...hospitals.map(h => haversineDistanceKm(mid.lat, mid.lng, h.lat, h.lng))
        );
        hospital_score = 1 / (1 + closest);
      }
    } catch (_) {}

    let business_density = features.business_density ?? 0.2;
    let open_now_ratio = features.open_now_ratio ?? 0.3;
    try {
      business_density = Math.min(biz.count / 20, 1.0);
      open_now_ratio = biz.openRatio;
    } catch (_) {}

    // ── time_of_day: real binary 0/1 (Bug 1 fix) ─
    const hour = new Date().getHours();
    const time_of_day = hour >= 20 || hour < 6 ? 1 : 0;

    // ── Build feature vector (Bug 2 + 3 fix) ──
    const safeFeatures: FeatureVector = {
      poi_density:           poiDensity,
      commercial_activity:   features.commercial_activity  ?? poiDensity * 0.85,
      road_isolation:        1 - poiDensity,
      connectivity:          features.connectivity         ?? poiDensity * 0.90,
      lighting_proxy:        poiDensity * 0.95,
      time_of_day,
      police_distance_score: features.police_distance_score ?? 0.3,
      police_density:        features.police_density        ?? 0.1,
      police_coverage:       features.police_coverage       ?? 0.2,
      hospital_score,
      business_density,
      open_now_ratio,
    };

    let risk_score = 0.35;
    let uncertainty = 0.3;

    try {
      const res = await axios.post(`${ML_URL}/predict`, safeFeatures, { timeout: 3000 });
      risk_score = res.data.risk_score;
      uncertainty = res.data.confidence_interval ?? 0.1;
console.log(`🤖 ML prediction for ${segmentId}: risk=${risk_score.toFixed(3)} ci=[${res.data.lower_bound}, ${res.data.upper_bound}] width=${uncertainty.toFixed(3)}`);
      
    } catch (mlError: any) {
      console.warn(`⚠️  ML sidecar unreachable for ${segmentId} — using fallback`);
      uncertainty = 0.5;
    }

    // Persist to cache
    await Segment.findOneAndUpdate(
      { segmentId },
      { segmentId, polyline, features: safeFeatures, risk_score, uncertainty, cached_at: new Date() },
      { upsert: true, new: true }
    );

    return { risk_score, uncertainty };
  } catch (error: any) {
    console.error(`Error scoring segment ${segmentId}:`, error.message);
    return { risk_score: 0.6, uncertainty: 0.5 };
  }
}