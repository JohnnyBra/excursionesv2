import { User, UserRole, ClassGroup, Cycle, Student, Excursion, ExcursionScope, Participation, ExcursionClothing, TransportType } from '../types';

// Initial Seed Data
const MOCK_CYCLES: Cycle[] = [
  { id: 'c1', name: 'Infantil' },
  { id: 'c2', name: 'Primaria 1º Ciclo' },
  { id: 'c3', name: 'Primaria 2º Ciclo' },
  { id: 'c4', name: 'Primaria 3º Ciclo' },
  { id: 'c5', name: 'Secundaria 1º Ciclo' },
  { id: 'c6', name: 'Secundaria 2º Ciclo' },
];

const MOCK_USERS: User[] = [
  { id: 'u1', username: 'direccion', password: '123', name: 'Ana Directora', email: 'admin@hispanidad.com', role: UserRole.DIRECCION },
  { id: 'u2', username: 'tutor1', password: '123', name: 'Carlos Tutor', email: 'tutor@hispanidad.com', role: UserRole.TUTOR, classId: 'cl1' },
  { id: 'u3', username: 'tesoreria', password: '123', name: 'Laura Tesorera', email: 'money@hispanidad.com', role: UserRole.TESORERIA },
  { id: 'u4', username: 'tutor2', password: '123', name: 'Maria Tutor 2', email: 'tutor2@hispanidad.com', role: UserRole.TUTOR, classId: 'cl2' },
];

const MOCK_CLASSES: ClassGroup[] = [
  { id: 'cl1', name: '1º A', cycleId: 'c2', tutorId: 'u2' },
  { id: 'cl2', name: '2º B', cycleId: 'c2', tutorId: 'u4' },
];

const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Pepito Pérez', classId: 'cl1' },
  { id: 's2', name: 'Juanita López', classId: 'cl1' },
  { id: 's3', name: 'Andrés García', classId: 'cl1' },
  { id: 's4', name: 'Lucía Martín', classId: 'cl2' },
  { id: 's5', name: 'Sofía Ruiz', classId: 'cl2' },
];

const MOCK_EXCURSIONS: Excursion[] = [
  {
    id: 'e1',
    title: 'Visita al Zoo',
    description: 'Conoceremos los animales de la sabana.',
    justification: 'Refuerzo de la asignatura de Conocimiento del Medio, unidad de vertebrados.',
    destination: 'Zoo City',
    dateStart: new Date(Date.now() + 86400000 * 5).toISOString(),
    dateEnd: new Date(Date.now() + 86400000 * 5 + 18000000).toISOString(), // +5 horas
    clothing: ExcursionClothing.PE_KIT,
    transport: TransportType.BUS,
    costBus: 200,
    costEntry: 150,
    costGlobal: 25,
    scope: ExcursionScope.CLASE,
    targetId: 'cl1',
    creatorId: 'u2',
    estimatedStudents: 25
  },
  {
    id: 'e2',
    title: 'Teatro Musical',
    description: 'Obra de teatro infantil.',
    justification: 'Fomento de la cultura y las artes escénicas.',
    destination: 'Gran Teatro',
    dateStart: new Date(Date.now() - 86400000 * 2).toISOString(),
    dateEnd: new Date(Date.now() - 86400000 * 2 + 10800000).toISOString(), // +3 horas
    clothing: ExcursionClothing.UNIFORM,
    transport: TransportType.WALKING,
    costBus: 300,
    costEntry: 300,
    costGlobal: 15,
    scope: ExcursionScope.GLOBAL,
    creatorId: 'u1',
    estimatedStudents: 100
  }
];

const MOCK_PARTICIPATIONS: Participation[] = [
  { id: 'p1', studentId: 's1', excursionId: 'e1', authSigned: true, paid: true, amountPaid: 25, attended: true, authDate: '2023-10-01' },
  { id: 'p2', studentId: 's2', excursionId: 'e1', authSigned: false, paid: false, amountPaid: 0, attended: false },
  { id: 'p3', studentId: 's3', excursionId: 'e1', authSigned: true, paid: false, amountPaid: 0, attended: false },
  { id: 'p4', studentId: 's1', excursionId: 'e2', authSigned: true, paid: true, amountPaid: 15, attended: true },
];

// LocalStorage Persistence Simulation
const load = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : initial;
};

const save = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[Backend Sync] ${key} saved successfully at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    console.error(`[Backend Error] Failed to save ${key}`, error);
  }
};

export const db = {
  // Getters
  getUsers: () => load<User[]>('db_users', MOCK_USERS),
  getCycles: () => load<Cycle[]>('db_cycles', MOCK_CYCLES),
  getClasses: () => load<ClassGroup[]>('db_classes', MOCK_CLASSES),
  getStudents: () => load<Student[]>('db_students', MOCK_STUDENTS),
  getExcursions: () => load<Excursion[]>('db_excursions', MOCK_EXCURSIONS),
  getParticipations: () => load<Participation[]>('db_participations', MOCK_PARTICIPATIONS),

  // Users
  addUser: (user: User) => {
    const list = db.getUsers();
    list.push(user);
    save('db_users', list);
  },
  updateUser: (user: User) => {
    const list = db.getUsers();
    const idx = list.findIndex(u => u.id === user.id);
    if (idx >= 0) {
        list[idx] = user;
        save('db_users', list);
    }
  },
  deleteUser: (id: string) => {
    const list = db.getUsers().filter(u => u.id !== id);
    save('db_users', list);
  },

  // Classes & Cycles
  addClass: (cls: ClassGroup) => {
    const list = db.getClasses();
    list.push(cls);
    save('db_classes', list);
  },
  deleteClass: (id: string) => {
    const list = db.getClasses().filter(c => c.id !== id);
    save('db_classes', list);
  },
  
  // Students
  addStudent: (student: Student) => {
    const list = db.getStudents();
    list.push(student);
    save('db_students', list);
  },
  updateStudent: (student: Student) => {
    const list = db.getStudents();
    const idx = list.findIndex(s => s.id === student.id);
    if (idx >= 0) {
        list[idx] = student;
        save('db_students', list);
    }
  },
  deleteStudent: (id: string) => {
    const list = db.getStudents().filter(s => s.id !== id);
    save('db_students', list);
  },
  
  importStudentsCSV: (csvContent: string, targetClassId: string) => {
    // Format expectation: "Surnames, Name" (e.g. "García López, Juan")
    // Goal: Store as "Juan García López"
    const lines = csvContent.split(/\r?\n/);
    const currentStudents = db.getStudents();
    let count = 0;
    
    lines.forEach(line => {
      // Simple CSV parse handling comma inside quotes if needed, 
      // but assuming simple structure "Surnames, Name" for now.
      const parts = line.split(',');
      
      if (parts.length >= 2) {
         // parts[0] = Surnames, parts[1] = Name
         const surnames = parts[0].trim();
         const name = parts[1].trim();
         
         if (name && surnames) {
            currentStudents.push({
                id: crypto.randomUUID(),
                name: `${name} ${surnames}`, // Format for display
                classId: targetClassId
            });
            count++;
         }
      }
    });
    save('db_students', currentStudents);
    return count;
  },

  // Excursions
  addExcursion: (exc: Excursion) => {
    const list = db.getExcursions();
    list.push(exc);
    save('db_excursions', list);
    
    // Auto-create participations logic
    let targetStudents: Student[] = [];
    const allStudents = db.getStudents();
    const classes = db.getClasses();
    
    if (exc.scope === ExcursionScope.GLOBAL) {
      targetStudents = allStudents;
    } else if (exc.scope === ExcursionScope.CICLO) {
      // Find classes in cycle
      const cycleClasses = classes.filter(c => c.cycleId === exc.targetId).map(c => c.id);
      targetStudents = allStudents.filter(s => cycleClasses.includes(s.classId));
    } else if (exc.scope === ExcursionScope.CLASE) {
      targetStudents = allStudents.filter(s => s.classId === exc.targetId);
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

    const parts = db.getParticipations();
    save('db_participations', [...parts, ...newParticipations]);
  },

  updateParticipation: (p: Participation) => {
    const list = db.getParticipations();
    const idx = list.findIndex(x => x.id === p.id);
    if (idx >= 0) {
      list[idx] = p;
      save('db_participations', list);
    }
  },

  updateExcursion: (updated: Excursion) => {
    const list = db.getExcursions();
    const idx = list.findIndex(x => x.id === updated.id);
    if (idx >= 0) {
      list[idx] = updated;
      save('db_excursions', list);
    }
  },

  deleteExcursion: (id: string) => {
     const list = db.getExcursions().filter(e => e.id !== id);
     save('db_excursions', list);
     // Clean participations
     const parts = db.getParticipations().filter(p => p.excursionId !== id);
     save('db_participations', parts);
  },
  
  // System
  exportDatabase: () => {
    const data = {
      users: db.getUsers(),
      classes: db.getClasses(),
      students: db.getStudents(),
      excursions: db.getExcursions(),
      participations: db.getParticipations(),
      cycles: db.getCycles()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_hispanidad_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  },

  importDatabase: (file: File) => {
    return new Promise<boolean>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if(data.users && data.excursions) {
                    save('db_users', data.users);
                    save('db_classes', data.classes);
                    save('db_students', data.students);
                    save('db_excursions', data.excursions);
                    save('db_participations', data.participations);
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

  // Mock properties for sync
  cycles: MOCK_CYCLES,
  classes: MOCK_CLASSES, // This is just for initial load in components, but components should use getClasses() for fresh data
  
  reset: () => {
    localStorage.clear();
    window.location.reload();
  }
};