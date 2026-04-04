import MapView from './components/Map/MapView';
import LocationInput from './components/Search/LocationInput';
import RouteComparison from './components/RoutePanel/RouteComparison';
import { useRouteStore } from './store/routeStore';

export default function App() {
  const { loading, error } = useRouteStore();
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-80 flex flex-col gap-4 p-4 overflow-y-auto shrink-0 bg-white border-r border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">🌙 Night Navigator</h1>
        <LocationInput />
        {loading && <p className="text-sm text-indigo-500 animate-pulse">Computing safe routes...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <RouteComparison />
      </div>
      <div className="flex-1 p-4">
        <MapView />
      </div>
    </div>
  );
}
