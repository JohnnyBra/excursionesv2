import React from 'react';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, LayoutDashboard, Bus, Users, 
  Wallet, Settings, Menu 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
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
        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-blue-100 dark:bg-primary-900/20 text-blue-700 dark:text-primary-400' : 'text-gray-600 dark:text-surface-300 hover:bg-gray-100 dark:hover:bg-surface-700'}`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700 p-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
            <img src="logo.png" alt="Logo" className="h-8 w-auto" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/30'} />
            <h1 className="font-bold text-sm text-gray-800 dark:text-white">Gestor Excursiones</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 dark:text-surface-300">
          <Menu />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-surface-800 border-r border-gray-200 dark:border-surface-700 transform transition-transform duration-200 ease-in-out
        md:translate-x-0 md:static md:block
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col items-center text-center border-b border-gray-100 dark:border-surface-700">
          <img src="logo.png" alt="Logo Hispanidad" className="h-16 w-auto mb-3 object-contain" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150?text=LOGO'} />
          <h1 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">
            Gestor de Excursiones
          </h1>
          <p className="text-xs text-blue-600 dark:text-primary-400 font-medium mt-1">
            Coop. Enseñanza La Hispanidad
          </p>
        </div>

        <nav className="px-4 py-6 space-y-1">
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

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-surface-700">
            <NavItem icon={Settings} label="Configuración" path="/settings" />
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 dark:border-surface-700 bg-gray-50 dark:bg-surface-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-primary-900/30 flex items-center justify-center text-blue-600 dark:text-primary-400 font-bold border border-blue-200 dark:border-primary-800 shadow-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-gray-800 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-surface-400 truncate capitalize">{user?.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium w-full px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-surface-700 text-center">
            <p className="text-[10px] text-gray-400 dark:text-surface-600 font-semibold tracking-wide uppercase">
              Creado por Javier Barrero
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-60px)] md:h-screen">
        {children}
      </main>
    </div>
  );
};