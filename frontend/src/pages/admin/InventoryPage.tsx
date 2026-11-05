import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { InventoryItem } from '../../types';
import { PageLoader } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';

type FormData = { name: string; sku?: string; description?: string; quantity: number; unit: string; low_stock_threshold: number; cost_price?: string; sell_price?: string };
type AdjustData = { quantity: number; transaction_type: string; notes?: string };

export const InventoryPage = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ defaultValues: { unit: 'pcs', low_stock_threshold: 5, quantity: 0 } });
  const { register: regAdj, handleSubmit: handleAdj, reset: resetAdj } = useForm<AdjustData>({ defaultValues: { transaction_type: 'add' } });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory');
      setItems(res.data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = { ...data, cost_price: data.cost_price || null, sell_price: data.sell_price || null };
      await api.post('/inventory', payload);
      toast.success('Item added');
      setCreateModal(false);
      reset();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const onAdjust = async (data: AdjustData) => {
    if (!adjustModal) return;
    try {
      await api.post(`/inventory/${adjustModal.id}/adjust`, data);
      toast.success('Stock adjusted');
      setAdjustModal(null);
      resetAdj();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 text-sm mt-0.5">{items.length} items tracked</p>
        </div>
        <button onClick={() => { reset({ unit: 'pcs', low_stock_threshold: 5, quantity: 0 }); setCreateModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {items.length === 0 ? <EmptyState title="No inventory items" description="Add parts and materials to track stock." /> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Item</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Sell Price</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Stock</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      {item.description && <p className="text-xs text-slate-500 truncate max-w-xs">{item.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell font-mono text-xs">{item.sku || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.quantity}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{item.unit}</td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{item.sell_price ? `₹${item.sell_price}` : '—'}</td>
                    <td className="px-4 py-3">
                      {item.is_low_stock ? (
                        <span className="flex items-center gap-1 text-orange-500 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setAdjustModal(item); resetAdj({ transaction_type: 'add' }); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Adjust stock">
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Item Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Add Inventory Item">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Item Name *</label>
              <input {...register('name', { required: 'Required' })} className="input-field" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">SKU / Code</label>
              <input {...register('sku')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit</label>
              <input {...register('unit')} className="input-field" placeholder="pcs, kg, m, etc." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Initial Quantity</label>
              <input {...register('quantity', { valueAsNumber: true })} type="number" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Low Stock Alert</label>
              <input {...register('low_stock_threshold', { valueAsNumber: true })} type="number" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cost Price (₹)</label>
              <input {...register('cost_price')} type="number" step="0.01" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sell Price (₹)</label>
              <input {...register('sell_price')} type="number" step="0.01" className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea {...register('description')} rows={2} className="input-field resize-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Item'}</button>
          </div>
        </form>
      </Modal>

      {/* Adjust Modal */}
      <Modal open={!!adjustModal} onClose={() => setAdjustModal(null)} title={`Adjust Stock: ${adjustModal?.name}`} size="sm">
        <form onSubmit={handleAdj(onAdjust)} className="space-y-4">
          <p className="text-sm text-slate-500">Current quantity: <strong>{adjustModal?.quantity} {adjustModal?.unit}</strong></p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Transaction Type</label>
            <select {...regAdj('transaction_type')} className="input-field bg-white">
              <option value="add">Add Stock</option>
              <option value="use">Use / Consume</option>
              <option value="adjust">Adjust (reduce)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
            <input {...regAdj('quantity', { valueAsNumber: true, required: true, min: 1 })} type="number" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <input {...regAdj('notes')} className="input-field" placeholder="Optional reason" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setAdjustModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Apply</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
