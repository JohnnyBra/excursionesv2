# Diseño: Sincronización automática y manual con PrismaEDU

**Fecha:** 2026-05-15  
**Alcance:** Backend (auto-sync diario) + Frontend (botón manual en Panel de Usuarios)

---

## Problema

El login con Google falla para usuarios nuevos de PrismaEDU porque `loginGoogle` solo busca por email en `database.json` local. No hay ningún mecanismo automático que sincronice usuarios nuevos desde PrismaEDU al arrancar el servidor ni periódicamente.

---

## Solución

### Backend — Sync automático (Opción B)

**Al arrancar el servidor** (delay de 10s para dejar que el servidor esté completamente listo) y **cada 24 horas**, se ejecuta la misma lógica de merge que ya existe en `POST /api/import/prisma`:

1. Llamada a PrismaEDU: `GET /api/export/classes`, `/api/export/students`, `/api/export/users`
2. Merge con `database.json` actual (usuarios, clases, alumnos, ciclos)
3. Escritura a disco + broadcast Socket.io `db_update`
4. Log en consola con stats

La lógica de sync se extrae a una función `runPrismaSync()` reutilizable por el endpoint manual y por el scheduler.

**No se añaden dependencias nuevas** — solo `setInterval` nativo de Node.js.

**Configuración:** el intervalo de 24h se define como constante `PRISMA_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000`.

### Frontend — Botón manual en Panel de Usuarios

**Visibilidad:** Solo para roles `ADMIN` y `DIRECCION`.

**Ubicación:** En `UserManager.tsx`, junto a los controles existentes de "Importar CSV" y "Restaurar backup".

**Comportamiento:**
- Botón "Sincronizar con PrismaEDU" con icono `RefreshCw` de lucide-react
- Al hacer clic: estado de carga (spinner, botón deshabilitado)
- Llama a `POST /api/import/prisma` (endpoint ya existente)
- Toast de éxito: `"Sincronización completada: X usuarios, Y clases actualizadas"`
- Toast de error si la llamada falla

---

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `backend/server.js` | Extraer lógica de merge a `runPrismaSync()`, añadir scheduler de arranque + 24h |
| `src/components/UserManager.tsx` | Añadir botón visible para ADMIN/DIRECCION, llamada a la API, feedback |

---

## Casos de error

- Si PrismaEDU no responde en el sync automático → log de error en consola, no afecta al servidor
- Si PrismaEDU no responde en el sync manual → toast de error al usuario
- Si `database.json` está corrupto antes del merge → el merge no se ejecuta (el `readDb()` existente ya maneja esto)

---

## Fuera de alcance

- Sync en tiempo real (webhooks de PrismaEDU)
- Configuración del intervalo desde la UI
- Historial de sincronizaciones
