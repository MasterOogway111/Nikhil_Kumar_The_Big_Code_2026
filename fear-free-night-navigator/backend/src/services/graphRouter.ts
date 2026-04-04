import { GraphNode, GraphEdge } from '../models/Route';

// ── Cost function ─────────────────────────────────────────────────────────────
// λ1*risk + λ2*time_normalized + λ3*uncertainty
// Weights sum to 1.0 and are derived from the safety slider in routeController
function edgeCost(
  edge: GraphEdge,
  lambda: [number, number, number] = [0.6, 0.3, 0.1]
): number {
  const [l1, l2, l3] = lambda;
  const timeNorm = Math.min(edge.time / 3600, 1); // normalize to 0–1, cap at 1 hour
  return l1 * edge.risk + l2 * timeNorm + l3 * edge.uncertainty;
}

// ── Build graph from scored segments ─────────────────────────────────────────
// Each segment start/end becomes a node, the segment itself becomes a directed edge
export function buildGraph(
  allScoredSegments: Array<{
    segmentId: string;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    risk_score: number;
    uncertainty: number;
    durationSeconds: number;
  }>
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const seg of allScoredSegments) {
    const fromId = `${seg.startLat.toFixed(5)},${seg.startLng.toFixed(5)}`;
    const toId   = `${seg.endLat.toFixed(5)},${seg.endLng.toFixed(5)}`;

    if (!nodeMap.has(fromId)) {
      nodeMap.set(fromId, { id: fromId, lat: seg.startLat, lng: seg.startLng });
    }
    if (!nodeMap.has(toId)) {
      nodeMap.set(toId, { id: toId, lat: seg.endLat, lng: seg.endLng });
    }

    edges.push({
      from: fromId,
      to: toId,
      risk: seg.risk_score,
      time: seg.durationSeconds,
      uncertainty: seg.uncertainty,
      segmentId: seg.segmentId,
    });
  }

  return { nodes: Array.from(nodeMap.values()), edges };
}

// ── Dijkstra core ─────────────────────────────────────────────────────────────
export function dijkstra(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string,
  lambda?: [number, number, number]
): { path: string[]; totalCost: number } {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const unvisited = new Set<string>();

  for (const n of nodes) {
    dist.set(n.id, Infinity);
    prev.set(n.id, null);
    unvisited.add(n.id);
  }
  dist.set(startId, 0);

  // Build adjacency list
  const adjacency = new Map<string, GraphEdge[]>();
  for (const e of edges) {
    if (!adjacency.has(e.from)) adjacency.set(e.from, []);
    adjacency.get(e.from)!.push(e);
  }

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let u = '';
    let minDist = Infinity;
    for (const id of unvisited) {
      const d = dist.get(id) ?? Infinity;
      if (d < minDist) { minDist = d; u = id; }
    }

    if (!u || minDist === Infinity) break; // no reachable nodes left
    if (u === endId) break;               // reached destination

    unvisited.delete(u);

    for (const edge of adjacency.get(u) ?? []) {
      if (!unvisited.has(edge.to)) continue;
      const alt = (dist.get(u) ?? Infinity) + edgeCost(edge, lambda);
      if (alt < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, alt);
        prev.set(edge.to, u);
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let cur: string | null = endId;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }

  return { path, totalCost: dist.get(endId) ?? Infinity };
}

// ── Preset variants ───────────────────────────────────────────────────────────

// Safest: heavily penalizes risk, tolerates longer time
export function dijkstraSafest(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): { path: string[]; totalCost: number } {
  return dijkstra(nodes, edges, startId, endId, [0.7, 0.2, 0.1]);
}

// Fastest: heavily penalizes time, tolerates higher risk
export function dijkstraFastest(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): { path: string[]; totalCost: number } {
  return dijkstra(nodes, edges, startId, endId, [0.3, 0.6, 0.1]);
}