# SchoolTripManager Pro 2.1

**Creado por Javier Barrero**

Plataforma integral para la gestión de excursiones escolares. Esta versión utiliza una arquitectura **Cliente-Servidor ligera**:
1.  **Frontend:** React + Vite (Puerto 3006).
2.  **Backend:** Node.js + Archivos JSON (Puerto 3005).

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
