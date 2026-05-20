const path = require('path');
const fs = require('fs');
const { Note, assignColor } = require('../models/Note');
const Tag = require('../models/Tag');
const Link = require('../models/Link');
const NoteImage = require('../models/NoteImage');

function validateNote(title, content) {
  const errors = [];
  if (!title || title.trim() === '') errors.push('Judul catatan wajib diisi');
  if (!content || content.trim() === '') errors.push('Isi catatan wajib diisi');
  return errors;
}

function parseTagsFromBody(body) {
  if (!body.tags) return [];
  if (Array.isArray(body.tags)) return body.tags.filter(t => t.trim());
  return body.tags.split(',').map(t => t.trim()).filter(Boolean);
}

function parseLinksFromBody(body) {
  if (!body.links) return [];
  if (Array.isArray(body.links)) return body.links.filter(u => u.trim());
  return [body.links].filter(u => u && u.trim());
}

function getUploadedUrls(files) {
  if (!files || files.length === 0) return [];
  return files.map(f => `/uploads/${f.filename}`);
}

const noteController = {
  async index(req, res) {
    try {
      const { search = '', tag = '', sort = '' } = req.query;
      const userId = parseInt(req.session.userId, 10);
      const [notes, tags] = await Promise.all([
        Note.findAll({ search, tag, sort, userId }),
        Tag.findAll(userId)
      ]);
      if (notes.length > 0) {
        const imgMap = await NoteImage.getFirstImages(notes.map(n => n.id));
        notes.forEach(n => { n.first_image = imgMap[n.id] || null; });
      }
      res.render('index', { notes, tags, search, activeTag: tag, sort, title: 'Tag Notes' });
    } catch (err) {
      console.error('INDEX ERROR:', err.message, err.stack);
      res.status(500).render('error', { message: 'Terjadi kesalahan pada server.', title: 'Server Error' });
    }
  },

  async newForm(req, res) {
    try {
      const tags = await Tag.findAll(req.session.userId);
      res.render('create', { note: null, tags, errors: [], title: 'Buat Catatan Baru' });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Terjadi kesalahan pada server.', title: 'Server Error' });
    }
  },

  async create(req, res) {
    try {
      const { title, content } = req.body;
      const tagNames = parseTagsFromBody(req.body);
      const linkUrls = parseLinksFromBody(req.body);
      const errors = validateNote(title, content);

      if (errors.length > 0) {
        const tags = await Tag.findAll(req.session.userId);
        return res.status(400).render('create', {
          note: { title, content, tags: tagNames.map(n => ({ name: n })), links: linkUrls.map(u => ({ url: u })), images: [] },
          tags, errors, title: 'Buat Catatan Baru'
        });
      }

      const noteId = await Note.create({ title: title.trim(), content: content.trim(), color: '#FCD34D', userId: req.session.userId });
      await Tag.syncTags(noteId, tagNames);
      await Link.syncLinks(noteId, linkUrls);

      const imageUrls = getUploadedUrls(req.files);
      console.log('CREATE - req.files:', req.files ? req.files.length : 0, '| imageUrls:', imageUrls);
      if (imageUrls.length > 0) {
        await NoteImage.addImages(noteId, imageUrls);
      }

      res.redirect('/');
    } catch (err) {
      console.error('CREATE ERROR:', err.message, err.stack);
      res.status(500).render('error', { message: `Error: ${err.message}`, title: 'Server Error' });
    }
  },

  async show(req, res) {
    try {
      const note = await Note.findById(req.params.id);
      if (!note || note.user_id !== parseInt(req.session.userId, 10)) {
        return res.status(404).render('error', { message: 'Catatan tidak ditemukan', title: '404 - Tidak Ditemukan' });
      }
      const [tags, links, images] = await Promise.all([
        Tag.findAll(req.session.userId),
        Link.findByNoteId(note.id),
        NoteImage.findByNoteId(note.id)
      ]);
      note.links = links;
      note.images = images;
      res.render('detail', { note, tags, title: note.title });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Terjadi kesalahan pada server.', title: 'Server Error' });
    }
  },

  async editForm(req, res) {
    try {
      const note = await Note.findById(req.params.id);
      if (!note || note.user_id !== parseInt(req.session.userId, 10)) {
        return res.status(404).render('error', { message: 'Catatan tidak ditemukan', title: '404 - Tidak Ditemukan' });
      }
      const [tags, links, images] = await Promise.all([
        Tag.findAll(req.session.userId),
        Link.findByNoteId(note.id),
        NoteImage.findByNoteId(note.id)
      ]);
      note.links = links;
      note.images = images;
      res.render('create', { note, tags, errors: [], title: `Edit: ${note.title}` });
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Terjadi kesalahan pada server.', title: 'Server Error' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const tagNames = parseTagsFromBody(req.body);
      const linkUrls = parseLinksFromBody(req.body);
      const errors = validateNote(title, content);

      if (errors.length > 0) {
        const note = await Note.findById(id);
        const [tags, links, images] = await Promise.all([
          Tag.findAll(req.session.userId),
          Link.findByNoteId(id),
          NoteImage.findByNoteId(id)
        ]);
        note.links = links;
        note.images = images;
        return res.status(400).render('create', {
          note: { ...note, title, content, tags: tagNames.map(n => ({ name: n })), links: linkUrls.map(u => ({ url: u })) },
          tags, errors, title: 'Edit Catatan'
        });
      }

      await Note.update(id, { title: title.trim(), content: content.trim() });
      await Tag.syncTags(id, tagNames);
      await Link.syncLinks(id, linkUrls);

      // Hapus gambar yang di-x oleh user
      const deleteIds = req.body.delete_images
        ? (Array.isArray(req.body.delete_images) ? req.body.delete_images : [req.body.delete_images])
        : [];
      if (deleteIds.length > 0) {
        const pool = require('../config/database');
        for (const imgId of deleteIds) {
          const [rows] = await pool.query('SELECT url FROM note_images WHERE id = ? AND note_id = ?', [imgId, id]);
          if (rows.length > 0) {
            const filePath = path.join(__dirname, '../public', rows[0].url);
            fs.unlink(filePath, () => {});
            await pool.query('DELETE FROM note_images WHERE id = ?', [imgId]);
          }
        }
      }

      // Tambah gambar baru kalau ada upload
      if (req.files && req.files.length > 0) {
        const imageUrls = getUploadedUrls(req.files);
        await NoteImage.addImages(id, imageUrls);
      }

      res.redirect(`/notes/${id}`);
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Terjadi kesalahan saat memperbarui catatan.', title: 'Server Error' });
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const note = await Note.findById(id);
      if (!note || note.user_id !== parseInt(req.session.userId, 10)) {
        return res.status(404).render('error', { message: 'Catatan tidak ditemukan', title: '404' });
      }
      await NoteImage.deleteByNoteId(id);
      // Hapus relasi manual karena MyISAM tidak support CASCADE
      const pool = require('../config/database');
      await pool.query('DELETE FROM note_tags WHERE note_id = ?', [id]);
      await pool.query('DELETE FROM note_links WHERE note_id = ?', [id]);
      // Hapus tag yang sudah tidak dipakai note manapun
      await pool.query('DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM note_tags)');
      await Note.delete(id);
      res.redirect('/');
    } catch (err) {
      console.error(err);
      res.status(500).render('error', { message: 'Terjadi kesalahan saat menghapus catatan.', title: 'Server Error' });
    }
  }
};

module.exports = noteController;
