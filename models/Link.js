const pool = require('../config/database');

const Link = {
  async findByNoteId(noteId) {
    const [rows] = await pool.query('SELECT * FROM note_links WHERE note_id = ? ORDER BY id', [noteId]);
    return rows;
  },

  async syncLinks(noteId, urls) {
    await pool.query('DELETE FROM note_links WHERE note_id = ?', [noteId]);
    if (!urls || urls.length === 0) return;
    for (const url of urls) {
      const trimmed = url.trim();
      if (trimmed) await pool.query('INSERT INTO note_links (note_id, url) VALUES (?, ?)', [noteId, trimmed]);
    }
  }
};

module.exports = Link;
