# SchoolTripManager Pro 2.0 (Serverless Edition)

**Creado por Javier Barrero**

Plataforma integral para la gestión de excursiones escolares. Esta versión ha sido optimizada para funcionar sin servidor backend complejo, utilizando el almacenamiento local del navegador para máxima velocidad y simplicidad.

---

## 🚀 Instalación Rápida

Como hemos eliminado el backend complejo, la instalación es instantánea.

1.  **Instalar dependencias:**
    Abre la terminal en la carpeta del proyecto y ejecuta:
    ```bash
    npm install
    ```

2.  **Iniciar la aplicación:**
    ```bash
    npm run dev
    ```

3.  **¡Listo!**
    La aplicación se abrirá en: `http://localhost:3006`

---

## 💾 Sobre los Datos (Importante)

Al no usar una base de datos externa (como PostgreSQL), los datos se guardan en el **Navegador (LocalStorage)** de tu ordenador.

*   **Persistencia:** Los datos no se borran al cerrar la ventana.
*   **Copias de Seguridad:**
    Para no perder datos o para moverlos a otro ordenador, ve a la sección **Dirección > Usuarios & Permisos > Sistema y Backup**.
    *   Botón **"Descargar Backup Completo"**: Guarda un archivo `.json` con todo.
    *   Botón **"Restaurar Sistema"**: Carga un archivo `.json` previo.

---

## 🔑 Usuarios de Prueba

Puedes usar cualquiera de estos usuarios para entrar:

| Rol | Usuario | Contraseña |
| :--- | :--- | :--- |
| **Dirección** | `direccion` | `123` |
| **Tesoreria** | `tesoreria` | `123` |
| **Tutor 1ºA** | `tutor1` | `123` |
| **Tutor 2ºB** | `tutor2` | `123` |

---

## 🛠️ Estructura del Proyecto

*   `src/components`: Componentes de React (Vistas).
*   `src/services/mockDb.ts`: El motor de base de datos local. Simula una base de datos real pero guarda todo en tu navegador.
*   `src/types.ts`: Definiciones de TypeScript.
