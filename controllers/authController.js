const User = require('../models/User');

// Password: min 8 chars, at least 1 letter + 1 number
function validatePassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

const authController = {
  showLogin(req, res) {
    res.render('login', {
      title: 'Login - Tag Notes',
      error: req.flash('error'),
      success: req.flash('success'),
      layout: false
    });
  },

  async login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
      req.flash('error', 'Email dan password wajib diisi');
      return res.redirect('/login');
    }
    try {
      const user = await User.findByEmail(email.trim().toLowerCase());
      if (!user) {
        req.flash('error', 'Email atau password salah');
        return res.redirect('/login');
      }
      const valid = await User.verifyPassword(password, user.password);
      if (!valid) {
        req.flash('error', 'Email atau password salah');
        return res.redirect('/login');
      }
      req.session.userId = parseInt(user.id, 10);
      req.session.username = user.username;
      res.redirect('/');
    } catch (err) {
      console.error('LOGIN ERROR:', err);
      req.flash('error', 'Terjadi kesalahan, coba lagi');
      res.redirect('/login');
    }
  },

  showRegister(req, res) {
    res.render('register', {
      title: 'Register - Tag Notes',
      error: req.flash('error'),
      layout: false
    });
  },

  async register(req, res) {
    const { username, email, password } = req.body;
    const errors = [];

    if (!username || username.trim().length < 2) errors.push('Username minimal 2 karakter');
    if (!email || !email.includes('@')) errors.push('Email tidak valid');
    if (!validatePassword(password)) {
      errors.push('Password minimal 8 karakter, kombinasi huruf dan angka');
    }

    if (errors.length > 0) {
      errors.forEach(e => req.flash('error', e));
      return res.redirect('/register');
    }

    try {
      const existing = await User.findByEmail(email.trim().toLowerCase());
      if (existing) {
        req.flash('error', 'Email sudah terdaftar');
        return res.redirect('/register');
      }
      const id = await User.create({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password
      });
      req.session.userId = parseInt(id, 10);
      req.session.username = username.trim();
      res.redirect('/');
    } catch (err) {
      console.error('REGISTER ERROR:', err);
      req.flash('error', 'Terjadi kesalahan, coba lagi');
      res.redirect('/register');
    }
  },

  logout(req, res) {
    req.session.destroy(() => res.redirect('/login'));
  },

  async getProfileData(req, res) {
    try {
      const user = await User.findById(req.session.userId);
      res.json({ user });
    } catch (err) {
      res.json({ user: null });
    }
  },

  async updateProfile(req, res) {
    const { username, email } = req.body;
    const userId = req.session.userId;
    try {
      if (!username || username.trim().length < 2) {
        return res.json({ success: false, message: 'Username minimal 2 karakter' });
      }
      if (!email || !email.includes('@')) {
        return res.json({ success: false, message: 'Email tidak valid' });
      }
      // Check email uniqueness (exclude current user)
      const existing = await User.findByEmail(email.trim().toLowerCase());
      if (existing && existing.id !== userId) {
        return res.json({ success: false, message: 'Email sudah digunakan akun lain' });
      }
      await User.updateProfile(userId, { username: username.trim(), email: email.trim().toLowerCase() });
      req.session.username = username.trim();
      res.json({ success: true, message: 'Profil berhasil diperbarui' });
    } catch (err) {
      console.error('UPDATE PROFILE ERROR:', err);
      res.json({ success: false, message: 'Terjadi kesalahan' });
    }
  },

  async updatePassword(req, res) {
    const { current_password, new_password } = req.body;
    const userId = req.session.userId;
    try {
      const user = await User.findByEmail(
        (await User.findById(userId)).email
      );
      const valid = await User.verifyPassword(current_password, user.password);
      if (!valid) {
        return res.json({ success: false, message: 'Password saat ini salah' });
      }
      if (!validatePassword(new_password)) {
        return res.json({ success: false, message: 'Password baru minimal 8 karakter, kombinasi huruf dan angka' });
      }
      await User.updatePassword(userId, new_password);
      res.json({ success: true, message: 'Password berhasil diperbarui' });
    } catch (err) {
      console.error('UPDATE PASSWORD ERROR:', err);
      res.json({ success: false, message: 'Terjadi kesalahan' });
    }
  }
};

module.exports = authController;
