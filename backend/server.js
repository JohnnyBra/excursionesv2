const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http'); // Importar HTTP nativo
const { Server } = require('socket.io'); // Importar Socket.io
const axios = require('axios'); // Importar Axios

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

// --- SERVIR FRONTEND ESTÁTICO ---
app.use(express.static(path.join(__dirname, '../dist')));

// --- Datos Iniciales (Semilla) Actualizados ---
const INITIAL_DATA = {
  users: [
    { id: 'u1', username: 'direccion', password: '123', name: 'Ana Directora', email: 'admin@hispanidad.com', role: 'DIRECCION' }
  ],
  cycles: [],
  classes: [],
  students: [],
  excursions: [],
  participations: []
};

// --- Helper Funciones ---
const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    return INITIAL_DATA;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error leyendo DB:", err);
    return INITIAL_DATA;
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- API Endpoints ---

// 1. Obtener todo (Initial Load)
app.get('/api/db', (req, res) => {
  const data = readDb();
  res.json(data);
});

// 2. Guardar entidad genérica (Create/Update)
app.post('/api/sync/:entity', (req, res) => {
  const { entity } = req.params; // users, students, etc.
  const item = req.body;
  const db = readDb();

  if (!db[entity]) db[entity] = [];

  const index = db[entity].findIndex(x => x.id === item.id);
  if (index >= 0) {
    db[entity][index] = item; // Update
  } else {
    db[entity].push(item); // Create
  }

  writeDb(db);
  
  // EMITIR EVENTO SOCKET
  io.emit('db_update', { entity, action: 'update' });
  
  res.json({ success: true });
});

// 3. Borrar entidad
app.delete('/api/sync/:entity/:id', (req, res) => {
  const { entity, id } = req.params;
  const db = readDb();

  if (db[entity]) {
    db[entity] = db[entity].filter(x => x.id !== id);
    writeDb(db);
    
    // EMITIR EVENTO SOCKET
    io.emit('db_update', { entity, action: 'delete', id });
  }
  res.json({ success: true });
});

// 4. Restaurar Backup Completo
app.post('/api/restore', (req, res) => {
  const fullData = req.body;
  if(fullData.users && fullData.excursions) {
    writeDb(fullData);
    
    // EMITIR EVENTO SOCKET (Full reload)
    io.emit('db_update', { entity: 'all', action: 'restore' });
    
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

    // Llamada a PrismaEdu
    const response = await axios.post(`${PRISMA_URL}/api/auth/external-check`, {
      username,
      password
    }, { headers: prismaHeaders });

    // Retornamos la respuesta tal cual
    res.json(response.data);
  } catch (error) {
    console.error('Error en Proxy Login:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error de conexión con PrismaEdu' });
    }
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


// --- CATCH-ALL ROUTE ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// USAR httpServer EN LUGAR DE app.listen
httpServer.listen(PORT, () => {
  console.log(`✅ Servidor Todo-en-Uno (HTTP + WebSocket) corriendo en http://localhost:${PORT}`);
  console.log(`📁 Base de datos: ${DB_FILE}`);
  console.log(`🌍 Sirviendo frontend desde: ../dist`);
  console.log(`🔌 Proxy PrismaEdu configurado hacia: ${PRISMA_URL}`);
});
