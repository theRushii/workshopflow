import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { ServiceCategory } from '../../types';
import { PageLoader } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';

type FormData = { name: string; description?: string; estimated_price?: string; estimated_duration_hours?: string; is_active: boolean };

export const ServicesAdminPage = () => {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceCategory | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/services?active_only=false');
      setServices(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); reset({ is_active: true }); setModalOpen(true); };
  const openEdit = (s: ServiceCategory) => {
    setEditing(s);
    reset({ ...s, estimated_price: s.estimated_price?.toString(), estimated_duration_hours: s.estimated_duration_hours?.toString() });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        estimated_price: data.estimated_price ? Number(data.estimated_price) : null,
        estimated_duration_hours: data.estimated_duration_hours ? Number(data.estimated_duration_hours) : null,
      };
      if (editing) {
        await api.put(`/services/${editing.id}`, payload);
        toast.success('Service updated');
      } else {
        await api.post('/services', payload);
        toast.success('Service added');
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/services/${deleteTarget.id}`);
      toast.success('Service deactivated');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('Error');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Catalogue</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage available service categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {services.length === 0 ? <EmptyState title="No services" description="Add service categories visible to customers." /> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell max-w-xs truncate">{s.description || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{s.estimated_price ? `₹${s.estimated_price}` : '—'}</td>
                    <td className="px-4 py-3">
                      {s.is_active ? <span className="badge-completed">Active</span> : <span className="badge-cancelled">Inactive</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {s.is_active && (
                          <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Service' : 'Add Service'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Name *</label>
            <input {...register('name', { required: 'Required' })} className="input-field" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} className="input-field resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Estimated Price (₹)</label>
              <input {...register('estimated_price')} type="number" step="0.01" className="input-field" placeholder="Leave blank if variable" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Estimated Duration (hrs)</label>
              <input {...register('estimated_duration_hours')} type="number" step="0.5" className="input-field" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('is_active')} id="svc_active" className="rounded" />
            <label htmlFor="svc_active" className="text-sm text-slate-700">Active (visible to customers)</label>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Service"
        message={`Deactivate "${deleteTarget?.name}"? It will no longer be visible to customers.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
};
