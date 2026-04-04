import { useState } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { computeRoute } from '../../api/client';

export default function LocationInput() {
  const {
    setRouteData,
    setLoading,
    setError,
    origin,
    destination,
    setOrigin,
    setDestination,
    developerMode,
    toggleDeveloperMode,
  } = useRouteStore();
  const [isNight, setIsNight] = useState(true);

  const handleSearch = async () => {
    if (!origin || !destination) {
      setError('Please enter both origin and destination');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // If developer mode is on, we'll prefix cities to trigger backend mocks
      const data = await computeRoute(
        developerMode ? `mock_${origin}` : origin, 
        developerMode ? `mock_${destination}` : destination, 
        isNight ? 1 : 0
      );
      setRouteData(data);
    } catch (e: any) {
      setError(e.message || 'Failed to compute routes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-xl shadow border border-gray-100">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Search Route</span>
        <button 
          onClick={toggleDeveloperMode}
          className={`text-[10px] px-2 py-0.5 rounded border transition ${
            developerMode ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}
        >
          {developerMode ? 'Dev Mode: ON' : 'Dev Mode: OFF'}
        </button>
      </div>
      
      <input
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 border-gray-200"
        placeholder="From (e.g. Delhi)"
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
      />
      <input
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 border-gray-200"
        placeholder="To (e.g. Lucknow)"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isNight}
          onChange={(e) => setIsNight(e.target.checked)}
          className="rounded text-indigo-600 focus:ring-indigo-500"
        />
        Night-time travel
      </label>
      <button
        onClick={handleSearch}
        className="bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition disabled:opacity-50"
      >
        Find Safe Route
      </button>
    </div>
  );
}
