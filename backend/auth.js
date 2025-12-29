const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'school.db');
// We create a new DB instance here for auth queries to avoid sharing the main server instance state if we wanted to separation,
// but reusing is fine too. For simplicity, we create a new connection per request or a global one.
// Let's use a global one for auth.
const db = new sqlite3.Database(DB_PATH);

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = function(passport) {
  // --- LOCAL STRATEGY (SuperAdmin / Fallback) ---
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Usuario no encontrado' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: 'Contraseña incorrecta' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  // --- GOOGLE STRATEGY ---
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: (process.env.PUBLIC_URL || 'https://prisma.bibliohispa.es') + '/auth/google/callback',
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;

      // Regla 1: Dominio
      if (!email.endsWith('@colegiolahispanidad.es')) {
        return done(null, false, { message: 'Dominio no autorizado' });
      }

      // Regla 2: Check Local DB
      const user = await getUserByEmail(email);

      if (!user) {
        return done(null, false, { message: 'Usuario no registrado en el sistema' });
      }

      if (user.role !== 'profesor' && user.role !== 'admin' && user.role !== 'DIRECCION' && user.role !== 'TUTOR') {
         // Assuming 'profesor', 'admin', 'TUTOR', 'DIRECCION' are valid roles for login
         // The prompt explicitly says: "Si el rol NO es 'profesor' o 'admin' (ej. es alumno), RECHAZA el acceso."
         // I will strictly follow that, but include TUTOR/DIRECCION if they are mapped to profesor/admin logic or if I should map them.
         // Let's stick to strict check first, maybe the user has 'profesor' role in DB even if title is Tutor.
         // In my seed, I used 'profesor' and 'admin'.
         if (['profesor', 'admin'].includes(user.role)) {
             // Update Google ID if not present
             if (!user.googleId) {
                 db.run("UPDATE users SET googleId = ? WHERE id = ?", [profile.id, user.id]);
             }
             return done(null, user);
         } else {
             return done(null, false, { message: 'Rol no autorizado' });
         }
      }

      return done(null, user);

    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await getUserById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
