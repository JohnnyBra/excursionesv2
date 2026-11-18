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
import { db } from '../services/mockDb';
import { useDataSync } from '../hooks/useDataSync';

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
  useDataSync(); // repinta el selector cuando llega el curso oficial de Prisma
  const schoolYear = db.getSchoolYear();
  const officialYear = db.getOfficialSchoolYear();
  const yearOptions = Array.from(new Set([officialYear - 3, officialYear - 2, officialYear - 1, officialYear, officialYear + 1, schoolYear])).sort((a, b) => b - a);
  const shortYear = (y: number) => `${String(y).slice(-2)}/${String(y + 1).slice(-2)}`;
  const nextTheme = { light: 'dark', dark: 'system', system: 'light' } as const;
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

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
          <label className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400" htmlFor="curso-escolar">Curso</label>
          <select
            id="curso-escolar"
            value={schoolYear}
            onChange={e => db.setSchoolYear(Number(e.target.value))}
            title={schoolYear === officialYear ? 'Curso escolar actual (lo fija Prisma)' : `Estás viendo otro curso; el actual es ${shortYear(officialYear)}`}
            aria-label="Curso escolar"
            className={`hs-boton hs-boton--suave !px-3 text-sm font-semibold cursor-pointer ${schoolYear !== officialYear ? '!border-amber-500 !text-amber-700 dark:!text-amber-300' : ''}`}
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{shortYear(y)}</option>
            ))}
          </select>
          <button
            onClick={() => setTheme(nextTheme[theme])}
            className="sm:hidden hs-boton hs-boton--suave !px-3"
            title="Cambiar tema"
            aria-label={`Tema: ${theme === 'light' ? 'claro' : theme === 'dark' ? 'oscuro' : 'automático'}. Pulsa para cambiar`}
          >
            <ThemeIcon size={16} />
          </button>
          <div className="hidden sm:flex bg-gray-200 dark:bg-zinc-800 rounded-lg p-0.5" role="group" aria-label="Tema">
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
