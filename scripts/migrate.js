/**
 * Migration script - jalankan sekali: node scripts/migrate.js
 * Menambahkan kolom user_id ke tabel notes jika belum ada,
 * lalu assign semua notes lama ke user demo (id=1)
 */
require('dotenv').config();
const pool = require('../config/database');

async function migrate() {
  try {
    console.log('Checking database state...');

    // 1. Cek apakah kolom user_id sudah ada
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notes' AND COLUMN_NAME = 'user_id'
    `);

    if (cols.length === 0) {
      console.log('Adding user_id column to notes...');
      await pool.query(`ALTER TABLE notes ADD COLUMN user_id INT NOT NULL DEFAULT 1 AFTER id`);
      console.log('Column added.');
    } else {
      console.log('Column user_id already exists.');
    }

    // 2. Cek apakah foreign key sudah ada
    const [fks] = await pool.query(`
      SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notes'
      AND REFERENCED_TABLE_NAME = 'users' AND COLUMN_NAME = 'user_id'
    `);

    if (fks.length === 0) {
      console.log('Adding foreign key...');
      try {
        await pool.query(`ALTER TABLE notes ADD CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
        console.log('Foreign key added.');
      } catch (e) {
        console.log('FK skipped (may already exist or conflict):', e.message);
      }
    } else {
      console.log('Foreign key already exists.');
    }

    // 3. Pastikan semua notes yang user_id = 0 atau NULL di-assign ke user id=1
    const [updated] = await pool.query(`UPDATE notes SET user_id = 1 WHERE user_id = 0 OR user_id IS NULL`);
    console.log(`Fixed ${updated.affectedRows} notes with invalid user_id.`);

    // 4. Tampilkan ringkasan
    const [noteSummary] = await pool.query(`SELECT user_id, COUNT(*) as total FROM notes GROUP BY user_id`);
    console.log('\nNotes per user:');
    noteSummary.forEach(r => console.log(`  user_id=${r.user_id}: ${r.total} notes`));

    const [users] = await pool.query(`SELECT id, username, email FROM users`);
    console.log('\nUsers in database:');
    users.forEach(u => console.log(`  id=${u.id} | ${u.username} | ${u.email}`));

    console.log('\nMigration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
