import React from 'react';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Bus, Users,
  Wallet, Settings
} from 'lucide-react';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
  };

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
    const isActive = location.pathname === path;
    return (
      <div
        onClick={() => handleNav(path)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-primary-100/50 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10'}`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Header (Branding only) */}
      <div className="md:hidden glass-nav p-4 flex justify-center items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
            <img src="logo.png" alt="Logo" className="h-8 w-auto" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/30'} />
            <h1 className="font-bold text-sm text-gray-800 dark:text-gray-100">Gestor Excursiones</h1>
        </div>
      </div>

      {/* Sidebar (Desktop Only) */}
      <aside className="hidden md:flex flex-col w-64 glass-light h-screen sticky top-0 transition-colors duration-300">
        <div className="p-6 flex flex-col items-center text-center border-b border-gray-200/50 dark:border-white/5">
          <img src="logo.png" alt="Logo Hispanidad" className="h-16 w-auto mb-3 object-contain" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150?text=LOGO'} />
          <h1 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">
            Gestor de Excursiones
          </h1>
          <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">
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

          <div className="pt-4 mt-4 border-t border-gray-200/50 dark:border-white/5">
            <NavItem icon={Settings} label="Configuración" path="/settings" />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200/50 dark:border-white/5 glass-panel">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-300 font-bold border border-primary-200 dark:border-primary-500/30 shadow-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-100">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{user?.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium w-full px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>

          <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-white/10 text-center">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold tracking-wide uppercase">
              Creado por Javier Barrero
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-65px)] md:h-screen pb-24 md:pb-8">
        {children}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
