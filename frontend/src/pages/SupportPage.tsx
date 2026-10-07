import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { SupportTicket } from '../types';
import { Headphones, Plus, Send, MessageSquare, HelpCircle } from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);

  // New ticket modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('BOOKING');
  const [priority, setPriority] = useState('MEDIUM');
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);

  // Reply message
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/support/');
      const list = res.data.results || res.data || [];
      setTickets(list);
      if (list.length > 0 && !selectedTicket) {
        setSelectedTicket(list[0]);
      }
    } catch (err) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/support/', {
        subject,
        category,
        priority,
        initial_message: message,
      });
      alert(`Support Ticket #${res.data.ticket_number} opened successfully!`);
      setShowNewModal(false);
      setSubject('');
      setMessage('');
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error opening ticket.");
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await api.post(`/support/${selectedTicket.id}/reply/`, {
        message: replyText.trim(),
      });
      setReplyText('');
      const updated = await api.get(`/support/${selectedTicket.id}/`);
      setSelectedTicket(updated.data);
      fetchTickets();
    } catch (err) {
      alert("Error sending message.");
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
              <Headphones className="w-8 h-8 text-brand-600" /> Customer Support Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Need assistance with your booking, seat allocation, or refund? Our dedicated team is here 24/7.
            </p>
          </div>

          {user && (
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Open New Support Ticket
            </button>
          )}
        </div>

        {/* TICKET INTERACTION PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT LIST */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-5 space-y-4">
            <h2 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Your Support Inquiries ({tickets.length})
            </h2>

            {!user ? (
              <div className="p-6 text-center text-xs text-slate-600">
                Please log in to submit or view support tickets.
              </div>
            ) : loading ? (
              <div className="p-6 text-center text-xs text-slate-600">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-600 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No active support tickets.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${selectedTicket?.id === t.id ? 'bg-brand-50/70 border-brand-300 text-brand-900' : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[10px] font-bold text-brand-700">{t.ticket_number}</span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {t.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-xs truncate">{t.subject}</h3>
                    <span className="text-[10px] text-slate-600 block mt-1">
                      {new Date(t.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT CONVERSATION THREAD */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 flex flex-col justify-between min-h-[500px]">
            {selectedTicket ? (
              <>
                <div className="space-y-6">
                  {/* Ticket Header */}
                  <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-brand-600">
                        {selectedTicket.ticket_number} • {selectedTicket.category}
                      </span>
                      <h3 className="text-lg font-black text-slate-900">{selectedTicket.subject}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${selectedTicket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {selectedTicket.status}
                    </span>
                  </div>

                  {/* Messages Bubble History */}
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
                    {selectedTicket.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.is_staff_reply ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-slate-600">
                          <span>{m.is_staff_reply ? '🛡️ Apex Support Agent' : m.sender_name || 'You'}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`p-4 rounded-2xl max-w-md text-xs leading-relaxed ${m.is_staff_reply ? 'bg-slate-100 text-slate-900 rounded-tl-none' : 'bg-brand-600 text-white rounded-tr-none'}`}>
                          {m.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply Box */}
                {selectedTicket.status !== 'CLOSED' && (
                  <form onSubmit={handleSendReply} className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your response to support agent..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-brand-500 bg-slate-50"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4" /> Send
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="m-auto text-center py-16 text-slate-600 space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">Select a ticket to view message thread</p>
              </div>
            )}
          </div>

        </div>

        {/* CREATE TICKET MODAL */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleCreateTicket} className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-lg text-slate-900">Open Support Ticket</h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question regarding seat re-assignment"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="BOOKING">Booking Assistance</option>
                    <option value="PAYMENT">Payment Issue</option>
                    <option value="CANCELLATION">Cancellation & Reschedule</option>
                    <option value="REFUND">Refund Inquiry</option>
                    <option value="BAGGAGE">Baggage Guidelines</option>
                    <option value="OTHER">General Inquiries</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent Departure</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide details or booking reference to assist our agent..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20"
                >
                  {creating ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
