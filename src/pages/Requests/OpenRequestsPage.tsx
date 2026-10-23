import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  AlertCircle,
  Clock,
  Filter,
  Send,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRequests, sendQuote } from '../../lib/api/requests';
import { ServiceRequest } from '../../types';
import { RequestCard } from '../../components/common/RequestCard';

export const OpenRequestsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUrgent, setFilterUrgent] = useState(false);

  // Quote Modal state
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [quotePrice, setQuotePrice] = useState<string>('650');
  const [quoteMessage, setQuoteMessage] = useState<string>('');
  const [sendingQuote, setSendingQuote] = useState(false);
  const [quoteSentSuccess, setQuoteSentSuccess] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const list = await getRequests({
        urgency: filterUrgent ? 'emergency' : undefined,
        status: 'open',
      });
      setRequests(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterUrgent]);

  const handleOpenQuoteModal = (req: ServiceRequest) => {
    setSelectedRequest(req);
    setQuotePrice(req.budgetMin ? String(req.budgetMin) : '500');
    setQuoteMessage('I can visit your location with full tools and diagnostic meters.');
    setQuoteSentSuccess(false);
  };

  const handleSendQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !quotePrice) return;

    setSendingQuote(true);
    try {
      await sendQuote({
        requestId: selectedRequest.id,
        providerId: user?.id || 'pro_ramesh_01',
        providerName: user?.name || 'Ramesh Kumar',
        providerAvatar: user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        providerRating: 4.9,
        providerPhone: user?.phone || '+91 98450 12345',
        price: Number(quotePrice),
        message: quoteMessage.trim(),
      });

      setQuoteSentSuccess(true);
      setTimeout(() => {
        setSelectedRequest(null);
        fetchRequests();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingQuote(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-navy leading-tight">
          {t('open_requests.title')}
        </h1>
        <p className="text-xs text-gray-600 mt-0.5">
          {t('open_requests.subtitle')}
        </p>
      </div>

      {/* Filter Tabs: All vs Urgent */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterUrgent(false)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
            !filterUrgent
              ? 'bg-navy text-white border-navy shadow-sm'
              : 'bg-white text-navy border-sage-border hover:bg-sage-light'
          }`}
        >
          {t('open_requests.filter_all')}
        </button>

        <button
          type="button"
          onClick={() => setFilterUrgent(true)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
            filterUrgent
              ? 'bg-coral text-white border-coral shadow-sm'
              : 'bg-white text-navy border-sage-border hover:bg-coral-light'
          }`}
        >
          <AlertCircle size={14} />
          <span>{t('open_requests.filter_emergency')}</span>
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-3 pt-2">
          {[1, 2].map((i) => (
            <div key={i} className="ll-card p-4 animate-pulse space-y-3">
              <div className="h-4 bg-sage-light rounded w-1/3" />
              <div className="h-5 bg-sage-light rounded w-3/4" />
              <div className="h-3 bg-sage-light rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="ll-card p-8 text-center space-y-2 bg-salmon-light/30 border-salmon">
          <Briefcase size={28} className="text-navy mx-auto opacity-60" />
          <h3 className="font-bold text-navy text-sm">{t('open_requests.no_open_requests')}</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Check back in a few minutes or adjust your trade categories in profile settings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              role="provider"
              onSendQuote={handleOpenQuoteModal}
            />
          ))}
        </div>
      )}

      {/* Send Quote Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-sage-border overflow-hidden">
            <div className="px-5 py-4 border-b border-sage-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-teal" />
                <h3 className="text-sm font-bold text-navy">{t('open_requests.quote_modal_title')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-full text-gray-400 hover:text-navy"
              >
                <X size={20} />
              </button>
            </div>

            {quoteSentSuccess ? (
              <div className="p-8 text-center space-y-3 bg-teal-light">
                <CheckCircle2 size={40} className="text-teal mx-auto animate-bounce" />
                <h4 className="font-extrabold text-navy text-base">Quote Sent to Customer!</h4>
                <p className="text-xs text-gray-600">
                  The customer has been alerted and can accept your quote immediately.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendQuoteSubmit} className="p-5 space-y-4">
                <div className="p-3 rounded-xl bg-sage-light text-xs text-navy border border-sage-border">
                  <span className="font-bold block text-navy mb-0.5">{selectedRequest.title}</span>
                  <span className="text-gray-500">{selectedRequest.address}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    {t('open_requests.quote_amount_label')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-gray-500 font-bold">₹</span>
                    <input
                      type="number"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      placeholder="e.g. 500"
                      className="ll-input pl-8"
                      required
                    />
                  </div>
                  {selectedRequest.budgetMax && (
                    <span className="text-[11px] text-gray-500 mt-1 block">
                      Customer budget hint: Up to ₹{selectedRequest.budgetMax}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">
                    {t('open_requests.quote_message_label')}
                  </label>
                  <textarea
                    rows={3}
                    value={quoteMessage}
                    onChange={(e) => setQuoteMessage(e.target.value)}
                    placeholder={t('open_requests.quote_message_placeholder')}
                    className="ll-input resize-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="flex-1 ll-btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={sendingQuote || !quotePrice}
                    className="flex-1 ll-btn-primary"
                  >
                    {sendingQuote ? t('common.loading') : t('open_requests.submit_quote')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
