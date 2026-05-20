const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

const NoteImage = {
  async findByNoteId(noteId) {
    const [rows] = await pool.query(
      'SELECT * FROM note_images WHERE note_id = ? ORDER BY sort_order ASC',
      [noteId]
    );
    return rows;
  },

  async addImages(noteId, urls) {
    if (!urls || urls.length === 0) return;
    for (let i = 0; i < urls.length; i++) {
      await pool.query(
        'INSERT INTO note_images (note_id, url, sort_order) VALUES (?, ?, ?)',
        [noteId, urls[i], i]
      );
    }
  },

  async deleteByNoteId(noteId) {
    const [rows] = await pool.query('SELECT url FROM note_images WHERE note_id = ?', [noteId]);
    // Hapus file fisik
    for (const row of rows) {
      if (row.url && row.url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../public', row.url);
        fs.unlink(filePath, () => {});
      }
    }
    await pool.query('DELETE FROM note_images WHERE note_id = ?', [noteId]);
  },

  async getFirstImage(noteId) {
    const [rows] = await pool.query(
      'SELECT url FROM note_images WHERE note_id = ? ORDER BY sort_order ASC LIMIT 1',
      [noteId]
    );
    return rows.length > 0 ? rows[0].url : null;
  },

  // Ambil first image untuk banyak note sekaligus (efisien)
  async getFirstImages(noteIds) {
    if (!noteIds || noteIds.length === 0) return {};
    const [rows] = await pool.query(
      `SELECT ni.note_id, ni.url FROM note_images ni
       INNER JOIN (
         SELECT note_id, MIN(sort_order) as min_order 
         FROM note_images WHERE note_id IN (?) 
         GROUP BY note_id
       ) m ON ni.note_id = m.note_id AND ni.sort_order = m.min_order`,
      [noteIds]
    );
    const map = {};
    rows.forEach(r => { map[r.note_id] = r.url; });
    return map;
  }
};

module.exports = NoteImage;
