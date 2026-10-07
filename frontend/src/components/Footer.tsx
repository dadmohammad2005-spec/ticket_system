import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ShieldCheck, CreditCard } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <Ticket className="w-5 h-5 rotate-45" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                APEX<span className="text-brand-500">TICKETS</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Leading digital passenger transit ticketing platform. Connect with verified bus lines, high-speed rail operators, and regional express shuttles with guaranteed seating.
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> SSL 256-bit Encrypted</span>
              <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-brand-400" /> Instant QR Passes</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/search" className="hover:text-white transition-colors">Search All Routes</Link></li>
              <li><Link to="/search?vehicle_type=BUS" className="hover:text-white transition-colors">Luxury Coach Buses</Link></li>
              <li><Link to="/search?vehicle_type=TRAIN" className="hover:text-white transition-colors">High-Speed Rail</Link></li>
              <li><Link to="/search?popular=true" className="hover:text-white transition-colors">Popular City Pairs</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/support" className="hover:text-white transition-colors">Help Center & Tickets</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">Refund & Cancellation Rules</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">Baggage Guidelines</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">Accessibility Inquiries</Link></li>
            </ul>
          </div>

          {/* Legal / Gate */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Security & Gate</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/verify/scan" className="hover:text-white transition-colors">Gate QR Ticket Scanner</Link></li>
              <li><a href="http://localhost:8000/api/docs/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Swagger REST API Docs</a></li>
              <li><span className="text-slate-400 text-xs block mt-2">Operator Support: 1-800-555-APEX</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Apex Tickets Inc. Enterprise Ticket Booking Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
