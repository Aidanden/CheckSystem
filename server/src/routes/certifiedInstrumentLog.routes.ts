import { Router } from 'express';
import { body, query } from 'express-validator';
import { CertifiedInstrumentLogController } from '../controllers/certifiedInstrumentLog.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate([
    body('operationType').isIn(['query', 'print', 'reprint']),
    body('txnRefNo').isString().notEmpty(),
    body('instrumentNo').optional({ nullable: true }).isString(),
    body('accountNumber').optional({ nullable: true }).isString(),
    body('amount').optional({ nullable: true }).isNumeric(),
    body('branchId').optional({ nullable: true }).isInt(),
  ]),
  CertifiedInstrumentLogController.create
);

router.get(
  '/statistics',
  requirePermission('SCREEN_CERTIFIED_INSTRUMENT_LOGS'),
  CertifiedInstrumentLogController.getStatistics
);

router.get(
  '/',
  validate([
    query('page').optional().isInt(),
    query('limit').optional().isInt(),
    query('operationType').optional().isIn(['query', 'print', 'reprint']),
    query('accountNumber').optional().isString(),
    query('txnRefNo').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('userId').optional().isInt(),
    query('branchId').optional().isInt(),
  ]),
  requirePermission('SCREEN_CERTIFIED_INSTRUMENT_LOGS'),
  CertifiedInstrumentLogController.getAll
);

export default router;
