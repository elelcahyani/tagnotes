const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, redirectIfAuth } = require('../middleware/auth');

router.get('/login', redirectIfAuth, authController.showLogin);
router.post('/login', redirectIfAuth, authController.login);
router.get('/register', redirectIfAuth, authController.showRegister);
router.post('/register', redirectIfAuth, authController.register);
router.post('/logout', requireAuth, authController.logout);
router.get('/profile/data', requireAuth, authController.getProfileData);
router.post('/profile/update', requireAuth, authController.updateProfile);
router.post('/profile/password', requireAuth, authController.updatePassword);

module.exports = router;
