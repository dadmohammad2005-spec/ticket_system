import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (type: 'customer' | 'admin' | 'operator') => {
    if (type === 'customer') {
      setEmail('customer@apextickets.com');
      setPassword('Customer@12345');
    } else if (type === 'admin') {
      setEmail('admin@apextickets.com');
      setPassword('Admin@12345');
    } else {
      setEmail('operator@apextickets.com');
      setPassword('Operator@12345');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-premium">
        
        {/* LOGO */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <Ticket className="w-5 h-5 rotate-45" />
            </div>
            <span className="text-xl font-extrabold text-navy-900 tracking-tight">
              APEX<span className="text-brand-600">TICKETS</span>
            </span>
          </Link>
          <h2 className="mt-5 text-2xl font-black text-slate-900">Sign in to your account</h2>
          <p className="text-xs text-slate-600 mt-1">
            Access your tickets, boarding passes, and booking history
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* DEMO QUICK BUTTONS */}
        <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-1.5">
          <span className="text-[11px] font-bold text-slate-600 block">1-Click Demo Login:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillQuickDemo('customer')}
              className="flex-1 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('admin')}
              className="flex-1 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('operator')}
              className="flex-1 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
            >
              Operator
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-sm shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:underline">
            Register now
          </Link>
        </p>

      </div>
    </div>
  );
};
