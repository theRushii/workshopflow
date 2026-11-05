import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Wrench, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await login(data.username, data.password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#1e3a5f] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-3 text-white">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg">WorkshopFlow</span>
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Rajesh Engineering<br />Works — Staff Portal
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed mb-8">
            Manage service requests, work orders, invoices, and workshop operations from one place.
          </p>
          <div className="space-y-3 text-blue-200 text-sm">
            {['Service Request Management', 'Work Order Tracking', 'Invoice & Payments', 'Dashboard Analytics'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-400 text-xs">© {new Date().getFullYear()} Rajesh Engineering Works</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1e3a5f] rounded-2xl mb-3 shadow-lg">
              <Wrench className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">WorkshopFlow</h1>
            <p className="text-sm text-slate-500 mt-0.5">Rajesh Engineering Works</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-500 mb-6">Sign in to your staff account</p>

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">⚠</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username or Email
                </label>
                <input
                  {...register('username')}
                  className="input-field"
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                />
                {errors.username && (
                  <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-11"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-2.5 mt-2 text-sm font-semibold"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>

          <div className="text-center mt-5">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
