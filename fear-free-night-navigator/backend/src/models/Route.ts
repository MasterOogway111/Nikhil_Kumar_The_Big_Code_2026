import mongoose, { Schema, Document } from 'mongoose';

interface RouteResult {
  duration_seconds: number;
  distance_meters: number;
  avg_risk: number;
  segments: string[];
}

export interface IRoute extends Document {
  origin: string;
  destination: string;
  fastest: RouteResult;
  safest: RouteResult;
  created_at: Date;
}

const RouteSchema = new Schema<IRoute>(
  {
    origin: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    fastest: {
      type: Schema.Types.Mixed,
      required: true,
    },
    safest: {
      type: Schema.Types.Mixed,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);
// ── Graph types for Dijkstra routing ─────────────────────────────────────────
export interface GraphNode {
  id: string;
  lat: number;
  lng: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  risk: number;
  time: number;
  uncertainty: number;
  segmentId: string;
}
export default mongoose.model<IRoute>('Route', RouteSchema);
