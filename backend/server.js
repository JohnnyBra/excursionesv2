const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http'); // Importar HTTP nativo
const { Server } = require('socket.io'); // Importar Socket.io
const axios = require('axios'); // Importar Axios
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 3005;
const DB_FILE = path.join(__dirname, 'database.json');

// --- CONSTANTES PRISMA ---
const PRISMA_URL = 'https://prisma.bibliohispa.es';
const API_SECRET = 'YOUR_API_SECRET';

// --- CONFIGURACIÓN SOCKET.IO ---
const httpServer = http.createServer(app); // Envolver app express
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Permitir conexiones desde cualquier origen (Vite puerto 3006)
    methods: ["GET", "POST", "DELETE"]
  }
});

// Guardar io en app para (opcionalmente) usarlo en otros archivos, 
// aunque aquí lo usaremos directamente en las rutas.
app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.set('trust proxy', 1); // Confía en el primer proxy (Cloudflare)
app.use(cookieParser());

const JWT_SSO_SECRET = process.env.JWT_SSO_SECRET || 'fallback-secret';

const globalAuthMiddleware = async (req, res, next) => {
  if (process.env.ENABLE_GLOBAL_SSO !== 'true') return next();

  if (req.path.startsWith('/api/proxy/login') || req.path.startsWith('/assets') || req.path === '/favicon.ico') {
    return next();
  }

  const token = req.cookies.BIBLIO_SSO_TOKEN;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SSO_SECRET);
    if (decoded.role === 'FAMILY' || decoded.role === 'STUDENT') {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ success: false, message: 'Acceso denegado a satélites para este rol.' });
      }
      return res.redirect('https://prisma.bibliohispa.es');
    }

    if (decoded.role === 'TEACHER' || decoded.role === 'ADMIN') {
      req.ssoUser = decoded;
      return next();
    }
    return next();
  } catch (err) {
    return next();
  }
};

app.use(globalAuthMiddleware);

// --- SERVIR FRONTEND ESTÁTICO ---
app.use(express.static(path.join(__dirname, '../dist')));

// --- Datos Iniciales (Semilla) Actualizados ---
const INITIAL_DATA = {
  // Solo usuario Dirección para poder hacer Login e Importar
  users: [
    { id: 'u1', username: 'direccion', password: '123', name: 'Dirección', email: 'direccion@hispanidad.com', role: 'DIRECCION' }
  ],
  cycles: [],
  classes: [],
  students: [],
  excursions: [],
  participations: []
};

// --- Helper Funciones ---

// In-memory cache
let dbCache = null;
let writeQueue = Promise.resolve();

const initDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    dbCache = JSON.parse(JSON.stringify(INITIAL_DATA));
  } else {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      dbCache = JSON.parse(data);
    } catch (err) {
      console.error("Error leyendo DB al inicio:", err);
      dbCache = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
  }
};

// Initialize cache on startup
initDb();

const readDb = () => {
  if (!dbCache) {
    initDb();
  }
  return dbCache;
};

const writeDb = (data) => {
  dbCache = data; // Update cache immediately
  // Chain write to ensure serialization without blocking event loop
  writeQueue = writeQueue.then(async () => {
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2));
  }).catch(err => {
    console.error("Error writing to DB:", err);
  });
  return writeQueue;
};

// --- API Endpoints ---

// 1. Obtener todo (Initial Load)
app.get('/api/db', (req, res) => {
  const data = readDb();
  res.json(data);
});

// 2. Guardar entidad genérica (Create/Update)
app.post('/api/sync/:entity', async (req, res) => {
  const { entity } = req.params; // users, students, etc.
  const item = req.body;
  const sourceSocketId = req.headers['x-socket-id']; // Get sender socket ID

  const db = readDb();

  if (!db[entity]) db[entity] = [];

  const index = db[entity].findIndex(x => x.id === item.id);
  if (index >= 0) {
    db[entity][index] = item; // Update
  } else {
    db[entity].push(item); // Create
  }

  await writeDb(db);

  // EMITIR EVENTO SOCKET
  io.emit('db_update', { entity, action: 'update', sourceSocketId });

  res.json({ success: true });
});

// 2.5 Bulk Guardar entidad genérica
app.post('/api/sync/:entity/bulk', async (req, res) => {
  const { entity } = req.params;
  const items = req.body;
  const sourceSocketId = req.headers['x-socket-id'];

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Body must be an array" });
  }

  const db = readDb();

  if (!db[entity]) db[entity] = [];

  items.forEach(item => {
    const index = db[entity].findIndex(x => x.id === item.id);
    if (index >= 0) {
      db[entity][index] = item; // Update
    } else {
      db[entity].push(item); // Create
    }
  });

  await writeDb(db);

  // EMITIR EVENTO SOCKET (Solo uno para todo el lote)
  io.emit('db_update', { entity, action: 'bulk_update', count: items.length, sourceSocketId });

  res.json({ success: true, count: items.length });
});

// 3. Borrar entidad
app.delete('/api/sync/:entity/:id', async (req, res) => {
  const { entity, id } = req.params;
  const sourceSocketId = req.headers['x-socket-id'];
  const db = readDb();

  if (db[entity]) {
    db[entity] = db[entity].filter(x => x.id !== id);
    await writeDb(db);

    // EMITIR EVENTO SOCKET
    io.emit('db_update', { entity, action: 'delete', id, sourceSocketId });
  }
  res.json({ success: true });
});

// 4. Restaurar Backup Completo
app.post('/api/restore', async (req, res) => {
  const fullData = req.body;
  if (fullData.users && fullData.excursions) {
    await writeDb(fullData);

    // EMITIR EVENTO SOCKET (Full reload)
    const sourceSocketId = req.headers['x-socket-id'];
    io.emit('db_update', { entity: 'all', action: 'restore', sourceSocketId });

    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Formato inválido" });
  }
});

// --- PROXY ENDPOINTS (PRISMA EDU) ---

const prismaHeaders = {
  'api_secret': API_SECRET,
  'Content-Type': 'application/json'
};

// Login Proxy (Manual)
app.post('/api/proxy/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`🔐 Proxy Login intentando para: ${username}`);

    // Llamada a PrismaEdu
    const response = await axios.post(`${PRISMA_URL}/api/auth/external-check`, {
      username,
      password
    }, { headers: prismaHeaders });

    console.log(`✅ Proxy Login éxito para ${username}:`, response.data);

    let data = response.data;

    // Si Prisma envía cookies (como BIBLIO_SSO_TOKEN), retransmitírselas al cliente de Excursiones
    if (response.headers && response.headers['set-cookie']) {
      res.setHeader('set-cookie', response.headers['set-cookie']);
    }

    // Fix: Normalize response if it's flat
    if (data.success && !data.user) {
      const { id, name, email, role, classId, coordinatorCycleId } = data;
      data = {
        success: true,
        user: {
          id,
          username: username.trim(),
          name,
          email,
          role,
          classId,
          coordinatorCycleId
        }
      };
    }

    // Retornamos la respuesta tal cual
    res.json(data);
  } catch (error) {
    console.error(`❌ Error en Proxy Login para ${req.body?.username}:`, error.message);
    if (error.response) {
      console.error("Detalles error externo:", error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error de conexión con PrismaEdu' });
    }
  }
});

// Endpoint to check SSO token
app.get('/api/proxy/me', (req, res) => {
  const token = req.cookies.BIBLIO_SSO_TOKEN;
  if (!token) return res.status(401).json({ success: false, message: 'No SSO session' });
  try {
    const JWT_SSO_SECRET = process.env.JWT_SSO_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, JWT_SSO_SECRET);

    // Fill "name" and other details from dbCache
    const db = readDb();
    const cleanEmail = (decoded.email || decoded.userId || '').toLowerCase();

    const localUser = db.users.find(u =>
      u.id === decoded.userId ||
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      (u.username && u.username.toLowerCase() === cleanEmail)
    );

    if (localUser) {
      return res.json({ success: true, user: localUser });
    }

    // Retornamos raw token info si no hay local match
    return res.json({
      success: true,
      user: { id: decoded.userId, username: decoded.userId, name: decoded.userId, email: decoded.email, role: decoded.role }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Users Proxy
app.get('/api/proxy/users', async (req, res) => {
  try {
    const response = await axios.get(`${PRISMA_URL}/api/export/users`, {
      headers: prismaHeaders
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error en Proxy Users:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error obteniendo usuarios externos' });
    }
  }
});

// Classes Proxy
app.get('/api/proxy/classes', async (req, res) => {
  try {
    const response = await axios.get(`${PRISMA_URL}/api/export/classes`, {
      headers: prismaHeaders
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error en Proxy Classes:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error obteniendo clases externas' });
    }
  }
});

// Students Proxy
app.get('/api/proxy/students', async (req, res) => {
  try {
    const response = await axios.get(`${PRISMA_URL}/api/export/students`, {
      headers: prismaHeaders
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error en Proxy Students:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error obteniendo alumnos externos' });
    }
  }
});

// --- IMPORTACIÓN Y SINCRONIZACIÓN ---

const fetchPrismaData = async () => {
  try {
    console.log("⬇️ Iniciando importación desde PrismaEdu...");
    const [classesRes, studentsRes, usersRes] = await Promise.all([
      axios.get(`${PRISMA_URL}/api/export/classes`, { headers: prismaHeaders }),
      axios.get(`${PRISMA_URL}/api/export/students`, { headers: prismaHeaders }),
      axios.get(`${PRISMA_URL}/api/export/users`, { headers: prismaHeaders })
    ]);

    // 1. Procesar Clases y Ciclos
    const rawClasses = classesRes.data || [];
    const cycleMap = new Map();

    const classes = rawClasses.map(c => {
      const cycleId = `${c.stage}-${c.cycle}`.replace(/\s+/g, '-').toLowerCase();

      // Generar Ciclo si no existe
      if (!cycleMap.has(cycleId)) {
        cycleMap.set(cycleId, {
          id: cycleId,
          name: `${c.stage} - ${c.cycle}`
        });
      }

      return {
        id: c.id,
        name: c.name,
        stage: c.stage,
        cycle: c.cycle,
        level: c.level,
        cycleId: cycleId,
        tutorId: '' // Se rellenará al procesar usuarios
      };
    });

    const cycles = Array.from(cycleMap.values());

    // 2. Procesar Alumnos
    const rawStudents = studentsRes.data || [];
    const students = rawStudents.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      classId: s.classId,
      familyId: s.familyId
    }));

    // 3. Procesar Usuarios (Profesores)
    const rawUsers = usersRes.data || [];
    const users = rawUsers.map(u => {
      let role = u.role || 'TUTOR';
      const username = u.username || u.email.split('@')[0];

      // Fix: Detectar Tesorería por nombre de usuario
      if (username.toLowerCase().includes('tesoreria')) {
        role = 'TESORERIA';
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        classId: u.classId,
        role: role,
        username: username,
        password: '', // Sin contraseña desde export
        coordinatorCycleId: u.coordinatorCycleId
      };
    });

    // 4. Vincular Tutor a Clase (Bidireccional)
    users.forEach(u => {
      if (u.classId) {
        const cls = classes.find(c => c.id === u.classId);
        if (cls) cls.tutorId = u.id;
      }
    });

    console.log(`✅ Datos obtenidos: ${users.length} usuarios, ${classes.length} clases, ${students.length} alumnos.`);
    return { users, classes, students, cycles };

  } catch (error) {
    console.error("❌ Error en fetchPrismaData:", error.message);
    if (error.response) {
      throw { status: error.response.status, message: error.response.data };
    }
    throw { status: 500, message: "Error conectando con PrismaEdu" };
  }
};

app.post('/api/import/prisma', async (req, res) => {
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
    const sourceSocketId = req.headers['x-socket-id'];
    io.emit('db_update', { entity: 'all', action: 'import', sourceSocketId });

    res.json({
      success: true,
      message: "Importación completada con éxito",
      stats: {
        users: mergedUsers.length,
        classes: mergedClasses.length,
        students: mergedStudents.length
      },
      data: prismaData
    });

  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || "Error interno en importación" });
  }
});


// --- CATCH-ALL ROUTE ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.get(/^\/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// USAR httpServer EN LUGAR DE app.listen
httpServer.listen(PORT, () => {
  console.log(`✅ Servidor Todo-en-Uno (HTTP + WebSocket) corriendo en http://localhost:${PORT}`);
  console.log(`📁 Base de datos: ${DB_FILE}`);
  console.log(`🌍 Sirviendo frontend desde: ../dist`);
  console.log(`🔌 Proxy PrismaEdu configurado hacia: ${PRISMA_URL}`);
});
