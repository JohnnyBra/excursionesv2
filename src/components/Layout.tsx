import React from 'react';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Bus, Users,
  Wallet, Settings, Sun, Moon, Monitor
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
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

  const NavTab = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
    const isActive = location.pathname === path;
    return (
      <button
        onClick={() => handleNav(path)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
          isActive
            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
        }`}
      >
        <Icon size={16} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Header unificado (móvil y escritorio) */}
      <header className="header-glass sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <img
              src="logo.png"
              alt="Logo La Hispanidad"
              className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
              onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/30'}
            />
          </div>

          {/* Navegación (solo escritorio) */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            <NavTab icon={LayoutDashboard} label="Dashboard" path="/" />
            <NavTab icon={Bus} label="Excursiones" path="/excursions" />
            {user?.role === UserRole.DIRECCION && (
              <NavTab icon={Users} label="Usuarios" path="/users" />
            )}
            {(user?.role === UserRole.TESORERIA || user?.role === UserRole.DIRECCION) && (
              <NavTab icon={Wallet} label="Tesorería" path="/treasury" />
            )}
            <NavTab icon={Settings} label="Ajustes" path="/settings" />
          </nav>

          {/* Espaciador en móvil */}
          <div className="flex-1 md:hidden" />

          {/* Controles derechos */}
          <div className="flex items-center gap-2">
            {/* Badge de usuario (solo escritorio) */}
            {user && (
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm border border-blue-200 dark:border-blue-500/30 shadow-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden lg:block leading-tight">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user.name.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
            )}

            <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-white/10" />

            {/* Toggle de tema */}
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

            {/* Cerrar sesión (solo escritorio) */}
            {user && (
              <button
                onClick={logout}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-all border border-red-500/10 hover:border-red-500/30 text-sm font-medium"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
                <span>Salir</span>
              </button>
            )}

            {/* Enlace a Prisma (siempre visible, último a la derecha) */}
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
            </a>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        {children}
      </main>

      {/* Navegación inferior (solo móvil) */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
