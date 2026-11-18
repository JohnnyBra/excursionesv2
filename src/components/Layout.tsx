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

const PRISMA = 'https://prisma.bibliohispa.es';
const SUITE = `${PRISMA}/suite`;

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

  const themeButton = (value: 'light' | 'system' | 'dark', Icon: any, label: string) => (
    <button
      onClick={() => setTheme(value)}
      className={`flex justify-center p-1.5 rounded-md text-sm transition-colors ${theme === value ? 'bg-white dark:bg-zinc-700 text-[#0a4a8c] dark:text-sky-300 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
      title={label}
      aria-label={label}
      aria-pressed={theme === value}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className="h-screen h-[100dvh] flex flex-col transition-colors duration-300">
      {/* Cabecera común de la Suite La Hispanidad (kit servido desde Prisma) */}
      <header className="hs-header shrink-0">
        <a className="hs-marca" href="#/">
          <img className="hs-escudo" src={`${SUITE}/escudo.png`} alt="Colegio La Hispanidad" />
          <span>
            <span className="hs-marca-nombre">Excursiones</span>
            <span className="hs-firma">Creado por Javi Barrero</span>
          </span>
        </a>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-200 dark:bg-zinc-800 rounded-lg p-0.5" role="group" aria-label="Tema">
            {themeButton('light', Sun, 'Modo claro')}
            {themeButton('system', Monitor, 'Automático')}
            {themeButton('dark', Moon, 'Modo oscuro')}
          </div>
          <a href={PRISMA} className="hs-boton hs-boton--suave" title="Ir al Portal Prisma">
            <span className="hs-prisma" style={{ '--t': '18px' } as React.CSSProperties} aria-hidden="true" />
            <span className="hidden sm:inline">Prisma</span>
            <span className="sr-only sm:hidden">Ir a Prisma</span>
          </a>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar (Desktop Only) */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white/60 dark:bg-black/20 backdrop-blur-md border-r border-gray-200 dark:border-white/10 transition-colors duration-300">
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
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
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
