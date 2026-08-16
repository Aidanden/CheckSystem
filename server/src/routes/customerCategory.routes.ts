import { Router } from 'express';
import { body } from 'express-validator';
import { CustomerCategoryController } from '../controllers/customerCategory.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticate);

router.get('/resolve', CustomerCategoryController.resolve);
router.get('/', CustomerCategoryController.getAll);

router.post(
  '/',
  requirePermission(['SCREEN_CATEGORY_SETTINGS', 'SYSTEM_SETTINGS']),
  validate([
    body('categoryCode').notEmpty(),
    body('description').notEmpty(),
    body('typeCode').notEmpty(),
  ]),
  CustomerCategoryController.create
);

router.put('/:id', requirePermission(['SCREEN_CATEGORY_SETTINGS', 'SYSTEM_SETTINGS']), CustomerCategoryController.update);
router.delete('/:id', requirePermission(['SCREEN_CATEGORY_SETTINGS', 'SYSTEM_SETTINGS']), CustomerCategoryController.delete);

export default router;
