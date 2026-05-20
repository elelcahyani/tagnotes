const pool = require('../config/database');

const COLOR_PALETTE = ['#FCD34D', '#C084FC', '#4ADE80', '#38BDF8', '#A3E635', '#FB923C'];

function assignColor(noteId) {
  return COLOR_PALETTE[(noteId - 1) % COLOR_PALETTE.length];
}

const Note = {
  async findAll({ search = '', tag = '', sort = '', userId } = {}) {
    let query = `
      SELECT n.*, 
        GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ',') as tag_names
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
    `;
    const params = [];
    const conditions = [];

    // Filter by user
    if (userId) {
      conditions.push('n.user_id = ?');
      params.push(userId);
    }

    if (tag) {
      conditions.push(`n.id IN (
        SELECT nt2.note_id FROM note_tags nt2
        JOIN tags t2 ON nt2.tag_id = t2.id
        WHERE LOWER(t2.name) = LOWER(?)
      )`);
      params.push(tag);
    }

    if (search) {
      conditions.push(`(
        LOWER(n.title) LIKE LOWER(?)
        OR LOWER(n.content) LIKE LOWER(?)
        OR n.id IN (
          SELECT nt3.note_id FROM note_tags nt3
          JOIN tags t3 ON nt3.tag_id = t3.id
          WHERE LOWER(t3.name) LIKE LOWER(?)
        )
      )`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const order = sort === 'date_asc' ? 'ASC' : 'DESC';
    query += ` GROUP BY n.id ORDER BY n.created_at ${order}`;

    const [rows] = await pool.query(query, params);
    return rows.map(row => ({
      ...row,
      tags: row.tag_names ? row.tag_names.split(',').map(name => ({ name })) : []
    }));
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT n.*, 
        GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ',') as tag_names
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE n.id = ?
      GROUP BY n.id
    `, [id]);

    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      ...row,
      tags: row.tag_names ? row.tag_names.split(',').map(name => ({ name })) : []
    };
  },

  async create({ title, content, color, userId }) {
    const [result] = await pool.query(
      'INSERT INTO notes (title, content, color, user_id) VALUES (?, ?, ?, ?)',
      [title, content, color, userId]
    );
    const newId = result.insertId;
    const actualColor = assignColor(newId);
    await pool.query('UPDATE notes SET color = ? WHERE id = ?', [actualColor, newId]);
    return newId;
  },

  async update(id, { title, content }) {
    await pool.query('UPDATE notes SET title = ?, content = ? WHERE id = ?', [title, content, id]);
  },

  async delete(id) {
    await pool.query('DELETE FROM notes WHERE id = ?', [id]);
  }
};

module.exports = { Note, assignColor, COLOR_PALETTE };
