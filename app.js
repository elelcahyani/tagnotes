require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'tagnotes-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
}));

// Flash messages
app.use(flash());

// Make user info available to all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId
    ? { id: req.session.userId, username: req.session.username }
    : null;
  next();
});

// Routes
const authRouter = require('./routes/auth');
const notesRouter = require('./routes/notes');
app.use('/', authRouter);
app.use('/', notesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    message: 'Halaman tidak ditemukan',
    title: '404 - Tidak Ditemukan'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).render('error', { 
      message: 'Ukuran file melebihi batas 5MB',
      title: 'Error Upload'
    });
  }
  if (err.message && err.message.includes('Format file')) {
    return res.status(400).render('error', { 
      message: err.message,
      title: 'Error Upload'
    });
  }
  
  res.status(500).render('error', { 
    message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
    title: 'Server Error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Tag Notes running on port ${PORT}`);
});

module.exports = app;
