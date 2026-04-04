import { useRouteStore } from '../../store/routeStore';
import SafetySlider from './SafetySlider';
import ExplanationPanel from './ExplanationPanel';

function riskLabel(risk: number) {
  if (risk < 0.3) return { text: 'Low risk', color: 'text-green-600' };
  if (risk < 0.6) return { text: 'Moderate risk', color: 'text-amber-500' };
  return { text: 'High risk', color: 'text-red-500' };
}

function formatTime(seconds: number) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatDist(meters: number) {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function RouteComparison() {
  // ✅ FIX: use activeRoute object directly
  const { routeData, activeRoute, activeRouteIdx, showComparison, toggleComparison, sliderLoading } = useRouteStore();

  if (!routeData || !activeRoute) return null;

  // Reference columns — always shortest vs safest (static, for comparison only)
  const shortest = routeData.alternatives[0];
  const safest = routeData.alternatives[routeData.alternatives.length - 1];

  const isFastest = activeRouteIdx === 0;
  const isSafest = activeRouteIdx === routeData.alternatives.length - 1;
  const isBalanced = !isFastest && !isSafest;

  // ✅ FIX: all diffs computed from activeRoute vs shortest — fully dynamic
  const timeDiff = activeRoute.total_time - shortest.total_time;
  const riskDiff = shortest.avg_risk - activeRoute.avg_risk;
  const distDiff = (activeRoute.total_distance ?? 0) - (shortest.total_distance ?? 0);

  // Table reference diffs (static — shortest vs safest)
  const tableTimeDiff = safest.total_time - shortest.total_time;
  const tableRiskDiff = shortest.avg_risk - safest.avg_risk;
  const tableDistDiff = (safest.total_distance ?? 0) - (shortest.total_distance ?? 0);

  const routeLabel = isSafest ? 'Safest Path' : isFastest ? 'Fastest Path' : 'Balanced Path';
  const routeLabelShort = isSafest ? 'Safest' : isFastest ? 'Fastest' : 'This';

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-xl shadow border border-gray-100">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-800">Route Details</h2>
        <div className="flex items-center gap-2">
          {sliderLoading && (
            <span className="text-[10px] text-indigo-400 animate-pulse">updating…</span>
          )}
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
            isSafest ? 'bg-green-100 text-green-700' :
            isFastest ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {routeLabel}
          </span>
        </div>
      </div>

      {/* ✅ Active route stats — driven by activeRoute object */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Duration</p>
          <p className="text-lg font-bold text-gray-900">
            {Math.round(activeRoute.total_time / 60)}{' '}
            <span className="text-xs font-normal">min</span>
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Safety Risk</p>
          <p className={`text-lg font-bold ${riskLabel(activeRoute.avg_risk).color}`}>
            {Math.round(activeRoute.avg_risk * 100)}%
          </p>
        </div>
      </div>

      {/* ✅ Trade-off box — fully dynamic from activeRoute */}
      <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-indigo-700">Max Risk Reduction</span>
          <span className="font-bold text-indigo-900">
            {riskDiff > 0 ? `-${Math.round(riskDiff * 100)}%` :
             riskDiff < 0 ? `+${Math.round(Math.abs(riskDiff) * 100)}%` : '0.0%'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-indigo-700">Time Trade-off</span>
          <span className="font-bold text-indigo-900">
            {timeDiff >= 0 ? `+${Math.round(timeDiff / 60)} min` : `-${Math.round(Math.abs(timeDiff) / 60)} min`}
          </span>
        </div>
      </div>

      {/* ── COMPARISON TABLE ── */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">

        <button
          onClick={toggleComparison}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Safest vs Shortest
            </span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
              {showComparison ? 'ON MAP' : 'HIDDEN'}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${showComparison ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="divide-y divide-gray-100">

          <div className="grid grid-cols-3 px-3 py-1.5 bg-white">
            <span className="text-[10px] text-gray-400 uppercase font-semibold"></span>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-1 rounded bg-blue-500"></span>
              <span className="text-[10px] text-blue-600 font-bold uppercase">Shortest</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-1 rounded bg-green-500"></span>
              <span className="text-[10px] text-green-700 font-bold uppercase">Safest</span>
            </div>
          </div>

          <div className="grid grid-cols-3 px-3 py-2 items-center">
            <span className="text-[11px] text-gray-500 font-medium">⏱ Time</span>
            <span className="text-sm font-bold text-blue-700">{formatTime(shortest.total_time)}</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-green-700">{formatTime(safest.total_time)}</span>
              {tableTimeDiff > 0 && (
                <span className="text-[9px] text-amber-600 bg-amber-50 px-1 rounded">
                  +{Math.round(tableTimeDiff / 60)}m
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 px-3 py-2 items-center">
            <span className="text-[11px] text-gray-500 font-medium">📏 Distance</span>
            <span className="text-sm font-bold text-blue-700">{formatDist(shortest.total_distance ?? 0)}</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-green-700">{formatDist(safest.total_distance ?? 0)}</span>
              {tableDistDiff > 0 && (
                <span className="text-[9px] text-amber-600 bg-amber-50 px-1 rounded">
                  +{formatDist(tableDistDiff)}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 px-3 py-2 items-center">
            <span className="text-[11px] text-gray-500 font-medium">🛡 Risk</span>
            <span className={`text-sm font-bold ${riskLabel(shortest.avg_risk).color}`}>
              {Math.round(shortest.avg_risk * 100)}%
            </span>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-bold ${riskLabel(safest.avg_risk).color}`}>
                {Math.round(safest.avg_risk * 100)}%
              </span>
              {tableRiskDiff > 0 && (
                <span className="text-[9px] text-green-700 bg-green-50 px-1 rounded">
                  -{Math.round(tableRiskDiff * 100)}%
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 px-3 py-2 items-center">
            <span className="text-[11px] text-gray-500 font-medium">🗺 Segments</span>
            <span className="text-sm font-bold text-blue-700">{shortest.segments.length}</span>
            <span className="text-sm font-bold text-green-700">{safest.segments.length}</span>
          </div>

        </div>

        {/* ✅ Verdict — fully dynamic */}
        <div className="px-3 py-2 bg-gradient-to-r from-green-50 to-indigo-50 border-t border-gray-100">
          <p className="text-[11px] text-gray-600 leading-snug">
            <span className={`font-bold ${isSafest ? 'text-green-700' : isFastest ? 'text-blue-700' : 'text-purple-700'}`}>
              {routeLabelShort} route
            </span>
            {riskDiff > 0
              ? <> reduces risk by <span className="font-bold">-{Math.round(riskDiff * 100)}%</span></>
              : riskDiff < 0
              ? <> increases risk by <span className="font-bold text-red-500">+{Math.round(Math.abs(riskDiff) * 100)}%</span></>
              : <> has the same risk</>}
            {timeDiff > 0 && <> at the cost of <span className="font-bold text-amber-600">+{Math.round(timeDiff / 60)} min</span></>}
            {timeDiff < 0 && <> and saves <span className="font-bold text-green-600">{Math.round(Math.abs(timeDiff) / 60)} min</span></>}.{' '}
            {isBalanced ? '⚖️ Balanced between speed and safety.'
              : riskDiff > 0.1 ? '✅ Strongly recommended for night travel.'
              : '⚡ Routes are very similar — either is fine.'}
          </p>
        </div>
      </div>

      <div className="h-px bg-gray-100" />
      <SafetySlider />
      <ExplanationPanel />
    </div>
  );
}