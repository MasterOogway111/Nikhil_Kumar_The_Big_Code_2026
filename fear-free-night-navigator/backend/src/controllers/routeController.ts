import { Request, Response } from 'express';
import {
  fetchRouteAlternatives,
  fetchPOIDensity,
  fetchNearbyPoliceStations,
  decodePolylineToPoints,
  haversineDistanceKm,
} from '../services/googleMaps';
import { scoreSegment } from '../services/segmentScorer';
import { buildGraph, dijkstra, dijkstraSafest, dijkstraFastest } from '../services/graphRouter';
import Route from '../models/Route';
import Segment from '../models/Segment';

export const computeRoutes = async (req: Request, res: Response) => {
  try {
    const { origin, destination, time_of_day = 1, safety_weight } = req.body;

if (!origin || !destination) {
  return res.status(400).json({
    error: 'Missing required fields',
    message: 'origin and destination are required',
  });
}

const sw = Math.min(1, Math.max(0,
  safety_weight !== undefined ? parseFloat(safety_weight) : 0.5
));
    
    console.log(`Computing routes: ${origin} → ${destination}, safety_weight=${safety_weight}`);

    const routeAlternatives = await fetchRouteAlternatives(origin, destination);

    if (!routeAlternatives || routeAlternatives.length === 0) {
      return res.status(404).json({
        error: 'No routes found',
        message: 'Could not find routes for the given origin and destination',
      });
    }

    console.log(`Found ${routeAlternatives.length} route alternatives`);

    const scoredAlternatives = await Promise.all(
      routeAlternatives.map(async (segments) => {
        const scored = await Promise.all(
          segments.map(async (seg) => {
            const cachedSegment = await Segment.findOne({ segmentId: seg.segmentId });
            if (cachedSegment) {
              console.log(`📦 Cache hit for segment: ${seg.segmentId}`);
              return {
                ...seg,
                risk_score: cachedSegment.risk_score,
                uncertainty: cachedSegment.uncertainty,
              };
            }

            const polyPoints = decodePolylineToPoints(seg.polyline);
            const [poi_density, policeStations] = await Promise.all([
              fetchPOIDensity(seg.startLat, seg.startLng),
              fetchNearbyPoliceStations(seg.startLat, seg.startLng, 2000),
            ]);

            let police_distance_score = 0;
            let police_density = 0;
            let police_coverage = 0;

            if (policeStations.length > 0 && polyPoints.length > 0) {
              police_density = Math.min(policeStations.length / 10, 1.0);

              let totalNearestDist = 0;
              let coveredPoints = 0;

              for (const point of polyPoints) {
                let nearestDist = Infinity;
                for (const station of policeStations) {
                  const dist = haversineDistanceKm(
                    point.lat, point.lng,
                    station.lat, station.lng
                  );
                  if (dist < nearestDist) nearestDist = dist;
                }
                totalNearestDist += nearestDist;
                if (nearestDist <= 1.0) coveredPoints++;
              }

              const avgDist = totalNearestDist / polyPoints.length;
              police_distance_score = 1 / (1 + avgDist);
              police_coverage = coveredPoints / polyPoints.length;

            } else if (polyPoints.length === 0) {
              police_distance_score = 0.5;
              police_density = 0.5;
              police_coverage = 0.5;
            }

            const features = {
              poi_density,
              commercial_activity:  Math.min(poi_density * 0.8, 1.0),
              road_isolation:       Math.max(0, 0.5 - poi_density * 0.5),
              connectivity:         Math.min(poi_density * 1.2, 1.0),
              lighting_proxy:       Math.min(poi_density * 1.1, 1.0),
              time_of_day:          Number(time_of_day),
              police_distance_score,
              police_density,
              police_coverage,
            };

            const { risk_score, uncertainty } = await scoreSegment(
              seg.segmentId,
              seg.polyline,
              features
            );

            return { ...seg, risk_score, uncertainty };
          })
        );

        const avg_risk = scored.reduce((s, sg) => s + sg.risk_score, 0) / scored.length;
        const total_time = scored.reduce((s, sg) => s + sg.durationSeconds, 0);
        const total_distance = scored.reduce((s, sg) => s + sg.distanceMeters, 0);

        return {
          segments: scored,
          avg_risk: parseFloat(avg_risk.toFixed(4)),
          total_time,
          total_distance,
        };
      })
    );

    // ── Graph-based Dijkstra routing ──────────────────────────────────────────
    const allSegments = scoredAlternatives.flatMap(r => r.segments);
    const { nodes, edges } = buildGraph(allSegments);

    const firstSeg = allSegments[0];
    const lastSeg  = allSegments[allSegments.length - 1];
    const startId  = `${firstSeg.startLat.toFixed(5)},${firstSeg.startLng.toFixed(5)}`;
    const endId    = `${lastSeg.endLat.toFixed(5)},${lastSeg.endLng.toFixed(5)}`;


    const lambda: [number, number, number] = [sw * 0.8, (1 - sw) * 0.8, 0.2];

    const fastestPath  = dijkstraFastest(nodes, edges, startId, endId);
    const safestPath   = dijkstraSafest(nodes, edges, startId, endId);
    const balancedPath = dijkstra(nodes, edges, startId, endId, lambda);

    function pathToRoute(path: string[]) {
      const edgeMap = new Map(edges.map(e => [`${e.from}->${e.to}`, e]));
      const routeSegments = path.slice(0, -1).map((nodeId, i) => {
        const edge = edgeMap.get(`${nodeId}->${path[i + 1]}`);
        return allSegments.find(s => s.segmentId === edge?.segmentId);
      }).filter(Boolean) as typeof allSegments;

      return {
        segments: routeSegments,
        avg_risk:       routeSegments.reduce((s, sg) => s + sg.risk_score, 0) / (routeSegments.length || 1),
        total_time:     routeSegments.reduce((s, sg) => s + sg.durationSeconds, 0),
        total_distance: routeSegments.reduce((s, sg) => s + sg.distanceMeters, 0),
      };
    }

    const fallback = scoredAlternatives.sort((a, b) => a.total_time - b.total_time)[0];
    const fastest  = fastestPath.path.length  > 1 ? pathToRoute(fastestPath.path)  : fallback;
    const safest   = safestPath.path.length   > 1 ? pathToRoute(safestPath.path)   : fallback;
    const balanced = balancedPath.path.length > 1 ? pathToRoute(balancedPath.path) : fallback;

    const result = {
      alternatives: scoredAlternatives,
      active_route: balanced,
      graph_stats: {
        nodes: nodes.length,
        edges: edges.length,
        algorithm: 'dijkstra',
        lambda: { risk: lambda[0], time: lambda[1], uncertainty: lambda[2] },
      },
      summary: {
        fastest_duration:  fastest.total_time,
        safest_risk:       safest.avg_risk,
        risk_reduction:
          fastest.avg_risk > 0
            ? (((fastest.avg_risk - safest.avg_risk) / fastest.avg_risk) * 100).toFixed(1) + '%'
            : '0%',
        eta_tradeoff_secs:  safest.total_time - fastest.total_time,
        active_risk_delta:  parseFloat((fastest.avg_risk - balanced.avg_risk).toFixed(4)),
        active_time_delta:  balanced.total_time - fastest.total_time,
      },
    };

    try {
      await Route.create({
        origin,
        destination,
        fastest: {
          duration_seconds: fastest.total_time,
          avg_risk: fastest.avg_risk,
          segments: fastest.segments.map((s) => s.segmentId),
        },
        safest: {
          duration_seconds: safest.total_time,
          avg_risk: safest.avg_risk,
          segments: safest.segments.map((s) => s.segmentId),
        },
      });
    } catch (dbError: any) {
      console.warn('History save failed:', dbError.message);
    }

    return res.json(result);
  } catch (err: any) {
    console.error('Error in computeRoutes:', err.message);
    return res.status(500).json({
      error: 'Route computation failed',
      message: err.message,
    });
  }
};

