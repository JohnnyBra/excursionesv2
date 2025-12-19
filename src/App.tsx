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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50">
        <div className="text-center mb-8 flex flex-col items-center">
          {/* Usamos ruta absoluta /logo.png */}
          <img 
            src="/logo.png" 
            alt="Logo Hispanidad" 
            className="h-24 w-auto mb-4 object-contain drop-shadow-md" 
            onError={(e) => {
                console.error("Error cargando logo en Login:", e);
                // Si falla, ocultamos la imagen rota para que no se vea feo
                e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-2xl font-bold text-gray-900">Gestor de Excursiones</h1>
          <p className="text-indigo-600 font-medium">Cooperativa de Enseñanza La Hispanidad</p>
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
                        className="w-full pl-10 pr-4 py-3 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
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
                        className="w-full pl-10 pr-4 py-3 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium animate-pulse">
                    {error}
                </div>
            )}

            <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
            >
                Entrar a la Plataforma
            </button>
        </form>
        
        <div className="mt-8 text-center space-y-4">
            <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase border-t border-gray-100 pt-4 w-1/2 mx-auto">
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