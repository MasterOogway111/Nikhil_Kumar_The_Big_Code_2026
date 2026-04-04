import { ScoredSegment } from '../../types';

interface SegmentPopupProps {
  segment: ScoredSegment | null;
  onClose: () => void;
}

function riskToColor(risk: number): string {
  if (risk < 0.3) return 'text-green-600';
  if (risk < 0.6) return 'text-amber-500';
  return 'text-red-500';
}

function riskLabel(risk: number): string {
  if (risk < 0.3) return 'Low Risk';
  if (risk < 0.6) return 'Moderate Risk';
  return 'High Risk';
}

export default function SegmentPopup({ segment, onClose }: SegmentPopupProps) {
  if (!segment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-gray-800">Segment Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Risk Score</p>
            <p className={`text-2xl font-bold ${riskToColor(segment.risk_score)}`}>
              {(segment.risk_score * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-gray-600">{riskLabel(segment.risk_score)}</p>
          </div>

          <hr />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="font-medium text-gray-800">
                {(segment.durationSeconds / 60).toFixed(1)} min
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Distance</p>
              <p className="font-medium text-gray-800">
                {(segment.distanceMeters / 1000).toFixed(2)} km
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Uncertainty</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${segment.uncertainty * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">
                {(segment.uncertainty * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
