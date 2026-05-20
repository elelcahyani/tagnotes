const pool = require('../config/database');

const Tag = {
  async findAll(userId) {
    if (userId) {
      const [rows] = await pool.query(
        `SELECT DISTINCT t.id, t.name FROM tags t
         JOIN note_tags nt ON t.id = nt.tag_id
         JOIN notes n ON nt.note_id = n.id
         WHERE n.user_id = ?
         ORDER BY t.name`,
        [userId]
      );
      return rows;
    }
    const [rows] = await pool.query(
      'SELECT DISTINCT t.id, t.name FROM tags t JOIN note_tags nt ON t.id = nt.tag_id ORDER BY t.name'
    );
    return rows;
  },

  async findByNoteId(noteId) {
    const [rows] = await pool.query(`
      SELECT t.id, t.name 
      FROM tags t
      JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
      ORDER BY t.name
    `, [noteId]);
    return rows;
  },

  async syncTags(noteId, tagNames) {
    // Delete existing note_tags for this note
    await pool.query('DELETE FROM note_tags WHERE note_id = ?', [noteId]);

    if (!tagNames || tagNames.length === 0) return;

    // Upsert each tag and create note_tag association
    for (const name of tagNames) {
      const trimmed = name.trim();
      if (!trimmed) continue;

      // Insert tag if not exists
      await pool.query(
        'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
        [trimmed]
      );
      const [tagRows] = await pool.query('SELECT id FROM tags WHERE name = ?', [trimmed]);
      if (tagRows.length > 0) {
        await pool.query(
          'INSERT IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)',
          [noteId, tagRows[0].id]
        );
      }
    }
  },

  async deleteByNoteId(noteId) {
    await pool.query('DELETE FROM note_tags WHERE note_id = ?', [noteId]);
  }
};

module.exports = Tag;
