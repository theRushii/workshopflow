import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search, XCircle, RefreshCw, MapPin, Clock, Hash } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface TrackResult {
  reference_number: string;
  customer_name: string;
  status: string;
  problem_description: string;
  created_at: string;
  updated_at: string;
  status_history: Array<{
    id: string;
    old_status?: string;
    new_status: string;
    notes?: string;
    changed_by?: string;
    created_at: string;
  }>;
}

export const TrackPage = () => {
  const [result,  setResult]  = useState<TrackResult | null>(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { register, handleSubmit } = useForm<{ reference: string }>({
    defaultValues: { reference: searchParams.get('ref') || '' },
  });

  const search = async (data: { reference: string }) => {
    if (!data.reference.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.get(`/public/track/${data.reference.trim().toUpperCase()}`);
      setResult(res.data);
    } catch {
      setError('No service request found with this reference. Please check and try again.');
    } finally { setLoading(false); }
  };

  React.useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) search({ reference: ref });
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="bg-[#0f2240] text-white py-14">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">Track Your Request</h1>
          <p className="text-blue-200 text-sm">Enter your service request reference number to check the current status.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Search form */}
        <form onSubmit={handleSubmit(search)} className="flex gap-3 mb-7">
          <div className="relative flex-1">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              {...register('reference')}
              className="input-field pl-10 uppercase font-mono tracking-widest text-slate-800 placeholder-slate-300"
              placeholder="REQ-2026-XXXXXX"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary px-6">
            {loading
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <><Search className="w-4 h-4" /> Track</>
            }
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Header bar */}
            <div className="bg-gradient-to-r from-[#0f2240] to-[#1e3a5f] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-1">Reference Number</p>
                  <p className="text-2xl font-black text-white font-mono tracking-wider">{result.reference_number}</p>
                </div>
                <div className="flex-shrink-0 mt-1">
                  <StatusBadge status={result.status} />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Quick info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Customer</p>
                  <p className="text-sm font-bold text-slate-800">{result.customer_name}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Submitted</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(result.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Service Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">{result.problem_description}</p>
              </div>

              {/* Timeline */}
              {result.status_history.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-4">Progress Timeline</p>
                  <div className="space-y-0">
                    {[...result.status_history].reverse().map((h, i, arr) => (
                      <div key={h.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 border-2 ${
                            i === 0
                              ? 'bg-blue-500 border-blue-500 ring-2 ring-blue-100'
                              : 'bg-white border-slate-300'
                          }`} />
                          {i < arr.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1 min-h-[20px]" />}
                        </div>
                        <div className="pb-4 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <StatusBadge status={h.new_status} />
                            <span className="text-xs text-slate-400">{new Date(h.created_at).toLocaleString('en-IN')}</span>
                          </div>
                          {h.notes && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 mt-1">{h.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
