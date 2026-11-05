import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Technician } from '../../types';
import { PageLoader } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';

type FormData = { full_name: string; phone: string; email?: string; skills?: string; is_available: boolean };

export const TechniciansPage = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Technician | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/technicians');
      setTechnicians(res.data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); reset({ is_available: true }); setModalOpen(true); };
  const openEdit = (t: Technician) => { setEditing(t); reset(t); setModalOpen(true); };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/technicians/${editing.id}`, data);
        toast.success('Technician updated');
      } else {
        await api.post('/technicians', data);
        toast.success('Technician added');
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
      await api.delete(`/technicians/${deleteTarget.id}`);
      toast.success('Technician deactivated');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('Error');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Technicians</h1>
          <p className="text-slate-500 text-sm mt-0.5">{technicians.length} total technicians</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Technician
        </button>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {technicians.length === 0 ? (
            <EmptyState title="No technicians" description="Add technicians to assign them to work orders." action={<button onClick={openCreate} className="btn-primary">Add Technician</button>} />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Skills</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Available</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Active</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {technicians.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{t.full_name}</td>
                    <td className="px-4 py-3 text-slate-600">{t.phone}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell max-w-xs truncate">{t.skills || '—'}</td>
                    <td className="px-4 py-3">
                      {t.is_available
                        ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Yes</span>
                        : <span className="flex items-center gap-1 text-slate-400"><XCircle className="w-3.5 h-3.5" /> No</span>}
                    </td>
                    <td className="px-4 py-3">
                      {t.is_active
                        ? <span className="badge-completed">Active</span>
                        : <span className="badge-cancelled">Inactive</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Technician' : 'Add Technician'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
              <input {...register('full_name', { required: 'Required' })} className="input-field" />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone *</label>
              <input {...register('phone', { required: 'Required' })} className="input-field" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input {...register('email')} type="email" className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Skills / Specialization</label>
              <textarea {...register('skills')} rows={2} className="input-field resize-none" placeholder="e.g. Welding, Hydraulics, Motor repair" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" {...register('is_available')} id="available" className="rounded" />
              <label htmlFor="available" className="text-sm text-slate-700">Available for assignment</label>
            </div>
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
        title="Deactivate Technician"
        message={`Deactivate ${deleteTarget?.full_name}? They won't be available for new assignments.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
};
