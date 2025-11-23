import { Router } from 'express';
import { body } from 'express-validator';
import { PrintingController } from '../controllers/printing.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { PermissionCode } from '../types';

const router = Router();

// All printing routes require authentication
router.use(authenticate);

// Print checkbook (requires PRINTING permission)
router.post(
  '/print',
  requirePermission(PermissionCode.PRINTING),
  validate([
    body('account_number').notEmpty().withMessage('Account number is required'),
    body('serial_from').optional().isInt({ min: 1 }).withMessage('Serial from must be a positive integer'),
    body('serial_to').optional().isInt({ min: 1 }).withMessage('Serial to must be a positive integer'),
  ]),
  PrintingController.printCheckbook
);

// Get print history (requires REPORTING permission)
router.get(
  '/history',
  requirePermission(PermissionCode.REPORTING),
  PrintingController.getPrintHistory
);

// Get statistics (requires REPORTING permission)
router.get(
  '/statistics',
  requirePermission(PermissionCode.REPORTING),
  PrintingController.getStatistics
);

// Download PDF (requires PRINTING permission)
router.get(
  '/download/:filename',
  requirePermission(PermissionCode.PRINTING),
  PrintingController.downloadPDF
);

export default router;

