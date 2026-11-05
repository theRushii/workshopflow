import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Wrench, Menu, X, Phone, Mail, MapPin } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home',            to: '/',                end: true  },
  { label: 'Services',        to: '/services',        end: false },
  { label: 'Track Request',   to: '/track',           end: false },
];

export const PublicLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top contact bar */}
      <div className="hidden md:block bg-[#1e3a5f] text-blue-200 text-xs">
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="tel:+918530150567" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3 h-3" /> +91 85301 50567
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> MIDC Waluj, Chh. Sambhajinagar
            </span>
          </div>
          <Link to="/login" className="hover:text-white transition-colors">Staff Login</Link>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 bg-[#1e3a5f] rounded-lg flex items-center justify-center shadow-sm">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1e3a5f] leading-tight">Rajesh Engineering Works</p>
                <p className="text-xs text-blue-500 font-medium">WorkshopFlow</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ label, to, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/request-service"
                className="btn-primary text-sm px-5 py-2"
              >
                Request Service
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1 shadow-lg">
            {NAV_LINKS.map(({ label, to, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <div className="pt-2 space-y-2 border-t border-slate-100 mt-2">
              <Link
                to="/request-service"
                className="block btn-primary text-center text-sm"
                onClick={() => setMobileOpen(false)}
              >
                Request Service
              </Link>
              <Link
                to="/login"
                className="block btn-secondary text-center text-sm"
                onClick={() => setMobileOpen(false)}
              >
                Staff Login
              </Link>
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-1 mt-1">
              <a href="tel:+918530150567" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-blue-500" /> +91 85301 50567
              </a>
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
                <MapPin className="w-4 h-4 text-blue-500" /> MIDC Waluj, Chh. Sambhajinagar
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold leading-tight">Rajesh Engineering Works</p>
                  <p className="text-xs text-blue-300">WorkshopFlow</p>
                </div>
              </div>
              <p className="text-sm text-blue-200 leading-relaxed">
                Professional engineering and workshop services. Trusted by businesses for reliable repair, maintenance, and fabrication work.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2.5 text-sm text-blue-200">
                <li><Link to="/services" className="hover:text-white transition-colors">Our Services</Link></li>
                <li><Link to="/request-service" className="hover:text-white transition-colors">Request Service</Link></li>
                <li><Link to="/track" className="hover:text-white transition-colors">Track Your Request</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Staff Login</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Contact Us</h4>
              <div className="space-y-3 text-sm text-blue-200">
                <a
                  href="tel:+918530150567"
                  className="flex items-start gap-2.5 hover:text-white transition-colors group"
                >
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 group-hover:text-blue-400" />
                  +91 85301 50567
                </a>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-300" />
                  <span>MIDC Waluj,<br />Chh. Sambhajinagar</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-sm text-blue-300 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} Rajesh Engineering Works. All rights reserved.</p>
            <p>Powered by <span className="text-blue-400 font-medium">WorkshopFlow</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
};
