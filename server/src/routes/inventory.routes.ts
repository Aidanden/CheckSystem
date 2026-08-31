import { Router } from 'express';
import { body } from 'express-validator';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { PermissionCode } from '../types';

const router = Router();

router.use(authenticate);

const inventoryPerm = requirePermission([
  PermissionCode.INVENTORY_MANAGEMENT,
  PermissionCode.CERTIFIED_INVENTORY_MANAGEMENT,
]);

router.get('/', inventoryPerm, InventoryController.getAll);

router.get(
  '/transactions/history',
  requirePermission([
    PermissionCode.REPORTING,
    PermissionCode.INVENTORY_MANAGEMENT,
    PermissionCode.CERTIFIED_INVENTORY_MANAGEMENT,
  ]),
  InventoryController.getTransactionHistory
);

router.delete('/transactions/:id', inventoryPerm, InventoryController.reverseTransaction);

router.put(
  '/transactions/:id',
  inventoryPerm,
  validate([
    body('quantity').isInt({ min: 1 }).withMessage('الكمية يجب أن تكون أكبر من صفر'),
    body('notes').optional().isString().withMessage('الملاحظات يجب أن تكون نصاً'),
  ]),
  InventoryController.updateTransaction
);

router.post(
  '/add',
  inventoryPerm,
  validate([
    body('stock_type').isInt({ min: 1, max: 3 }).withMessage('نوع المخزون يجب أن يكون 1 أو 2 أو 3'),
    body('quantity').isInt({ min: 1 }).withMessage('الكمية يجب أن تكون أكبر من صفر'),
    body('branch_id')
      .optional({ nullable: true })
      .isInt({ min: 1 })
      .withMessage('معرف الفرع غير صالح'),
    body('serial_from').optional().isString(),
    body('serial_to').optional().isString(),
    body('notes').optional().isString(),
  ]),
  InventoryController.addStock
);

router.get('/:stockType', inventoryPerm, InventoryController.getByStockType);

export default router;
