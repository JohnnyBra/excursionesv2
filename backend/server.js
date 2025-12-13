const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3005;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// --- SERVIR FRONTEND ESTÁTICO ---
app.use(express.static(path.join(__dirname, '../dist')));

// --- Datos Iniciales (Semilla) Actualizados ---
const INITIAL_DATA = {
  users: [
    { id: 'u1', username: 'direccion', password: '123', name: 'Ana Directora', email: 'admin@hispanidad.com', role: 'DIRECCION' },
    { id: 'u2', username: 'tutor1', password: '123', name: 'Carlos Tutor', email: 'tutor@hispanidad.com', role: 'TUTOR', classId: 'cl1' },
    { id: 'u3', username: 'tesoreria', password: '123', name: 'Laura Tesorera', email: 'money@hispanidad.com', role: 'TESORERIA' },
    { id: 'u4', username: 'tutor2', password: '123', name: 'Maria Tutor 2', email: 'tutor2@hispanidad.com', role: 'TUTOR', classId: 'cl2' },
  ],
  cycles: [
    { id: 'c1', name: 'Infantil (3, 4, 5 años)' },
    { id: 'c2', name: 'Primaria - 1º Ciclo (1º y 2º)' },
    { id: 'c3', name: 'Primaria - 2º Ciclo (3º y 4º)' },
    { id: 'c4', name: 'Primaria - 3º Ciclo (5º y 6º)' },
    { id: 'c5', name: 'ESO - 1º Ciclo (1º y 2º)' },
    { id: 'c6', name: 'ESO - 2º Ciclo (3º y 4º)' }
  ],
  classes: [
    { id: 'cl1', name: '1º A Primaria', cycleId: 'c2', tutorId: 'u2' },
    { id: 'cl2', name: '3º B ESO', cycleId: 'c6', tutorId: 'u4' },
  ],
  students: [
    { id: 's1', name: 'Pepito Pérez', classId: 'cl1' },
    { id: 's2', name: 'Juanita López', classId: 'cl1' },
  ],
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
  res.json({ success: true });
});

// 3. Borrar entidad
app.delete('/api/sync/:entity/:id', (req, res) => {
  const { entity, id } = req.params;
  const db = readDb();

  if (db[entity]) {
    db[entity] = db[entity].filter(x => x.id !== id);
    writeDb(db);
  }
  res.json({ success: true });
});

// 4. Restaurar Backup Completo
app.post('/api/restore', (req, res) => {
  const fullData = req.body;
  if(fullData.users && fullData.excursions) {
    writeDb(fullData);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Formato inválido" });
  }
});

// --- CATCH-ALL ROUTE ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Servidor Todo-en-Uno corriendo en http://localhost:${PORT}`);
  console.log(`📁 Base de datos: ${DB_FILE}`);
  console.log(`🌍 Sirviendo frontend desde: ../dist`);
});