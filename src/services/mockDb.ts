import { User, ClassGroup, Cycle, Student, Excursion, Participation } from '../types';
import { io, Socket } from 'socket.io-client';

// --- API CONFIG ---
const API_URL = '/api';
const SOCKET_URL = 'http://localhost:3005'; // URL directa del backend

// Cache local
let localState = {
  users: [] as User[],
  cycles: [] as Cycle[],
  classes: [] as ClassGroup[],
  students: [] as Student[],
  excursions: [] as Excursion[],
  participations: [] as Participation[]
};

let isInitialized = false;
let socket: Socket | null = null;
let listeners: Array<() => void> = [];

// Datos Iniciales por defecto (por si falla servidor o primera carga)
const MOCK_CYCLES: Cycle[] = [
  { id: 'c1', name: 'Infantil (3, 4, 5 años)' },
  { id: 'c2', name: 'Primaria - 1º Ciclo (1º y 2º)' },
  { id: 'c3', name: 'Primaria - 2º Ciclo (3º y 4º)' },
  { id: 'c4', name: 'Primaria - 3º Ciclo (5º y 6º)' },
  { id: 'c5', name: 'ESO - 1º Ciclo (1º y 2º)' },
  { id: 'c6', name: 'ESO - 2º Ciclo (3º y 4º)' }
];

const generateParticipationsForExcursion = (exc: Excursion) => {
  let targetStudents: Student[] = [];
  if (exc.scope === 'GLOBAL') {
    targetStudents = localState.students;
  } else if (exc.scope === 'CICLO') {
    const cycleClasses = localState.classes.filter(c => c.cycleId === exc.targetId).map(c => c.id);
    targetStudents = localState.students.filter(s => cycleClasses.includes(s.classId));
  } else if (exc.scope === 'CLASE') {
    targetStudents = localState.students.filter(s => s.classId === exc.targetId);
  }

  const newParticipations = targetStudents.map(s => ({
    id: crypto.randomUUID(),
    studentId: s.id,
    excursionId: exc.id,
    authSigned: false,
    paid: false,
    amountPaid: 0,
    attended: false
  }));

  localState.participations.push(...newParticipations);
  newParticipations.forEach(p => syncItem('participations', p));
};

// --- Helper Fetch ---
const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const config: RequestInit = { method, headers };
    if (body) config.body = JSON.stringify(body);
    
    // Construir URL final
    const url = endpoint.startsWith('/') ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;
    
    const res = await fetch(url, config);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    return null;
  }
};

// --- Sync Functions ---
const syncItem = (entity: string, item: any) => {
  apiCall(`/sync/${entity}`, 'POST', item);
  // Nota: No necesitamos notificar listeners aquí manualmente, 
  // el socket nos devolverá el evento 'db_update' y recargará todo.
  // Sin embargo, para respuesta inmediata UI (Optimistic UI), ya actualizamos localState abajo.
};

const deleteItem = (entity: string, id: string) => {
  apiCall(`/sync/${entity}/${id}`, 'DELETE');
};

const notifyListeners = () => {
    listeners.forEach(cb => cb());
};

const fetchAndLoadData = async () => {
    try {
      const data = await apiCall('/db');
      if (data) {
        localState = data;
        console.log("Datos sincronizados con servidor via Socket/Init");
        notifyListeners();
        return true;
      }
    } catch (e) {
      console.error("Error fetching data", e);
    }
    return false;
};

export const db = {
  // Inicialización y Socket
  init: async () => {
    // Conectar Socket siempre, aunque ya tengamos datos (para reconexiones)
    db.connectSocket();

    if (isInitialized) return;
    
    const success = await fetchAndLoadData();
    if (success) {
        isInitialized = true;
    } else {
        // Fallback
        if(localState.cycles.length === 0) localState.cycles = MOCK_CYCLES;
    }
  },

  connectSocket: () => {
    if (socket) return; // Ya conectado

    socket = io(SOCKET_URL);

    socket.on('connect', () => {
        console.log('🌐 Conectado al servidor de tiempo real');
    });

    socket.on('db_update', (payload) => {
        console.log('📥 Actualización recibida del servidor:', payload);
        // Cuando alguien cambia algo, recargamos todo
        db.reload();
    });
  },

  reload: async () => {
      await fetchAndLoadData();
  },

  // Sistema de Suscripción (Observer Pattern) para Hooks
  subscribe: (callback: () => void) => {
      listeners.push(callback);
      return () => {
          listeners = listeners.filter(cb => cb !== callback);
      };
  },

  // Getters
  getUsers: () => localState.users,
  getCycles: () => localState.cycles,
  getClasses: () => localState.classes,
  getStudents: () => localState.students,
  getExcursions: () => localState.excursions,
  getParticipations: () => localState.participations,
  
  // Direct Access Properties
  get cycles() { return localState.cycles },
  get classes() { return localState.classes },

  // --- WRITE OPERATIONS ---

  // Users
  addUser: (user: User) => {
    localState.users.push(user);
    syncItem('users', user);
  },
  updateUser: (user: User) => {
    const idx = localState.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      localState.users[idx] = user;
      syncItem('users', user);
    }
  },
  deleteUser: (id: string) => {
    localState.users = localState.users.filter(u => u.id !== id);
    deleteItem('users', id);
  },

  // Classes
  addClass: (cls: ClassGroup) => {
    localState.classes.push(cls);
    syncItem('classes', cls);

    const tutorIndex = localState.users.findIndex(u => u.id === cls.tutorId);
    if (tutorIndex >= 0) {
      localState.users[tutorIndex].classId = cls.id;
      syncItem('users', localState.users[tutorIndex]);
    }
  },

  updateClass: (cls: ClassGroup) => {
    const idx = localState.classes.findIndex(c => c.id === cls.id);
    if (idx >= 0) {
      const oldClass = localState.classes[idx];

      // Si cambia el tutor, actualizar referencias en usuarios
      if (oldClass.tutorId !== cls.tutorId) {
          // 1. Quitar clase al tutor antiguo
          if (oldClass.tutorId) {
             const oldTutorIdx = localState.users.findIndex(u => u.id === oldClass.tutorId);
             if (oldTutorIdx >= 0) {
                 localState.users[oldTutorIdx].classId = undefined;
                 syncItem('users', localState.users[oldTutorIdx]);
             }
          }
          // 2. Asignar clase al tutor nuevo
          if (cls.tutorId) {
             const newTutorIdx = localState.users.findIndex(u => u.id === cls.tutorId);
             if (newTutorIdx >= 0) {
                 localState.users[newTutorIdx].classId = cls.id;
                 syncItem('users', localState.users[newTutorIdx]);
             }
          }
      }

      localState.classes[idx] = cls;
      syncItem('classes', cls);
    }
  },

  deleteClass: (id: string) => {
    const cls = localState.classes.find(c => c.id === id);
    if (cls && cls.tutorId) {
      const tutorIndex = localState.users.findIndex(u => u.id === cls.tutorId);
      if (tutorIndex >= 0) {
        localState.users[tutorIndex].classId = undefined;
        syncItem('users', localState.users[tutorIndex]);
      }
    }

    localState.classes = localState.classes.filter(c => c.id !== id);
    deleteItem('classes', id);
  },

  // Students
  addStudent: (student: Student) => {
    localState.students.push(student);
    syncItem('students', student);
  },
  updateStudent: (student: Student) => {
    const idx = localState.students.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      localState.students[idx] = student;
      syncItem('students', student);
    }
  },
  deleteStudent: (id: string) => {
    localState.students = localState.students.filter(s => s.id !== id);
    deleteItem('students', id);

    const toDelete = localState.participations.filter(p => p.studentId === id);
    localState.participations = localState.participations.filter(p => p.studentId !== id);
    toDelete.forEach(p => deleteItem('participations', p.id));
  },
  
  importStudentsCSV: (csvContent: string, targetClassId: string) => {
    const lines = csvContent.split(/\r?\n/);
    let count = 0;
    const cleanStr = (str: string) => str.trim().replace(/['"]/g, '');

    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split(',');
      if (parts.length >= 2) {
         const surnames = cleanStr(parts[0]);
         const name = cleanStr(parts[1]);
         if (name && surnames) {
            const newStudent = {
                id: crypto.randomUUID(),
                name: `${name} ${surnames}`,
                classId: targetClassId
            };
            localState.students.push(newStudent);
            syncItem('students', newStudent);
            count++;
         }
      }
    });
    return count;
  },

  // Excursions
  addExcursion: (exc: Excursion) => {
    localState.excursions.push(exc);
    syncItem('excursions', exc);
    generateParticipationsForExcursion(exc);
  },

  updateExcursion: (updated: Excursion) => {
    const idx = localState.excursions.findIndex(x => x.id === updated.id);
    if (idx >= 0) {
      const old = localState.excursions[idx];
      const scopeChanged = old.scope !== updated.scope || old.targetId !== updated.targetId;

      localState.excursions[idx] = updated;
      syncItem('excursions', updated);

      if (scopeChanged) {
        // Remove old participations
        const toDelete = localState.participations.filter(p => p.excursionId === updated.id);
        localState.participations = localState.participations.filter(p => p.excursionId !== updated.id);
        toDelete.forEach(p => deleteItem('participations', p.id));

        // Generate new ones
        generateParticipationsForExcursion(updated);
      }
    }
  },

  deleteExcursion: (id: string) => {
     localState.excursions = localState.excursions.filter(e => e.id !== id);
     deleteItem('excursions', id);
     
     const toDelete = localState.participations.filter(p => p.excursionId === id);
     localState.participations = localState.participations.filter(p => p.excursionId !== id);
     toDelete.forEach(p => deleteItem('participations', p.id));
  },

  updateParticipation: (p: Participation) => {
    const idx = localState.participations.findIndex(x => x.id === p.id);
    if (idx >= 0) {
      localState.participations[idx] = p;
      syncItem('participations', p);
    }
  },
  
  // System
  exportDatabase: () => {
    const blob = new Blob([JSON.stringify(localState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_hispanidad_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  },

  importDatabase: async (file: File) => {
    return new Promise<boolean>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if(data.users && data.excursions) {
                    await apiCall('/restore', 'POST', data);
                    localState = data;
                    resolve(true);
                }
            } catch (err) {
                console.error(err);
                resolve(false);
            }
        };
        reader.readAsText(file);
    });
  },
  
  reset: () => {
      alert("Contacta al administrador para borrar el servidor.");
  }
};