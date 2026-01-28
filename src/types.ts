export enum UserRole {
  DIRECCION = 'DIRECCION',
  TUTOR = 'TUTOR',
  TESORERIA = 'TESORERIA',
  COORDINACION = 'COORDINACION',
  ADMIN = 'ADMIN'
}

export enum ExcursionScope {
  GLOBAL = 'GLOBAL',
  CICLO = 'CICLO',
  CLASE = 'CLASE'
}

export enum ExcursionClothing {
  UNIFORM = 'UNIFORM', // Uniforme
  PE_KIT = 'PE_KIT',   // Chándal
  STREET = 'STREET'    // Ropa de calle
}

export enum TransportType {
  BUS = 'BUS',
  WALKING = 'WALKING',
  OTHER = 'OTHER'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  role: UserRole;
  classId?: string;
}

export interface PrismaUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  classId?: string;
}

export interface PrismaClass {
  id: string;
  name: string;
  stage: string;
  cycle: string;
  level: string;
  group: string;
}

export interface Cycle {
  id: string;
  name: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  cycleId: string;
  tutorId: string;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
}

export interface Excursion {
  id: string;
  title: string;
  description: string;
  justification?: string;
  destination: string;
  dateStart: string;
  dateEnd: string;
  clothing?: ExcursionClothing;
  transport?: TransportType;
  costBus: number;
  costOther?: number; // Nuevo: Otros gastos (parking, material, etc.)
  costEntry: number;
  costGlobal: number;
  estimatedStudents?: number;
  scope: ExcursionScope;
  targetId?: string;
  creatorId: string;
  status?: 'ACTIVE' | 'CANCELLED' | 'POSTPONED';
}

export interface Participation {
  id: string;
  studentId: string;
  excursionId: string;
  authSigned: boolean;
  authDate?: string;
  paid: boolean;
  amountPaid: number;
  paymentDate?: string;
  attended: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}