const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// --- Middlewares ---
app.use(helmet()); // Seguridad headers
app.use(cors()); // Permitir peticiones desde Vite
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parsing JSON

// --- Routes Placeholders ---
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/excursions', require('./routes/excursions'));
// app.use('/api/students', require('./routes/students'));

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Cambio solicitado: Puerto 3004
const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;