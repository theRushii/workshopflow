import React, { useEffect, useState } from 'react';
import { Wrench, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { WorkOrder } from '../../types';
import { PageLoader } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';

const STATUSES = ['assigned', 'in_progress', 'on_hold', 'completed'];
const PRIORITY_BADGE: Record<string, string> = {
  low: 'badge-low', medium: 'badge-medium', high: 'badge-high', urgent: 'badge-urgent',
};

export const TechWorkOrders = () => {
  const [orders,      setOrders]      = useState<WorkOrder[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<WorkOrder | null>(null);
  const [statusModal, setStatusModal] = useState(false);

  const { register, handleSubmit, reset } = useForm<{ status: string; notes: string }>();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/technician-portal/work-orders');
      setOrders(res.data);
    } catch {
      toast.error('Failed to load work orders');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openStatusUpdate = (wo: WorkOrder) => {
    setSelected(wo);
    reset({ status: wo.status, notes: '' });
    setStatusModal(true);
  };

  const onStatusSubmit = async (data: { status: string; notes: string }) => {
    if (!selected) return;
    try {
      await api.patch(`/technician-portal/work-orders/${selected.id}/status`, data);
      toast.success('Status updated');
      setStatusModal(false);
      setSelected(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error updating status');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Work Orders</h1>
          <p className="page-subtitle">{orders.length} assigned to you</p>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {orders.length === 0 ? (
            <EmptyState
              icon={<Wrench className="w-7 h-7 text-slate-400" />}
              title="No work orders assigned"
              description="Work orders assigned to you by the admin will appear here."
            />
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="table-th">WO #</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th hidden md:table-cell">Title</th>
                  <th className="table-th">Priority</th>
                  <th className="table-th">Status</th>
                  <th className="table-th hidden sm:table-cell">Scheduled</th>
                  <th className="table-th w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(wo => (
                  <tr key={wo.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="table-td">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{wo.work_order_number}</span>
                    </td>
                    <td className="table-td font-semibold text-slate-800">{wo.customer_name || '—'}</td>
                    <td className="table-td hidden md:table-cell text-slate-600 max-w-[180px] truncate">{wo.title}</td>
                    <td className="table-td">
                      <span className={PRIORITY_BADGE[wo.priority] || 'badge-medium'}>{wo.priority}</span>
                    </td>
                    <td className="table-td"><StatusBadge status={wo.status} /></td>
                    <td className="table-td hidden sm:table-cell text-slate-400 text-xs">
                      {wo.scheduled_date || '—'}
                    </td>
                    <td className="table-td">
                      {wo.status !== 'completed' && wo.status !== 'cancelled' && (
                        <button
                          onClick={() => openStatusUpdate(wo)}
                          className="opacity-0 group-hover:opacity-100 btn-primary text-xs px-3 py-1.5 transition-all"
                        >
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Detail / Status Update Modal */}
      {selected && !statusModal && (
        <Modal open={true} onClose={() => setSelected(null)} title={`Work Order ${selected.work_order_number}`} size="md">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Customer',  v: selected.customer_name || '—' },
                { l: 'Priority',  v: <span className={PRIORITY_BADGE[selected.priority]}>{selected.priority}</span> },
                { l: 'Status',    v: <StatusBadge status={selected.status} /> },
                { l: 'Scheduled', v: selected.scheduled_date || '—' },
              ].map(({ l, v }) => (
                <div key={l} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{l}</p>
                  <div className="font-semibold text-slate-800">{v}</div>
                </div>
              ))}
              <div className="col-span-2 bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Title</p>
                <p className="font-semibold text-slate-800">{selected.title}</p>
              </div>
              {selected.description && (
                <div className="col-span-2 bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Description</p>
                  <p className="text-slate-700 leading-relaxed">{selected.description}</p>
                </div>
              )}
            </div>
            {selected.status !== 'completed' && selected.status !== 'cancelled' && (
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button onClick={() => { reset({ status: selected.status, notes: '' }); setStatusModal(true); }} className="btn-primary">
                  Update Status
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Work Order Status" size="sm">
        <form onSubmit={handleSubmit(onStatusSubmit)} className="space-y-4">
          <div>
            <label className="form-label">New Status</label>
            <select {...register('status')} className="input-field">
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Progress Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea {...register('notes')} rows={3} className="input-field resize-none" placeholder="Describe what was done or why status changed…" />
          </div>
          <div className="flex gap-2.5 justify-end">
            <button type="button" onClick={() => setStatusModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Update Status</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
