# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SchoolTripManager Pro v2.1 — a school excursion management platform (Spanish-language UI). React + Vite frontend on port 3006, Node.js Express backend on port 3005, with a JSON file database (`backend/database.json`).

## Commands

```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Development (starts both Vite dev server on :3006 and backend on :3005)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

There is no test framework configured. No linter is configured.

## Architecture

### Frontend (`src/`)

- **Entry**: `index.html` → `src/index.tsx` → `src/App.tsx`
- **Routing**: HashRouter (`react-router-dom`). Routes: `/login`, `/` (Dashboard), `/excursions`, `/treasury`, `/users`, `/settings`
- **Styling**: Tailwind CSS via CDN (configured in `index.html` with custom theme), plus CSS variables in `src/styles/theme.css` for light/dark mode and glass-morphism utilities
- **Icons**: `lucide-react`
- **Charts**: `recharts`
- **PDF export**: `jspdf` + `jspdf-autotable` (client-side generation)

### State Management

No external state library. Uses a hybrid approach:

- **`src/services/mockDb.ts`** — Central data layer. Maintains an in-memory `localState` cache of all entities (users, cycles, classes, students, excursions, participations). Exposes `db.*` methods that read from cache and write via REST API calls to the backend. Connects to Socket.io for real-time sync across clients.
- **React Context** — `AuthContext` (in `App.tsx`) for auth state, `ThemeContext` for dark/light mode, `ToastContext` for notifications.
- **Data flow**: User action → `db.*()` call → `POST /api/sync/:entity` → backend writes `database.json` → Socket.io `db_update` broadcast → all clients reload from cache via `notifyListeners()`.

### Backend (`backend/`)

- **`backend/server.js`** — Express server, port 3005. Reads/writes `backend/database.json`. Serves REST endpoints under `/api/` and also serves the production `dist/` build as static files.
- **Key endpoints**: `GET /api/db` (load all data), `POST /api/sync/:entity` (upsert), `POST /api/sync/:entity/bulk` (bulk upsert), `DELETE /api/sync/:entity/:id`, `POST /api/restore` (restore backup), `POST /api/proxy/login` (proxy to PrismaEDU), `GET /api/proxy/users|classes|students` (fetch from external PrismaEDU system).
- **Socket.io** broadcasts `db_update` on every write so all connected clients stay in sync.
- **External integration**: Proxies requests to `https://prisma.bibliohispa.es` (PrismaEDU school management system) for user/class/student imports.

### Types (`src/types.ts`)

Shared TypeScript interfaces and enums: `UserRole` (DIRECCION, TUTOR, TESORERIA, COORDINACION, ADMIN), `ExcursionScope` (GLOBAL, CICLO, CLASE), `ExcursionClothing`, `TransportType`, and entity interfaces (`User`, `Student`, `Excursion`, `Participation`, etc.).

### Role-Based Access

- **DIRECCION** (Principal): Full access including user management and treasury
- **TESORERIA** (Treasurer): Treasury and payment tracking
- **TUTOR** (Teacher): View excursions for own class/cycle
- **COORDINACION** (Coordinator): Cycle-level access
- **ADMIN**: Full access

### Participation Table (`ExcursionManager.tsx`)

The participation table shows columns conditionally based on excursion state:
- **Auth** (authorization): Always visible.
- **Pago** (payment): Only visible when `excursion.costGlobal > 0`. Hidden for free excursions.
- **Asistencia Real** (attendance): Only visible on or after the excursion date (`isExcursionDayOrPast`).

### Dev Server Proxy

Vite proxies `/api/*` requests to `http://localhost:3005` during development (configured in `vite.config.ts`).

## Key Conventions

- All UI text is in **Spanish** — maintain this when adding or modifying user-facing strings.
- TypeScript strict mode is enabled with `noUnusedLocals` and `noUnusedParameters`.
- The project uses ES modules (`"type": "module"` in package.json).
- The backend uses CommonJS (`require`/`module.exports`).
- Fonts: "Outfit" for headings, "Plus Jakarta Sans" for body text (loaded from Google Fonts in `index.html`).
