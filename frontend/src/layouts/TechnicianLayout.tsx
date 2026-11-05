import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Wrench, ChevronDown, LogOut, Menu, X, ChevronRight
} from 'lucide-react';

const NAV = [
  { label: 'My Dashboard', icon: LayoutDashboard, to: '/technician',          end: true  },
  { label: 'My Work Orders', icon: Wrench,          to: '/technician/work-orders', end: false },
];

export const TechnicianLayout = () => {
  const [userMenu,    setUserMenu]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const initials = user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'T';

  const currentPage = NAV.find(n => n.end ? pathname === n.to : pathname.startsWith(n.to))?.label ?? 'Technician Portal';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[200px] flex-shrink-0 bg-[#0f2240] text-white flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-4 border-b border-white/10">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">WorkshopFlow</p>
            <p className="text-[10px] text-emerald-300/80 font-medium">Technician Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2.5 space-y-0.5">
          {NAV.map(({ label, icon: Icon, to, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative
                 ${isActive
                   ? 'bg-white/15 text-white font-semibold'
                   : 'text-blue-100/70 hover:text-white hover:bg-white/8'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-400 rounded-r-full" />}
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative bg-[#0f2240] text-white shadow-2xl z-10 w-64 flex flex-col">
            <div className="absolute top-4 right-4">
              <button onClick={() => setMobileOpen(false)} className="p-1.5 text-blue-300/60 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 h-16 px-4 border-b border-white/10">
              <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">WorkshopFlow</p>
                <p className="text-[10px] text-emerald-300">Technician Portal</p>
              </div>
            </div>
            <nav className="flex-1 py-4 px-2.5 space-y-0.5">
              {NAV.map(({ label, icon: Icon, to, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${isActive ? 'bg-white/15 text-white font-semibold' : 'text-blue-100/70 hover:text-white hover:bg-white/8'}`}>
                  <Icon className="w-4 h-4" />{label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden btn-ghost p-2">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-400 text-xs hidden sm:inline font-medium">Technician</span>
              <ChevronRight className="w-3 h-3 text-slate-300 hidden sm:inline" />
              <span className="font-bold text-slate-800">{currentPage}</span>
            </div>
          </div>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setUserMenu(!userMenu)}
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-xs text-white font-bold">{initials}</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-slate-800 leading-tight">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 font-medium">Technician</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenu ? 'rotate-180' : ''}`} />
            </button>

            {userMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-800">{user?.full_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Technician Account</p>
                </div>
                <button
                  onClick={() => { setUserMenu(false); logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1 font-medium"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
