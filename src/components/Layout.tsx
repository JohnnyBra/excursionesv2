import React from 'react';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  LogOut, LayoutDashboard, Bus, Users,
  Wallet, Settings, Sun, Moon, Monitor
} from 'lucide-react';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleNav = (path: string) => {
    navigate(path);
  };

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
    const isActive = location.pathname === path;
    return (
      <div
        onClick={() => handleNav(path)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Unified Header (Mobile & Desktop) */}
      <div className="header-glass sticky top-0 z-50 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img
            src="logo.png"
            alt="Logo La Hispanidad"
            className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
            onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/30'}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle (3 buttons) */}
          <div className="flex bg-gray-200 dark:bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setTheme('light')}
              className={`flex justify-center p-1.5 rounded-md text-sm transition-colors ${theme === 'light' ? 'bg-white text-[#234B6E] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              title="Modo claro"
            >
              <Sun size={14} />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex justify-center p-1.5 rounded-md text-sm transition-colors ${theme === 'system' ? 'bg-white dark:bg-zinc-700 text-[#234B6E] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              title="Automático"
            >
              <Monitor size={14} />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex justify-center p-1.5 rounded-md text-sm transition-colors ${theme === 'dark' ? 'bg-zinc-700 text-[#234B6E] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              title="Modo oscuro"
            >
              <Moon size={14} />
            </button>
          </div>

          {/* Prisma Link */}
          <a
            href="https://prisma.bibliohispa.es"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors font-medium"
            title="Ir al Portal Prisma"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" fill="#3b82f6" stroke="#3b82f6" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
            <span className="hidden sm:inline">Prisma</span>
          </a>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar (Desktop Only) */}
        <aside className="hidden md:flex flex-col w-64 bg-white/60 dark:bg-black/20 backdrop-blur-md border-r border-gray-200 dark:border-white/10 h-[calc(100dvh-57px)] sticky top-[57px] transition-colors duration-300">
          <div className="p-6 flex flex-col items-center text-center border-b border-gray-100 dark:border-white/5">
            <h1 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">
              Gestor de Excursiones
            </h1>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
              Coop. Enseñanza La Hispanidad
            </p>
          </div>

          <nav className="px-4 py-6 space-y-1 flex-1 overflow-y-auto">
            <NavItem icon={LayoutDashboard} label="Dashboard" path="/" />

            <NavItem icon={Bus} label="Excursiones" path="/excursions" />

            {user?.role === UserRole.DIRECCION && (
              <>
                <NavItem icon={Users} label="Usuarios & Permisos" path="/users" />
              </>
            )}

            {(user?.role === UserRole.TESORERIA || user?.role === UserRole.DIRECCION) && (
              <NavItem icon={Wallet} label="Tesorería" path="/treasury" />
            )}

            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5">
              <NavItem icon={Settings} label="Configuración" path="/settings" />
            </div>
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-500/30 shadow-sm">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{user?.role.toLowerCase()}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium w-full px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition"
            >
              <LogOut size={16} /> Cerrar Sesión
            </button>

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 text-center">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold tracking-wide uppercase">
                Creado por Javier Barrero
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100dvh-57px)] md:h-[calc(100dvh-57px)] pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
