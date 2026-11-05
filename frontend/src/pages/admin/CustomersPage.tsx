import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, UserX, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Customer } from '../../types';
import { PageLoader } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';

type FormData = { full_name: string; phone: string; email?: string; address?: string; notes?: string };

const Avatar = ({ name }: { name: string }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = name.charCodeAt(0) * 13 % 360;
  return (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
      style={{ background: `hsl(${hue},60%,50%)` }}>
      {initials}
    </div>
  );
};

export const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), page_size: '20' });
      if (search) p.set('search', search);
      const res = await api.get(`/customers?${p}`);
      setCustomers(res.data.items);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit   = (c: Customer) => { setEditing(c); reset(c); setModalOpen(true); };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      editing ? await api.put(`/customers/${editing.id}`, data) : await api.post('/customers', data);
      toast.success(editing ? 'Customer updated' : 'Customer created');
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error saving customer');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/customers/${deleteTarget.id}`);
      toast.success('Customer deactivated');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Error'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{total} total customers</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 min-w-56 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
            placeholder="Search name, phone or email…"
          />
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {customers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-7 h-7 text-slate-400" />}
              title="No customers yet"
              description={search ? 'No customers match your search.' : 'Add your first customer to get started.'}
              action={!search ? <button onClick={openCreate} className="btn-primary">Add Customer</button> : undefined}
            />
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="table-th">Customer</th>
                    <th className="table-th hidden md:table-cell">Email</th>
                    <th className="table-th hidden lg:table-cell">Address</th>
                    <th className="table-th hidden sm:table-cell">Joined</th>
                    <th className="table-th w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.full_name} />
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">{c.full_name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{c.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-td text-slate-500 hidden md:table-cell">{c.email || <span className="text-slate-300">—</span>}</td>
                      <td className="table-td text-slate-500 hidden lg:table-cell max-w-xs truncate">{c.address || <span className="text-slate-300">—</span>}</td>
                      <td className="table-td text-slate-400 hidden sm:table-cell text-xs">{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(c)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(c)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Deactivate">
                            <UserX className="w-3.5 h-3.5" />
                          </button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Full Name <span className="text-red-400">*</span></label>
              <input {...register('full_name', { required: 'Required' })} className="input-field" placeholder="Enter full name" autoFocus />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="form-label">Phone <span className="text-red-400">*</span></label>
              <input {...register('phone', { required: 'Required' })} className="input-field" placeholder="+91 XXXXX XXXXX" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="form-label">Email</label>
              <input {...register('email')} type="email" className="input-field" placeholder="Optional" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Address</label>
              <textarea {...register('address')} rows={2} className="input-field resize-none" placeholder="Customer address" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Notes</label>
              <textarea {...register('notes')} rows={2} className="input-field resize-none" placeholder="Internal notes…" />
            </div>
          </div>
          <div className="flex gap-2.5 justify-end pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : editing ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Customer"
        message={`Deactivate ${deleteTarget?.full_name}? Their service history will be preserved.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
};
