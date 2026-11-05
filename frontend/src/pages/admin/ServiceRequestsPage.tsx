import React, { useEffect, useState, useCallback } from 'react';
import { Search, Eye, ArrowRight, CheckCircle, ClipboardList, Calendar, Flag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { ServiceRequest } from '../../types';
import { PageLoader } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';

const STATUSES   = ['', 'new', 'under_review', 'accepted', 'rejected', 'converted'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent'];

const PRIORITY_BADGE: Record<string, string> = {
  low: 'badge-low', medium: 'badge-medium', high: 'badge-high', urgent: 'badge-urgent',
};

export const ServiceRequestsPage = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [priorityModal, setPriorityModal] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm<{ status: string; notes: string }>();
  const { register: regPri, handleSubmit: hPri, reset: rPri } = useForm<{ priority: string }>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), page_size: '20' });
      if (search) p.set('search', search);
      if (statusFilter) p.set('status', statusFilter);
      if (priorityFilter) p.set('priority', priorityFilter);
      const res = await api.get(`/service-requests?${p}`);
      setRequests(res.data.items);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  }, [page, search, statusFilter, priorityFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (req: ServiceRequest) => {
    const res = await api.get(`/service-requests/${req.id}`);
    setSelected(res.data);
  };
  const openStatusChange = (req: ServiceRequest) => {
    setSelected(req);
    reset({ status: req.status, notes: '' });
    setStatusModal(true);
  };
  const openPriorityChange = (req: ServiceRequest) => {
    setSelected(req);
    rPri({ priority: (req as any).priority || 'medium' });
    setPriorityModal(true);
  };
  const onStatusSubmit = async (data: { status: string; notes: string }) => {
    if (!selected) return;
    try {
      await api.patch(`/service-requests/${selected.id}/status`, data);
      toast.success('Status updated');
      setStatusModal(false);
      setSelected(null);
      load();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Error'); }
  };
  const onPrioritySubmit = async (data: { priority: string }) => {
    if (!selected) return;
    try {
      await api.patch(`/service-requests/${selected.id}/priority`, data);
      toast.success('Priority updated');
      setPriorityModal(false);
      setSelected(null);
      load();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Error'); }
  };
  const handleConvert = async (req: ServiceRequest) => {
    setConvertLoading(true);
    try {
      const res = await api.post(`/service-requests/${req.id}/convert`);
      toast.success(`Converted → ${res.data.work_order_number}`);
      setSelected(null);
      load();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Error converting');
    } finally { setConvertLoading(false); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Service Requests</h1>
          <p className="page-subtitle">{total} total requests</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" placeholder="Search name, reference, phone…" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto min-w-[140px]">
          {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Statuses'}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }} className="input-field w-auto min-w-[130px]">
          {PRIORITIES.map(p => <option key={p} value={p}>{p ? p.charAt(0).toUpperCase() + p.slice(1) + ' Priority' : 'All Priorities'}</option>)}
        </select>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {requests.length === 0 ? (
            <EmptyState icon={<ClipboardList className="w-7 h-7 text-slate-400" />} title="No service requests" description="Requests submitted from the public website appear here." />
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="table-th">Reference</th>
                    <th className="table-th">Customer</th>
                    <th className="table-th hidden md:table-cell">Issue</th>
                    <th className="table-th">Priority</th>
                    <th className="table-th">Status</th>
                    <th className="table-th hidden sm:table-cell">Submitted</th>
                    <th className="table-th w-28" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="table-td">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{r.reference_number}</span>
                      </td>
                      <td className="table-td">
                        <p className="font-semibold text-slate-900 text-sm">{r.customer_name}</p>
                        <p className="text-xs text-slate-400">{r.customer_phone}</p>
                      </td>
                      <td className="table-td hidden md:table-cell max-w-[200px]">
                        <p className="text-sm text-slate-600 truncate">{r.problem_description}</p>
                      </td>
                      <td className="table-td">
                        <button onClick={() => openPriorityChange(r)} className="cursor-pointer" title="Click to change priority">
                          <span className={PRIORITY_BADGE[(r as any).priority || 'medium'] || 'badge-medium'}>
                            {(r as any).priority || 'medium'}
                          </span>
                        </button>
                      </td>
                      <td className="table-td"><StatusBadge status={r.status} /></td>
                      <td className="table-td hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openDetail(r)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="View details">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {r.status !== 'converted' && (
                            <button onClick={() => openStatusChange(r)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors" title="Update status">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {r.status === 'accepted' && (
                            <button onClick={() => handleConvert(r)} disabled={convertLoading}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors">
                              <ArrowRight className="w-3 h-3" /> Convert
                            </button>
                          )}
                        </div>
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
      {selected && !statusModal && (
        <Modal open={true} onClose={() => setSelected(null)} title={`Request ${selected.reference_number}`} size="lg">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Customer',    val: selected.customer_name },
                { label: 'Phone',       val: selected.customer_phone },
                { label: 'Email',       val: selected.customer_email || '—' },
                { label: 'Status',      val: <StatusBadge status={selected.status} /> },
              ].map(({ label, val }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                  <div className="text-sm font-semibold text-slate-800">{val}</div>
                </div>
              ))}
              <div className="col-span-2 bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Problem Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">{selected.problem_description}</p>
              </div>
              {selected.equipment_details && (
                <div className="col-span-2 bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Equipment Details</p>
                  <p className="text-sm text-slate-700">{selected.equipment_details}</p>
                </div>
              )}
            </div>

            {selected.status_history.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Status Timeline</p>
                <div className="space-y-2">
                  {selected.status_history.map((h, i) => (
                    <div key={h.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${i === selected.status_history.length - 1 ? 'bg-blue-500 ring-2 ring-blue-200' : 'bg-slate-300'}`} />
                        {i < selected.status_history.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1 min-h-[16px]" />}
                      </div>
                      <div className="pb-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={h.new_status} />
                          <span className="text-xs text-slate-400">{new Date(h.created_at).toLocaleString('en-IN')}</span>
                        </div>
                        {h.notes && <p className="text-xs text-slate-500 mt-1">{h.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2.5 justify-end pt-1 border-t border-slate-100">
              {selected.status !== 'converted' && (
                <button onClick={() => { setStatusModal(true); reset({ status: selected.status, notes: '' }); }} className="btn-secondary">
                  Update Status
                </button>
              )}
              {selected.status === 'accepted' && (
                <button onClick={() => handleConvert(selected)} disabled={convertLoading} className="btn-primary">
                  <ArrowRight className="w-4 h-4" /> Convert to Work Order
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Request Status" size="sm">
        <form onSubmit={handleSubmit(onStatusSubmit)} className="space-y-4">
          <div>
            <label className="form-label">New Status</label>
            <select {...register('status')} className="input-field">
              <option value="new">New</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="form-label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea {...register('notes')} rows={3} className="input-field resize-none" placeholder="Add a note about this status change…" />
          </div>
          <div className="flex gap-2.5 justify-end">
            <button type="button" onClick={() => setStatusModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Update Status</button>
          </div>
        </form>
      </Modal>

      <Modal open={priorityModal} onClose={() => setPriorityModal(false)} title="Set Priority" size="sm">
        <form onSubmit={hPri(onPrioritySubmit)} className="space-y-4">
          <p className="text-sm text-slate-500">Request: <strong>{selected?.reference_number}</strong></p>
          <div>
            <label className="form-label">Priority</label>
            <select {...regPri('priority')} className="input-field">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex gap-2.5 justify-end">
            <button type="button" onClick={() => setPriorityModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Set Priority</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
