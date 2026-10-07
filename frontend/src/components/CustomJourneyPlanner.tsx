import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import {
  MapPin, Calendar, Clock, User, Sparkles, Printer,
  Download, ArrowRight, CheckCircle2, AlertCircle, Compass, Ticket
} from 'lucide-react';
import { PakistanCityDropdown } from './PakistanCityDropdown';

interface CustomTicketResult {
  booking_reference: string;
  origin_city: string;
  destination_city: string;
  origin_station: string;
  destination_station: string;
  distance_km: number;
  duration_formatted: string;
  rent: number;
  departure_time: string;
  arrival_time: string;
  passenger_name: string;
  seat_number: string;
  ticket_number: string;
  qr_data: string;
  ticket_url: string;
  print_url: string;
  pdf_url: string;
}

const CITY_SUGGESTIONS = [
  'Lahore', 'Islamabad', 'Karachi', 'Rawalpindi', 'Peshawar',
  'Faisalabad', 'Multan', 'Murree', 'Quetta', 'Gwadar',
  'Skardu', 'Gilgit', 'Abbottabad', 'Swat', 'Sialkot',
  'Gujranwala', 'Hyderabad', 'Bahawalpur', 'Sukkur',
  'Rahim Yar Khan', 'Muzaffarabad', 'Mirpur', 'Sahiwal', 'Ziarat'
];

export const CustomJourneyPlanner: React.FC = () => {
  const navigate = useNavigate();

  const [origin, setOrigin] = useState('Lahore');
  const [destination, setDestination] = useState('Islamabad');
  const [passengerName, setPassengerName] = useState('Muhammad Ali');
  const [seatNumber, setSeatNumber] = useState('1A');
  const [departureDate, setDepartureDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [departureTime, setDepartureTime] = useState('09:00');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketResult, setTicketResult] = useState<CustomTicketResult | null>(null);

  const handleSubmitJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      setError('Please write both your journey start and destination city.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/trips/custom_journey/', {
        origin: origin.trim(),
        destination: destination.trim(),
        passenger_name: passengerName.trim() || 'Muhammad Ali',
        seat_number: seatNumber.trim() || '1A',
        departure_date: departureDate,
        departure_time: departureTime,
      });

      if (res.data.success) {
        setTicketResult(res.data);
      } else {
        setError(res.data.error || 'Failed to calculate journey rent and ticket.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Could not calculate journey rent. Please verify the city names.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (ticketResult?.booking_reference) {
      window.open(
        `http://127.0.0.1:8000/api/tickets/download-pdf/${ticketResult.booking_reference}/`,
        '_blank'
      );
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden my-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-indigo-950 p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-black tracking-wider uppercase mb-2">
              <Compass className="w-3.5 h-3.5" />
              Write Any Journey Across All Pakistan Cities
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Instant Ticket &amp; Destination Rent Calculator
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Type any starting city and destination. We calculate the exact highway kilometers, travel rent (fare), scheduled arrival time, and prepare your printable boarding pass immediately.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono font-bold bg-white/10 px-4 py-2 rounded-2xl border border-white/10 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE ODOMETER &amp; FARE ENGINE</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* INPUT FORM: Write Journey and Destination */}
        <form onSubmit={handleSubmitJourney} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Origin Input (Alphabetical Pakistan Dropdown & Custom Typing) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Write Starting City (Origin)
              </label>
              <PakistanCityDropdown
                value={origin}
                onChange={setOrigin}
                placeholder="Select or type starting city..."
                iconColor="text-emerald-600"
                required
              />
              <span className="text-[10px] text-slate-500 font-medium block">
                Type any city or pick from A-Z provinces
              </span>
            </div>

            {/* Destination Input (Alphabetical Pakistan Dropdown & Custom Typing) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Write Destination City
              </label>
              <PakistanCityDropdown
                value={destination}
                onChange={setDestination}
                placeholder="Select or type destination..."
                iconColor="text-blue-600"
                required
              />
              <span className="text-[10px] text-slate-500 font-medium block">
                Select any Pakistan city from all provinces
              </span>
            </div>

            {/* Departure Date & Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                Departure Date &amp; Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-slate-300 font-semibold text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-600"
                />
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-slate-300 font-semibold text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-600"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                Scheduled departure schedule
              </span>
            </div>

            {/* Passenger & Seat */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Passenger &amp; Seat
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Passenger Name"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="col-span-2 w-full px-3 py-3 rounded-xl border border-slate-300 font-semibold text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-600"
                />
                <input
                  type="text"
                  placeholder="Seat"
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value.toUpperCase())}
                  className="col-span-1 w-full px-2 py-3 rounded-xl border border-slate-300 font-black text-xs text-center text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-600 uppercase"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                Name &amp; Seat assignment
              </span>
            </div>

          </div>

          {/* Quick Route Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="font-bold text-slate-500">Quick Write:</span>
            {[
              { from: 'Lahore', to: 'Islamabad', label: 'Lahore → Islamabad' },
              { from: 'Karachi', to: 'Lahore', label: 'Karachi → Lahore' },
              { from: 'Islamabad', to: 'Peshawar', label: 'Islamabad → Peshawar' },
              { from: 'Islamabad', to: 'Murree', label: 'Islamabad → Murree' },
              { from: 'Rawalpindi', to: 'Skardu', label: 'Rawalpindi → Skardu' },
              { from: 'Karachi', to: 'Gwadar', label: 'Karachi → Gwadar' },
            ].map(({ from, to, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => { setOrigin(from); setDestination(to); }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500">
              ⚡ Instant calculation of <strong>Rent (Rs.)</strong>, <strong>Kilometers (KM)</strong>, and <strong>Arrival Time</strong>.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Calculating Rent &amp; Generating Ticket...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Journey &amp; Show Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* RESULTS: TICKET & RENT OF DESTINATION SHOWN DIRECTLY */}
        {ticketResult && (
          <div className="space-y-6 pt-6 border-t border-slate-200 animate-fadeIn">
            
            {/* Rent & Distance Telemetry Summary Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Rent of this Destination */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-xs">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                  💰 Rent of Destination
                </span>
                <span className="text-3xl font-black text-emerald-700 mt-1 block">
                  Rs. {ticketResult.rent.toLocaleString()}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                  Official Standard Fare
                </span>
              </div>

              {/* Distance Meter (Kilometers) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 shadow-xs">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 block">
                  🛣️ Distance Meter
                </span>
                <span className="text-3xl font-black text-blue-700 mt-1 block">
                  {ticketResult.distance_km} KM
                </span>
                <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
                  Total Road / Rail Distance
                </span>
              </div>

              {/* Scheduled Departure */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                  🛫 Departure Time
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {new Date(ticketResult.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold mt-1 block truncate">
                  {ticketResult.origin_city} ({ticketResult.origin_station})
                </span>
              </div>

              {/* What Time We Arrive */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-xs">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 block">
                  🏁 What Time We Arrive
                </span>
                <span className="text-2xl font-black text-amber-900 mt-1 block">
                  {new Date(ticketResult.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[11px] text-amber-700 font-semibold mt-1 block truncate">
                  {ticketResult.destination_city} ({ticketResult.duration_formatted} run)
                </span>
              </div>

            </div>

            {/* VISUAL ROUTE MAP & HIGHWAY TRACK */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-md border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono font-bold text-emerald-400">HIGHWAY RUN VERIFIED</span>
                </div>
                <div className="font-mono text-slate-400">
                  PNR: <strong className="text-white text-sm">{ticketResult.booking_reference}</strong>
                </div>
              </div>

              {/* Visual Map Track */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Station A */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">A</span>
                    <span className="text-xs font-black text-emerald-400 uppercase">STARTING POINT</span>
                  </div>
                  <span className="text-2xl font-black text-white block">
                    {new Date(ticketResult.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-base font-bold text-slate-200 block">{ticketResult.origin_city}</span>
                  <span className="text-xs text-slate-400 block">{ticketResult.origin_station}</span>
                </div>

                {/* Middle Odometer Gauge */}
                <div className="text-center px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-blue-400 mb-2">
                    <span>🛣️ {ticketResult.distance_km} KILOMETERS</span>
                  </div>
                  <div className="relative flex items-center justify-center my-2">
                    <div className="h-1.5 w-full bg-slate-700 rounded-full" />
                    <div className="absolute left-0 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-950" />
                    <div className="absolute right-0 w-3 h-3 rounded-full bg-blue-400 ring-4 ring-blue-950" />
                    <div className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-slate-300 block">
                    Travel Duration: {ticketResult.duration_formatted}
                  </span>
                </div>

                {/* Station B (Arrival) */}
                <div className="md:text-right">
                  <div className="flex items-center md:justify-end gap-2 mb-1">
                    <span className="text-xs font-black text-blue-400 uppercase">DESTINATION ARRIVAL</span>
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-slate-950 font-black text-xs flex items-center justify-center">B</span>
                  </div>
                  <span className="text-2xl font-black text-blue-400 block">
                    {new Date(ticketResult.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-base font-bold text-slate-200 block">{ticketResult.destination_city}</span>
                  <span className="text-xs text-slate-400 block">{ticketResult.destination_station}</span>
                </div>
              </div>
            </div>

            {/* REAL BOARDING PASS READY TO PRINT */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                    OFFICIAL BOARDING PASS READY
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                    {ticketResult.origin_city} → {ticketResult.destination_city}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Carrier: Daewoo Express Pakistan • Executive Luxury Coach
                  </p>
                </div>

                {/* Print & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Print Real Ticket
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button
                    onClick={() => navigate(ticketResult.ticket_url)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs border border-brand-200 transition-all cursor-pointer"
                  >
                    <Ticket className="w-4 h-4" /> Full View
                  </button>
                </div>
              </div>

              {/* Boarding Pass Body & QR Code */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="space-y-3 flex-1 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-slate-500 font-semibold block">Passenger Name</span>
                      <strong className="text-sm text-slate-900 font-black">{ticketResult.passenger_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Seat Number</span>
                      <strong className="text-base text-brand-600 font-black">{ticketResult.seat_number}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Rent (Fare Paid)</span>
                      <strong className="text-base text-emerald-700 font-black">Rs. {ticketResult.rent.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">PNR Reference</span>
                      <strong className="text-sm font-mono text-slate-900 font-black">{ticketResult.booking_reference}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500 font-semibold block">Departure</span>
                      <span className="text-slate-800 font-bold">
                        {new Date(ticketResult.departure_time).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block">Scheduled Arrival Time</span>
                      <span className="text-amber-800 font-black">
                        {new Date(ticketResult.arrival_time).toLocaleString()} ({ticketResult.duration_formatted})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scannable Gate QR Code */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shrink-0 text-center shadow-xs">
                  <QRCodeSVG
                    value={ticketResult.qr_data || ticketResult.booking_reference}
                    size={90}
                    level="M"
                    className="mx-auto"
                  />
                  <span className="text-[10px] text-slate-600 font-mono font-bold block mt-1.5">
                    {ticketResult.ticket_number}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold block">
                    ✓ Gate Verified
                  </span>
                </div>
              </div>

              {/* Hint */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Seats reserved and validated. Present ticket at boarding gate.
                </span>
                <span className="font-mono text-slate-400">
                  Total Road Run: {ticketResult.distance_km} KM
                </span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
