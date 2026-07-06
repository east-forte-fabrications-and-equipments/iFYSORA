import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRegistration, validateLogin } from '../middleware/validation.js';

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/register', validateRegistration, authController.register.bind(authController));
router.post('/login', validateLogin, authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));

// Protected routes
router.post('/logout', authenticate, authController.logout.bind(authController));
router.get('/me', authenticate, authController.getProfile.bind(authController));
router.put('/profile', authenticate, authController.updateProfile.bind(authController));

export default router;
