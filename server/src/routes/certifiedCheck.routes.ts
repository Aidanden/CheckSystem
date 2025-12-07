import { Router } from 'express';
import {
    getBranches,
    getNextSerialRange,
    printBook,
    reprintBook,
    getLogs,
    getStatistics,
    getSettings,
    updateSettings,
} from '../controllers/certifiedCheck.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get branches for certified check printing
router.get('/branches', requirePermission('SCREEN_CERTIFIED_CHECKS'), getBranches);

// Get next serial range for a branch
router.get('/serial/:branchId', requirePermission('SCREEN_CERTIFIED_CHECKS'), getNextSerialRange);

// Print a new certified check book
router.post('/print', requirePermission('SCREEN_CERTIFIED_CHECKS'), printBook);

// Reprint a certified check book
router.post('/reprint/:logId', requirePermission('REPRINT_CERTIFIED'), reprintBook);

// Get print logs
router.get('/logs', requirePermission('SCREEN_CERTIFIED_LOGS'), getLogs);

// Get statistics
router.get('/statistics', requirePermission('SCREEN_CERTIFIED_CHECKS'), getStatistics);

// Get print settings
router.get('/settings', requirePermission('SYSTEM_SETTINGS'), getSettings);

// Update print settings
router.put('/settings', requirePermission('SYSTEM_SETTINGS'), updateSettings);

export default router;
