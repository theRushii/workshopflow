import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, ClipboardCopy } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { ServiceCategory } from '../types';

const schema = z.object({
  customer_name: z.string().min(2, 'Name is required'),
  customer_phone: z.string().min(7, 'Valid phone number required'),
  customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
  customer_address: z.string().optional(),
  service_category_id: z.string().optional(),
  equipment_details: z.string().optional(),
  problem_description: z.string().min(10, 'Please describe the problem (min 10 chars)'),
  preferred_date: z.string().optional(),
  additional_notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const RequestServicePage = () => {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get('service') || '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { service_category_id: preselectedService },
  });

  useEffect(() => {
    api.get('/services?active_only=true').then(r => setServices(r.data)).catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const payload = {
        ...data,
        customer_email: data.customer_email || undefined,
        service_category_id: data.service_category_id || undefined,
        preferred_date: data.preferred_date || undefined,
      };
      const res = await api.post('/service-requests', payload);
      setReferenceNumber(res.data.reference_number);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Submitted!</h2>
        <p className="text-slate-500 mb-6">Your service request has been received. Keep your reference number to track progress.</p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-600 mb-1 font-medium">Your Reference Number</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-blue-700 font-mono">{referenceNumber}</span>
            <button
              onClick={() => navigator.clipboard.writeText(referenceNumber)}
              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg"
              title="Copy"
            >
              <ClipboardCopy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <a href={`/track?ref=${referenceNumber}`} className="btn-primary text-sm">Track Request</a>
          <a href="/" className="btn-secondary text-sm">Go Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Request a Service</h1>
        <p className="text-slate-500 mt-1">Fill in the details below and our team will review your request promptly.</p>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
            <input {...register('customer_name')} className="input-field" placeholder="Your name" />
            {errors.customer_name && <p className="text-xs text-red-500 mt-1">{errors.customer_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number *</label>
            <input {...register('customer_phone')} className="input-field" placeholder="+91 XXXXX XXXXX" />
            {errors.customer_phone && <p className="text-xs text-red-500 mt-1">{errors.customer_phone.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email (optional)</label>
            <input {...register('customer_email')} type="email" className="input-field" placeholder="email@example.com" />
            {errors.customer_email && <p className="text-xs text-red-500 mt-1">{errors.customer_email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Category</label>
            <select {...register('service_category_id')} className="input-field bg-white">
              <option value="">-- Select service --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Address / Location *</label>
          <input {...register('customer_address')} className="input-field" placeholder="Your address or service location" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Equipment / Machine Details</label>
          <input {...register('equipment_details')} className="input-field" placeholder="Type, make, model, serial number if applicable" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Problem Description *</label>
          <textarea {...register('problem_description')} rows={4} className="input-field resize-none" placeholder="Describe the issue or service needed in detail..." />
          {errors.problem_description && <p className="text-xs text-red-500 mt-1">{errors.problem_description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Date</label>
            <input type="date" {...register('preferred_date')} className="input-field" min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Additional Notes</label>
            <input {...register('additional_notes')} className="input-field" placeholder="Any other information..." />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
            {isSubmitting ? 'Submitting...' : 'Submit Service Request'}
          </button>
        </div>
      </form>
    </div>
  );
};
