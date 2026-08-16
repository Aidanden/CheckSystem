import { Router } from 'express';
import { body } from 'express-validator';
import { SystemSettingController } from '../controllers/systemSetting.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

router.get('/hidden-screens', authenticate, SystemSettingController.getHiddenScreens);

router.post(
  '/hidden-screens/unlock',
  validate([body('password').isString().withMessage('كلمة المرور مطلوبة')]),
  SystemSettingController.unlockHiddenScreens
);

router.post(
  '/hidden-screens',
  validate([
    body('password').isString().withMessage('كلمة المرور مطلوبة'),
    body('hiddenScreens').isArray().withMessage('قائمة الشاشات مطلوبة'),
  ]),
  SystemSettingController.updateHiddenScreens
);

router.use(authenticate);

router.get('/soap-endpoint', SystemSettingController.getSoapEndpoint);

router.post(
  '/soap-endpoint',
  requireAdmin,
  validate([
    body('endpoint')
      .isString()
      .withMessage('رابط SOAP يجب أن يكون نصاً')
      .trim()
      .isLength({ min: 5 })
      .withMessage('رابط SOAP غير صالح'),
  ]),
  SystemSettingController.updateSoapEndpoint
);

// SOAP IA Service endpoint routes
router.get('/soap-ia-endpoint', SystemSettingController.getSoapIAEndpoint);

router.post(
  '/soap-ia-endpoint',
  requireAdmin,
  validate([
    body('endpoint')
      .isString()
      .withMessage('رابط SOAP IA يجب أن يكون نصاً')
      .trim()
      .isLength({ min: 5 })
      .withMessage('رابط SOAP IA غير صالح'),
  ]),
  SystemSettingController.updateSoapIAEndpoint
);

router.get('/soap-instrument-endpoint', SystemSettingController.getSoapInstrumentEndpoint);

router.post(
  '/soap-instrument-endpoint',
  requireAdmin,
  validate([
    body('endpoint')
      .isString()
      .withMessage('رابط خدمة الصكوك المصدقة يجب أن يكون نصاً')
      .trim()
      .isLength({ min: 5 })
      .withMessage('رابط خدمة الصكوك المصدقة غير صالح'),
  ]),
  SystemSettingController.updateSoapInstrumentEndpoint
);

export default router;
