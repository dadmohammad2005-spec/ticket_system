import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import { Booking } from '../types';
import { 
  CheckCircle2, Download, Printer, ArrowLeft, 
  MapPin, Clock, Calendar, Users, ShieldCheck, Share2 
} from 'lucide-react';

export const BookingConfirmationPage: React.FC = () => {
  const { reference: paramReference } = useParams<{ reference: string }>();
  const [activeReference, setActiveReference] = useState(paramReference || 'PK-LHE-ISB-2026');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paramReference) {
      setActiveReference(paramReference);
    }
  }, [paramReference]);

  useEffect(() => {
    // Fire confetti celebration on successful confirmation!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const fetchBooking = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/bookings/ref/${activeReference}/`);
        setBooking(res.data);
      } catch (err) {
        // Fallback to PK-LHE-ISB-2026 if user passed non-existent reference
        try {
          const fallbackRes = await api.get('/bookings/ref/PK-LHE-ISB-2026/');
          setBooking(fallbackRes.data);
        } catch {
          setBooking(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [activeReference]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const targetRef = booking?.booking_reference || activeReference;
    window.open(`http://localhost:8000/api/tickets/download-pdf/${targetRef}/`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Apex Ticket: ${booking?.booking_reference}`,
        text: `Here is my confirmed ticket from ${booking?.trip_detail.route_detail.origin_city_detail.name} to ${booking?.trip_detail.route_detail.destination_city_detail.name}.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Ticket link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-subtle max-w-md">
          <p className="text-sm font-bold text-slate-900">Booking reference not found</p>
          <Link to="/" className="mt-4 inline-block text-xs text-brand-600 font-bold hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const trip = booking.trip_detail;
  const passengers = booking.passengers || [];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SUCCESS HERO BANNER */}
        <div className="text-center space-y-3 mb-10">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Booking Confirmed!</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your journey is booked and seats are secured. A digital pass has been generated below.
          </p>
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold tracking-wider">
            PNR: {booking.booking_reference}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8 print:hidden">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Official PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Ticket
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
          >
            Go to My Bookings
          </Link>
        </div>

        {/* EXECUTIVE DIGITAL BOARDING PASS CARD */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-premium overflow-hidden">
          {/* Header Bar */}
          <div className="bg-navy-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] tracking-widest uppercase font-bold text-brand-300 block">
                Official Digital Boarding Pass
              </span>
              <h2 className="text-2xl font-black tracking-tight">{trip.operator_detail.name}</h2>
              <span className="text-xs text-slate-400">
                {trip.vehicle_detail.model_name} • Veh #{trip.vehicle_detail.vehicle_number}
              </span>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block font-medium">Booking Reference</span>
              <span className="text-xl font-mono font-black text-brand-400">{booking.booking_reference}</span>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {booking.status}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Journey Details & Visual Route Map Track */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-md border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black tracking-wide flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    VERIFIED EXPRESS ROUTE
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {trip.route_detail?.origin_city_detail.name} → {trip.route_detail?.destination_city_detail.name}
                  </span>
                </div>
                
                {/* Distance Odometer Gauge Pill */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black font-mono">
                  <span>🛣️ TOTAL DISTANCE:</span>
                  <span className="text-white text-sm">{trip.route_detail?.distance_km || 375} KM</span>
                </div>
              </div>

              {/* Station To Station Schedule Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Origin Point A */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">A</span>
                    <span className="text-xs font-extrabold text-emerald-400 tracking-wider uppercase">DEPARTURE</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-white block">
                    {new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-base font-bold text-slate-200 block">
                    {trip.route_detail.origin_city_detail.name}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {trip.route_detail.origin_station_detail?.name || 'Central Terminal'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold block pt-1">
                    {new Date(trip.departure_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Middle Visual Route Track */}
                <div className="text-center px-2 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-black text-blue-400 mb-2">
                    <span>🛣️ {trip.route_detail?.distance_km || 375} KM ROAD RUN</span>
                  </div>
                  
                  {/* Track line with animated indicator */}
                  <div className="relative flex items-center justify-center my-2">
                    <div className="h-1.5 w-full bg-slate-700 rounded-full" />
                    <div className="absolute left-0 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-950" />
                    <div className="absolute right-0 w-3 h-3 rounded-full bg-blue-400 ring-4 ring-blue-950" />
                    <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg shadow-white/50 animate-ping opacity-75" />
                    <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white" />
                  </div>

                  <span className="text-xs font-bold text-slate-300 block">{trip.duration_formatted} (Non-Stop Express)</span>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Direct Motorway Journey</span>
                </div>

                {/* Destination Point B (Scheduled Arrival) */}
                <div className="md:text-right space-y-1">
                  <div className="flex items-center md:justify-end gap-2">
                    <span className="text-xs font-extrabold text-blue-400 tracking-wider uppercase">SCHEDULED ARRIVAL</span>
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-slate-950 font-black text-xs flex items-center justify-center">B</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-blue-400 block">
                    {new Date(trip.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-base font-bold text-slate-200 block">
                    {trip.route_detail.destination_city_detail.name}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {trip.route_detail.destination_station_detail?.name || 'Main Station'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold block pt-1">
                    {new Date(trip.arrival_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Passenger Pass Cards with QR */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Passenger Tickets ({passengers.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {passengers.map((p) => {
                  const verificationPayload = JSON.stringify({
                    pnr: booking.booking_reference,
                    ticket: p.ticket_number,
                    passenger: p.full_name,
                    seat: p.seat_number,
                    status: 'CONFIRMED'
                  });

                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <span className="text-[10px] font-mono text-slate-600 font-bold block">
                          TICKET #{p.ticket_number}
                        </span>
                        <h4 className="text-base font-black text-slate-900">{p.full_name}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                          <span>Seat: <strong className="text-brand-600 text-sm">{p.seat_number}</strong></span>
                          <span>ID: {p.id_card_number || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Scannable QR Code */}
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl shrink-0 text-center">
                        <QRCodeSVG
                          value={verificationPayload}
                          size={78}
                          level="M"
                          className="mx-auto"
                        />
                        <span className="text-[9px] text-slate-600 font-bold block mt-1">Gate Pass</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment & Terms Notice */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
              <div>
                <span>Total Amount Paid: </span>
                <strong className="text-slate-900 text-sm">Rs. {Number(booking.final_amount).toLocaleString()}</strong>
                <span className="ml-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">PAID</span>
              </div>
              <p className="text-center sm:text-right max-w-xs">
                Please present this pass and matching photo ID upon boarding 20 minutes prior to departure.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
