# Excursiones — Gestión de Salidas Escolares y Tesorería

Plataforma integral para planificar, gestionar y contabilizar las salidas y excursiones del Colegio La Hispanidad. Permite gestionar autorizaciones, pagos, asistencia y el balance económico del centro. Forma parte de la Suite Educativa La Hispanidad.

> **Acceso:** Profesorado, coordinación, tesorería y dirección. Autenticación compartida con PrismaEdu (SSO).

---

## 🚀 Funcionalidades por Público

### 👨‍🏫 Profesorado

- **Dashboard**
  - Ver las próximas salidas visibles para su clase según el ámbito (global, ciclo, nivel o clase propia)
  - Indicadores de coste, participación y balance por excursión

- **Crear excursiones** (dentro del ámbito asignado)
  - **CLASE:** Solo para su propia clase
  - **NIVEL:** Para todas las clases del mismo curso en su ciclo (ej. todos los 5º)
  - **CICLO:** Para todas las clases de su ciclo
  - Campos: título, descripción, destino, fechas, ropa, transporte y desglose de costes

- **Gestión de participantes**
  - Tabla con un alumno por fila:
    - Autorización familiar (checkbox)
    - Pago (visible solo si la excursión tiene coste)
    - Asistencia real (visible solo a partir de la fecha de la salida)
  - Acciones masivas: marcar todos autorizados · todos pagados · todos asistentes

- **Resumen financiero**
  - Ver importe recaudado, pendiente y balance de la excursión propia

---

### 🏫 Dirección / Administración

Todo lo del profesorado, más:

- **Excursiones de cualquier ámbito** (GLOBAL, CICLO, NIVEL, CLASE)
- **Editar y eliminar cualquier excursión** del sistema, independientemente del creador
- **Panel de tesorería completo**
  - Posición financiera global del colegio en todas las salidas
  - Exportación de informe de balance a PDF (jsPDF)
- **Gestión de usuarios del sistema**
  - Alta y baja de docentes, coordinadores y personal de tesorería
  - Asignación de tutores a clases
  - Gestión de coordinadores por ciclo
- **Configuración del sistema**
  - Configuración del curso escolar, ciclos y niveles
- **Copias de seguridad**
  - Descargar y restaurar `backend/database.json` desde el panel de administración

---

### 💰 Tesorería

- Ver la lista completa de excursiones y su estado
- Registrar y editar pagos de participantes en todas las excursiones
- Consultar el balance económico global
- Exportar informes financieros a PDF
- Sin acceso a la creación ni edición de excursiones

---

### 📋 Coordinación

- Ver y gestionar excursiones de su ciclo asignado
- Crear excursiones de ámbito **CICLO** dentro del ciclo propio
- Sin acceso a excursiones de ámbito global

---

## 📐 Sistema de Ámbitos

| Ámbito | targetId | Destinatarios |
|--------|----------|---------------|
| `GLOBAL` | _(vacío)_ | Todo el centro |
| `CICLO` | `cycleId` | Todo un ciclo (ej. Primaria Tercer Ciclo) |
| `NIVEL` | `"{cycleId}\|{level}"` | Todas las clases de un curso (ej. 5ºA y 5ºB) |
| `CLASE` | `classId` | Una sola clase |

---

## 💰 Modelo Financiero

| Campo | Descripción |
|-------|-------------|
| `costBus` | Coste total del autobús (fijo, compartido) |
| `costOther` | Otros costes fijos (parking, materiales…) |
| `costEntry` | Precio de entrada **por alumno** |
| `costGlobal` | Precio final por alumno (calculado automáticamente) |

**Fórmula:** `costGlobal = ⌈(costBus + costOther) / estimatedStudents⌉ + costEntry`

**Coste real de excursiones pasadas:** `costBus + costOther + (costEntry × alumnos_asistentes)`

---

## ⚙️ Características Técnicas

- **Frontend:** React 19 + TypeScript + Vite, React Router (HashRouter), Recharts
- **Backend:** Node.js/Express (ESM), Socket.IO
- **PDF:** jsPDF + jspdf-autotable (generación en cliente)
- **Tiempo real:** Socket.IO — evento `db_update` propagado a todos los clientes en cada cambio
- **Autenticación:** PIN proxy a PrismaEdu + SSO compartido (`BIBLIO_SSO_TOKEN`)
- **Base de datos:** Archivo JSON (`backend/database.json`) con copias de seguridad automáticas
- **Despliegue:** PM2 en Ubuntu/Debian (frontend en :3006, backend en :3005)

---

**Creado por Javier Barrero**

Arquitectura Cliente-Servidor ligera:
1.  **Frontend:** React + Vite (Puerto 3006)
2.  **Backend:** Node.js + Archivos JSON (Puerto 3005)

Los datos son persistentes y se guardan en el servidor (`backend/database.json`), permitiendo el acceso desde múltiples dispositivos en la misma red.

---

## 🚀 Instalación desde Cero

1.  **Clonar el repositorio:**
    Abre la terminal y ejecuta:
    ```bash
    git clone https://github.com/JohnnyBra/excursionesv2.git
    cd excursionesv2
    ```

2.  **Ejecutar el script de instalación automática:**
    Este script descarga actualizaciones, instala dependencias y construye la aplicación.
    ```bash
    chmod +x setup.sh  # Solo necesario la primera vez
    ./setup.sh
    ```

## 🔄 Actualizar la Aplicación

Para actualizar a la última versión en el futuro, simplemente ejecuta de nuevo el script:
```bash
./setup.sh
```

---

## 💻 Modo Desarrollo

Para trabajar en la aplicación y ver cambios en tiempo real:

```bash
npm run dev
```

Esto abrirá la aplicación en `http://localhost:3006`.

---

## 🌍 Despliegue Persistente (Producción con PM2)

Si quieres dejar la aplicación funcionando 24/7 en un servidor (NAS, Raspberry Pi, PC Servidor) y que se inicie sola al reiniciar, sigue estos pasos:

### 1. Instalar PM2 Globalmente
Herramienta para gestionar procesos en segundo plano.
```bash
npm install -g pm2
```

### 2. Construir el Frontend
Genera la versión optimizada de la web para producción.
```bash
npm run build
```
*(Esto creará una carpeta `dist` con la web lista).*

### 3. Iniciar los Servicios
Ejecuta estos comandos uno por uno en la raíz del proyecto:

1.  **Arrancar Backend (API):**
    ```bash
    pm2 start backend/server.js --name "schooltrip-api"
    ```

2.  **Arrancar Frontend (Web Estática):**
    ```bash
    pm2 serve dist 3006 --name "schooltrip-web" --spa
    ```

### 4. Guardar y Automatizar Inicio
Para que se inicien automáticamente si se apaga el servidor:

```bash
pm2 save
pm2 startup
```
*(Copia y pega el comando que te muestre `pm2 startup` en la terminal).*

---

## 📡 Acceso desde otros ordenadores

Si has instalado esto en un servidor (ej. con IP `192.168.1.50`), puedes acceder desde cualquier ordenador de la red escribiendo en el navegador:

`http://192.168.1.50:3006`

*(La aplicación detectará automáticamente la IP del backend).*

---

## 💾 Gestión de Datos (Copias de Seguridad)

Los datos se guardan físicamente en el archivo:
`backend/database.json`

**Métodos de Backup:**
1.  **Automático:** Copia ese archivo manualmente cuando quieras.
2.  **Desde la App:** Ve a **Dirección > Usuarios & Permisos > Sistema y Backup**.
    *   **Descargar Backup:** Genera un JSON descargable.
    *   **Restaurar:** Sube un JSON para sobrescribir la base de datos actual.

---

## 🔑 Usuarios de Prueba

| Rol | Usuario | Contraseña |
| :--- | :--- | :--- |
| **Dirección** | `direccion` | `123` |
| **Tesoreria** | `tesoreria` | `123` |
| **Tutor** | `tutor1` | `123` |

---

## 🛠️ Estructura Técnica

*   **Frontend (Puerto 3006):** React, TailwindCSS, Lucide Icons.
*   **Backend (Puerto 3005):** Node.js Express.
*   **Base de Datos:** Archivo JSON local (No requiere SQL ni Docker).
