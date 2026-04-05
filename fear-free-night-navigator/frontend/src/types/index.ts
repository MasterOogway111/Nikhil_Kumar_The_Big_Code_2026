export interface ScoredSegment {
  segmentId: string;
  polyline: string;
  risk_score: number;
  uncertainty: number;
  durationSeconds: number;
  distanceMeters: number;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
}

export interface RouteResult {
  segments: ScoredSegment[];
  avg_risk: number;
  total_time: number;
  total_distance: number;
}

export interface RouteAlternative {
  segments: ScoredSegment[];
  avg_risk: number;
  total_time: number;
  total_distance: number;
  blendScore?: number;
}

export interface RouteResponse {
  alternatives: RouteAlternative[];
  active_route?: RouteAlternative;
  summary: {
    fastest_duration: number;
    safest_risk: number;
    risk_reduction: string;
    eta_tradeoff_secs: number;
    active_risk_delta?: number;
    active_time_delta?: number;
  };
}

export interface SegmentExplanation {
  segmentId: string;
  risk_score: number;
  uncertainty: number;
  explanations: string[];
}
