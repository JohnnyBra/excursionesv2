# SchoolTripManager Pro 2.0

**Creado por Javier Barrero**

Plataforma integral para la gestión de excursiones escolares, diseñada para coordinar las necesidades de Dirección, Tutores y Tesorería.

## Estructura del Proyecto

El proyecto sigue una arquitectura moderna dividida en Frontend (React) y Backend (Node.js/Prisma).

- `components/`: Interfaz de usuario React.
- `services/`: Lógica de cliente y `mockDb.ts` (Base de datos simulada para demostración/desarrollo sin backend activo).
- `backend/`: Código del servidor, API y modelos de datos.

---

## 🚀 Guía de Instalación y Configuración

Sigue estos pasos para poner en marcha la aplicación en un entorno de producción o desarrollo completo.

### 1. Frontend (Interfaz)

Instala las dependencias y ejecuta el servidor de desarrollo de Vite.

```bash
npm install
npm run dev
```

La aplicación abrirá por defecto usando `mockDb` (datos locales simulados) si no se configura la conexión al backend.

### 2. Backend y Base de Datos (Configuración Manual)

Para persistencia de datos real, necesitamos configurar Prisma y la base de datos.

#### A. Crear el archivo Schema

Como la configuración de Prisma requiere creación manual de archivos en este entorno, navega a la carpeta `backend/prisma/` (créala si no existe) y crea un archivo llamado `schema.prisma`.

**Copia y pega el siguiente contenido en `backend/prisma/schema.prisma`:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // O "sqlite" para desarrollo local simple
  url      = env("DATABASE_URL")
}

// Enums
enum UserRole {
  DIRECCION
  TUTOR
  TESORERIA
  COORDINACION
}

enum ExcursionScope {
  GLOBAL
  CICLO
  CLASE
}

enum ExcursionClothing {
  UNIFORM
  PE_KIT
  STREET
}

enum TransportType {
  BUS
  WALKING
  OTHER
}

// Modelos

model User {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String
  name      String
  email     String   @unique
  role      UserRole
  
  // Relaciones
  managedClass ClassGroup? // Si es tutor
  createdExcursions Excursion[]
}

model Cycle {
  id      String       @id @default(uuid())
  name    String
  classes ClassGroup[]
}

model ClassGroup {
  id      String @id @default(uuid())
  name    String
  
  cycleId String
  cycle   Cycle  @relation(fields: [cycleId], references: [id])
  
  tutorId String @unique
  tutor   User   @relation(fields: [tutorId], references: [id])
  
  students Student[]
}

model Student {
  id      String     @id @default(uuid())
  name    String
  classId String
  class   ClassGroup @relation(fields: [classId], references: [id])
  
  participations Participation[]
}

model Excursion {
  id            String            @id @default(uuid())
  title         String
  description   String
  justification String?
  destination   String
  
  dateStart     DateTime
  dateEnd       DateTime
  
  clothing      ExcursionClothing @default(UNIFORM)
  transport     TransportType     @default(BUS)
  
  costBus       Float
  costEntry     Float
  costGlobal    Float
  estimatedStudents Int?
  
  scope         ExcursionScope
  targetId      String? // ID de Ciclo o Clase si aplica
  
  creatorId     String
  creator       User   @relation(fields: [creatorId], references: [id])
  
  participations Participation[]
  createdAt     DateTime @default(now())
}

model Participation {
  id            String   @id @default(uuid())
  
  studentId     String
  student       Student  @relation(fields: [studentId], references: [id])
  
  excursionId   String
  excursion     Excursion @relation(fields: [excursionId], references: [id])
  
  authSigned    Boolean  @default(false)
  authDate      DateTime?
  
  paid          Boolean  @default(false)
  amountPaid    Float    @default(0)
  paymentDate   DateTime?
  
  attended      Boolean  @default(false)

  @@unique([studentId, excursionId])
}
```

#### B. Configurar Variables de Entorno

En la carpeta `backend/`, crea un archivo `.env`:

```env
# Ejemplo para PostgreSQL
DATABASE_URL="postgresql://usuario:password@localhost:5432/schooltrip_db?schema=public"

# Ejemplo para SQLite (más fácil para pruebas locales)
# DATABASE_URL="file:./dev.db"
```

#### C. Inicializar Base de Datos

Ejecuta los siguientes comandos desde la carpeta raíz o backend para crear las tablas:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

#### D. Iniciar Servidor

```bash
node app.js
```

El servidor correrá en el puerto configurado (por defecto 3004).

## Características

*   **Multirole:** Paneles específicos para Dirección, Tutores y Tesorería.
*   **Gestión de Excursiones:** Creación, edición, duplicación y control presupuestario.
*   **Logística:** Control de vestimenta, transporte y horarios.
*   **Compartir:** Sistema interno para transferir excursiones entre clases.
*   **Informes:** Generación automática de PDFs (Listas de asistencia, Informes económicos).
*   **Persistencia:** Sincronización robusta de datos (actualmente simulada en navegador, lista para conectar a backend).
