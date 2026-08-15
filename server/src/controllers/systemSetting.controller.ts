import { AuthRequest } from '../middleware/auth.middleware';
import { Response } from 'express';
import { SystemSettingService } from '../services/systemSetting.service';

export class SystemSettingController {
  static async getSoapEndpoint(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const endpoint = await SystemSettingService.getSoapEndpoint();
      res.json({ endpoint });
    } catch (error) {
      console.error('Error fetching SOAP endpoint:', error);
      res.status(500).json({ error: 'فشل في تحميل رابط SOAP الحالي' });
    }
  }

  static async updateSoapEndpoint(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'صلاحيات المشرف مطلوبة لتعديل رابط SOAP' });
      return;
    }

    try {
      const { endpoint } = req.body as { endpoint?: string };
      if (!endpoint || typeof endpoint !== 'string' || !endpoint.trim()) {
        res.status(400).json({ error: 'رابط SOAP مطلوب' });
        return;
      }

      const saved = await SystemSettingService.updateSoapEndpoint(endpoint);
      res.json({ success: true, endpoint: saved.value });
    } catch (error) {
      console.error('Error updating SOAP endpoint:', error);
      res.status(500).json({ error: 'فشل في تحديث رابط SOAP' });
    }
  }

  static async getSoapIAEndpoint(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const endpoint = await SystemSettingService.getSoapIAEndpoint();
      res.json({ endpoint });
    } catch (error) {
      console.error('Error fetching SOAP IA endpoint:', error);
      res.status(500).json({ error: 'فشل في تحميل رابط SOAP IA الحالي' });
    }
  }

  static async updateSoapIAEndpoint(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'صلاحيات المشرف مطلوبة لتعديل رابط SOAP IA' });
      return;
    }

    try {
      const { endpoint } = req.body as { endpoint?: string };
      if (!endpoint || typeof endpoint !== 'string' || !endpoint.trim()) {
        res.status(400).json({ error: 'رابط SOAP IA مطلوب' });
        return;
      }

      const saved = await SystemSettingService.updateSoapIAEndpoint(endpoint);
      res.json({ success: true, endpoint: saved.value });
    } catch (error) {
      console.error('Error updating SOAP IA endpoint:', error);
      res.status(500).json({ error: 'فشل في تحديث رابط SOAP IA' });
    }
  }

  static async getSoapInstrumentEndpoint(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const endpoint = await SystemSettingService.getSoapInstrumentEndpoint();
      res.json({ endpoint });
    } catch (error) {
      console.error('Error fetching SOAP Instrument endpoint:', error);
      res.status(500).json({ error: 'فشل في تحميل رابط خدمة الصكوك المصدقة' });
    }
  }

  static async updateSoapInstrumentEndpoint(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'صلاحيات المشرف مطلوبة لتعديل رابط الخدمة' });
      return;
    }

    try {
      const { endpoint } = req.body as { endpoint?: string };
      if (!endpoint || typeof endpoint !== 'string' || !endpoint.trim()) {
        res.status(400).json({ error: 'رابط خدمة الصكوك المصدقة مطلوب' });
        return;
      }

      const saved = await SystemSettingService.updateSoapInstrumentEndpoint(endpoint);
      res.json({ success: true, endpoint: saved.value });
    } catch (error) {
      console.error('Error updating SOAP Instrument endpoint:', error);
      res.status(500).json({ error: 'فشل في تحديث رابط خدمة الصكوك المصدقة' });
    }
  }

  static async getHiddenScreens(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const hiddenScreens = await SystemSettingService.getHiddenScreens();
      res.json({ hiddenScreens });
    } catch (error) {
      console.error('Error fetching hidden screens:', error);
      res.status(500).json({ error: 'فشل في تحميل إعدادات الشاشات' });
    }
  }

  static async updateHiddenScreens(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { password, hiddenScreens } = req.body as {
        password?: string;
        hiddenScreens?: string[];
      };

      if (!SystemSettingService.verifyScreenVisibilityPassword(password || '')) {
        res.status(403).json({ error: 'كلمة المرور غير صحيحة' });
        return;
      }

      if (!Array.isArray(hiddenScreens)) {
        res.status(400).json({ error: 'قائمة الشاشات غير صالحة' });
        return;
      }

      await SystemSettingService.updateHiddenScreens(hiddenScreens);
      const saved = await SystemSettingService.getHiddenScreens();
      res.json({ success: true, hiddenScreens: saved });
    } catch (error) {
      console.error('Error updating hidden screens:', error);
      res.status(500).json({ error: 'فشل في حفظ إعدادات الشاشات' });
    }
  }

  static async unlockHiddenScreens(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { password } = req.body as { password?: string };
      if (!SystemSettingService.verifyScreenVisibilityPassword(password || '')) {
        res.status(403).json({ error: 'كلمة المرور غير صحيحة' });
        return;
      }

      const hiddenScreens = await SystemSettingService.getHiddenScreens();
      res.json({ success: true, hiddenScreens });
    } catch (error) {
      console.error('Error unlocking hidden screens:', error);
      res.status(500).json({ error: 'فشل فتح الإعدادات المتقدمة' });
    }
  }
}
