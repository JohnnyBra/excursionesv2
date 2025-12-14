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
        className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
            <img 
                src="logo.png" 
                alt="Logo" 
                className="h-8 w-auto" 
            />
            <h1 className="font-bold text-sm text-gray-800">Gestor Excursiones</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          <Menu />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        md:translate-x-0 md:static md:block
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col items-center text-center border-b border-gray-100">
          <img 
            src="logo.png" 
            alt="Logo Hispanidad" 
            className="h-20 w-auto mb-3 object-contain drop-shadow-sm" 
          />
          <h1 className="text-lg font-bold text-gray-800 leading-tight">
            Gestor de Excursiones
          </h1>
          <p className="text-xs text-blue-600 font-medium mt-1">
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

          <div className="pt-4 mt-4 border-t border-gray-100">
            <NavItem icon={Settings} label="Configuración" path="/settings" />
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200 shadow-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role.toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium w-full px-2 py-1 rounded hover:bg-red-50 transition"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>

          <div className="mt-4 pt-3 border-t border-gray-200 text-center">
            <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">
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