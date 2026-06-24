import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Target,
  PiggyBank,
  TrendingDown,
  BarChart3,
  Menu,
  X,
  Wallet,
  ChevronRight,
  Repeat,
  LogOut,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '../store/AuthStore';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/accounts', label: 'Cuentas', icon: CreditCard },
  { path: '/movements', label: 'Movimientos', icon: ArrowLeftRight },
  // { path: '/recurrings', label: 'Recurrentes', icon: Repeat },
  { path: '/budgets', label: 'Presupuestos', icon: Target },
  { path: '/savings', label: 'Ahorros', icon: PiggyBank },
  { path: '/debts', label: 'Deudas', icon: TrendingDown },
  { path: '/reports', label: 'Reportes', icon: BarChart3 },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const initials = (() => {
    if (!user) return '?';
    const a = user.firstName?.trim()?.charAt(0) ?? '';
    const b = user.lastName?.trim()?.charAt(0) ?? '';
    const s = `${a}${b}`.toUpperCase();
    return s || '?';
  })();
  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Usuario'
    : 'Sin sesión';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-700/50">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base">Monetria</span>
            <p className="text-slate-400 text-xs">Finanzas Personales</p>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium px-3 mb-3">
            Principal
          </p>
          {NAV_ITEMS.map(({ path, label, icon: Icon, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 space-y-3">
          <div className="px-1">
            <p className="text-slate-500 text-xs uppercase tracking-wider font-medium px-2 mb-2">Tema</p>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{fullName}</p>
              <p className="text-slate-400 text-xs">Mi cuenta</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-800 dark:text-slate-100 font-bold truncate">Monetria</span>
          </div>
          <ThemeToggle compact />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}