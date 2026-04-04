import { create } from 'zustand';
import { RouteResponse, RouteAlternative, SegmentExplanation } from '../types';
import { computeRoute } from '../api/client';

// Deep clone via JSON to guarantee new object references at every level
// This forces Zustand + React to always detect a change
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function pickBestAlternative(alternatives: RouteAlternative[], safetyWeight: number): RouteAlternative {
  if (alternatives.length === 1) return alternatives[0];

  const speedWeight = 1 - safetyWeight;
  const maxTime = Math.max(...alternatives.map((r) => r.total_time));
  const minTime = Math.min(...alternatives.map((r) => r.total_time));
  const maxRisk = Math.max(...alternatives.map((r) => r.avg_risk));
  const minRisk = Math.min(...alternatives.map((r) => r.avg_risk));

  const timeRange = maxTime - minTime || 1;
  const riskRange = maxRisk - minRisk || 1;

  const scored = alternatives.map((r) => ({
    route: r,
    score:
      speedWeight * ((r.total_time - minTime) / timeRange) +
      safetyWeight * ((r.avg_risk - minRisk) / riskRange),
  }));

  return scored.sort((a, b) => a.score - b.score)[0].route;
}

interface RouteStore {
  origin: string;
  destination: string;
  routeData: RouteResponse | null;
  activeRoute: RouteAlternative | null;
  activeRouteIdx: number;
  safetyWeight: number;
  developerMode: boolean;
  explanation: SegmentExplanation | null;
  loading: boolean;
  sliderLoading: boolean;
  error: string | null;
  showComparison: boolean;
  isNight: boolean;
  setOrigin: (v: string) => void;
  setDestination: (v: string) => void;
  setRouteData: (v: RouteResponse) => void;
  setActiveRouteIdx: (v: number) => void;
  setSafetyWeight: (v: number) => void;
  toggleDeveloperMode: () => void;
  setExplanation: (v: SegmentExplanation | null) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  toggleComparison: () => void;
  setIsNight: (v: boolean) => void;
}

export const useRouteStore = create<RouteStore>((set, get) => ({
  origin: '',
  destination: '',
  routeData: null,
  activeRoute: null,
  activeRouteIdx: 0,
  safetyWeight: 0.5,
  developerMode: false,
  explanation: null,
  loading: false,
  sliderLoading: false,
  error: null,
  showComparison: true,
  isNight: true,

  setOrigin: (v) => set({ origin: v }),
  setDestination: (v) => set({ destination: v }),
  setIsNight: (v) => set({ isNight: v }),

  setRouteData: (v) => {
    const { safetyWeight } = get();
    const best = pickBestAlternative(v.alternatives, safetyWeight);
    const bestIdx = v.alternatives.indexOf(best);
    set({
      routeData: v,
      activeRoute: deepClone(best), // ✅ deep clone = guaranteed new reference
      activeRouteIdx: bestIdx,
    });
  },

  setActiveRouteIdx: (v) => {
    const { routeData } = get();
    if (!routeData) return;
    set({
      activeRouteIdx: v,
      activeRoute: deepClone(routeData.alternatives[v]), // ✅ deep clone
    });
  },

  setSafetyWeight: (v: number) => {
    const { routeData } = get();
    set({ safetyWeight: v });
    if (!routeData || routeData.alternatives.length === 0) return;

    const best = pickBestAlternative(routeData.alternatives, v);
    const bestIdx = routeData.alternatives.indexOf(best);

    console.log(`[slider] weight=${v} → idx=${bestIdx} time=${best.total_time} risk=${best.avg_risk}`);

    set({
      activeRoute: deepClone(best), // ✅ deep clone = Zustand always sees a new object
      activeRouteIdx: bestIdx,
    });
  },

  toggleDeveloperMode: () => set((s) => ({ developerMode: !s.developerMode })),
  setExplanation: (v) => set({ explanation: v }),
  setLoading: (v) => set({ loading: v }),
  setError: (v) => set({ error: v }),
  toggleComparison: () => set((s) => ({ showComparison: !s.showComparison })),
}));