import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Eye, Download, DollarSign, Search, ChevronDown, X, User, FileText, Wrench } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Invoice, Customer, WorkOrder, ServiceRequest } from '../../types';
import { PageLoader } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';

// ─── Types ───────────────────────────────────────────────────────────────────

type InvoiceFormData = {
  customer_id: string;
  service_request_id: string;
  work_order_id: string;
  invoice_date: string;
  due_date: string;
  tax_rate: number;
  discount_amount: number;
  notes: string;
  items: { description: string; quantity: number; unit_price: number; item_type: string }[];
};

// ─── Searchable Select Component ─────────────────────────────────────────────

interface SearchSelectProps {
  label: string;
  placeholder: string;
  options: { value: string; label: string; sublabel?: string; badge?: string }[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ElementType;
  emptyMessage?: string;
}

const SearchSelect = ({
  label, placeholder, options, value, onChange,
  required, disabled, icon: Icon, emptyMessage
}: SearchSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.sublabel || '').toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        onClick={() => !disabled && setOpen(!open)}
        className={`input-field flex items-center justify-between cursor-pointer select-none ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-blue-400'
        } ${open ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
          {selected ? (
            <div className="min-w-0">
              <span className="text-slate-900 text-sm font-medium truncate block">{selected.label}</span>
              {selected.sublabel && <span className="text-xs text-slate-500 truncate block">{selected.sublabel}</span>}
            </div>
          ) : (
            <span className="text-slate-400 text-sm">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {value && !disabled && (
            <button onClick={handleClear} className="p-0.5 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search..."
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-400">
                {emptyMessage || 'No results found'}
              </div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-3 py-2.5 cursor-pointer flex items-center justify-between hover:bg-blue-50 transition-colors ${
                    opt.value === value ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <div>
                    <p className={`text-sm font-medium ${opt.value === value ? 'text-blue-700' : 'text-slate-800'}`}>
                      {opt.label}
                    </p>
                    {opt.sublabel && <p className="text-xs text-slate-500 mt-0.5">{opt.sublabel}</p>}
                  </div>
                  {opt.badge && <StatusBadge status={opt.badge} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<Invoice | null>(null);

  // Data for dropdowns
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allServiceRequests, setAllServiceRequests] = useState<ServiceRequest[]>([]);
  const [allWorkOrders, setAllWorkOrders] = useState<WorkOrder[]>([]);

  // Cascading selection state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSRId, setSelectedSRId] = useState('');
  const [selectedWOId, setSelectedWOId] = useState('');

  const { register: regInv, handleSubmit: handleInvSubmit, control, reset: resetInv, watch, setValue } =
    useForm<InvoiceFormData>({
      defaultValues: {
        tax_rate: 18,
        discount_amount: 0,
        invoice_date: new Date().toISOString().split('T')[0],
        items: [{ description: '', quantity: 1, unit_price: 0, item_type: 'service' }],
      },
    });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const { register: regPay, handleSubmit: handlePaySubmit, reset: resetPay } = useForm<any>();

  const watchItems = watch('items');
  const watchTax = watch('tax_rate');
  const watchDiscount = watch('discount_amount');

  const subtotal = watchItems?.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0) || 0;
  const discount = Number(watchDiscount) || 0;
  const taxable = subtotal - discount;
  const tax = (taxable * (Number(watchTax) || 0)) / 100;
  const total_calc = taxable + tax;

  // ── Derived dropdown options ──────────────────────────────────────────────

  const customerOptions = allCustomers.map(c => ({
    value: c.id,
    label: c.full_name,
    sublabel: `${c.phone}${c.email ? ' · ' + c.email : ''}`,
  }));

  // Filter SRs to the selected customer
  const filteredSRs = selectedCustomerId
    ? allServiceRequests.filter(sr => sr.customer_id === selectedCustomerId)
    : allServiceRequests;

  const srOptions = filteredSRs.map(sr => ({
    value: sr.id,
    label: sr.reference_number,
    sublabel: sr.problem_description.slice(0, 60),
    badge: sr.status,
  }));

  // Filter WOs to the selected customer
  const filteredWOs = selectedCustomerId
    ? allWorkOrders.filter(wo => wo.customer_id === selectedCustomerId)
    : allWorkOrders;

  const woOptions = filteredWOs.map(wo => ({
    value: wo.id,
    label: wo.work_order_number,
    sublabel: `${wo.title?.slice(0, 40)}${wo.technician_name ? ' · ' + wo.technician_name : ''}`,
    badge: wo.status,
  }));

  // ── Load data ─────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/invoices?${params}`);
      setInvoices(res.data.items);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Load all reference data on mount
  useEffect(() => {
    api.get('/customers?page_size=500')
      .then(r => setAllCustomers(r.data.items))
      .catch(() => toast.error('Failed to load customers'));
    api.get('/service-requests?page_size=500')
      .then(r => setAllServiceRequests(r.data.items))
      .catch(() => {});
    api.get('/work-orders?page_size=500')
      .then(r => setAllWorkOrders(r.data.items))
      .catch(() => {});
  }, []);

  // ── Auto-populate when customer is selected ───────────────────────────────

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    // Reset downstream selections when customer changes
    setSelectedSRId('');
    setSelectedWOId('');

    if (customerId) {
      const customer = allCustomers.find(c => c.id === customerId);
      if (customer && customer.address) {
        setValue('notes', `Billing address: ${customer.address}`);
      }
    }
  };

  // Auto-populate first line item description from service request
  const handleSRChange = (srId: string) => {
    setSelectedSRId(srId);
    if (srId) {
      const sr = allServiceRequests.find(s => s.id === srId);
      if (sr) {
        const currentItems = watchItems || [];
        // Fill first empty description item
        const firstEmpty = currentItems.findIndex(i => !i.description.trim());
        if (firstEmpty >= 0) {
          setValue(`items.${firstEmpty}.description`, sr.problem_description.slice(0, 200));
        }
      }
    }
  };

  // Auto-populate description from work order
  const handleWOChange = (woId: string) => {
    setSelectedWOId(woId);
    if (woId) {
      const wo = allWorkOrders.find(w => w.id === woId);
      if (wo) {
        const currentItems = watchItems || [];
        const firstEmpty = currentItems.findIndex(i => !i.description.trim());
        if (firstEmpty >= 0) {
          setValue(`items.${firstEmpty}.description`, wo.title?.slice(0, 200) || wo.description?.slice(0, 200) || '');
        }
      }
    }
  };

  // ── Form submit ───────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setSelectedCustomerId('');
    setSelectedSRId('');
    setSelectedWOId('');
    resetInv({
      tax_rate: 18,
      discount_amount: 0,
      invoice_date: new Date().toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unit_price: 0, item_type: 'service' }],
    });
    setCreateModal(true);
  };

  const onCreateSubmit = async (data: InvoiceFormData) => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    setSaving(true);
    try {
      await api.post('/invoices', {
        customer_id: selectedCustomerId,
        service_request_id: selectedSRId || undefined,
        work_order_id: selectedWOId || undefined,
        invoice_date: data.invoice_date,
        due_date: data.due_date || undefined,
        tax_rate: Number(data.tax_rate),
        discount_amount: Number(data.discount_amount),
        notes: data.notes || undefined,
        items: data.items.map(i => ({
          description: i.description,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          item_type: i.item_type,
        })),
      });
      toast.success('Invoice created successfully');
      setCreateModal(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  // ── PDF download ──────────────────────────────────────────────────────────

  const downloadPDF = async (inv: Invoice) => {
    setDownloadingId(inv.id);
    try {
      const res = await api.get(`/invoices/${inv.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Payment ───────────────────────────────────────────────────────────────

  const onPaymentSubmit = async (data: any) => {
    if (!paymentModal) return;
    try {
      await api.post('/payments', {
        ...data,
        invoice_id: paymentModal.id,
        amount: Number(data.amount),
      });
      toast.success('Payment recorded');
      setPaymentModal(null);
      resetPay();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error recording payment');
    }
  };

  const STATUSES = ['', 'draft', 'issued', 'partially_paid', 'paid', 'cancelled'];

  // ── Selected entity details for preview in modal ──────────────────────────
  const selectedCustomer = allCustomers.find(c => c.id === selectedCustomerId);
  const selectedSR = allServiceRequests.find(s => s.id === selectedSRId);
  const selectedWO = allWorkOrders.find(w => w.id === selectedWOId);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} invoices</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-auto bg-white"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {s ? s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Statuses'}
            </option>
          ))}
        </select>
      </div>

      {/* Invoice Table */}
      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {invoices.length === 0 ? (
            <EmptyState
              title="No invoices yet"
              description="Create your first invoice by selecting a customer."
              action={<button onClick={openCreateModal} className="btn-primary">Create Invoice</button>}
            />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">SR Ref</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Work Order</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Balance</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{inv.customer_name}</td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell font-mono text-xs">
                        {inv.service_request_reference || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell font-mono text-xs">
                        {inv.work_order_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                        {new Date(inv.invoice_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-medium">
                        ₹{Number(inv.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={Number(inv.balance_due) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          ₹{Number(inv.balance_due).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setSelected(inv)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => downloadPDF(inv)}
                            disabled={downloadingId === inv.id}
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                setPaymentModal(inv);
                                resetPay({
                                  payment_date: new Date().toISOString().split('T')[0],
                                  payment_method: 'cash',
                                  amount: inv.balance_due,
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Record Payment"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
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

      {/* ── Invoice Detail Modal ── */}
      {selected && (
        <Modal open={true} onClose={() => setSelected(null)} title={`Invoice ${selected.invoice_number}`} size="lg">
          <div className="space-y-4 text-sm">
            {/* Customer + references */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg p-3">
              <div>
                <p className="text-xs text-slate-500 mb-0.5 flex items-center gap-1"><User className="w-3 h-3" /> Customer</p>
                <p className="font-semibold text-slate-900">{selected.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Status</p>
                <StatusBadge status={selected.status} />
              </div>
              {selected.service_request_reference && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5 flex items-center gap-1"><FileText className="w-3 h-3" /> Service Request</p>
                  <p className="font-mono text-xs text-blue-700 font-semibold">{selected.service_request_reference}</p>
                </div>
              )}
              {selected.work_order_number && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5 flex items-center gap-1"><Wrench className="w-3 h-3" /> Work Order</p>
                  <p className="font-mono text-xs text-blue-700 font-semibold">{selected.work_order_number}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Invoice Date</p>
                <p>{selected.invoice_date}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Due Date</p>
                <p>{selected.due_date || '—'}</p>
              </div>
            </div>

            {/* Items table */}
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-2 border border-slate-200">Description</th>
                  <th className="text-left p-2 border border-slate-200">Type</th>
                  <th className="text-right p-2 border border-slate-200">Qty</th>
                  <th className="text-right p-2 border border-slate-200">Unit Price</th>
                  <th className="text-right p-2 border border-slate-200">Total</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map(it => (
                  <tr key={it.id}>
                    <td className="p-2 border border-slate-200">{it.description}</td>
                    <td className="p-2 border border-slate-200 capitalize">{it.item_type}</td>
                    <td className="text-right p-2 border border-slate-200">{it.quantity}</td>
                    <td className="text-right p-2 border border-slate-200">₹{Number(it.unit_price).toLocaleString()}</td>
                    <td className="text-right p-2 border border-slate-200">₹{Number(it.total_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="text-right space-y-1 bg-slate-50 rounded-lg p-3">
              <p className="text-slate-600">Subtotal: ₹{Number(selected.subtotal).toLocaleString()}</p>
              {Number(selected.discount_amount) > 0 && (
                <p className="text-red-600">Discount: −₹{Number(selected.discount_amount).toLocaleString()}</p>
              )}
              <p className="text-slate-600">Tax ({selected.tax_rate}%): ₹{Number(selected.tax_amount).toLocaleString()}</p>
              <p className="font-bold text-base text-slate-900 border-t border-slate-200 pt-1">
                Total: ₹{Number(selected.total_amount).toLocaleString()}
              </p>
              <p className="text-green-700">Paid: ₹{Number(selected.amount_paid).toLocaleString()}</p>
              <p className="text-red-600 font-semibold">Balance: ₹{Number(selected.balance_due).toLocaleString()}</p>
            </div>

            {selected.notes && (
              <p className="text-xs text-slate-500 bg-slate-50 rounded p-2">{selected.notes}</p>
            )}

            <div className="flex gap-3 justify-end border-t border-slate-100 pt-3">
              <button onClick={() => downloadPDF(selected)} className="btn-secondary text-sm flex items-center gap-1">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Create Invoice Modal ── */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Invoice" size="xl">
        <form onSubmit={handleInvSubmit(onCreateSubmit)} className="space-y-5">

          {/* Step 1: Entity selection */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Step 1 — Select Customer & References
            </p>

            {/* Customer */}
            <SearchSelect
              label="Customer"
              placeholder="Search and select a customer..."
              options={customerOptions}
              value={selectedCustomerId}
              onChange={handleCustomerChange}
              required
              icon={User}
              emptyMessage={allCustomers.length === 0 ? 'No customers found. Add customers first.' : 'No match found'}
            />

            {/* Customer info preview */}
            {selectedCustomer && (
              <div className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs text-slate-600 grid grid-cols-3 gap-2">
                <div><span className="text-slate-400">Phone: </span>{selectedCustomer.phone}</div>
                {selectedCustomer.email && <div><span className="text-slate-400">Email: </span>{selectedCustomer.email}</div>}
                {selectedCustomer.address && <div className="col-span-3"><span className="text-slate-400">Address: </span>{selectedCustomer.address}</div>}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Service Request */}
              <SearchSelect
                label="Service Request (optional)"
                placeholder={selectedCustomerId ? 'Select a service request...' : 'Select customer first'}
                options={srOptions}
                value={selectedSRId}
                onChange={handleSRChange}
                disabled={!selectedCustomerId}
                icon={FileText}
                emptyMessage={
                  selectedCustomerId && filteredSRs.length === 0
                    ? 'No service requests for this customer'
                    : 'No match'
                }
              />

              {/* Work Order */}
              <SearchSelect
                label="Work Order (optional)"
                placeholder={selectedCustomerId ? 'Select a work order...' : 'Select customer first'}
                options={woOptions}
                value={selectedWOId}
                onChange={handleWOChange}
                disabled={!selectedCustomerId}
                icon={Wrench}
                emptyMessage={
                  selectedCustomerId && filteredWOs.length === 0
                    ? 'No work orders for this customer'
                    : 'No match'
                }
              />
            </div>

            {/* SR / WO quick info */}
            {(selectedSR || selectedWO) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedSR && (
                  <div className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs text-slate-600">
                    <p className="font-semibold text-blue-700 mb-1">{selectedSR.reference_number}</p>
                    <p className="text-slate-500 line-clamp-2">{selectedSR.problem_description}</p>
                    <StatusBadge status={selectedSR.status} className="mt-1" />
                  </div>
                )}
                {selectedWO && (
                  <div className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs text-slate-600">
                    <p className="font-semibold text-blue-700 mb-1">{selectedWO.work_order_number}</p>
                    <p className="text-slate-500 line-clamp-2">{selectedWO.title}</p>
                    {selectedWO.technician_name && (
                      <p className="text-slate-400 mt-0.5">Tech: {selectedWO.technician_name}</p>
                    )}
                    <StatusBadge status={selectedWO.status} className="mt-1" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Invoice Date *</label>
              <input type="date" {...regInv('invoice_date', { required: true })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
              <input type="date" {...regInv('due_date')} className="input-field" />
            </div>
          </div>

          {/* Step 3: Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Line Items</p>
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unit_price: 0, item_type: 'service' })}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    {i === 0 && <p className="text-xs text-slate-500 mb-1">Description</p>}
                    <input
                      {...regInv(`items.${i}.description`, { required: true })}
                      className="input-field text-xs"
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <p className="text-xs text-slate-500 mb-1">Type</p>}
                    <select {...regInv(`items.${i}.item_type`)} className="input-field text-xs bg-white">
                      <option value="service">Service</option>
                      <option value="part">Part</option>
                      <option value="labour">Labour</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <p className="text-xs text-slate-500 mb-1">Qty</p>}
                    <input
                      {...regInv(`items.${i}.quantity`, { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <p className="text-xs text-slate-500 mb-1">Unit Price (₹)</p>}
                    <input
                      {...regInv(`items.${i}.unit_price`, { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field text-xs"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="text-red-400 hover:text-red-600 text-xl font-bold leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax / Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tax Rate (%)</label>
              <input {...regInv('tax_rate', { valueAsNumber: true })} type="number" step="0.01" min="0" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Discount (₹)</label>
              <input {...regInv('discount_amount', { valueAsNumber: true })} type="number" step="0.01" min="0" className="input-field" />
            </div>
          </div>

          {/* Live totals */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-right space-y-1">
            <p className="text-slate-600">Subtotal: ₹{subtotal.toFixed(2)}</p>
            {discount > 0 && <p className="text-red-600">Discount: −₹{discount.toFixed(2)}</p>}
            <p className="text-slate-600">Tax ({watchTax || 0}%): ₹{tax.toFixed(2)}</p>
            <p className="font-bold text-base text-slate-900 border-t border-slate-200 pt-1">
              Total: ₹{total_calc.toFixed(2)}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea
              {...regInv('notes')}
              rows={2}
              className="input-field resize-none"
              placeholder="Optional notes for the customer..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving || !selectedCustomerId} className="btn-primary">
              {saving ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Payment Modal ── */}
      <Modal open={!!paymentModal} onClose={() => setPaymentModal(null)} title="Record Payment" size="sm">
        <form onSubmit={handlePaySubmit(onPaymentSubmit)} className="space-y-4">
          {paymentModal && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <p>Invoice: <strong>{paymentModal.invoice_number}</strong></p>
              <p>Customer: <strong>{paymentModal.customer_name}</strong></p>
              <p>Balance Due: <strong className="text-red-600">
                ₹{Number(paymentModal.balance_due).toLocaleString('en-IN')}
              </strong></p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Date *</label>
            <input type="date" {...regPay('payment_date', { required: true })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹) *</label>
            <input
              {...regPay('amount', { required: true })}
              type="number"
              step="0.01"
              min="0.01"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method</label>
            <select {...regPay('payment_method')} className="input-field bg-white">
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference / Transaction ID</label>
            <input
              {...regPay('transaction_reference')}
              className="input-field"
              placeholder="UPI ref, cheque no., etc."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setPaymentModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Record Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
