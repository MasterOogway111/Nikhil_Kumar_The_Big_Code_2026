import { useRouteStore } from '../../store/routeStore';

export default function ExplanationPanel() {
  const { explanation } = useRouteStore();

  if (!explanation) {
    return (
      <p className="text-xs text-gray-400 italic">
        Click a route segment to see risk factors.
      </p>
    );
  }

  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs font-semibold text-gray-700 mb-2">
        Risk score: {(explanation.risk_score * 100).toFixed(0)}%
        {explanation.uncertainty > 0.3 && ' ⚠️ uncertain'}
      </p>
      <ul className="space-y-1">
        {explanation.explanations.map((e, i) => (
          <li key={i} className="text-xs text-gray-600">
            • {e}
          </li>
        ))}
      </ul>
    </div>
  );
}
