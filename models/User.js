const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ username, email, password }) {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hash]
    );
    return result.insertId;
  },

  async updateProfile(id, { username, email }) {
    await pool.query('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, id]);
  },

  async updatePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, id]);
  },

  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
};

module.exports = User;
