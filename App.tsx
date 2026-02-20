import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { db } from './services/mockDb';
import { User, UserRole } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ExcursionManager } from './components/ExcursionManager';
import { UserManager } from './components/UserManager';
import { ToastProvider, useToast } from './components/ui/Toast';
import { Lock, User as UserIcon, Save } from 'lucide-react';

// -- Auth Context --
interface AuthContextType {
  user: User | null;
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// -- Components --

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (!success) {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Marca de agua */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-5">
        <img src="/logo.png" alt="" className="w-full max-w-4xl opacity-50" />
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50 backdrop-blur-sm relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="logo.png" alt="Logo Hispanidad" className="h-20 w-auto mb-4 object-contain" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150?text=LOGO'} />
          <h1 className="text-2xl font-bold text-gray-900">Gestor de Excursiones</h1>
          <p className="text-blue-600 font-medium">Cooperativa de Enseñanza La Hispanidad</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Introduce tu usuario"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
          >
            Entrar a la Plataforma
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-[10px] text-gray-300 font-medium tracking-wider uppercase border-t border-gray-100 pt-4 w-1/2 mx-auto">
            Creado por Javier Barrero
          </p>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [pass, setPass] = useState('');

  const handleUpdate = () => {
    addToast('Configuración guardada (Simulación)', 'success');
    setPass('');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración del Perfil</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Mostrar</label>
          <input type="text" disabled value={user?.name} className="w-full border p-2 rounded bg-gray-50 text-gray-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar Contraseña</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Nueva contraseña..."
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="pt-4 border-t">
          <button onClick={handleUpdate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            <Save size={18} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// -- Main App --

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      let localUser = null;
      try {
        const stored = localStorage.getItem('auth_user');
        if (stored) localUser = JSON.parse(stored);
      } catch (e) { localStorage.removeItem('auth_user'); }

      try {
        const res = await fetch('/api/proxy/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            return;
          }
        }
        if (res.status === 401 && !localUser) {
          localStorage.removeItem('auth_user');
        }
      } catch (e) {
        // Network err
      }

      if (localUser) setUser(localUser);
      else setUser(null);
    };

    checkAuth();
  }, []);

  const login = async (username: string, pass: string): Promise<boolean> => {
    // Auth logic against Proxy
    const res = await db.loginProxy(username, pass);

    if (res && res.success && res.user) {
      setUser(res.user);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      addToast(`Bienvenido/a ${res.user.name}`, 'success');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/*" element={
            user ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/excursions" element={<ExcursionManager mode="management" />} />
                  <Route path="/treasury" element={<ExcursionManager mode="treasury" />} />
                  <Route path="/users" element={<UserManager />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}