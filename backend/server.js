const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const passport = require('passport');
const session = require('express-session');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = 3020; // Changed to 3020 as requested
const DB_PATH = path.join(__dirname, 'school.db');

// --- DATABASE CONNECTION ---
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error("Could not connect to database", err);
    else console.log("Connected to SQLite database");
});

// --- CONFIGURACIÓN SOCKET.IO ---
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE"]
  }
});
app.set('socketio', io);

// --- EXPRESS CONFIG ---
app.set('trust proxy', 1); // Requested config

app.use(cors({
    origin: true, // Allow all for now, or specify frontend URL
    credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// --- SESSION & PASSPORT ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Secure in production (behind https proxy)
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

require('./auth')(passport); // Configure Passport Strategies

// --- AUTH ROUTES ---

// Local Login
app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ success: false, message: info.message });

        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
        });
    })(req, res, next);
});

// Google Login
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('/');
    }
);

// Logout
app.post('/api/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// Current User
app.get('/api/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                role: req.user.role,
                name: req.user.name
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// External Check (Satellite Apps)
app.post('/api/auth/external-check', async (req, res) => {
    const { username, password } = req.body;
    
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) return res.status(500).json({ success: false, error: "DB Error" });
        if (!user) return res.json({ success: false, message: "User not found" });

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.json({
                success: true,
                role: user.role,
                name: user.name
            });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    });
});


// --- EXPORT API (Phase 3) ---
const checkApiSecret = (req, res, next) => {
    const secret = req.headers['api-secret'] || req.headers['api_secret'];
    // In a real env, match against process.env.API_SECRET
    // For now, let's assume 'prisma_secret_123' if not set in env
    const validSecret = process.env.API_SECRET || 'prisma_secret_123';
    
    if (secret === validSecret) {
        next();
    } else {
        res.status(403).json({ error: 'Unauthorized: Invalid API Key' });
    }
};

app.get('/api/export/classes', checkApiSecret, (req, res) => {
    const query = `
        SELECT c.id, c.name,
               l.name as level,
               cy.name as cycle,
               s.name as stage
        FROM classes c
        JOIN levels l ON c.level_id = l.id
        JOIN cycles cy ON l.cycle_id = cy.id
        JOIN stages s ON cy.stage_id = s.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/export/students', checkApiSecret, (req, res) => {
    db.all("SELECT id, name, class_id FROM students", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/export/users', checkApiSecret, (req, res) => {
    // Only return active teachers (profesor)
    db.all("SELECT id, name, email FROM users WHERE role = 'profesor'", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// --- LEGACY/COMPATIBILITY ROUTES (To keep frontend working initially if needed) ---
// We should probably implement /api/proxy/classes and /api/proxy/students
// BUT the prompt says "Convert this app into the Central ERP".
// The frontend uses "mockDb" or "proxy".
// The previous server.js had /api/db, /api/sync/*
// If we want the frontend to work immediately, we might need to map the new DB to the old endpoints or update the frontend to use the new endpoints.
// For now, I will implement the requested phases.
// If the user wants the frontend to work *as is*, I'd need to mock the old endpoints using SQLite data.

// Let's reimplement /api/proxy/classes using the new DB, because the frontend expects it?
// Wait, the memory says: "Authentication is performed via the backend endpoint POST /api/login, which acts as a proxy to an external authentication service (PrismaEdu) running on http://localhost:3020."
// NOW, WE ARE BUILDING THAT SERVICE ON 3020.
// So the frontend calls /api/login -> which now hits this server directly (if frontend proxy is updated or if this server is the main one).
// The frontend calls /api/proxy/classes -> which presumably fetches from 3020.
// So I should implement /api/proxy/classes (or just /api/classes if the frontend calls it that).
// Actually, I should probably expose the classes at a standard endpoint.

// Reimplementing basic data fetch for the frontend to consume (assuming frontend logic will be updated or expects specific format)
app.get('/api/classes', (req, res) => {
    const query = `
        SELECT c.id, c.name,
               l.name as level,
               cy.name as cycle,
               s.name as stage
        FROM classes c
        JOIN levels l ON c.level_id = l.id
        JOIN cycles cy ON l.cycle_id = cy.id
        JOIN stages s ON cy.stage_id = s.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// --- SERVIR FRONTEND ESTÁTICO ---
app.use(express.static(path.join(__dirname, '../dist')));

// --- CATCH-ALL ROUTE ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// USAR httpServer EN LUGAR DE app.listen
httpServer.listen(PORT, () => {
  console.log(`✅ Servidor Central ERP (HTTP + WebSocket) corriendo en http://localhost:${PORT}`);
  console.log(`📁 Base de datos: ${DB_PATH}`);
});
