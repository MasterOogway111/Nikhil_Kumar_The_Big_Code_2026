import { ScoredSegment } from '../../types';

interface RouteOverlayProps {
  segments: ScoredSegment[];
  onSegmentClick: (segment: ScoredSegment) => void;
}

function riskToColor(risk: number): string {
  if (risk < 0.3) return '#22c55e'; // green — low risk
  if (risk < 0.6) return '#f59e0b'; // amber — moderate risk
  return '#ef4444'; // red — high risk
}

export default function RouteOverlay({ segments, onSegmentClick }: RouteOverlayProps) {
  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs max-h-96 overflow-y-auto z-10">
      <h3 className="font-semibold text-gray-800 mb-3">Route Segments</h3>
      <div className="space-y-2">
        {segments.map((seg) => (
          <button
            key={seg.segmentId}
            onClick={() => onSegmentClick(seg)}
            className="w-full text-left p-2 rounded hover:bg-gray-100 transition border-l-4"
            style={{ borderColor: riskToColor(seg.risk_score) }}
          >
            <p className="text-xs font-medium text-gray-700">
              Risk: {(seg.risk_score * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500">
              {(seg.durationSeconds / 60).toFixed(1)} min · {(seg.distanceMeters / 1000).toFixed(1)} km
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
