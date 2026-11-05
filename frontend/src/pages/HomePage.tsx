import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, Clock, ClipboardList, Wrench,
  Shield, Star, Phone, ChevronRight, MapPin, Zap
} from 'lucide-react';
import api from '../services/api';
import { ServiceCategory } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

const STEPS = [
  { icon: ClipboardList, step: '01', title: 'Submit Request',    desc: 'Fill out our online form with your service details and contact information.' },
  { icon: CheckCircle,   step: '02', title: 'We Review & Accept', desc: 'Our team reviews your request and confirms acceptance within 24 hours.' },
  { icon: Wrench,        step: '03', title: 'Work Begins',        desc: 'Skilled technicians are assigned and work commences on schedule.' },
  { icon: Star,          step: '04', title: 'Delivery',           desc: 'Work is completed, inspected, and handed over with full documentation.' },
];

const FEATURES = [
  { icon: Shield,       title: 'Quality Assured',    desc: 'Every job is executed with precision and inspected before delivery.' },
  { icon: Clock,        title: 'On-Time Delivery',   desc: 'We respect your timelines and production schedules.' },
  { icon: Zap,          title: 'Expert Technicians', desc: 'Experienced professionals skilled across multiple engineering disciplines.' },
  { icon: CheckCircle,  title: 'Online Tracking',    desc: 'Track your service request status online — 24 hours a day.' },
];

export const HomePage = () => {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    api.get('/services?active_only=true')
      .then(r => setServices(r.data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-[#1e3a5f] text-white relative overflow-hidden">
        {/* Subtle geometric background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-400 translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-blue-300 -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm text-blue-200 font-medium">MIDC Waluj, Chh. Sambhajinagar</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight tracking-tight">
              Engineering & Workshop<br />
              <span className="text-blue-400">Services You Can Trust</span>
            </h1>

            <p className="text-lg text-blue-100 mb-8 leading-relaxed">
              Rajesh Engineering Works delivers precision repair, maintenance, and fabrication services. Submit your service request online and track progress in real time.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                to="/request-service"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-900/30"
              >
                Request Service <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                View Services
              </Link>
            </div>

            {/* Quick contact */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-blue-200">
              <a href="tel:+918530150567" className="flex items-center gap-2 hover:text-white transition-colors">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                +91 85301 50567
              </a>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                MIDC Waluj, Chh. Sambhajinagar
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
            {[
              { value: '500+',  label: 'Jobs Completed'    },
              { value: '10+',   label: 'Service Categories' },
              { value: '24 hr', label: 'Response Time'     },
              { value: '100%',  label: 'Online Tracking'   },
            ].map(s => (
              <div key={s.label} className="text-center py-5 px-4">
                <p className="text-2xl font-bold text-[#1e3a5f]">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services Preview ── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-widest mb-1">What We Do</p>
              <h2 className="text-2xl font-bold text-slate-900">Our Services</h2>
              <p className="text-slate-500 mt-1 text-sm">Engineering and workshop services across multiple disciplines</p>
            </div>
            <Link
              to="/services"
              className="hidden sm:inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              All services <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingServices ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" text="Loading services..." />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No services available at the moment.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(svc => (
                <div
                  key={svc.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                    <Wrench className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1.5">{svc.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-2">{svc.description}</p>
                  <div className="flex items-center justify-between">
                    {svc.estimated_price ? (
                      <span className="text-xs text-slate-400 font-medium">From ₹{Number(svc.estimated_price).toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Price on request</span>
                    )}
                    <Link
                      to={`/request-service?service=${svc.id}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Request <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link to="/services" className="btn-secondary text-sm inline-flex items-center gap-1">
              View all services <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-widest mb-1">Process</p>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">How It Works</h2>
            <p className="text-slate-500 text-sm">Simple and transparent — from request to delivery</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-slate-200 -translate-x-4 z-0" />
                )}
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#1e3a5f] rounded-xl flex items-center justify-center shadow-sm">
                      <step.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-black text-slate-100">{step.step}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-widest mb-1">Why Choose Us</p>
            <h2 className="text-2xl font-bold text-slate-900">What Sets Us Apart</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-[#1e3a5f] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-blue-200 mb-8 text-lg">Submit your service request online — our team responds within 24 hours.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/request-service"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-7 py-3 rounded-xl font-semibold transition-colors shadow-lg"
            >
              Request Service <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:+918530150567"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 px-7 py-3 rounded-xl font-semibold transition-colors"
            >
              <Phone className="w-4 h-4" /> +91 85301 50567
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
