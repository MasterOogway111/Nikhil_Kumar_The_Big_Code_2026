import mongoose, { Schema, Document } from 'mongoose';

export interface ISegment extends Document {
  segmentId: string;
  polyline: string;
  features: {
    poi_density: number;
    commercial_activity: number;
    road_isolation: number;
    connectivity: number;
    lighting_proxy: number;
    time_of_day: number;
    police_distance_score?: number;
    police_density?: number;
    police_coverage?: number;
  };
  risk_score: number;
  uncertainty: number;
  cached_at: Date;
}

const SegmentSchema = new Schema<ISegment>(
  {
    segmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    polyline: {
      type: String,
      required: true,
    },
    features: {
      type: Schema.Types.Mixed,
      required: true,
    },
    risk_score: {
      type: Number,
      required: true,
    },
    uncertainty: {
      type: Number,
      default: 0,
    },
    cached_at: {
      type: Date,
      default: Date.now,
      expires: 86400, // TTL: 24 hours
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISegment>('Segment', SegmentSchema);
