import express from 'express';
import { PortraitController } from '../controllers/portraitController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const controller = new PortraitController();

// All routes require authentication
router.use(authenticate);

// Portrait CRUD
router.post('/', controller.uploadPortrait.bind(controller));
router.get('/', controller.getPortraits.bind(controller));
router.get('/:id', controller.getPortrait.bind(controller));
router.delete('/:id', controller.deletePortrait.bind(controller));

// Set active portrait
router.put('/:id/active', controller.setActivePortrait.bind(controller));

export default router;
