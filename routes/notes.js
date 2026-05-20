const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { upload, MAX_FILES } = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, noteController.index);
router.get('/notes/new', requireAuth, noteController.newForm);
router.post('/notes', requireAuth, upload.array('images', MAX_FILES), noteController.create);
router.get('/notes/:id', requireAuth, noteController.show);
router.get('/notes/:id/edit', requireAuth, noteController.editForm);
router.put('/notes/:id', requireAuth, upload.array('images', MAX_FILES), noteController.update);
router.post('/notes/:id', requireAuth, upload.array('images', MAX_FILES), noteController.update);
router.delete('/notes/:id', requireAuth, noteController.destroy);
router.post('/notes/:id/delete', requireAuth, noteController.destroy);

module.exports = router;
