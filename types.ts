export enum UserRole {
  DIRECCION = 'DIRECCION',
  TUTOR = 'TUTOR',
  TESORERIA = 'TESORERIA',
  COORDINACION = 'COORDINACION'
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
  username: string; // Nuevo campo para login
  password?: string; // Nuevo campo (opcional en frontend para no exponerlo siempre)
  name: string;
  email: string;
  role: UserRole;
  classId?: string; // If tutor
}

export interface Cycle {
  id: string;
  name: string; // e.g., "Infantil", "Primaria"
}

export interface ClassGroup {
  id: string;
  name: string; // e.g., "1A"
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
  justification?: string; // Nuevo: Justificación pedagógica
  destination: string;
  dateStart: string;
  dateEnd: string;
  clothing?: ExcursionClothing; // Nuevo: Vestimenta
  transport?: TransportType;    // Nuevo: Transporte
  costBus: number;
  costEntry: number;
  costGlobal: number; // calculated or fixed fee
  estimatedStudents?: number; // Para cálculo de presupuesto
  scope: ExcursionScope;
  targetId?: string; // CycleId or ClassId depending on scope
  creatorId: string;
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
  attended: boolean; // null/undefined means pending
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}