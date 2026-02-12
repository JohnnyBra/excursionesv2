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

      <a href="https://prisma.bibliohispa.es/" className="absolute top-6 left-6 text-white/70 hover:text-white transition flex items-center gap-2 font-medium z-20 glass px-4 py-2 rounded-full text-sm">
        <ArrowLeft size={16} />
        <span className="hidden md:inline">Portal Matriz</span>
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
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
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
    <div className="max-w-2xl mx-auto glass p-8 rounded-2xl animate-slide-up">
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

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}