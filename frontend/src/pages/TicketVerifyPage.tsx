import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, AlertCircle, CheckCircle2, QrCode, 
  MapPin, Clock, Calendar, User, Search, Check 
} from 'lucide-react';

export const TicketVerifyPage: React.FC = () => {
  const { ticketCode: routeCode } = useParams<{ ticketCode: string }>();
  const { isOperator } = useAuth();

  const [ticketInput, setTicketInput] = useState(routeCode && routeCode !== 'scan' ? routeCode : '');
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gateMsg, setGateMsg] = useState<string | null>(null);

  const verifyTicket = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setGateMsg(null);

    try {
      const res = await api.get(`/tickets/verify/${codeToVerify.trim()}/`);
      setTicketData(res.data);
    } catch (err: any) {
      setTicketData(null);
      setErrorMsg(err.response?.data?.message || 'Ticket code is invalid or does not exist in the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeCode && routeCode !== 'scan') {
      verifyTicket(routeCode);
    }
  }, [routeCode]);

  const handleValidateGate = async () => {
    if (!ticketData) return;
    try {
      const res = await api.post(`/tickets/validate-gate/${ticketData.ticket_code}/`);
      setGateMsg(res.data.message);
      setTicketData({ ...ticketData, is_validated: true });
    } catch (err: any) {
      alert("Error marking ticket as validated.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
            <QrCode className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Gate Ticket Scanner & Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Scan passenger QR code or enter ticket reference to verify authenticity and check-in status.
          </p>
        </div>

        {/* INPUT BOX */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-3">
          <label className="block text-xs font-bold text-slate-700">Ticket Reference Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. TC-849204A1 or APX-DEMO2026-1A"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-semibold focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={() => verifyTicket(ticketInput)}
              disabled={loading || !ticketInput.trim()}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" /> Verify
            </button>
          </div>
        </div>

        {/* VERIFICATION RESULTS */}
        {loading && (
          <div className="p-8 text-center text-xs font-bold text-slate-600">Verifying security signature...</div>
        )}

        {errorMsg && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-3xl flex items-center gap-4 text-red-700">
            <AlertCircle className="w-8 h-8 shrink-0 text-red-500" />
            <div>
              <h3 className="font-bold text-sm">Ticket Verification Failed</h3>
              <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {gateMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{gateMsg}</span>
          </div>
        )}

        {ticketData && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-premium p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-slate-600 block">
                  PNR: {ticketData.booking_reference}
                </span>
                <h3 className="text-lg font-black text-slate-900">{ticketData.passenger_name}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${ticketData.is_validated ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {ticketData.is_validated ? '✓ Boarded' : 'Valid Ticket'}
              </span>
            </div>

            {/* Grid breakdown */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 block font-medium">Assigned Seat</span>
                <span className="text-lg font-black text-brand-600">{ticketData.seat_number}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 block font-medium">Passenger ID Card</span>
                <span className="text-sm font-bold text-slate-900">{ticketData.id_card || 'Verified upon booking'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 block font-medium">Route</span>
                <span className="text-sm font-bold text-slate-900">{ticketData.route}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 block font-medium">Operator</span>
                <span className="text-sm font-bold text-slate-900">{ticketData.operator}</span>
              </div>
            </div>

            {/* Staff Gate Checkin button */}
            {isOperator && !ticketData.is_validated && (
              <button
                onClick={handleValidateGate}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5" /> Validate & Check-In Passenger for Boarding
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
