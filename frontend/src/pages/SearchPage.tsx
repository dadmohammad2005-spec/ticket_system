import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Trip, Operator } from '../types';
import { 
  Filter, MapPin, Calendar, Star, 
  SlidersHorizontal, AlertCircle, Sparkles, ChevronDown, ChevronUp 
} from 'lucide-react';
import { CustomJourneyPlanner } from '../components/CustomJourneyPlanner';
import { PakistanCityDropdown } from '../components/PakistanCityDropdown';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search parameters
  const originParam = searchParams.get('origin') || '';
  const destinationParam = searchParams.get('destination') || '';
  const dateParam = searchParams.get('date') || '';
  const vehicleTypeParam = searchParams.get('vehicle_type') || 'ALL';

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState<Operator[]>([]);

  // Search inputs
  const [origin, setOrigin] = useState(originParam);
  const [destination, setDestination] = useState(destinationParam);
  const [date, setDate] = useState(dateParam);
  const [sortOption, setSortOption] = useState<'cheapest' | 'fastest' | 'best_rated' | 'earliest'>('cheapest');
  const [showCustomPlanner, setShowCustomPlanner] = useState(false);

  // Filters state
  const [maxPrice, setMaxPrice] = useState<number>(6000);
  const [selectedOperators, setSelectedOperators] = useState<number[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>(vehicleTypeParam);
  const [minRating, setMinRating] = useState<number>(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [isFallbackResults, setIsFallbackResults] = useState(false);

  // Synchronize inputs when query params change in URL
  useEffect(() => {
    setOrigin(originParam);
    setDestination(destinationParam);
    setDate(dateParam);
    setSelectedVehicleType(vehicleTypeParam);
  }, [originParam, destinationParam, dateParam, vehicleTypeParam]);

  // Fetch operators for filter list
  useEffect(() => {
    api.get('/operators/').then((res) => {
      setOperators(res.data.results || res.data || []);
    }).catch(() => {});
  }, []);

  // Fetch search results
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (origin) params.append('origin', origin);
        if (destination) params.append('destination', destination);
        if (date) params.append('date', date);
        if (sortOption) params.append('sort', sortOption);

        const res = await api.get(`/trips/?${params.toString()}`);
        let results = res.data.results || res.data || [];
        let isFallback = false;

        // If 0 results with date filter, fallback to searching without date filter (all dates on this route)
        if (results.length === 0 && date && (origin || destination)) {
          const fallbackParams = new URLSearchParams();
          if (origin) fallbackParams.append('origin', origin);
          if (destination) fallbackParams.append('destination', destination);
          if (sortOption) fallbackParams.append('sort', sortOption);
          const fallbackRes = await api.get(`/trips/?${fallbackParams.toString()}`);
          results = fallbackRes.data.results || fallbackRes.data || [];
          if (results.length > 0) isFallback = true;
        }

        // If STILL 0 results (e.g. unknown custom search text), show all available trips so user is never stranded
        if (results.length === 0) {
          const allTripsRes = await api.get(`/trips/`);
          results = allTripsRes.data.results || allTripsRes.data || [];
          isFallback = true;
        }

        setTrips(results);
        setIsFallbackResults(isFallback);
      } catch (err) {
        try {
          const allTripsRes = await api.get(`/trips/`);
          setTrips(allTripsRes.data.results || allTripsRes.data || []);
          setIsFallbackResults(true);
        } catch {
          setTrips([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [origin, destination, date, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({
      origin,
      destination,
      date,
      vehicle_type: selectedVehicleType,
    });
  };

  const handleOperatorToggle = (opId: number) => {
    if (selectedOperators.includes(opId)) {
      setSelectedOperators(selectedOperators.filter(id => id !== opId));
    } else {
      setSelectedOperators([...selectedOperators, opId]);
    }
  };

  // Client side filtration for real-time responsiveness
  const filteredTrips = trips.filter(trip => {
    const price = Number(trip.base_price);
    if (price > maxPrice) return false;
    if (selectedOperators.length > 0 && !selectedOperators.includes(trip.operator)) return false;
    if (selectedVehicleType !== 'ALL' && trip.vehicle_detail.vehicle_type !== selectedVehicleType) return false;
    if (minRating > 0 && Number(trip.operator_detail.rating) < minRating) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* COMPACT SEARCH REFINEMENT BAR */}
        <div className="bg-white rounded-2xl shadow-subtle border border-slate-200/80 p-4 mb-8">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            <div>
              <PakistanCityDropdown
                value={origin}
                onChange={setOrigin}
                placeholder="Origin City (A-Z or Province)..."
                iconColor="text-emerald-600"
              />
            </div>

            <div>
              <PakistanCityDropdown
                value={destination}
                onChange={setDestination}
                placeholder="Destination City (A-Z or Province)..."
                iconColor="text-blue-600"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                Search Journeys
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="md:hidden px-3 py-2 rounded-xl border border-slate-200 text-slate-700"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick pills & Custom Journey Generator Toggle */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-slate-500">Popular:</span>
              <button type="button" onClick={() => { setOrigin('Lahore'); setDestination('Islamabad'); }} className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">Lahore → Islamabad (375 KM)</button>
              <button type="button" onClick={() => { setOrigin('Karachi'); setDestination('Lahore'); }} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">Karachi → Lahore (1,210 KM)</button>
              <button type="button" onClick={() => { setOrigin('Islamabad'); setDestination('Murree'); }} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">Islamabad → Murree (65 KM)</button>
              <button type="button" onClick={() => { setOrigin(''); setDestination(''); setDate(''); }} className="px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold">All Routes</button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCustomPlanner(!showCustomPlanner)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-xs ${showCustomPlanner ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Write Any Custom Journey &amp; Rent Calculator</span>
                {showCustomPlanner ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => navigate('/ticket/PK-LHE-ISB-2026')}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                🎫 Print Real Ticket
              </button>
            </div>
          </div>
        </div>

        {/* EXPANDABLE CUSTOM JOURNEY PLANNER WIDGET */}
        {showCustomPlanner && (
          <div className="mb-8 animate-fadeIn">
            <CustomJourneyPlanner />
          </div>
        )}

        {/* MAIN RESULTS & FILTER LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* DESKTOP FILTERS SIDEBAR */}
          <aside className={`lg:block ${mobileFilterOpen ? 'block' : 'hidden'} lg:col-span-1 space-y-6`}>
            <div className="bg-white rounded-2xl shadow-subtle border border-slate-200/80 p-5 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-brand-600" /> Filter Journeys
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setMaxPrice(6000);
                    setSelectedOperators([]);
                    setSelectedVehicleType('ALL');
                    setMinRating(0);
                  }}
                  className="text-xs text-brand-600 hover:underline font-semibold"
                >
                  Reset
                </button>
              </div>

              {/* Price Filter */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-2 flex justify-between">
                  <span>Max Fare:</span>
                  <span className="text-brand-600 font-extrabold">Rs. {maxPrice.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min="500"
                  max="6000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-600 mt-1">
                  <span>Rs. 500</span>
                  <span>Rs. 6,000</span>
                </div>
              </div>

              {/* Transport Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2.5">Transport Mode</label>
                <div className="space-y-1.5">
                  {['ALL', 'BUS', 'TRAIN'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSelectedVehicleType(mode)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${selectedVehicleType === mode ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {mode === 'ALL' ? 'All Modes' : mode === 'BUS' ? 'Luxury Coach Buses' : 'Express High-Speed Rail'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operators */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2.5">Operators</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {operators.map((op) => (
                    <label key={op.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOperators.includes(op.id)}
                        onChange={() => handleOperatorToggle(op.id)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span>{op.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2.5">Minimum Operator Rating</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[0, 4.5, 4.8].map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => setMinRating(rt)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${minRating === rt ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {rt === 0 ? 'Any' : `${rt}+ ★`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* RESULTS CONTENT */}
          <main className="lg:col-span-3 space-y-4">
            {/* Header with Results Count and Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {filteredTrips.length} {filteredTrips.length === 1 ? 'Trip Available' : 'Trips Available'}
                </h2>
                <p className="text-xs text-slate-600">
                  {origin || 'Any Origin'} → {destination || 'Any Destination'}
                </p>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
                >
                  <option value="cheapest">Cheapest Fare</option>
                  <option value="fastest">Fastest Journey</option>
                  <option value="best_rated">Highest Rated Operator</option>
                  <option value="earliest">Earliest Departure</option>
                </select>
              </div>
            </div>

            {/* Fallback Notice Banner */}
            {isFallbackResults && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    No exact departures found for that specific filter. Showing <strong>all available departures</strong> below so you can book your journey:
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setOrigin('Lahore'); setDestination('Islamabad'); }}
                    className="px-2.5 py-1 rounded-lg bg-amber-200/60 hover:bg-amber-200 text-amber-900 font-bold"
                  >
                    Try Lahore → Islamabad
                  </button>
                  <button
                    onClick={() => navigate('/ticket/PK-LHE-ISB-2026')}
                    className="px-2.5 py-1 rounded-lg bg-brand-600 text-white font-bold"
                  >
                    🎫 Print Real Ticket
                  </button>
                </div>
              </div>
            )}

            {/* RESULTS LIST */}
            {loading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
                <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">Finding the best available journeys...</p>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No matching trips found</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Try adjusting your date or destination filters, or view all trips by leaving city fields empty.
                </p>
                <button
                  onClick={() => {
                    setOrigin('');
                    setDestination('');
                    setMaxPrice(150);
                    setSelectedOperators([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              filteredTrips.map((trip) => {
                const depDate = new Date(trip.departure_time);
                const arrDate = new Date(trip.arrival_time);
                const isTrain = trip.vehicle_detail.vehicle_type === 'TRAIN';

                return (
                  <div
                    key={trip.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-premium hover:border-brand-300 transition-all p-5 sm:p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Left: Operator & Times */}
                      <div className="space-y-4 flex-1">
                        {/* Operator badge */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-brand-700">
                            {trip.operator_detail.code}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900">{trip.operator_detail.name}</span>
                              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                                <Star className="w-3 h-3 fill-current" /> {trip.operator_detail.rating}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600">
                              {trip.vehicle_detail.model_name} • {isTrain ? 'High-Speed Rail' : 'Coach'}
                            </span>
                          </div>
                        </div>

                        {/* Journey schedule info with visual highway route track and distance meter */}
                        <div className="flex items-center gap-3 sm:gap-6">
                          {/* Departure */}
                          <div className="min-w-[110px]">
                            <span className="text-xl sm:text-2xl font-black text-slate-900">
                              {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <p className="text-xs font-black text-slate-800 mt-0.5">
                              {trip.route_detail.origin_city_detail.name}
                            </p>
                            <span className="text-[11px] text-slate-500 font-medium truncate block max-w-[140px]">
                              {trip.route_detail.origin_station_detail?.name || 'Central Terminal'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {depDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          {/* Highway Track & Distance Meter Gauge */}
                          <div className="flex-1 text-center px-1 sm:px-3">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-black tracking-tight mb-1.5 shadow-2xs">
                              <span>🛣️ {trip.route_detail?.distance_km} KM</span>
                              <span className="text-blue-300">•</span>
                              <span>{trip.duration_formatted}</span>
                            </div>
                            
                            {/* Visual Road Map Track */}
                            <div className="relative flex items-center justify-center my-1">
                              <div className="h-1 w-full bg-slate-200 rounded-full" />
                              <div className="absolute left-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                              <div className="absolute right-0 w-2.5 h-2.5 rounded-full bg-brand-600 ring-2 ring-white" />
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.2 bg-white border border-slate-300 rounded text-[9px] font-bold text-slate-600">
                                Direct Express
                              </div>
                            </div>
                            
                            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Non-Stop Highway Route</span>
                          </div>

                          {/* Arrival */}
                          <div className="min-w-[110px] text-right">
                            <span className="text-xl sm:text-2xl font-black text-brand-600">
                              {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <p className="text-xs font-black text-slate-800 mt-0.5">
                              {trip.route_detail.destination_city_detail.name}
                            </p>
                            <span className="text-[11px] text-slate-500 font-medium truncate block max-w-[140px] ml-auto">
                              {trip.route_detail.destination_station_detail?.name || 'Main Station'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {arrDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Scheduled Arrival Banner */}
                        <div className="mt-2 py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-emerald-700">🏁 Scheduled Arrival:</span>
                            <strong className="text-slate-900 font-black">
                              {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </strong>
                            <span className="text-slate-500">
                              ({arrDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })})
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-brand-700 truncate max-w-[200px]">
                            {trip.route_detail.destination_station_detail?.name || 'Main Terminal'}
                          </span>
                        </div>

                        {/* Amenities pills */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {trip.vehicle_detail.amenities.slice(0, 4).map((amenity, idx) => (
                            <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Fare, Seats left, and Action Button */}
                      <div className="lg:border-l lg:border-slate-100 lg:pl-6 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 min-w-[170px]">
                        <div className="text-left lg:text-right">
                          <span className="text-[11px] text-slate-600 block">Starting from</span>
                          <span className="text-2xl sm:text-3xl font-black text-slate-900">
                            Rs. {Number(trip.base_price).toLocaleString()}
                          </span>
                          <span className={`block text-[11px] font-bold mt-0.5 ${trip.available_seats_count <= 8 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {trip.available_seats_count} seats left
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/trips/${trip.id}`)}
                          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
                        >
                          Select Seats
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </main>

        </div>
      </div>
    </div>
  );
};
