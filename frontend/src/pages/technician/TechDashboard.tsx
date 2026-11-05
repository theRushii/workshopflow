import React, { useEffect, useState } from 'react';
import { Wrench, CheckCircle, Clock, PauseCircle, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { PageLoader } from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const PRIORITY_BADGE: Record<string, string> = {
  low: 'badge-low', medium: 'badge-medium', high: 'badge-high', urgent: 'badge-urgent',
};

export const TechDashboard = () => {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/technician-portal/dashboard');
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard. Ask admin to link your profile.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleAvailability = async () => {
    if (!data) return;
    setToggling(true);
    try {
      const newVal = !data.technician.is_available;
      await api.patch(`/technician-portal/availability?available=${newVal}`);
      setData((prev: any) => ({
        ...prev,
        technician: { ...prev.technician, is_available: newVal }
      }));
      toast.success(newVal ? 'You are now Available' : 'You are now Unavailable');
    } catch {
      toast.error('Failed to update availability');
    } finally { setToggling(false); }
  };

  if (loading) return <PageLoader />;

  if (!data) return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="card p-12 text-center">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="font-bold text-slate-700 mb-1">Profile Not Linked</p>
        <p className="text-sm text-slate-400 max-w-xs mx-auto">Your login account hasn't been linked to a technician profile yet. Ask your admin to link it.</p>
      </div>
    </div>
  );

  const { technician, stats, recent_work_orders } = data;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Welcome, {technician.full_name}</h1>
          <p className="page-subtitle">{technician.skills || 'Technician'}</p>
        </div>
        {/* Availability toggle */}
        <button
          onClick={toggleAvailability}
          disabled={toggling}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border font-semibold text-sm transition-all ${
            technician.is_available
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
          }`}
        >
          {technician.is_available
            ? <><ToggleRight className="w-5 h-5 text-emerald-500" /> Available</>
            : <><ToggleLeft className="w-5 h-5 text-slate-400" /> Unavailable</>
          }
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending',   value: stats.pending,   icon: Clock,        bg: 'bg-amber-50',   ic: 'text-amber-600'   },
          { label: 'Active',    value: stats.active,    icon: Wrench,       bg: 'bg-blue-50',    ic: 'text-blue-600'    },
          { label: 'On Hold',   value: stats.on_hold,   icon: PauseCircle,  bg: 'bg-orange-50',  ic: 'text-orange-600'  },
          { label: 'Completed', value: stats.completed, icon: CheckCircle,  bg: 'bg-emerald-50', ic: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
              <s.icon className={`w-5 h-5 ${s.ic}`} />
            </div>
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Work Orders */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="font-bold text-slate-800">Active Work Orders</p>
          <Link to="/technician/work-orders" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">View all →</Link>
        </div>
        {recent_work_orders.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No active work orders assigned to you.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="table-th">WO #</th>
                <th className="table-th">Customer</th>
                <th className="table-th hidden md:table-cell">Title</th>
                <th className="table-th">Priority</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent_work_orders.map((wo: any) => (
                <tr key={wo.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="table-td">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{wo.work_order_number}</span>
                  </td>
                  <td className="table-td font-semibold text-slate-800 text-sm">{wo.customer_name || '—'}</td>
                  <td className="table-td hidden md:table-cell text-slate-600 text-sm max-w-[200px] truncate">{wo.title}</td>
                  <td className="table-td">
                    <span className={PRIORITY_BADGE[wo.priority] || 'badge-medium'}>{wo.priority}</span>
                  </td>
                  <td className="table-td"><StatusBadge status={wo.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
