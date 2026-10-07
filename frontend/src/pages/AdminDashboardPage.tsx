import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Ticket, DollarSign, Calendar, TrendingUp, 
  Shield, CheckCircle, XCircle, Search, Plus, Filter, 
  MapPin, Clock, AlertCircle, Tag, ChevronRight, BarChart3 
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, isOperator } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'trips' | 'users' | 'coupons'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Entities state
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allCoupons, setAllCoupons] = useState<any[]>([]);

  // Search filters
  const [bookingSearch, setBookingSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Trip cancel modal
  const [cancellingTripId, setCancellingTripId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('Inclement weather delay');

  // Coupon create modal
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [couponVal, setCouponVal] = useState(15);
  const [couponMin, setCouponMin] = useState(30);

  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics/dashboard/');
      setStats(res.data);
    } catch (err) {}
  };

  const fetchTabContent = async () => {
    try {
      if (activeTab === 'bookings') {
        const res = await api.get('/bookings/');
        setAllBookings(res.data.results || res.data || []);
      } else if (activeTab === 'trips') {
        const res = await api.get('/trips/');
        setAllTrips(res.data.results || res.data || []);
      } else if (activeTab === 'users') {
        const res = await api.get('/users/');
        setAllUsers(res.data.results || res.data || []);
      } else if (activeTab === 'coupons') {
        const res = await api.get('/coupons/');
        setAllCoupons(res.data.results || res.data || []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (!user || !isOperator) {
      navigate('/login');
      return;
    }
    setLoading(true);
    Promise.all([fetchStats(), fetchTabContent()]).finally(() => setLoading(false));
  }, [user, isOperator, activeTab]);

  const handleCancelTrip = async () => {
    if (!cancellingTripId) return;
    try {
      await api.post(`/trips/${cancellingTripId}/cancel_trip/`, {
        reason: cancelReason,
      });
      alert(`Trip #${cancellingTripId} marked as CANCELLED.`);
      setCancellingTripId(null);
      fetchTabContent();
    } catch (err) {
      alert("Error cancelling trip.");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);

      await api.post('/coupons/', {
        code: couponCode.trim().toUpperCase(),
        discount_type: couponType,
        discount_value: couponVal,
        min_booking_amount: couponMin,
        valid_to: futureDate.toISOString(),
        usage_limit: 500,
        is_active: true,
      });
      alert(`Coupon ${couponCode} created successfully!`);
      setShowCouponModal(false);
      setCouponCode('');
      fetchTabContent();
    } catch (err: any) {
      alert(err.response?.data?.code || "Error creating coupon.");
    }
  };

  const kpis = stats?.kpis || {
    total_users: 0,
    total_bookings: 0,
    today_bookings: 0,
    total_revenue: 0,
    cancelled_bookings: 0,
    active_routes: 0,
    active_operators: 0,
    available_vehicles: 0,
    active_trips: 0,
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      {/* Top Admin Banner */}
      <div className="bg-navy-950 text-white border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">Apex Operations & Admin Console</h1>
            <span className="text-[10px] text-slate-400">Enterprise Route Dispatch & Financial Controls</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live System
          </span>
          <span className="text-slate-300 font-medium">Logged in as {user?.email}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        
        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          {[
            { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
            { id: 'bookings', label: 'Bookings & Refunds', icon: Ticket },
            { id: 'trips', label: 'Trips & Schedules', icon: Clock },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'coupons', label: 'Promotions & Coupons', icon: Tag },
          ].map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tabId ? 'bg-brand-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200/60'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & CHARTS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI STAT CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-subtle space-y-1">
                <span className="text-[11px] font-bold text-slate-600 block">Total Revenue</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600">${Number(kpis.total_revenue).toFixed(2)}</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-subtle space-y-1">
                <span className="text-[11px] font-bold text-slate-600 block">Total Bookings</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900">{kpis.total_bookings}</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-subtle space-y-1">
                <span className="text-[11px] font-bold text-slate-600 block">Today's Bookings</span>
                <span className="text-xl sm:text-2xl font-black text-brand-600">{kpis.today_bookings}</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-subtle space-y-1">
                <span className="text-[11px] font-bold text-slate-600 block">Registered Users</span>
                <span className="text-xl sm:text-2xl font-black text-slate-800">{kpis.total_users}</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-subtle space-y-1">
                <span className="text-[11px] font-bold text-slate-600 block">Active Trips</span>
                <span className="text-xl sm:text-2xl font-black text-indigo-600">{kpis.active_trips}</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-subtle space-y-1">
                <span className="text-[11px] font-bold text-slate-600 block">Operators</span>
                <span className="text-xl sm:text-2xl font-black text-slate-700">{kpis.active_operators}</span>
              </div>
            </div>

            {/* CHARTS & TREND PANELS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Bookings Trend */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900">Daily Bookings (Last 7 Days)</h3>
                  <span className="text-xs font-semibold text-brand-600">Volume</span>
                </div>
                <div className="h-44 flex items-end gap-3 pt-6 px-2">
                  {(stats?.daily_bookings || []).map((day: any, i: number) => {
                    const maxCount = Math.max(...(stats?.daily_bookings || []).map((d: any) => d.count), 1);
                    const heightPercent = Math.max(15, (day.count / maxCount) * 100);

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-[10px] font-bold text-slate-700">{day.count}</span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-brand-500 rounded-t-lg transition-all"
                        />
                        <span className="text-[10px] text-slate-600 font-semibold truncate w-full text-center">
                          {day.date}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Breakdown & Popular Routes */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900">Top Popular Routes</h3>
                <div className="space-y-3">
                  {(stats?.popular_routes || []).map((r: any) => (
                    <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-800">{r.name}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600">{r.duration}</span>
                        <span className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 font-bold">
                          {r.bookings_count} bookings
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOOKINGS MANAGEMENT */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">All Reservations</h3>
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by PNR, customer..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <th className="p-3">PNR Reference</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Journey</th>
                    <th className="p-3">Departure</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {allBookings
                    .filter(b => b.booking_reference.toLowerCase().includes(bookingSearch.toLowerCase()) || b.user_email.toLowerCase().includes(bookingSearch.toLowerCase()))
                    .map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-brand-700">{b.booking_reference}</td>
                        <td className="p-3">{b.user_email}</td>
                        <td className="p-3 font-semibold text-slate-900">
                          {b.trip_detail.route_detail.origin_city_detail.name} → {b.trip_detail.route_detail.destination_city_detail.name}
                        </td>
                        <td className="p-3">{new Date(b.trip_detail.departure_time).toLocaleDateString()}</td>
                        <td className="p-3 font-bold text-slate-900">${Number(b.final_amount).toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TRIPS MANAGEMENT */}
        {activeTab === 'trips' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Scheduled Trips</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <th className="p-3">Trip ID</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Route</th>
                    <th className="p-3">Departure</th>
                    <th className="p-3">Base Fare</th>
                    <th className="p-3">Available Seats</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {allTrips.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold">#{t.id}</td>
                      <td className="p-3 font-bold text-slate-900">{t.operator_detail.name}</td>
                      <td className="p-3">
                        {t.route_detail.origin_city_detail.name} → {t.route_detail.destination_city_detail.name}
                      </td>
                      <td className="p-3">{new Date(t.departure_time).toLocaleString()}</td>
                      <td className="p-3 font-bold text-slate-900">${Number(t.base_price).toFixed(2)}</td>
                      <td className="p-3">{t.available_seats_count} seats</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === 'SCHEDULED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {t.status === 'SCHEDULED' && (
                          <button
                            onClick={() => setCancellingTripId(t.id)}
                            className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold"
                          >
                            Cancel Trip
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">User Directory</h3>
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Verified</th>
                    <th className="p-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {allUsers
                    .filter(u => u.email.toLowerCase().includes(userSearch.toLowerCase()) || (u.first_name || '').toLowerCase().includes(userSearch.toLowerCase()))
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{u.first_name} {u.last_name || u.username}</td>
                        <td className="p-3">{u.email}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700 uppercase">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">{u.phone_number || 'N/A'}</td>
                        <td className="p-3">{u.is_verified ? '✓ Verified' : 'Pending'}</td>
                        <td className="p-3">{new Date(u.date_joined).toLocaleDateString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: COUPONS */}
        {activeTab === 'coupons' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Promotions & Coupons</h3>
              <button
                onClick={() => setShowCouponModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" /> Create Coupon
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allCoupons.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-black text-sm text-brand-700">{c.code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Min Booking: ${c.min_booking_amount} • Used: {c.times_used}/{c.usage_limit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* CANCEL TRIP REASON MODAL */}
      {cancellingTripId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Cancel Scheduled Trip #{cancellingTripId}</h3>
            <p className="text-xs text-slate-600">Please provide a reason to notify booked passengers.</p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setCancellingTripId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelTrip}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateCoupon} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Create Promotional Coupon</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. SUMMER25"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                <select
                  value={couponType}
                  onChange={(e) => setCouponType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Discount Value</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={couponVal}
                  onChange={(e) => setCouponVal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Booking Amount ($)</label>
              <input
                type="number"
                min="0"
                value={couponMin}
                onChange={(e) => setCouponMin(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
              >
                Create Coupon
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
