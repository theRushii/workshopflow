import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Eye, Wrench } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { WorkOrder, Customer, Technician } from '../../types';
import { PageLoader } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';

const STATUSES   = ['', 'pending', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const PRIORITY_BADGE: Record<string, string> = {
  low:    'badge-low',
  medium: 'badge-medium',
  high:   'badge-high',
  urgent: 'badge-urgent',
};

export const WorkOrdersPage = () => {
  const [orders,      setOrders]      = useState<WorkOrder[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('');
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<WorkOrder | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [customers,   setCustomers]   = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const { register: regCreate, handleSubmit: handleCreate, reset: resetCreate, formState: { errors: createErrors } } = useForm<any>();
  const { register: regStatus, handleSubmit: handleStatusSubmit, reset: resetStatus } = useForm<any>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), page_size: '20' });
      if (search) p.set('search', search);
      if (statusFilter) p.set('status', statusFilter);
      const res = await api.get(`/work-orders?${p}`);
      setOrders(res.data.items);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/customers?page_size=500').then(r => setCustomers(r.data.items));
    api.get('/technicians?active_only=true').then(r => setTechnicians(r.data.items));
  }, []);

  const openDetail = async (wo: WorkOrder) => {
    const res = await api.get(`/work-orders/${wo.id}`);
    setSelected(res.data);
    setDetailModal(true);
  };
  const onCreateSubmit = async (data: any) => {
    try {
      await api.post('/work-orders', { ...data, technician_id: data.technician_id || undefined, scheduled_date: data.scheduled_date || undefined });
      toast.success('Work order created');
      setCreateModal(false);
      resetCreate();
      load();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Error'); }
  };
  const onStatusChange = async (data: any) => {
    if (!selected) return;
    try {
      await api.patch(`/work-orders/${selected.id}/status`, { status: data.status, notes: data.notes });
      toast.success('Status updated');
      setStatusModal(false);
      setDetailModal(false);
      setSelected(null);
      load();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Work Orders</h1>
          <p className="page-subtitle">{total} total work orders</p>
        </div>
        <button onClick={() => { resetCreate(); setCreateModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> New Work Order
        </button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" placeholder="Search by WO number or title…" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto min-w-[150px]">
          {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase()) : 'All Statuses'}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {orders.length === 0 ? (
            <EmptyState icon={<Wrench className="w-7 h-7 text-slate-400" />} title="No work orders" description="Convert a service request or create one manually." action={<button onClick={() => setCreateModal(true)} className="btn-primary">New Work Order</button>} />
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="table-th">WO Number</th>
                    <th className="table-th">Customer</th>
                    <th className="table-th hidden md:table-cell">Title</th>
                    <th className="table-th">Priority</th>
                    <th className="table-th">Status</th>
                    <th className="table-th hidden lg:table-cell">Technician</th>
                    <th className="table-th w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(wo => (
                    <tr key={wo.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="table-td">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{wo.work_order_number}</span>
                      </td>
                      <td className="table-td font-semibold text-slate-800">{wo.customer_name || '—'}</td>
                      <td className="table-td hidden md:table-cell max-w-[200px]">
                        <p className="text-sm text-slate-600 truncate">{wo.title}</p>
                      </td>
                      <td className="table-td">
                        <span className={PRIORITY_BADGE[wo.priority] || 'badge-pending'}>{wo.priority}</span>
                      </td>
                      <td className="table-td"><StatusBadge status={wo.status} /></td>
                      <td className="table-td hidden lg:table-cell text-slate-500 text-sm">{wo.technician_name || <span className="text-slate-300">Unassigned</span>}</td>
                      <td className="table-td">
                        <button onClick={() => openDetail(wo)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 border-t border-slate-100">
                <Pagination page={page} total={total} pageSize={20} onChange={setPage} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selected && detailModal && (
        <Modal open={true} onClose={() => { setDetailModal(false); setSelected(null); }} title={`Work Order ${selected.work_order_number}`} size="lg">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Customer',   val: selected.customer_name || '—' },
                { label: 'Technician', val: selected.technician_name || 'Not assigned' },
                { label: 'Priority',   val: <span className={PRIORITY_BADGE[selected.priority] || ''}>{selected.priority}</span> },
                { label: 'Status',     val: <StatusBadge status={selected.status} /> },
              ].map(({ label, val }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                  <div className="text-sm font-semibold text-slate-800">{val}</div>
                </div>
              ))}
              <div className="col-span-2 bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Title</p>
                <p className="text-sm font-semibold text-slate-800">{selected.title}</p>
              </div>
              {selected.description && (
                <div className="col-span-2 bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{selected.description}</p>
                </div>
              )}
              {selected.work_performed && (
                <div className="col-span-2 bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Work Performed</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{selected.work_performed}</p>
                </div>
              )}
            </div>

            {selected.status_history.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Status Timeline</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selected.status_history.map((h, i) => (
                    <div key={h.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${i === selected.status_history.length - 1 ? 'bg-blue-500 ring-2 ring-blue-200' : 'bg-slate-300'}`} />
                        {i < selected.status_history.length - 1 && <div className="w-px bg-slate-200 mt-1 min-h-[16px]" />}
                      </div>
                      <div className="pb-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={h.new_status} />
                          <span className="text-xs text-slate-400">{new Date(h.created_at).toLocaleString('en-IN')}</span>
                          {h.changed_by && <span className="text-xs text-slate-400">by {h.changed_by}</span>}
                        </div>
                        {h.notes && <p className="text-xs text-slate-500 mt-0.5">{h.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2.5 justify-end pt-1 border-t border-slate-100">
              {selected.status !== 'completed' && selected.status !== 'cancelled' && (
                <button onClick={() => { resetStatus({ status: selected.status, notes: '' }); setStatusModal(true); }} className="btn-secondary">
                  Update Status
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Work Order Status" size="sm">
        <form onSubmit={handleStatusSubmit(onStatusChange)} className="space-y-4">
          <div>
            <label className="form-label">New Status</label>
            <select {...regStatus('status')} className="input-field">
              {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea {...regStatus('notes')} rows={3} className="input-field resize-none" placeholder="Optional notes…" />
          </div>
          <div className="flex gap-2.5 justify-end">
            <button type="button" onClick={() => setStatusModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Update Status</button>
          </div>
        </form>
      </Modal>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Work Order" size="lg">
        <form onSubmit={handleCreate(onCreateSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Customer <span className="text-red-400">*</span></label>
              <select {...regCreate('customer_id', { required: true })} className="input-field">
                <option value="">— Select customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>)}
              </select>
              {createErrors.customer_id && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div>
              <label className="form-label">Technician</label>
              <select {...regCreate('technician_id')} className="input-field">
                <option value="">— Assign later —</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Title <span className="text-red-400">*</span></label>
              <input {...regCreate('title', { required: true })} className="input-field" placeholder="Brief job title" autoFocus />
            </div>
            <div className="col-span-2">
              <label className="form-label">Description</label>
              <textarea {...regCreate('description')} rows={3} className="input-field resize-none" placeholder="Detailed job description…" />
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select {...regCreate('priority')} className="input-field">
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Scheduled Date</label>
              <input type="date" {...regCreate('scheduled_date')} className="input-field" />
            </div>
          </div>
          <div className="flex gap-2.5 justify-end pt-1">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Work Order</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
