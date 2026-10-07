import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Trip, Seat } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Check, ShieldCheck, MapPin, 
  Users, CreditCard, AlertCircle, Info, Tag 
} from 'lucide-react';

interface PassengerForm {
  seat_id: number;
  seat_number: string;
  price: number;
  full_name: string;
  id_card_number: string;
  phone: string;
  email: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  age: number;
}

export const TripDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1); // 1: Seats, 2: Passengers, 3: Payment

  // Seat selection
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [lockingError, setLockingError] = useState<string | null>(null);

  // Passenger forms
  const [passengers, setPassengers] = useState<PassengerForm[]>([]);
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone_number || '');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Payment
  const [paymentProvider, setPaymentProvider] = useState<'SANDBOX_MOCK' | 'STRIPE' | 'JAZZCASH'>('SANDBOX_MOCK');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await api.get(`/trips/${id}/`);
        setTrip(res.data);
      } catch (err) {
        setTrip(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id]);

  useEffect(() => {
    if (user) {
      if (!contactEmail) setContactEmail(user.email);
      if (!contactPhone && user.phone_number) setContactPhone(user.phone_number);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading trip schedule & seat map...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-subtle max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Trip Not Found</h2>
          <p className="text-xs text-slate-600 mt-1 mb-4">This trip may have departed or is no longer scheduled.</p>
          <button
            onClick={() => navigate('/search')}
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const seatsLayout: Seat[] = trip.seats_layout || [];

  // Toggle seat selection
  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'available' && !selectedSeatIds.includes(seat.id)) return;

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds(selectedSeatIds.filter(sid => sid !== seat.id));
    } else {
      if (selectedSeatIds.length >= 6) {
        alert("Maximum of 6 seats can be booked in a single reservation.");
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.id]);
    }
  };

  // Calculate pricing
  const selectedSeats = seatsLayout.filter(s => selectedSeatIds.includes(s.id));
  const subtotal = selectedSeats.reduce((acc, s) => acc + (s.price || Number(trip.base_price)), 0);
  const totalFare = Math.max(0, subtotal - couponDiscount);

  // Validate coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponMessage(null);
    try {
      const res = await api.post('/coupons/validate_coupon/', {
        code: couponCode.trim(),
        amount: subtotal,
      });
      if (res.data.valid) {
        setCouponDiscount(Number(res.data.discount_amount));
        setCouponMessage(`Discount of $${res.data.discount_amount} applied!`);
      }
    } catch (err: any) {
      setCouponDiscount(0);
      setCouponMessage(err.response?.data?.message || 'Invalid or expired coupon code.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Proceed from Step 1 to Step 2
  const handleProceedToPassengers = async () => {
    if (selectedSeatIds.length === 0) {
      alert("Please select at least one seat to proceed.");
      return;
    }

    setLockingError(null);
    try {
      // Call server-side lock API to hold seats
      await api.post(`/trips/${trip.id}/lock_seats/`, {
        seat_ids: selectedSeatIds,
      });

      // Prepare passenger forms
      const newPassengers: PassengerForm[] = selectedSeats.map(seat => {
        const existing = passengers.find(p => p.seat_id === seat.id);
        return existing || {
          seat_id: seat.id,
          seat_number: seat.seat_number,
          price: seat.price || Number(trip.base_price),
          full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
          id_card_number: user?.id_card_number || '',
          phone: contactPhone,
          email: contactEmail,
          gender: 'MALE',
          age: 28,
        };
      });

      setPassengers(newPassengers);
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setLockingError(err.response?.data?.error || "Could not reserve selected seats. They may have just been booked by another passenger.");
    }
  };

  // Proceed from Step 2 to Step 3
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail || !contactPhone) {
      alert("Please enter contact email and phone number.");
      return;
    }
    for (const p of passengers) {
      if (!p.full_name.trim()) {
        alert(`Please enter full name for passenger on Seat ${p.seat_number}`);
        return;
      }
    }

    if (!user) {
      alert("Please log in or create an account to finalize your booking.");
      navigate('/login');
      return;
    }

    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Checkout & Payment
  const handleProcessPayment = async () => {
    setProcessingPayment(true);
    setPaymentError(null);

    try {
      // 1. Create Booking in database
      const bookingRes = await api.post('/bookings/', {
        trip_id: trip.id,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        coupon_code: couponCode.trim() || undefined,
        passengers: passengers.map(p => ({
          seat_id: p.seat_id,
          full_name: p.full_name,
          id_card_number: p.id_card_number,
          phone: p.phone,
          email: p.email,
          gender: p.gender,
          age: p.age,
        })),
      });

      const bookingRef = bookingRes.data.booking_reference;

      // 2. Process Payment through payment gateway layer
      const payRes = await api.post('/payments/checkout/', {
        booking_reference: bookingRef,
        provider: paymentProvider,
        payment_details: {
          card_number: cardNumber,
          card_expiry: cardExpiry,
          card_cvc: cardCvc,
        },
      });

      if (payRes.data.success) {
        navigate(`/booking/${bookingRef}/confirmation`);
      } else {
        setPaymentError(payRes.data.error || 'Payment failed.');
      }
    } catch (err: any) {
      setPaymentError(err.response?.data?.error || err.response?.data?.message || 'Error processing reservation.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const rowsCount = trip.vehicle_detail.total_rows || 10;
  const seatsPerRow = trip.vehicle_detail.seats_per_row || 4;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP PROGRESS INDICATOR */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (currentStep === 1) navigate('/search');
              else setCurrentStep((currentStep - 1) as any);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {currentStep === 1 ? 'Search Results' : currentStep === 2 ? 'Seat Selection' : 'Passenger Details'}
          </button>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto w-full">
              {[
                { step: 1, label: 'Select Seats' },
                { step: 2, label: 'Passenger Info' },
                { step: 3, label: 'Payment' },
              ].map(({ step, label }) => (
                <div key={step} className="flex items-center gap-2.5 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep === step ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : currentStep > step ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {currentStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  <span className={`text-xs font-bold ${currentStep === step ? 'text-slate-900' : 'text-slate-600'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {lockingError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{lockingError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* STEP 1: INTERACTIVE SEAT SELECTION */}
            {currentStep === 1 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Select Your Seats</h2>
                    <p className="text-xs text-slate-600 mt-0.5">Click on available seats to reserve (Up to 6 seats)</p>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-slate-100 border border-slate-300 inline-block" /> Available</span>
                    <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-brand-600 inline-block" /> Selected</span>
                    <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-slate-300 inline-block" /> Booked</span>
                  </div>
                </div>

                <div className="max-w-md mx-auto p-6 bg-slate-100/70 rounded-3xl border-2 border-dashed border-slate-300">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-300/60 text-xs font-bold text-slate-600">
                    <span className="bg-white px-3 py-1 rounded-full shadow-xs">Front of Vehicle</span>
                    <span className="text-[11px] bg-slate-200 px-2 py-0.5 rounded">Driver Cabin</span>
                  </div>

                  <div className="space-y-3">
                    {Array.from({ length: rowsCount }, (_, rIdx) => {
                      const rowNum = rIdx + 1;
                      const rowSeats = seatsLayout.filter(s => s.row === rowNum);

                      return (
                        <div key={rowNum} className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-600 w-4">{rowNum}</span>
                          
                          <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3">
                            {rowSeats.map((seat, cIdx) => {
                              const isSelected = selectedSeatIds.includes(seat.id);
                              const isBooked = seat.status === 'booked';
                              const isLocked = seat.status === 'locked';

                              return (
                                <React.Fragment key={seat.id}>
                                  {cIdx === Math.floor(seatsPerRow / 2) && (
                                    <div className="w-4 sm:w-8 text-center text-[9px] text-slate-600 select-none">
                                      AISLE
                                    </div>
                                  )}

                                  <button
                                    type="button"
                                    disabled={isBooked || isLocked}
                                    onClick={() => handleSeatClick(seat)}
                                    className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30 scale-105' : isBooked || isLocked ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-800 border border-slate-300 hover:border-brand-500 hover:shadow-xs'}`}
                                  >
                                    <span>{seat.seat_number}</span>
                                    {seat.seat_type === 'VIP' && (
                                      <span className="text-[8px] leading-none opacity-80">VIP</span>
                                    )}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-600 font-medium">Selected Seats:</span>
                    <span className="ml-1 text-sm font-bold text-slate-900">
                      {selectedSeats.map(s => s.seat_number).join(', ') || 'None'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={selectedSeatIds.length === 0}
                    onClick={handleProceedToPassengers}
                    className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all cursor-pointer"
                  >
                    Continue to Passenger Details →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PASSENGER INFORMATION */}
            {currentStep === 2 && (
              <form onSubmit={handleProceedToPayment} className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 sm:p-8">
                  <h2 className="text-xl font-extrabold text-slate-900 mb-1">Passenger Information</h2>
                  <p className="text-xs text-slate-600 mb-6">Enter official travel details matching government ID</p>

                  <div className="space-y-6">
                    {passengers.map((p, index) => (
                      <div key={p.seat_id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                            Passenger {index + 1} • Seat {p.seat_number}
                          </span>
                          <span className="text-xs font-bold text-slate-900">${p.price.toFixed(2)}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Sarah Jenkins"
                              value={p.full_name}
                              onChange={(e) => {
                                const updated = [...passengers];
                                updated[index].full_name = e.target.value;
                                setPassengers(updated);
                              }}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-brand-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">CNIC / Passport Number</label>
                            <input
                              type="text"
                              placeholder="e.g. US-PASSPORT-98234"
                              value={p.id_card_number}
                              onChange={(e) => {
                                const updated = [...passengers];
                                updated[index].id_card_number = e.target.value;
                                setPassengers(updated);
                              }}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-brand-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                            <select
                              value={p.gender}
                              onChange={(e) => {
                                const updated = [...passengers];
                                updated[index].gender = e.target.value as any;
                                setPassengers(updated);
                              }}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-brand-500 bg-white"
                            >
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                            <input
                              type="number"
                              min="1"
                              max="120"
                              value={p.age}
                              onChange={(e) => {
                                const updated = [...passengers];
                                updated[index].age = Number(e.target.value);
                                setPassengers(updated);
                              }}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-brand-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Ticket Delivery Contact</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email *</label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-brand-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone *</label>
                        <input
                          type="tel"
                          required
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-brand-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition-all cursor-pointer"
                    >
                      Proceed to Payment →
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: PAYMENT & CONFIRMATION */}
            {currentStep === 3 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Secure Payment</h2>
                  <p className="text-xs text-slate-600 mt-0.5">Payment credentials are processed via isolated PCI-ready simulator.</p>
                </div>

                {paymentError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'SANDBOX_MOCK', label: '1-Click Simulator', icon: CreditCard },
                    { id: 'STRIPE', label: 'Credit Card', icon: ShieldCheck },
                    { id: 'JAZZCASH', label: 'Mobile Wallet', icon: Users },
                  ].map(({ id: gId, label, icon: Icon }) => (
                    <button
                      key={gId}
                      type="button"
                      onClick={() => setPaymentProvider(gId as any)}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${paymentProvider === gId ? 'border-brand-600 bg-brand-50/50 text-brand-700 ring-2 ring-brand-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1.5" />
                      <span className="block text-xs font-bold">{label}</span>
                    </button>
                  ))}
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-semibold bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Expires</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-semibold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Security CVC</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-semibold bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2 text-xs">
                    <span className="text-slate-600 font-medium">Quick Test:</span>
                    <button
                      type="button"
                      onClick={() => setCardNumber('4242 4242 4242 4242')}
                      className="text-brand-600 font-bold hover:underline"
                    >
                      Valid Card
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setCardNumber('4242 4242 4242 0002')}
                      className="text-red-600 font-bold hover:underline"
                    >
                      Decline Simulator
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-600 block">Total Due</span>
                    <span className="text-2xl font-black text-slate-900">Rs. {totalFare.toLocaleString()}</span>
                  </div>

                  <button
                    type="button"
                    disabled={processingPayment}
                    onClick={handleProcessPayment}
                    className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {processingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Confirming Reservation...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>Pay Rs. {totalFare.toLocaleString()} & Generate Tickets</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SUMMARY SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-6">
              <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
                Journey Summary
              </h3>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-sm">
                  {trip.operator_detail.code}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{trip.operator_detail.name}</h4>
                  <p className="text-xs text-slate-600">{trip.vehicle_detail.model_name}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">{trip.route_detail.origin_city_detail.name}</span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {trip.route_detail.origin_station_detail?.name || 'Central Terminal'}
                    </span>
                    <span className="text-slate-600 font-semibold">{new Date(trip.departure_time).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pl-2">
                  <div className="border-l-2 border-dashed border-slate-300 pl-4 py-2 space-y-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-200">
                      🛣️ Distance Meter: {trip.route_detail.distance_km || 375} KM
                    </span>
                    <div className="text-[11px] text-slate-600 font-semibold">
                      {trip.duration_formatted} (Non-stop direct express)
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">{trip.route_detail.destination_city_detail.name}</span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {trip.route_detail.destination_station_detail?.name || 'Main Station'}
                    </span>
                    <span className="text-emerald-700 font-bold">
                      🏁 Scheduled Arrival: {new Date(trip.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(trip.arrival_time).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-600" /> Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. APEX15"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold uppercase focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className={`text-[11px] font-semibold mt-1.5 ${couponDiscount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {couponMessage}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Seats Selected:</span>
                  <span className="font-bold text-slate-900">{selectedSeats.length}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">Rs. {subtotal.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount:</span>
                    <span>-Rs. {couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Amount:</span>
                  <span className="text-brand-600 font-black">Rs. {totalFare.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" /> Cancellation Policy
                </div>
                <p className="leading-relaxed">
                  {trip.operator_detail.cancellation_policy}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
