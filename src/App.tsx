import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { db } from './services/mockDb';
import { User } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ExcursionManager } from './components/ExcursionManager';
import { UserManager } from './components/UserManager';
import { ToastProvider, useToast } from './components/ui/Toast';
import { Lock, User as UserIcon, Save, Loader, ShieldCheck, ArrowLeft } from 'lucide-react';

// -- Auth Context --
interface AuthContextType {
  user: User | null;
  login: (u: string, p: string) => Promise<boolean>;
  loginWithGoogle: (email: string) => Promise<boolean>;
  logout: () => void;
  coordinatorMode: boolean;
  setCoordinatorMode: (mode: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// -- Components --

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const success = await login(username.trim(), password);
        if (!success) {
            setError('Credenciales incorrectas o servidor no disponible');
        }
    } catch(e) {
        setError('Error de conexión');
    } finally {
        setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoRes.json();

        if (userInfo && userInfo.email) {
             // Validar contra Prisma (db local sincronizada)
             const success = await loginWithGoogle(userInfo.email);
             if (!success) {
                  setError('Usuario no autorizado o no encontrado en el sistema.');
             }
        } else {
            setError('No se pudo obtener el email de Google.');
        }
      } catch (err) {
          console.error(err);
          setError('Error validando cuenta Google.');
      } finally {
          setLoading(false);
      }
    },
    onError: () => {
        setError('Google Login falló.');
        setLoading(false);
    }
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <a href="https://prisma.bibliohispa.es/" className="absolute top-6 left-6 text-white hover:text-indigo-100 transition flex items-center gap-2 font-medium z-20">
        <ArrowLeft size={20} />
        <span className="hidden md:inline">Volver a Portal Matriz</span>
      </a>

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
                e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-2xl font-bold text-gray-900">Gestor de Excursiones</h1>
          <p className="text-indigo-600 font-medium">Cooperativa de Enseñanza La Hispanidad</p>
        </div>
        
        <form onSubmit={handleManualLogin} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario Prisma</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        placeholder="Usuario"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN / Contraseña</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
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
                disabled={loading}
                className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex justify-center items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                {loading && <Loader size={18} className="animate-spin" />}
                {loading ? 'Validando...' : 'Entrar con Credenciales'}
            </button>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">O entra con</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <button
                type="button"
                onClick={() => googleLogin()}
                disabled={loading}
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl shadow-sm transition-all flex justify-center items-center gap-2"
            >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    Entrar con Google
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
  const [coordinatorMode, setCoordinatorMode] = useState(false);
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

  const login = async (username: string, pass: string): Promise<boolean> => {
    // FASE 3: Login via Proxy
    const response = await db.loginProxy(username, pass);
    
    if (response && response.success && response.user) {
        // El usuario viene de Prisma
        // Necesitamos mapearlo a nuestro formato User local
        const prismaUser = response.user;

        const userMapped: User = {
            id: prismaUser.id,
            username: prismaUser.username,
            name: prismaUser.name, // "Nombre real del profesor"
            email: prismaUser.email || '',
            role: prismaUser.role, // TUTOR, DIRECCION, etc.
            classId: prismaUser.classId, // Si es tutor, su clase
            password: '', // No guardamos password
            coordinatorCycleId: prismaUser.coordinatorCycleId
        };

        // Opcional: Si queremos que este usuario exista en local DB para referencias futuras
        // db.addUser(userMapped) // Cuidado con duplicados, mejor solo usar en sesión
        // O sincronizar si no existe:
        const localUsers = db.getUsers();
        const existingLocalUser = localUsers.find(u => u.id === userMapped.id);

        if (!existingLocalUser) {
            db.addUser(userMapped);
        } else {
            // Actualizar nombre si cambió en Prisma, pero mantener password local si existe
            // (Evita sobrescribir passwords de usuarios de test con string vacío)
            db.updateUser({
                ...userMapped,
                password: existingLocalUser.password || userMapped.password,
                coordinatorCycleId: existingLocalUser.coordinatorCycleId || userMapped.coordinatorCycleId
            });
        }

        setUser(userMapped);
        localStorage.setItem('auth_user', JSON.stringify(userMapped));
        addToast(`Bienvenido/a ${userMapped.name}`, 'success');
        return true;
    }

    // Warn if specific failure message
    if (response && response.message) {
        console.warn("Login failed with message:", response.message);
    }

    return false;
  };

  const loginWithGoogle = async (email: string): Promise<boolean> => {
      const response = await db.loginGoogle(email);
      if (response && response.success && response.user) {
          const userMapped: User = {
            ...response.user,
            password: ''
          };

          setUser(userMapped);
          localStorage.setItem('auth_user', JSON.stringify(userMapped));
          addToast(`Bienvenido/a ${userMapped.name}`, 'success');
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
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, coordinatorMode, setCoordinatorMode }}>
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