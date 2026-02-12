import React from 'react';
import { useAuth } from '../App';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Bus, Users,
  Wallet, Settings, Menu, Globe, Sun, Moon
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, coordinatorMode, setCoordinatorMode } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
    const isActive = location.pathname === path;
    return (
      <div
        onClick={() => handleNav(path)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive
          ? 'bg-primary-50 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 font-semibold shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
          }`}
      >
        <Icon size={20} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'} />
        <span className="font-medium">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-app flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Header */}
      <div className="md:hidden glass p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-8 w-auto"
          />
          <h1 className="font-display font-bold text-sm text-gray-900 dark:text-white">Gestor Excursiones</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300">
            <Menu />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 glass-light border-r border-glass-border transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:block
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-glow-pulse" />
            <img
              src="/logo.png"
              alt="Logo Hispanidad"
              className="h-24 w-auto relative object-contain drop-shadow-md"
            />
          </div>
          <h1 className="text-xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400 leading-tight">
            Gestor Excursiones
          </h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-2">
            La Hispanidad
          </p>
        </div>

        <nav className="px-4 py-2 space-y-1">
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

          {user?.coordinatorCycleId && (
            <div className="px-4 py-4 mt-2 mb-2">
              <div className="flex items-center justify-between bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-transparent border border-purple-100 dark:border-purple-500/20 p-4 rounded-xl shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">Coordinador</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400">Ver todo el ciclo</span>
                </div>
                <button
                  onClick={() => setCoordinatorMode(!coordinatorMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${coordinatorMode ? 'bg-purple-600' : 'bg-gray-300 dark:bg-white/20'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${coordinatorMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5">
            <NavItem icon={Settings} label="Configuración" path="/settings" />
            <a
              href="https://prisma.bibliohispa.es/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <Globe size={20} className="text-gray-400 dark:text-gray-500" />
              <span className="font-medium">Portal Matriz</span>
            </a>
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/10 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/50 dark:to-primary-800/30 flex items-center justify-center text-primary-600 dark:text-primary-300 font-bold border border-primary-200 dark:border-primary-700/50 shadow-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{user?.role.toLowerCase()}</p>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold w-full px-2 py-2 rounded-lg transition-colors"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-69px)] md:h-screen relative scrollbar-hide">
        {/* Marca de agua */}
        <div className="fixed inset-0 md:left-72 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.05]">
          <img src="/logo.png" alt="" className="w-1/3 max-w-2xl object-contain grayscale" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};