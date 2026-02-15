import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { UserRole } from '../types';
import {
  LayoutDashboard, Bus, Users,
  Wallet, Settings
} from 'lucide-react';

export const BottomNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
  };

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
    const isActive = location.pathname === path;
    return (
      <button
        onClick={() => handleNav(path)}
        className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <div className={`p-1.5 rounded-2xl transition-all ${isActive ? 'bg-blue-100/50 shadow-inner' : ''}`}>
             <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-medium mt-0.5">{label}</span>
      </button>
    );
  };

  return (
    <div className="glass-nav fixed bottom-0 left-0 w-full z-50 px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-[70px]">
        <NavItem icon={LayoutDashboard} label="Inicio" path="/" />

        <NavItem icon={Bus} label="Excursiones" path="/excursions" />

        {user?.role === UserRole.DIRECCION && (
            <NavItem icon={Users} label="Usuarios" path="/users" />
        )}

        {(user?.role === UserRole.TESORERIA || user?.role === UserRole.DIRECCION) && (
            <NavItem icon={Wallet} label="Tesorería" path="/treasury" />
        )}

        <NavItem icon={Settings} label="Ajustes" path="/settings" />
      </div>
    </div>
  );
};
