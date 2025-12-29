const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, '../school.db');
const db = new sqlite3.Database(DB_PATH);

const SALT_ROUNDS = 10;

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stage_id INTEGER,
    FOREIGN KEY(stage_id) REFERENCES stages(id)
);

CREATE TABLE IF NOT EXISTS levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cycle_id INTEGER,
    FOREIGN KEY(cycle_id) REFERENCES cycles(id)
);

CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level_id INTEGER,
    tutor_id TEXT,
    FOREIGN KEY(level_id) REFERENCES levels(id)
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    name TEXT,
    email TEXT UNIQUE,
    role TEXT,
    googleId TEXT,
    class_id INTEGER
);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class_id INTEGER,
    FOREIGN KEY(class_id) REFERENCES classes(id)
);
`;

const HIERARCHY = [
    {
        stage: 'INFANTIL',
        cycles: [
            {
                name: 'Ciclo Único',
                levels: [
                    { name: '3 Años' },
                    { name: '4 Años' },
                    { name: '5 Años' }
                ]
            }
        ]
    },
    {
        stage: 'PRIMARIA',
        cycles: [
            {
                name: 'Primer Ciclo',
                levels: [
                    { name: '1º Primaria' },
                    { name: '2º Primaria' }
                ]
            },
            {
                name: 'Segundo Ciclo',
                levels: [
                    { name: '3º Primaria' },
                    { name: '4º Primaria' }
                ]
            },
            {
                name: 'Tercer Ciclo',
                levels: [
                    { name: '5º Primaria' },
                    { name: '6º Primaria' }
                ]
            }
        ]
    },
    {
        stage: 'ESO',
        cycles: [
            {
                name: 'Primer Ciclo',
                levels: [
                    { name: '1º ESO' },
                    { name: '2º ESO' }
                ]
            },
            {
                name: 'Segundo Ciclo',
                levels: [
                    { name: '3º ESO' },
                    { name: '4º ESO' }
                ]
            }
        ]
    }
];

function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function init() {
    try {
        console.log("Creating tables...");
        await new Promise((resolve, reject) => {
            db.exec(SCHEMA, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log("Seeding hierarchy...");
        for (const stageData of HIERARCHY) {
            const stageResult = await runQuery("INSERT INTO stages (name) VALUES (?)", [stageData.stage]);
            const stageId = stageResult.lastID;

            for (const cycleData of stageData.cycles) {
                const cycleResult = await runQuery("INSERT INTO cycles (name, stage_id) VALUES (?, ?)", [cycleData.name, stageId]);
                const cycleId = cycleResult.lastID;

                for (const levelData of cycleData.levels) {
                    const levelResult = await runQuery("INSERT INTO levels (name, cycle_id) VALUES (?, ?)", [levelData.name, cycleId]);
                    const levelId = levelResult.lastID;

                    await runQuery("INSERT INTO classes (name, level_id) VALUES (?, ?)", [levelData.name + ' A', levelId]);
                    await runQuery("INSERT INTO classes (name, level_id) VALUES (?, ?)", [levelData.name + ' B', levelId]);
                }
            }
        }

        console.log("Seeding users...");
        const adminPass = await hashPassword('123');
        try {
            await runQuery("INSERT INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)",
                ['admin', adminPass, 'Super Admin', 'admin@colegiolahispanidad.es', 'admin']);
            console.log("SuperAdmin created.");
        } catch (e) {
            console.log("Admin likely exists.");
        }

        const teacherPass = await hashPassword('123');
        try {
            await runQuery("INSERT INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)",
                ['profesor', teacherPass, 'Profesor Test', 'profesor@colegiolahispanidad.es', 'profesor']);
             console.log("Teacher created.");
        } catch (e) {
            console.log("Teacher likely exists.");
        }

        console.log("Database init complete.");
    } catch (err) {
        console.error("Error initializing DB:", err);
    } finally {
        db.close();
    }
}

init();
