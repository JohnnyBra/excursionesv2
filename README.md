# SchoolTripManager Pro 2.0

**Creado por Javier Barrero**

Plataforma integral para la gestión de excursiones escolares del Colegio La Hispanidad.

---

## 📋 Requisitos Previos

*   **Node.js**: Versión 18 o superior.
*   **Git**: Para clonar el repositorio.
*   **Base de Datos**: PostgreSQL (recomendado) o SQLite (para pruebas rápidas).

---

## 🚀 Guía de Instalación Paso a Paso

Sigue estos pasos en orden para levantar el proyecto completo.

### 1. Clonar el Repositorio

Abre tu terminal y ejecuta:

```bash
git clone https://github.com/JohnnyBra/excursionesv2.git
cd excursionesv2
```

### 2. Configuración del Backend (Puerto 3005)

El backend maneja la lógica del servidor y la conexión a la base de datos real.

1.  Entra a la carpeta del backend:
    ```bash
    cd backend
    ```

2.  Instala las dependencias:
    ```bash
    npm install
    ```

3.  **IMPORTANTE: Crear el Schema de Base de Datos**
    
    Debes crear manualmente la definición de la base de datos.
    *   Crea una carpeta llamada `prisma` dentro de la carpeta `backend`.
    *   Dentro de esa carpeta, crea un archivo llamado `schema.prisma`.
    *   Pega el siguiente contenido exacto en `backend/prisma/schema.prisma`:

    ```prisma
    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "postgresql" // Cambia a "sqlite" si usas un archivo local
      url      = env("DATABASE_URL")
    }

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

    model User {
      id        String   @id @default(uuid())
      username  String   @unique
      password  String
      name      String
      email     String   @unique
      role      UserRole
      managedClass ClassGroup?
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
      targetId      String?
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

4.  **Configurar Variables de Entorno**
    
    En la carpeta `backend`, crea un archivo `.env`:
    ```env
    # Opción A: PostgreSQL
    DATABASE_URL="postgresql://usuario:password@localhost:5432/schooltrip_db?schema=public"
    
    # Opción B: SQLite (Más fácil para probar)
    # DATABASE_URL="file:./dev.db"
    
    PORT=3005
    ```

5.  **Inicializar la Base de Datos**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

6.  **Arrancar el Servidor**
    ```bash
    node app.js
    ```
    *Debería indicar: `Server running on port 3005`*

### 3. Configuración del Frontend (Puerto 3006)

El frontend es la aplicación web (React) que usarán los profesores.

1.  Abre una **nueva terminal** (no cierres la del backend) y ve a la raíz del proyecto:
    ```bash
    cd excursionesv2
    ```

2.  Instala las dependencias:
    ```bash
    npm install
    ```

3.  **Añadir Logo**
    *   Asegúrate de colocar un archivo llamado `logo.png` en la carpeta raíz (junto a `index.html`) para que funcione el icono y el logo de la aplicación.

4.  Arranca la aplicación:
    ```bash
    npm run dev
    ```
    *Vite iniciará el servidor en: `http://localhost:3006`*

---

## 🔑 Credenciales de Acceso (Modo Prueba)

La aplicación actualmente utiliza una base de datos simulada (`mockDb`) en el navegador para facilitar la demostración. Usa estas credenciales para entrar:

| Rol | Usuario | Contraseña | Funcionalidad |
| :--- | :--- | :--- | :--- |
| **Dirección** | `direccion` | `123` | Control total, gestión usuarios, ver todo. |
| **Tesorería** | `tesoreria` | `123` | Control de pagos y presupuestos. |
| **Tutor 1** | `tutor1` | `123` | Gestionar excursiones de clase 1ºA. |
| **Tutor 2** | `tutor2` | `123` | Gestionar excursiones de clase 2ºB. |

---

## 🛠️ Notas para el Desarrollador

*   **Puertos:**
    *   Frontend: `3006`
    *   Backend: `3005`
*   **Persistencia:** Actualmente el frontend usa `localStorage` para simular persistencia. Para conectar con el backend real, se debe implementar la capa de servicios (`services/api.ts`) para consumir los endpoints del puerto 3005.
