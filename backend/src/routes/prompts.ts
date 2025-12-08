import { Router } from 'express';
import { PromptController } from '../controllers/PromptController';

const router = Router();
const promptController = new PromptController();

router.get('/', promptController.getPrompts);
router.get('/:category', promptController.getPromptByCategory);

export default router;
