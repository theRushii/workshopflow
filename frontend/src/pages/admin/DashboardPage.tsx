import React, { useEffect, useState } from 'react';
import {
  Users, ClipboardList, Wrench, UserCog,
  TrendingUp, Clock, CheckCircle, AlertCircle, RefreshCw, ArrowUpRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { DashboardSummary } from '../../types';
import { PageLoader } from '../../components/LoadingSpinner';

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconClass: string;
  bgClass: string;
  sub?: string;
  link?: string;
  alert?: boolean;
}

const StatCard = ({ label, value, icon: Icon, iconClass, bgClass, sub, link, alert }: StatCardProps) => (
  <div className={`bg-white rounded-2xl border p-5 transition-all duration-200 hover:shadow-md group ${alert ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-200/80'}`}>
    <div className="flex items-start justify-between mb-5">
      <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>
      {link && (
        <Link to={link} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-slate-100">
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Link>
      )}
    </div>
    <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
    <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">{label}</p>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label, prefix = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl">
      <p className="text-slate-400 mb-0.5">{label}</p>
      <p className="font-bold">{prefix}{payload[0].value?.toLocaleString('en-IN')}</p>
    </div>
  );
};

export const DashboardPage = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(false);
    try {
      const [s, c] = await Promise.all([api.get('/dashboard/summary'), api.get('/dashboard/charts')]);
      setSummary(s.data);
      setCharts(c.data);
    } catch { setError(true); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageLoader />;

  if (error) return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="card p-14 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="font-bold text-slate-700 mb-1">Failed to load dashboard</p>
        <p className="text-sm text-slate-400 mb-5">Check that the backend is running.</p>
        <button onClick={() => load()} className="btn-primary">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Rajesh Engineering Works — Operations Overview</p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Customers"    value={summary?.total_customers ?? 0}       icon={Users}         iconClass="text-blue-600"    bgClass="bg-blue-50"    link="/admin/customers" />
        <StatCard label="Service Requests"   value={summary?.total_service_requests ?? 0} icon={ClipboardList} iconClass="text-violet-600"  bgClass="bg-violet-50"  link="/admin/service-requests" />
        <StatCard label="Pending Reviews"    value={summary?.pending_requests ?? 0}       icon={Clock}         iconClass="text-amber-600"   bgClass="bg-amber-50"   sub="Awaiting action" alert={(summary?.pending_requests ?? 0) > 0} link="/admin/service-requests" />
        <StatCard label="Active Work Orders" value={summary?.active_work_orders ?? 0}     icon={Wrench}        iconClass="text-orange-600"  bgClass="bg-orange-50"  link="/admin/work-orders" />
        <StatCard label="Completed Jobs"     value={summary?.completed_jobs ?? 0}         icon={CheckCircle}   iconClass="text-emerald-600" bgClass="bg-emerald-50" link="/admin/work-orders" />
        <StatCard label="Technicians"        value={summary?.total_technicians ?? 0}      icon={UserCog}       iconClass="text-cyan-600"    bgClass="bg-cyan-50"    link="/admin/technicians" />
        <StatCard label="Unpaid Invoices"    value={summary?.unpaid_invoices ?? 0}        icon={AlertCircle}   iconClass="text-red-500"     bgClass="bg-red-50"     sub="Pending payment" alert={(summary?.unpaid_invoices ?? 0) > 0} link="/admin/invoices" />
        <StatCard
          label="Revenue Collected"
          value={`₹${Number(summary?.revenue_collected ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          iconClass="text-emerald-600"
          bgClass="bg-emerald-50"
          link="/admin/payments"
        />
      </div>

      {/* Charts row */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Monthly requests — 2 cols */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-slate-800">Monthly Service Requests</p>
                <p className="text-xs text-slate-400 mt-0.5">Current year overview</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={charts.monthly_requests} margin={{ top: 0, right: 4, left: -18, bottom: 0 }} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 6 }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Requests" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* WO status pie — 1 col */}
          <div className="card p-5">
            <p className="text-sm font-bold text-slate-800 mb-1">Work Order Status</p>
            <p className="text-xs text-slate-400 mb-4">Current distribution</p>
            {charts.work_order_status?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={charts.work_order_status} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={2} stroke="#fff">
                      {charts.work_order_status.map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {charts.work_order_status.slice(0, 4).map((d: any, i: number) => (
                    <div key={d.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-600 capitalize">{d.label}</span>
                      </div>
                      <span className="font-bold text-slate-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] text-slate-300">
                <Wrench className="w-8 h-8 mb-2" />
                <span className="text-sm">No work orders yet</span>
              </div>
            )}
          </div>

          {/* Revenue area — full width */}
          <div className="card p-5 lg:col-span-3">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-slate-800">Revenue This Year</p>
                <p className="text-xs text-slate-400 mt-0.5">Monthly payments collected (₹)</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={charts.monthly_revenue} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                <Tooltip content={<CustomTooltip prefix="₹" />} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5}
                  fill="url(#revGrad)" dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
