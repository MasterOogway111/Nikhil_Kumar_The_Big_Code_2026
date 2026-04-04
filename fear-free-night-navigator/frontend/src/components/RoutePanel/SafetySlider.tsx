import { useRouteStore } from '../../store/routeStore';

export default function SafetySlider() {
  const { safetyWeight, setSafetyWeight } = useRouteStore();
  return (
    <div>
      <label className="text-xs text-gray-600 flex justify-between mb-1">
        <span>⚡ Speed</span>
        <span>🛡 Safety</span>
      </label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={safetyWeight}
        onChange={(e) => setSafetyWeight(parseFloat(e.target.value))}
        className="w-full accent-indigo-600"
      />
      <p className="text-xs text-center text-gray-400 mt-1">
        Safety weight: {Math.round(safetyWeight * 100)}%
      </p>
    </div>
  );
}
