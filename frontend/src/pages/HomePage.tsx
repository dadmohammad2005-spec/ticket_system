import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { City, Route } from '../types';
import { 
  Search, MapPin, Calendar, Users, Bus, Train, ShieldCheck, 
  Clock, Award, ArrowRight, Star, ChevronRight, Sparkles 
} from 'lucide-react';
import { CustomJourneyPlanner } from '../components/CustomJourneyPlanner';
import { PakistanCityDropdown } from '../components/PakistanCityDropdown';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const [cities, setCities] = useState<City[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<Route[]>([]);
  const [originCity, setOriginCity] = useState('Lahore');
  const [destinationCity, setDestinationCity] = useState('Islamabad');
  const [departureDate, setDepartureDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [passengers, setPassengers] = useState(1);
  const [vehicleType, setVehicleType] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citiesRes, routesRes] = await Promise.all([
          api.get('/locations/cities/popular/'),
          api.get('/routes/popular/')
        ]);
        setCities(citiesRes.data || []);
        setPopularRoutes(routesRes.data || []);
      } catch (err) {
        // Fallback default cities if API empty
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (originCity) query.append('origin', originCity);
    if (destinationCity) query.append('destination', destinationCity);
    if (departureDate) query.append('date', departureDate);
    if (passengers) query.append('passengers', passengers.toString());
    if (vehicleType !== 'ALL') query.append('vehicle_type', vehicleType);

    navigate(`/search?${query.toString()}`);
  };

  const handleQuickRoute = (r: Route) => {
    navigate(`/search?origin=${encodeURIComponent(r.origin_city_detail.name)}&destination=${encodeURIComponent(r.destination_city_detail.name)}&date=${departureDate}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-navy-950 via-slate-900 to-brand-950 text-white pt-16 pb-28 sm:pt-24 sm:pb-36 overflow-hidden">
        {/* Glow ambient effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-200 mb-8 animate-pulse-slow">
            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            <span>Guaranteed Seats • Instant E-Passes • Zero Hidden Fees</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Book Your Journey With <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">Confidence</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal">
            Search, compare and book your tickets quickly and securely across top coach and high-speed rail lines.
          </p>

          {/* SEARCH INTERFACE BOX */}
          <div className="mt-12 max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 border border-slate-100">
            {/* Mode Tabs */}
            <div className="flex items-center gap-2 pb-6 mb-6 border-b border-slate-100 overflow-x-auto">
              <button
                type="button"
                onClick={() => setVehicleType('ALL')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${vehicleType === 'ALL' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All Transport
              </button>
              <button
                type="button"
                onClick={() => setVehicleType('BUS')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${vehicleType === 'BUS' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Bus className="w-4 h-4" /> Luxury Bus
              </button>
              <button
                type="button"
                onClick={() => setVehicleType('TRAIN')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${vehicleType === 'TRAIN' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Train className="w-4 h-4" /> Express Rail
              </button>
            </div>

            {/* Quick Routes Selector Pills - Pakistan Inter-City Transport */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">🇵🇰 Pakistan Routes:</span>
              <button
                type="button"
                onClick={() => { setOriginCity('Lahore'); setDestinationCity('Islamabad'); }}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${originCity === 'Lahore' && destinationCity === 'Islamabad' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Lahore → Islamabad (375 km • 4.5h • Rs. 2,400)
              </button>
              <button
                type="button"
                onClick={() => { setOriginCity('Islamabad'); setDestinationCity('Lahore'); }}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${originCity === 'Islamabad' && destinationCity === 'Lahore' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Islamabad → Lahore (375 km • 4.5h • Rs. 2,400)
              </button>
              <button
                type="button"
                onClick={() => { setOriginCity('Lahore'); setDestinationCity('Karachi'); }}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${originCity === 'Lahore' && destinationCity === 'Karachi' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Lahore → Karachi (1,210 km • 16h • Rs. 4,800)
              </button>
              <button
                type="button"
                onClick={() => { setOriginCity('Islamabad'); setDestinationCity('Peshawar'); }}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${originCity === 'Islamabad' && destinationCity === 'Peshawar' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Islamabad → Peshawar (185 km • 2.2h • Rs. 1,600)
              </button>
              <button
                type="button"
                onClick={() => { setOriginCity('Islamabad'); setDestinationCity('Murree'); }}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${originCity === 'Islamabad' && destinationCity === 'Murree' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Islamabad → Murree (65 km • 1.2h • Rs. 1,100)
              </button>
            </div>

            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {/* Departure Location (Pakistan Dropdown & Custom Input) */}
              <div>
                <PakistanCityDropdown
                  label="From Location (Pakistan & Custom)"
                  value={originCity}
                  onChange={setOriginCity}
                  placeholder="Select or type origin city..."
                  iconColor="text-brand-600"
                  required
                />
              </div>

              {/* Destination Location (Pakistan Dropdown & Custom Input) */}
              <div>
                <PakistanCityDropdown
                  label="Destination (Pakistan & Custom)"
                  value={destinationCity}
                  onChange={setDestinationCity}
                  placeholder="Select or type destination city..."
                  iconColor="text-brand-600"
                  required
                />
              </div>

              {/* Departure Date */}
              <div className="relative p-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-brand-500 focus-within:bg-white transition-all">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" /> Departure Date
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-transparent font-semibold text-slate-900 text-sm focus:outline-none"
                />
              </div>

              {/* Passengers & Search Button */}
              <div className="flex gap-2">
                <div className="w-1/3 relative p-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-brand-500 focus-within:bg-white transition-all">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-brand-600" /> Seats
                  </label>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full bg-transparent font-semibold text-slate-900 text-sm focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} {num > 1 ? 'seats' : 'seat'}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-base shadow-lg shadow-brand-600/30 transition-all cursor-pointer"
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* QUICK ACTIONS FOOTER INSIDE HERO BOX */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Instant Boarding Pass:</span>
                <button
                  type="button"
                  onClick={() => navigate('/ticket/PK-LHE-ISB-2026')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition-all cursor-pointer shadow-xs"
                >
                  🎫 Print Real Ticket: Lahore → Islamabad (375 KM • PK-LHE-ISB-2026)
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate('/search?origin=Lahore&destination=Islamabad')}
                className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-bold hover:underline"
              >
                <span>Browse All Pakistan Scheduled Trips</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* WRITE YOUR OWN JOURNEY & INSTANT TICKET SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-6">
        <CustomJourneyPlanner />
      </section>

      {/* POPULAR ROUTES SECTION */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Top Travel Connections</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-1">Popular Intercity Routes</h2>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="mt-3 sm:mt-0 text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Browse all routes <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularRoutes.length > 0 ? (
            popularRoutes.slice(0, 6).map((route) => (
              <div
                key={route.id}
                onClick={() => handleQuickRoute(route)}
                className="group p-5 bg-white rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-premium hover:border-brand-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-brand-500" /> {route.duration_formatted}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                      {Math.round(route.distance_km)} km
                    </span>
                  </div>

                  <div className="flex items-center gap-3 my-2">
                    <span className="text-base font-bold text-slate-900">{route.origin_city_detail?.name}</span>
                    <ArrowRight className="w-4 h-4 text-brand-500 group-hover:translate-x-1 transition-transform" />
                    <span className="text-base font-bold text-slate-900">{route.destination_city_detail?.name}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Multiple Daily Departures</span>
                  <span className="text-xs font-bold text-brand-600 group-hover:underline flex items-center gap-0.5">
                    View Trips <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-slate-600">Loading popular routes...</div>
          )}
        </div>
      </section>

      {/* WHY APEX PLATFORM (VALUE PILLARS) */}
      <section className="py-16 bg-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Premium Experience</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-1">Why Travelers Choose Apex</h2>
            <p className="text-slate-600 text-sm mt-2">Every feature designed to provide seamless, predictable, and stress-free travel booking.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Live Seat Selection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose your exact window, aisle, or VIP seat on our interactive vehicle layout. Double-booking is mathematically prevented.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Instant QR Boarding Passes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download high-res PDF passes or scan directly from your phone at the terminal gate for contactless boarding.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Clear Cancellation Rules</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Flexible cancellations with clear refund windows: 100% refund up to 24h prior, 50% between 12-24 hours.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Verified Operators Only</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Only inspected, regulated transport operators with authentic customer reviews are permitted on our platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VERIFIED CUSTOMER REVIEWS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900">Loved by Thousands of Commuters</h2>
          <p className="text-sm text-slate-600 mt-2">Authentic feedback from verified passengers on recent journeys.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <p className="text-sm text-slate-700 italic">
              "The seat selection showed exactly where the power socket and extra legroom was. Train was on time, boarding with QR on my phone took 5 seconds."
            </p>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-900">Ayesha Khan</p>
              <p className="text-[11px] text-slate-600">Lahore → Islamabad • Faisal Movers</p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <p className="text-sm text-slate-700 italic">
              "Hands down the cleanest luxury coach I've taken. Reclining leather seats, strong Wi-Fi, and the digital ticket had all terminal gate details clearly laid out."
            </p>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-900">Muhammad Usman</p>
              <p className="text-[11px] text-slate-600">Islamabad → Murree • Daewoo Express</p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <p className="text-sm text-slate-700 italic">
              "I had to cancel 2 days prior due to a meeting shift. The refund calculation was instant and credited back without any complicated paperwork."
            </p>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-900">Zainab Fatima</p>
              <p className="text-[11px] text-slate-600">Karachi → Lahore • Green Line Rail</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
