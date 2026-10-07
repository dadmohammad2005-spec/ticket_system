import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Booking } from '../types';
import { 
  Calendar, Clock, MapPin, Ticket, ShieldCheck, 
  Download, AlertCircle, CheckCircle2, ChevronRight, X, Star 
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_bookings: 0,
    upcoming_trips: 0,
    completed_trips: 0,
    cancelled_bookings: 0,
  });

  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancellingRef, setCancellingRef] = useState<string | null>(null);

  // Review modal
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchData = async () => {
    try {
      const [bookingsRes, summaryRes] = await Promise.all([
        api.get('/bookings/'),
        api.get('/bookings/summary/'),
      ]);
      setBookings(bookingsRes.data.results || bookingsRes.data || []);
      setSummary({
        total_bookings: summaryRes.data.total_bookings || 0,
        upcoming_trips: summaryRes.data.upcoming_trips || 0,
        completed_trips: summaryRes.data.completed_trips || 0,
        cancelled_bookings: summaryRes.data.cancelled_bookings || 0,
      });
    } catch (err) {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user]);

  const handleCancelBooking = async (bookingRef: string) => {
    if (!confirm("Are you sure you want to cancel this booking? Refund will be calculated automatically based on operator cancellation rules.")) {
      return;
    }
    setCancellingRef(bookingRef);
    try {
      const res = await api.post('/payments/refund/', {
        booking_reference: bookingRef,
        reason: 'Customer initiated dashboard cancellation',
      });
      alert(res.data.message || "Booking successfully cancelled.");
      fetchData();
      setSelectedBooking(null);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error cancelling booking.");
    } finally {
      setCancellingRef(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews/', {
        trip: reviewBooking.trip,
        rating,
        cleanliness_rating: rating,
        punctuality_rating: rating,
        staff_rating: rating,
        comment,
      });
      alert("Review submitted! Thank you for your feedback.");
      setReviewBooking(null);
      setComment('');
    } catch (err: any) {
      alert(err.response?.data?.error || "Error submitting review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const now = new Date();
  const upcomingBookings = bookings.filter(b => {
    const dep = new Date(b.trip_detail.departure_time);
    return dep >= now && b.status === 'CONFIRMED';
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* WELCOME HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Welcome back, {user?.first_name || 'Traveler'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Manage your upcoming trips, download boarding passes, and view booking history.
            </p>
          </div>

          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            <Ticket className="w-4 h-4" /> Book New Journey
          </Link>
        </div>

        {/* SUMMARY STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
            <span className="text-xs font-bold text-slate-600 block">Total Bookings</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{summary.total_bookings}</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
            <span className="text-xs font-bold text-emerald-600 block">Upcoming Trips</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{summary.upcoming_trips}</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
            <span className="text-xs font-bold text-slate-600 block">Completed Journeys</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-700">{summary.completed_trips}</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
            <span className="text-xs font-bold text-red-500 block">Cancelled</span>
            <span className="text-2xl sm:text-3xl font-black text-red-600">{summary.cancelled_bookings}</span>
          </div>
        </div>

        {/* TABS & BOOKING LIST */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 space-y-6">
          {/* Tab buttons */}
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'upcoming' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Upcoming Trips ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              All Booking History ({bookings.length})
            </button>
          </div>

          {/* Bookings table / cards */}
          {loading ? (
            <div className="p-10 text-center text-xs font-semibold text-slate-600">Loading your reservations...</div>
          ) : (activeTab === 'upcoming' ? upcomingBookings : bookings).length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No bookings in this category</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Ready for your next adventure? Find schedules and book tickets across thousands of destinations.
              </p>
              <Link
                to="/search"
                className="inline-block mt-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
              >
                Find Tickets Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {(activeTab === 'upcoming' ? upcomingBookings : bookings).map((b) => {
                const trip = b.trip_detail;
                const depDate = new Date(trip.departure_time);
                const isConfirmed = b.status === 'CONFIRMED';
                const isCancelled = b.status === 'CANCELLED';
                const isPast = depDate < now;

                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl border border-slate-200/90 hover:border-brand-300 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md">
                          {b.booking_reference}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${isConfirmed ? 'bg-emerald-100 text-emerald-700' : isCancelled ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {b.status}
                        </span>
                        <span className="text-xs text-slate-600">
                          {trip.operator_detail.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-slate-900">{trip.route_detail.origin_city_detail.name}</span>
                        <span className="text-xs text-slate-600 font-bold">→</span>
                        <span className="text-base font-bold text-slate-900">{trip.route_detail.destination_city_detail.name}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          {depDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>Pass: {b.total_passengers}</span>
                      </div>
                    </div>

                    {/* Right action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                      >
                        View Details
                      </button>

                      {isConfirmed && (
                        <Link
                          to={`/booking/${b.booking_reference}/confirmation`}
                          className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          E-Ticket Pass
                        </Link>
                      )}

                      {isPast && isConfirmed && (
                        <button
                          onClick={() => setReviewBooking(b)}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" /> Review
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BOOKING DETAILS MODAL */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] font-mono font-bold text-brand-600 uppercase">
                  Reservation Details
                </span>
                <h3 className="text-xl font-black text-slate-900">{selectedBooking.booking_reference}</h3>
                <span className="text-xs text-slate-600">Booked on {new Date(selectedBooking.created_at).toLocaleDateString()}</span>
              </div>

              {/* Journey info */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Operator:</span>
                  <span className="font-semibold text-slate-900">{selectedBooking.trip_detail.operator_detail.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Route:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedBooking.trip_detail.route_detail.origin_city_detail.name} → {selectedBooking.trip_detail.route_detail.destination_city_detail.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Departure:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selectedBooking.trip_detail.departure_time).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Total Paid:</span>
                  <span className="font-bold text-brand-600">${Number(selectedBooking.final_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Cancellation button */}
              {selectedBooking.status === 'CONFIRMED' && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-600 mb-3">
                    Refund percentage is calculated automatically: 100% refund up to 24h before departure, 50% between 12-24 hours.
                  </p>
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.booking_reference)}
                    disabled={cancellingRef === selectedBooking.booking_reference}
                    className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
                  >
                    {cancellingRef === selectedBooking.booking_reference ? 'Processing Cancellation...' : 'Cancel Booking & Request Refund'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REVIEW MODAL */}
        {reviewBooking && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleReviewSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setReviewBooking(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-lg font-black text-slate-900">Review Your Journey</h3>
                <p className="text-xs text-slate-600 mt-0.5">{reviewBooking.trip_detail.operator_detail.name}</p>
              </div>

              {/* Star rating selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-xl transition-all ${rating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Feedback</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share details regarding vehicle comfort, punctuality, and staff..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20"
              >
                {submittingReview ? 'Submitting...' : 'Submit Verified Review'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
