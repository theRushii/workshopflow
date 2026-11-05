import React, { useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';

export const ReportsPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [srReport, setSrReport] = useState<any>(null);
  const [woReport, setWoReport] = useState<any>(null);
  const [revReport, setRevReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      const [sr, wo, rev] = await Promise.all([
        api.get(`/reports/service-requests?${params}`),
        api.get(`/reports/work-orders?${params}`),
        api.get(`/reports/revenue?${params}`),
      ]);
      setSrReport(sr.data);
      setWoReport(wo.data);
      setRevReport(rev.data);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadReports(); }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500 text-sm mt-0.5">Operational summary reports</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">From Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">To Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" />
        </div>
        <button onClick={loadReports} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          Generate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Service Requests Report */}
        {srReport && (
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Service Requests</h3>
            <p className="text-3xl font-bold text-blue-600 mb-4">{srReport.total}</p>
            <div className="space-y-2">
              {Object.entries(srReport.by_status || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="font-semibold text-slate-700">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Orders Report */}
        {woReport && (
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Work Orders</h3>
            <p className="text-3xl font-bold text-purple-600 mb-4">{woReport.total}</p>
            <div className="space-y-2">
              {Object.entries(woReport.by_status || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="font-semibold text-slate-700">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revenue Report */}
        {revReport && (
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Revenue</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Total Invoiced</p>
                <p className="text-xl font-bold text-slate-900">₹{Number(revReport.total_invoiced).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Collected</p>
                <p className="text-xl font-bold text-green-600">₹{Number(revReport.total_collected).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Outstanding</p>
                <p className="text-xl font-bold text-red-500">₹{Number(revReport.total_outstanding).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
