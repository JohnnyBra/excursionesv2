import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { db } from './services/mockDb';
import { User } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ExcursionManager } from './components/ExcursionManager';
import { UserManager } from './components/UserManager';
import { ToastProvider, useToast } from './components/ui/Toast';
import { Lock, User as UserIcon, Save, Loader, ShieldCheck } from 'lucide-react';

// Fallback image in base64 (Un escudo simple en azul) para evitar peticiones de red fallidas
const FALLBACK_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%232563eb'%3E%3Cpath d='M50 0L0 20v30c0 30 50 50 50 50s50-20 50-50V20L50 0zm0 15c5 0 10 5 10 10s-5 10-10 10-10-5-10-10 5-10 10-10z' fill='white'/%3E%3C/svg%3E";

// -- Auth Context --
interface AuthContextType {
  user: User | null;
  login: (u: string, p: string) => boolean;
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
        setError('Credenciales incorrectas o servidor no disponible');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50 backdrop-blur-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <img 
            src="logo.png" 
            alt="Logo Hispanidad" 
            className="h-20 w-auto mb-4 object-contain" 
            onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== FALLBACK_LOGO) {
                    target.src = FALLBACK_LOGO;
                    target.onerror = null; // Prevent loop
                }
            }} 
          />
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
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const handleUpdate = () => {
    if (!user) return;

    if (!currentPass || !newPass) {
        addToast('Debes rellenar la contraseña actual y la nueva', 'error');
        return;
    }

    if (currentPass !== user.password) {
        addToast('La contraseña actual es incorrecta', 'error');
        return;
    }

    // Actualizar contraseña
    db.updateUser({ ...user, password: newPass });
    addToast('Contraseña actualizada correctamente', 'success');
    setCurrentPass('');
    setNewPass('');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
             <ShieldCheck size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Seguridad y Perfil</h2>
      </div>
      
      <div className="space-y-6">
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Mostrar</label>
           <input type="text" disabled value={user?.name} className="w-full border p-2 rounded bg-gray-50 text-gray-500" />
        </div>

        <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cambiar Contraseña</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                    <input 
                        type="password" 
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        placeholder="Introduce tu contraseña actual..." 
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                    <input 
                        type="password" 
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="Nueva contraseña..." 
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                </div>
            </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
            <button onClick={handleUpdate} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm">
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
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const initApp = async () => {
        // 1. Load data from server
        try {
            await db.init();
        } catch (e) {
            console.error("Init failed", e);
        }
        
        // 2. Check auth
        const stored = localStorage.getItem('auth_user');
        if (stored) setUser(JSON.parse(stored));
        
        setLoading(false);
    };
    initApp();
  }, []);

  const login = (username: string, pass: string): boolean => {
    const users = db.getUsers();
    // Safety check if users is undefined/empty due to network error
    if (!users || users.length === 0) {
        return false;
    }

    const found = users.find(u => u.username === username && u.password === pass);
    
    if (found) {
        setUser(found);
        localStorage.setItem('auth_user', JSON.stringify(found));
        addToast(`Bienvenido/a ${found.name}`, 'success');
        return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
              <Loader className="animate-spin text-blue-600" size={48} />
              <p className="text-gray-500 font-medium">Conectando con el servidor...</p>
          </div>
      );
  }

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