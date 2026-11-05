import React, { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';
import api from '../../services/api';
import { Payment } from '../../types';
import { PageLoader } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';

export const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments')
      .then(r => setPayments(r.data.items))
      .finally(() => setLoading(false));
  }, []);

  const methodLabel: Record<string, string> = {
    cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer', cheque: 'Cheque', other: 'Other'
  };

  const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-slate-500 text-sm mt-0.5">{payments.length} payments recorded</p>
      </div>

      <div className="card p-4 mb-4 flex items-center gap-3 bg-green-50 border-green-200">
        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-green-700 font-medium">Total Collected</p>
          <p className="text-2xl font-bold text-green-800">₹{totalCollected.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {payments.length === 0 ? <EmptyState title="No payments recorded" description="Payments recorded from the Invoices page will appear here." /> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Invoice</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Reference</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-700">{p.invoice_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-semibold text-green-700">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{methodLabel[p.payment_method] || p.payment_method}</td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{p.transaction_reference || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{p.recorded_by || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
