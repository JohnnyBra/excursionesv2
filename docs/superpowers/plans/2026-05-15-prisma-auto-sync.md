# Prisma Auto-Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sincronizar automáticamente usuarios/clases/alumnos de PrismaEDU al arrancar el servidor y cada 24h, y añadir un botón de sync manual en el Panel de Usuarios para roles ADMIN y DIRECCION.

**Architecture:** El backend extrae la lógica de merge a `runPrismaSync()`, la llama al arrancar (delay 10s) y cada 24h vía `setInterval`. El frontend añade un botón en la pestaña "Sistema y Backup" de `UserManager.tsx` que llama a `POST /api/import/prisma`.

**Tech Stack:** Node.js (backend), React + TypeScript (frontend), lucide-react (iconos), fetch API (llamada al endpoint).

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `backend/server.js` | Extraer `runPrismaSync()`, añadir scheduler al arrancar y cada 24h |
| `src/components/UserManager.tsx` | Actualizar guarda de acceso, añadir estado `isSyncing`, handler y botón UI |

---

### Task 1: Backend — Extraer `runPrismaSync()` y añadir scheduler

**Files:**
- Modify: `backend/server.js:506-580`

- [ ] **Step 1: Extraer lógica de merge a `runPrismaSync()`**

Localiza la función `app.post('/api/import/prisma', ...)` (línea ~506) y **justo antes** de ella añade la función `runPrismaSync()`. Extrae toda la lógica de merge que actualmente vive dentro del handler:

```js
const PRISMA_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

const runPrismaSync = async () => {
  console.log('🔄 Sincronización con PrismaEdu iniciada...');
  try {
    const prismaData = await fetchPrismaData();
    const currentDb = readDb();

    // A) Ciclos
    const cycleMap = new Map(currentDb.cycles.map(c => [c.id, c]));
    prismaData.cycles.forEach(pc => {
      if (!cycleMap.has(pc.id)) {
        cycleMap.set(pc.id, pc);
      }
    });
    const mergedCycles = Array.from(cycleMap.values());

    // B) Clases
    const classMap = new Map(currentDb.classes.map(c => [c.id, c]));
    prismaData.classes.forEach(pc => {
      const existing = classMap.get(pc.id);
      if (existing) {
        classMap.set(pc.id, { ...existing, ...pc });
      } else {
        classMap.set(pc.id, pc);
      }
    });
    const mergedClasses = Array.from(classMap.values());

    // C) Usuarios
    const userMap = new Map(currentDb.users.map(u => [u.id, u]));
    prismaData.users.forEach(pu => {
      const existing = userMap.get(pu.id);
      if (existing) {
        if (!existing.password) {
          userMap.set(pu.id, pu);
        }
      } else {
        userMap.set(pu.id, pu);
      }
    });
    const mergedUsers = Array.from(userMap.values());

    // D) Alumnos
    const studentMap = new Map(currentDb.students.map(s => [s.id, s]));
    prismaData.students.forEach(ps => {
      studentMap.set(ps.id, ps);
    });
    const mergedStudents = Array.from(studentMap.values());

    const newDb = {
      ...currentDb,
      cycles: mergedCycles,
      classes: mergedClasses,
      users: mergedUsers,
      students: mergedStudents
    };

    await writeDb(newDb);
    io.emit('db_update', { entity: 'all', action: 'import', sourceSocketId: null });

    console.log(`✅ Sync PrismaEdu completado: ${mergedUsers.length} usuarios, ${mergedClasses.length} clases, ${mergedStudents.length} alumnos.`);
    return { users: mergedUsers.length, classes: mergedClasses.length, students: mergedStudents.length };
  } catch (err) {
    console.error('❌ Error en sync automático con PrismaEdu:', err.message || err);
    throw err;
  }
};
```

- [ ] **Step 2: Simplificar el endpoint `POST /api/import/prisma` para que llame a `runPrismaSync()`**

Reemplaza el cuerpo completo de `app.post('/api/import/prisma', ...)` con:

```js
app.post('/api/import/prisma', async (req, res) => {
  try {
    const stats = await runPrismaSync();
    res.json({
      success: true,
      message: 'Importación completada con éxito',
      stats
    });
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Error en la sincronización';
    res.status(status).json({ error: message });
  }
});
```

- [ ] **Step 3: Añadir el scheduler al arrancar y cada 24h**

Localiza el bloque `httpServer.listen(PORT, () => { ... })` al final del archivo (línea ~593). **Justo después del cierre de ese bloque** (después del `}`), añade:

```js
// Sync automático con PrismaEdu: al arrancar (10s delay) y cada 24h
setTimeout(() => {
  runPrismaSync().catch(() => {});
}, 10000);

setInterval(() => {
  runPrismaSync().catch(() => {});
}, PRISMA_SYNC_INTERVAL_MS);
```

- [ ] **Step 4: Verificar manualmente**

Reinicia el servidor:
```bash
npm run dev
```

Espera 10 segundos. En la consola del backend deberías ver:
```
🔄 Sincronización con PrismaEdu iniciada...
✅ Sync PrismaEdu completado: X usuarios, Y clases, Z alumnos.
```

Si aparece `❌ Error en sync automático` es porque PrismaEdu no es accesible desde ese entorno — es esperado en local si no hay VPN/acceso.

- [ ] **Step 5: Commit**

```bash
git add backend/server.js
git commit -m "feat(sync): sync automático con PrismaEdu al arrancar y cada 24h"
```

---

### Task 2: Frontend — Actualizar guarda de acceso en UserManager

**Files:**
- Modify: `src/components/UserManager.tsx:92-94`

**Contexto:** La guarda actual solo permite `DIRECCION`. El usuario quiere que `ADMIN` también pueda acceder al botón de sync. Hay que ampliar la guarda.

- [ ] **Step 1: Actualizar la guarda de acceso**

Localiza estas líneas (~92):
```tsx
    // Security check
    if (user?.role !== UserRole.DIRECCION) {
        return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl shadow mt-10">⛔ ACCESO DENEGADO<br/><span className="text-sm font-normal text-gray-600">Este panel es exclusivo para Dirección.</span></div>;
    }
```

Reemplázalas por:
```tsx
    // Security check
    const canAccess = user?.role === UserRole.DIRECCION || user?.role === UserRole.ADMIN;
    if (!canAccess) {
        return <div className="p-8 text-center text-red-500 font-bold bg-white rounded-xl shadow mt-10">⛔ ACCESO DENEGADO<br/><span className="text-sm font-normal text-gray-600">Este panel es exclusivo para Dirección.</span></div>;
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/UserManager.tsx
git commit -m "fix(auth): permitir acceso a UserManager también para rol ADMIN"
```

---

### Task 3: Frontend — Añadir botón de sync manual en la pestaña Sistema

**Files:**
- Modify: `src/components/UserManager.tsx`

- [ ] **Step 1: Añadir `RefreshCw` a los imports de lucide-react**

Localiza la línea de imports de lucide (línea ~5):
```tsx
import { Trash2, UserPlus, Edit, Upload, Download, Database, Users, GraduationCap, School, Search, KeyRound } from 'lucide-react';
```

Añade `RefreshCw`:
```tsx
import { Trash2, UserPlus, Edit, Upload, Download, Database, Users, GraduationCap, School, Search, KeyRound, RefreshCw } from 'lucide-react';
```

- [ ] **Step 2: Añadir estado `isSyncing` en el bloque de estados**

Localiza el bloque de Import State (~línea 77):
```tsx
    // Import State
    const [importClassId, setImportClassId] = useState('');
```

Añade la línea después:
```tsx
    // Import State
    const [importClassId, setImportClassId] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
```

- [ ] **Step 3: Añadir el handler `handlePrismaSync`**

Localiza la función `refreshData` (~línea 84) y añade `handlePrismaSync` justo después:

```tsx
    const handlePrismaSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/import/prisma', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                db.reload();
                refreshData();
                addToast(`Sincronización completada: ${data.stats.users} usuarios, ${data.stats.classes} clases actualizadas`, 'success');
            } else {
                addToast(data.error || 'Error al sincronizar con PrismaEDU', 'error');
            }
        } catch {
            addToast('No se pudo conectar con el servidor', 'error');
        } finally {
            setIsSyncing(false);
        }
    };
```

- [ ] **Step 4: Añadir el bloque UI en la pestaña Sistema**

Localiza el inicio de la pestaña sistema (~línea 501):
```tsx
                {activeTab === 'system' && (
                    <div className="space-y-8 max-w-lg">
                        <div>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Download size={20}/> Copia de Seguridad</h3>
```

Inserta el bloque de PrismaEDU **justo antes** de `<div>` de "Copia de Seguridad":

```tsx
                {activeTab === 'system' && (
                    <div className="space-y-8 max-w-lg">
                        <div>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><RefreshCw size={20}/> Sincronización con PrismaEDU</h3>
                            <p className="text-sm text-gray-600 mb-4">Importa usuarios, clases y alumnos actualizados desde PrismaEDU. El sistema también sincroniza automáticamente cada 24 horas.</p>
                            <button
                                onClick={handlePrismaSync}
                                disabled={isSyncing}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                                {isSyncing ? 'Sincronizando...' : 'Sincronizar con PrismaEDU'}
                            </button>
                        </div>

                        <div className="pt-8 border-t">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Download size={20}/> Copia de Seguridad</h3>
```

**Nota:** Asegúrate de que el `<div className="pt-8 border-t">` de Copia de Seguridad sigue siendo el mismo, solo se añade el bloque nuevo encima.

- [ ] **Step 5: Verificar en el navegador**

Arranca la app con `npm run dev`. Entra como usuario con rol DIRECCION o ADMIN. Ve al panel de Usuarios → pestaña "Sistema y Backup". Deberías ver el bloque "Sincronización con PrismaEDU" con el botón azul encima de "Copia de Seguridad". Haz clic: el icono gira mientras sincroniza y aparece un toast con el resultado.

- [ ] **Step 6: Commit**

```bash
git add src/components/UserManager.tsx
git commit -m "feat(ui): botón de sincronización manual con PrismaEDU en panel de sistema"
```
