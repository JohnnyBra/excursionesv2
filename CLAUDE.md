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
- **`backend/database.json` is gitignored** — production data is never touched by git operations.

### Types (`src/types.ts`)

Shared TypeScript interfaces and enums:

- `UserRole`: `DIRECCION, TUTOR, TESORERIA, COORDINACION, ADMIN`
- `ExcursionScope`: `GLOBAL, CICLO, NIVEL, CLASE` (see Scope System below)
- `ExcursionClothing`, `TransportType`
- `ClassGroup` has a `level?: string` field populated from `PrismaClass.level` during import

### Authentication & SSO

Two login methods plus SSO:

1. **PIN login** (`POST /api/proxy/login`) - Proxies credentials to PrismaEdu `/api/auth/external-check`. Creates SSO cookie.
2. **Google OAuth** - Via frontend, calls backend proxy.
3. **SSO silent login** (`GET /api/proxy/me`) - Reads `BIBLIO_SSO_TOKEN` cookie, verifies JWT, auto-logs in.

`/api/proxy/login` creates the `BIBLIO_SSO_TOKEN` cookie directly (when `ENABLE_GLOBAL_SSO=true`) using `jwt.sign()` with `JWT_SSO_SECRET`. On page load, `App.tsx` calls `/api/proxy/me` for SSO auto-login before falling back to localStorage (`auth_user`). Role normalization: `TUTOR` → `TEACHER`.

### Role-Based Access

- **DIRECCION** (Principal): Full access including user management and treasury
- **TESORERIA** (Treasurer): Treasury and payment tracking
- **TUTOR** (Teacher): View/create excursions for own class, own level (NIVEL), or own cycle
- **COORDINACION** (Coordinator): Cycle-level access
- **ADMIN**: Full access

## Scope System

Excursions have four scope levels, stored in `excursion.scope` + `excursion.targetId`:

| Scope | `targetId` | Destinatarios |
|-------|-----------|---------------|
| `GLOBAL` | `''` | Todo el centro |
| `CICLO` | `cycleId` | Todo un ciclo |
| `NIVEL` | `"{cycleId}\|{level}"` | Todas las clases de un curso (ej. 5ºA y 5ºB) |
| `CLASE` | `classId` | Una sola clase |

**NIVEL format**: `targetId = "primaria-tercer-ciclo|5"` — cicleId and level joined by `|`.

### Who can create what scope
- **TUTOR**: CLASE (propia), NIVEL (su curso dentro de su ciclo), CICLO (su ciclo)
- **DIRECCION/ADMIN**: todos los scopes

### Visibility rules for TUTOR
A tutor sees an excursion if:
- `scope === GLOBAL`
- `scope === CICLO` and `targetId === myClass.cycleId`
- `scope === NIVEL` and `targetId === "{myClass.cycleId}|{myClass.level}"`
- `scope === CLASE` and `targetId === myClass.id`

### Class import from PrismaEdu
`mockDb.ts` imports `PrismaClass` (which has `stage, cycle, level, group`) and maps to local `ClassGroup`:
- `cycleId` = `"{stage}-{cycle}".toLowerCase().replace(/\s+/g, '-')`
- `level` = `PrismaClass.level` (preserved on merge)

### Generating participations (`generateParticipationsForExcursion`)
Called automatically on `db.addExcursion()` and `db.updateExcursion()` (when scope/targetId changed). Filters `localState.students` by scope:
- `NIVEL`: splits `targetId` on `|`, filters classes by `cycleId` and `level`, then students of those classes.

## Financial Model

### Cost fields on `Excursion`
- `costBus` — total bus cost (fixed, shared)
- `costOther` — other fixed costs (parking, materials, etc.)
- `costEntry` — **per-student** entry price (unitario, NOT total)
- `estimatedStudents` — estimated headcount
- `costGlobal` — **price per student** (auto-calculated: `⌈(costBus + costOther) / estimatedStudents⌉ + costEntry`)

**`costEntry` is per-student** — never add it directly to `costBus`. Always multiply by student count.

### Real cost calculation
Total cost of an excursion = `costBus + costOther + (costEntry × studentCount)`

For **past excursions**, `studentCount` uses real attendance data:
1. `attended` count (if recorded) → 2. `paid` count (fallback) → 3. `estimatedStudents` (last resort)

For **future excursions**, always uses `estimatedStudents`.

This logic is in `getExcursionCost()` (Dashboard) and in the budget tab balance summary (ExcursionManager).

### amountPaid sync
When `costGlobal` changes and is saved (`handleSave`), all existing paid participations for that excursion have their `amountPaid` updated to the new `costGlobal`. This keeps all balance calculations accurate.

### Balance displays
- **Dashboard "Balance Neto"**: `totalCollected - totalCost` across all relevant excursions. `totalCost` uses real attendance for past excursions.
- **Dashboard chart**: shows all excursions with `cost > 0` (free excursions excluded); scrollable horizontally (90px/bar); labels rotate −35° when >5 items.
- **Tab Presupuesto** (ExcursionManager): shows live summary — Recaudado, Pendiente, Balance (Recaudado − Coste Real) — when not editing.

## Excursion List & Dashboard

### Pending vs. completed split
- **Dashboard "Próximas Salidas"**: shows only excursions where `dateEnd >= today`.
- **Tab Excursiones sidebar**: split into two sections — **Pendientes** (`dateEnd >= today`) and **Realizadas** (`dateEnd < today`).

### Participation Table (`ExcursionManager.tsx`)

The participation table shows columns conditionally based on excursion state:
- **Auth** (authorization): Always visible.
- **Pago** (payment): Only visible when `excursion.costGlobal > 0`. Hidden for free excursions.
- **Asistencia Real** (attendance): Only visible on or after the excursion date (`isExcursionDayOrPast`).

### Dev Server Proxy

Vite proxies `/api/*` requests to `http://localhost:3005` during development (configured in `vite.config.ts`).

## Unified Header

`src/components/Layout.tsx` implements the unified header design. The **mobile header** (`md:hidden`) uses the `.header-glass` class (defined in `src/styles/theme.css`) with:
- **Logo**: `h-10` with `dark:brightness-0 dark:invert` for theme adaptation
- **3-button theme toggle**: Sun / Monitor / Moon (Light / System / Dark), uses `useTheme()` from `src/context/ThemeContext.tsx`, active state styled with `text-[#234B6E]`
- **Prisma link**: SVG icon (4 squares, top-right filled `#3b82f6`), links to `https://prisma.bibliohispa.es`

The **desktop sidebar** (`hidden md:flex`) is independent — it has its own Prisma link, navigation items, user info, and logout button. It does NOT use the unified header pattern; only the mobile header was unified.

The `.header-glass` class uses `rgba(255,255,255,0.45)` background with `backdrop-filter: blur(24px) saturate(1.6)`, with a `.dark` variant. Theme is managed via `ThemeContext` with `useTheme()` hook supporting `'light' | 'dark' | 'system'`, toggling `.dark` class on `<html>`.

## Key Conventions

- All UI text is in **Spanish** — maintain this when adding or modifying user-facing strings.
- TypeScript strict mode is enabled with `noUnusedLocals` and `noUnusedParameters`.
- The project uses ES modules (`"type": "module"` in package.json).
- The backend uses CommonJS (`require`/`module.exports`).
- Fonts: "Outfit" for headings, "Plus Jakarta Sans" for body text (loaded from Google Fonts in `index.html`).

## Important Implementation Details

### dotenv path
`backend/server.js` loads `.env` from the **project root** (not from `backend/`):
```js
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
```
The `.env` file lives at `excursionesv2/.env`, not `excursionesv2/backend/.env`.

### AuthContext — updateCurrentUser
`App.tsx` exposes `updateCurrentUser(user: User)` through `AuthContext`. Use this instead of `window.location.reload()` when updating the current user's data (e.g. in `UserManager.tsx`). It updates React state and `localStorage` atomically without a full page reload.

### Optimistic UI in toggleParticipationStatus
`toggleParticipationStatus` in `ExcursionManager.tsx` is **async**. It updates the UI immediately and reverts the change if the server call fails. `db.updateParticipation()` returns a `Promise` — always `await` it when error handling matters.

### syncItem returns Promise
`syncItem()` in `mockDb.ts` returns the `apiCall` Promise. Methods that need error handling (like `updateParticipation`) should return and `await` it.

### Rate limiting
`/api/proxy/login` is protected with `express-rate-limit`: **10 requests per minute per IP**. Do not remove this when modifying the login endpoint.

### /api/restore validation
`POST /api/restore` validates that the body contains all required arrays (`users`, `excursions`, `participations`, `students`, `classes`, `cycles`) and strips any unknown keys before writing to disk.

### Dashboard performance
The "Participantes Totales" stat uses a pre-computed `Set` of relevant excursion IDs (`relevantExcursionIds`) to filter participations in O(n) instead of O(n²). Keep this pattern when modifying Dashboard stats.
