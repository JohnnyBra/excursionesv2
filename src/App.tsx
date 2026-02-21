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
import { Lock, User as UserIcon, Save, Loader, ShieldCheck, ArrowLeft, Moon, Sun, Monitor, LogOut } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

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
    } catch (e) {
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
    <div className="min-h-screen min-h-[100dvh] mesh-auth flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Animated floating orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-primary-500/10 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] rounded-full bg-accent-500/10 blur-3xl animate-float pointer-events-none" />

      <a href="https://prisma.bibliohispa.es/" className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 dark:text-white/70 dark:hover:text-white transition flex items-center gap-2 font-medium z-20 glass px-4 py-2 rounded-full text-sm">
        <ArrowLeft size={16} />
        <span className="hidden md:inline">Volver a Prisma</span>
      </a>

      <div className="glass-medium p-8 rounded-3xl shadow-glass-lg w-full max-w-md animate-scale-in relative z-10 mx-4">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-glow-pulse" />
            <img
              src="/logo.png"
              alt="Logo Hispanidad"
              className="h-20 w-auto relative object-contain drop-shadow-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400 dark:from-primary-300 dark:to-accent-300 mb-2">
            Gestor Excursiones
          </h1>
          <p className="text-sm font-medium text-muted dark:text-gray-400 uppercase tracking-wide">
            Cooperativa de Enseñanza La Hispanidad
          </p>
        </div>

        <form onSubmit={handleManualLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-muted dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Usuario Prisma</label>
            <div className="relative group">
              <UserIcon className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all placeholder:text-gray-400 dark:text-white"
                placeholder="Usuario"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">PIN / Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all placeholder:text-gray-400 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl text-center font-bold animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-display font-bold text-base shadow-lg shadow-primary-500/25 transition-all active:scale-[0.98] flex justify-center items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading && <Loader size={18} className="animate-spin" />}
            {loading ? 'Validando...' : 'Entrar con Credenciales'}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">O entra con</span>
            <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
          </div>

          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={loading}
            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white font-bold py-3 rounded-xl shadow-sm transition-all flex justify-center items-center gap-3 backdrop-blur-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar con Google
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-400 dark:text-white/30 font-bold tracking-widest uppercase border-t border-gray-200 dark:border-white/10 pt-4 w-1/2 mx-auto">
            Creado por Javier Barrero
          </p>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
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
    <div className="max-w-2xl mx-auto glass p-8 rounded-2xl animate-slide-up pb-24">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-xl">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Seguridad y Perfil</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona tu cuenta y contraseña</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Nombre Mostrar</label>
          <input type="text" disabled value={user?.name} className="w-full border border-gray-200 dark:border-white/10 p-3 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium" />
        </div>

        {/* Theme Section */}
        <div className="pt-6 border-t border-gray-100 dark:border-white/10">
          <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-6">Apariencia</h3>
          <div className="grid grid-cols-3 gap-4">
             <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === 'light' ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:border-primary-500/50 dark:text-primary-300' : 'border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'}`}
             >
                <Sun size={24} />
                <span className="text-xs font-bold uppercase tracking-wider">Claro</span>
             </button>
             <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:border-primary-500/50 dark:text-primary-300' : 'border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'}`}
             >
                <Moon size={24} />
                <span className="text-xs font-bold uppercase tracking-wider">Oscuro</span>
             </button>
             <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === 'system' ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:border-primary-500/50 dark:text-primary-300' : 'border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'}`}
             >
                <Monitor size={24} />
                <span className="text-xs font-bold uppercase tracking-wider">Sistema</span>
             </button>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-white/10">
          <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-6">Cambiar Contraseña</h3>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Contraseña Actual</label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Introduce tu contraseña actual..."
                className="w-full border border-gray-200 dark:border-white/10 p-3 rounded-xl bg-white dark:bg-black/20 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Nueva Contraseña</label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Nueva contraseña..."
                className="w-full border border-gray-200 dark:border-white/10 p-3 rounded-xl bg-white dark:bg-black/20 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-white/10 flex justify-end">
          <button onClick={handleUpdate} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-primary-500/20 active:scale-95">
            <Save size={18} /> Guardar Cambios
          </button>
        </div>

        {/* Logout Button (Mobile mainly) */}
        <div className="pt-6 border-t border-gray-100 dark:border-white/10 md:hidden">
            <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 px-6 py-4 rounded-xl transition-all font-bold"
            >
                <LogOut size={20} /> Cerrar Sesión
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

      // 2. SSO silent check (cookie-based auto-login)
      try {
        const ssoRes = await fetch('/api/proxy/me');
        if (ssoRes.ok) {
          const ssoData = await ssoRes.json();
          if (ssoData.success && ssoData.user) {
            const ssoUser: User = {
              id: ssoData.user.id,
              username: ssoData.user.username || ssoData.user.email || ssoData.user.id,
              name: ssoData.user.name || ssoData.user.id,
              email: ssoData.user.email || '',
              role: ssoData.user.role as User['role'],
              classId: ssoData.user.classId,
              password: '',
              coordinatorCycleId: ssoData.user.coordinatorCycleId
            };

            // Merge with local user data if available (for coordinatorCycleId etc.)
            const localUsers = db.getUsers();
            const existingLocal = localUsers.find(u => u.id === ssoUser.id);
            if (existingLocal) {
              ssoUser.coordinatorCycleId = existingLocal.coordinatorCycleId || ssoUser.coordinatorCycleId;
              ssoUser.classId = ssoUser.classId || existingLocal.classId;
            }

            setUser(ssoUser);
            localStorage.setItem('auth_user', JSON.stringify(ssoUser));
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // Network error or SSO not available — fall through to localStorage
      }

      // 3. Fallback: check localStorage
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

      // MERGE: Combinar datos de Prisma con datos locales (password, coordinatorCycleId)
      // Esto es CRÍTICO para que el coordinatorCycleId se mantenga en la sesión si Prisma no lo envía
      const mergedUser: User = {
        ...userMapped,
        password: existingLocalUser ? (existingLocalUser.password || userMapped.password) : userMapped.password,
        coordinatorCycleId: existingLocalUser ? (existingLocalUser.coordinatorCycleId || userMapped.coordinatorCycleId) : userMapped.coordinatorCycleId
      };

      if (!existingLocalUser) {
        db.addUser(mergedUser);
      } else {
        db.updateUser(mergedUser);
      }

      setUser(mergedUser);
      localStorage.setItem('auth_user', JSON.stringify(mergedUser));
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-surface-900 gap-4">
        <Loader className="animate-spin text-primary-600" size={48} />
        <p className="text-gray-500 dark:text-gray-400 font-medium">Conectando con el servidor...</p>
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

// -- Main App --

import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="schooltrip-theme">
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
