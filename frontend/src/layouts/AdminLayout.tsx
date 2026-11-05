import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, ClipboardList, Wrench, UserCog,
  Settings, Package, FileText, CreditCard, BarChart3,
  Menu, X, ChevronDown, LogOut, ChevronRight, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard',        icon: LayoutDashboard, to: '/admin',                  end: true  },
  { label: 'Customers',        icon: Users,           to: '/admin/customers',        end: false },
  { label: 'Service Requests', icon: ClipboardList,   to: '/admin/service-requests', end: false },
  { label: 'Work Orders',      icon: Wrench,          to: '/admin/work-orders',      end: false },
  { label: 'Technicians',      icon: UserCog,         to: '/admin/technicians',      end: false },
  { label: 'Services',         icon: Settings,        to: '/admin/services',         end: false },
  { label: 'Inventory',        icon: Package,         to: '/admin/inventory',        end: false },
  { label: 'Invoices',         icon: FileText,        to: '/admin/invoices',         end: false },
  { label: 'Payments',         icon: CreditCard,      to: '/admin/payments',         end: false },
  { label: 'Reports',          icon: BarChart3,       to: '/admin/reports',          end: false },
];

function useBreadcrumb() {
  const { pathname } = useLocation();
  const match = NAV.find(n => n.end ? pathname === n.to : pathname.startsWith(n.to));
  return match?.label ?? 'Admin';
}

export const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const breadcrumb = useBreadcrumb();
  const menuRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const initials = user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A';

  const SidebarNav = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-72' : ''}`}>
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-white/10 flex-shrink-0 ${collapsed && !mobile ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/30 flex-shrink-0">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <p className="text-sm font-bold text-white leading-tight">WorkshopFlow</p>
            <p className="text-[10px] text-blue-300/80 font-medium">Rajesh Eng. Works</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-0.5">
        {NAV.map(({ label, icon: Icon, to, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed && !mobile ? label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-xl text-sm transition-all duration-150 group relative
               ${collapsed && !mobile ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
               ${isActive
                 ? 'bg-white/15 text-white font-semibold shadow-sm'
                 : 'text-blue-100/70 hover:text-white hover:bg-white/8'
               }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-400 rounded-r-full" />}
                <Icon className={`flex-shrink-0 transition-transform ${collapsed && !mobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                {(!collapsed || mobile) && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle (desktop) */}
      {!mobile && (
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-blue-300/60 hover:text-white hover:bg-white/10 transition-all text-xs font-medium"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <><PanelLeftClose className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-shrink-0 bg-[#0f2240] text-white flex-col transition-all duration-200 ${collapsed ? 'w-[68px]' : 'w-[220px]'}`}>
        <SidebarNav />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative bg-[#0f2240] text-white shadow-2xl z-10 flex">
            <div className="absolute top-4 right-4 z-20">
              <button onClick={() => setMobileOpen(false)} className="p-1.5 text-blue-300/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarNav mobile />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 shadow-sm shadow-slate-200/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden btn-ghost p-2"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-400 text-xs hidden sm:inline font-medium">Admin</span>
              <ChevronRight className="w-3 h-3 text-slate-300 hidden sm:inline" />
              <span className="font-bold text-slate-800">{breadcrumb}</span>
            </div>
          </div>

          <div className="flex items-center gap-2" ref={menuRef}>
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-xs text-white font-bold tracking-tight">{initials}</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-slate-800 leading-tight">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-400 capitalize font-medium">{user?.role}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${userMenu ? 'rotate-180' : ''}`} />
              </button>

              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200/80 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">{user?.full_name}</p>
                    <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role} Account</p>
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
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
