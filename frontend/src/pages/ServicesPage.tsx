import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Clock, ArrowRight, Zap } from 'lucide-react';
import api from '../services/api';
import { ServiceCategory } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ServicesPage = () => {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/services?active_only=true')
      .then(r => setServices(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="bg-[#0f2240] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Our Services</p>
          <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Engineering & Workshop Services</h1>
          <p className="text-blue-200 max-w-xl mx-auto text-base leading-relaxed">
            Professional repair, maintenance, and fabrication. Submit a request for any service and our team will follow up promptly.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" text="Loading services…" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No services available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(svc => (
              <div key={svc.id} className="group bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-lg hover:shadow-slate-200/80 hover:border-blue-200 transition-all duration-200 flex flex-col">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 rounded-2xl flex items-center justify-center mb-5 transition-colors shadow-sm">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{svc.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">{svc.description}</p>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {svc.estimated_price && (
                      <span className="font-semibold text-slate-600">From ₹{Number(svc.estimated_price).toLocaleString('en-IN')}</span>
                    )}
                    {svc.estimated_duration_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ~{svc.estimated_duration_hours}h
                      </span>
                    )}
                    {!svc.estimated_price && !svc.estimated_duration_hours && (
                      <span>Price on enquiry</span>
                    )}
                  </div>
                  <Link
                    to={`/request-service?service=${svc.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    Request <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-[#0f2240] to-[#1e3a5f] rounded-3xl p-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 translate-x-1/3 -translate-y-1/3" />
          <div className="relative">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-black mb-2 tracking-tight">Need something custom?</h2>
            <p className="text-blue-200 mb-6 max-w-sm mx-auto">Don't see what you need? Submit a custom request with full details and we'll evaluate it.</p>
            <Link to="/request-service" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-7 py-3 rounded-2xl font-bold transition-colors shadow-lg shadow-blue-900/30">
              Submit Custom Request <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
