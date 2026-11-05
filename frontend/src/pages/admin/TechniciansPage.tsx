import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, UserX, CheckCircle, XCircle, UserCog, KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Technician } from '../../types';
import { PageLoader } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';

type BasicForm    = { full_name: string; phone: string; email?: string; skills?: string; is_available: boolean };
type WithLoginForm = BasicForm & { username: string; password: string; email: string };

export const TechniciansPage = () => {
  const [technicians,  setTechnicians]  = useState<Technician[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [loginModal,   setLoginModal]   = useState(false);
  const [editing,      setEditing]      = useState<Technician | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Technician | null>(null);
  const [saving,       setSaving]       = useState(false);

  const { register: regBasic,    handleSubmit: hBasic,    reset: rBasic,    formState: { errors: eBasic }    } = useForm<BasicForm>();
  const { register: regLogin,    handleSubmit: hLogin,    reset: rLogin,    formState: { errors: eLogin }    } = useForm<WithLoginForm>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/technicians');
      setTechnicians(res.data.items);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate      = () => { setEditing(null); rBasic({ is_available: true }); setModalOpen(true); };
  const openEdit        = (t: Technician) => { setEditing(t); rBasic(t); setModalOpen(true); };
  const openLoginCreate = () => { rLogin({ is_available: true } as any); setLoginModal(true); };

  const onBasicSubmit = async (data: BasicForm) => {
    setSaving(true);
    try {
      editing
        ? await api.put(`/technicians/${editing.id}`, data)
        : await api.post('/technicians', data);
      toast.success(editing ? 'Technician updated' : 'Technician added');
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error');
    } finally { setSaving(false); }
  };

  const onLoginSubmit = async (data: WithLoginForm) => {
    setSaving(true);
    try {
      await api.post('/technicians/with-login', data);
      toast.success(`Technician created with login: ${data.username}`);
      setLoginModal(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/technicians/${deleteTarget.id}`);
      toast.success('Technician deactivated');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Error'); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Technicians</h1>
          <p className="page-subtitle">{technicians.length} total technicians</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={openCreate} className="btn-secondary">
            <Plus className="w-4 h-4" /> Add (No Login)
          </button>
          <button onClick={openLoginCreate} className="btn-primary">
            <KeyRound className="w-4 h-4" /> Add with Login
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-700 flex items-start gap-2">
        <KeyRound className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span><strong>Add with Login</strong> creates a technician profile AND a login account so they can sign in at <code className="bg-blue-100 px-1 rounded text-xs">/login</code> and update their work orders.</span>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {technicians.length === 0 ? (
            <EmptyState icon={<UserCog className="w-7 h-7 text-slate-400" />} title="No technicians" description="Add technicians to assign them to work orders." action={<button onClick={openLoginCreate} className="btn-primary">Add with Login</button>} />
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Phone</th>
                  <th className="table-th hidden md:table-cell">Skills</th>
                  <th className="table-th">Available</th>
                  <th className="table-th">Login</th>
                  <th className="table-th">Status</th>
                  <th className="table-th w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {technicians.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="table-td font-semibold text-slate-900">{t.full_name}</td>
                    <td className="table-td text-slate-600">{t.phone}</td>
                    <td className="table-td text-slate-500 hidden md:table-cell max-w-xs truncate">{t.skills || '—'}</td>
                    <td className="table-td">
                      {t.is_available
                        ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Yes</span>
                        : <span className="flex items-center gap-1 text-slate-400 text-xs font-semibold"><XCircle className="w-3.5 h-3.5" /> No</span>}
                    </td>
                    <td className="table-td">
                      {t.user_id
                        ? <span className="badge-accepted">✓ Has Login</span>
                        : <span className="badge-pending">No Login</span>}
                    </td>
                    <td className="table-td">
                      {t.is_active ? <span className="badge-completed">Active</span> : <span className="badge-cancelled">Inactive</span>}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(t)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                          <UserX className="w-3.5 h-3.5" />
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

      {/* Basic Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Technician' : 'Add Technician (No Login)'}>
        <form onSubmit={hBasic(onBasicSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Full Name <span className="text-red-400">*</span></label>
              <input {...regBasic('full_name', { required: 'Required' })} className="input-field" autoFocus />
              {eBasic.full_name && <p className="text-xs text-red-500 mt-1">{eBasic.full_name.message}</p>}
            </div>
            <div>
              <label className="form-label">Phone <span className="text-red-400">*</span></label>
              <input {...regBasic('phone', { required: 'Required' })} className="input-field" />
              {eBasic.phone && <p className="text-xs text-red-500 mt-1">{eBasic.phone.message}</p>}
            </div>
            <div>
              <label className="form-label">Email</label>
              <input {...regBasic('email')} type="email" className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Skills</label>
              <textarea {...regBasic('skills')} rows={2} className="input-field resize-none" placeholder="e.g. Welding, Hydraulics, Motor repair" />
            </div>
            <div className="col-span-2 flex items-center gap-2.5">
              <input type="checkbox" {...regBasic('is_available')} id="avail" className="rounded" />
              <label htmlFor="avail" className="text-sm text-slate-700 font-medium">Available for assignment</label>
            </div>
          </div>
          <div className="flex gap-2.5 justify-end pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editing ? 'Update' : 'Add Technician'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create with Login Modal */}
      <Modal open={loginModal} onClose={() => setLoginModal(false)} title="Add Technician with Login Account" size="lg">
        <p className="text-sm text-slate-500 mb-4">Creates both a technician profile and a login account. The technician can sign in at <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">/login</code>.</p>
        <form onSubmit={hLogin(onLoginSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Full Name <span className="text-red-400">*</span></label>
              <input {...regLogin('full_name', { required: 'Required' })} className="input-field" autoFocus />
              {eLogin.full_name && <p className="text-xs text-red-500 mt-1">{eLogin.full_name.message}</p>}
            </div>
            <div>
              <label className="form-label">Phone <span className="text-red-400">*</span></label>
              <input {...regLogin('phone', { required: 'Required' })} className="input-field" />
              {eLogin.phone && <p className="text-xs text-red-500 mt-1">{eLogin.phone.message}</p>}
            </div>
            <div>
              <label className="form-label">Email <span className="text-red-400">*</span></label>
              <input {...regLogin('email', { required: 'Required' })} type="email" className="input-field" />
              {eLogin.email && <p className="text-xs text-red-500 mt-1">{eLogin.email.message}</p>}
            </div>
            <div>
              <label className="form-label">Username <span className="text-red-400">*</span></label>
              <input {...regLogin('username', { required: 'Required' })} className="input-field" placeholder="Login username" />
              {eLogin.username && <p className="text-xs text-red-500 mt-1">{eLogin.username.message}</p>}
            </div>
            <div>
              <label className="form-label">Password <span className="text-red-400">*</span></label>
              <input {...regLogin('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} type="password" className="input-field" placeholder="Initial password" />
              {eLogin.password && <p className="text-xs text-red-500 mt-1">{eLogin.password.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="form-label">Skills</label>
              <textarea {...regLogin('skills')} rows={2} className="input-field resize-none" placeholder="e.g. Welding, Hydraulics, Motor repair" />
            </div>
            <div className="col-span-2 flex items-center gap-2.5">
              <input type="checkbox" {...regLogin('is_available')} id="avail2" defaultChecked className="rounded" />
              <label htmlFor="avail2" className="text-sm text-slate-700 font-medium">Available for assignment</label>
            </div>
          </div>
          <div className="flex gap-2.5 justify-end pt-1">
            <button type="button" onClick={() => setLoginModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creating…' : 'Create Technician with Login'}
            </button>
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
