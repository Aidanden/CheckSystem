import { Router } from 'express';
import { body } from 'express-validator';
import { AccountController } from '../controllers/account.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { PermissionCode } from '../types';

const router = Router();

// All account routes require authentication
router.use(authenticate);

// Get all accounts (requires REPORTING permission)
router.get(
  '/',
  requirePermission(PermissionCode.REPORTING),
  AccountController.getAll
);

// Get account by id
router.get(
  '/:id',
  requirePermission(PermissionCode.REPORTING),
  AccountController.getById
);

// Query account (requires PRINTING permission)
router.post(
  '/query',
  requirePermission(PermissionCode.PRINTING),
  validate([
    body('account_number').notEmpty().withMessage('Account number is required'),
  ]),
  AccountController.queryAccount
);

export default router;

