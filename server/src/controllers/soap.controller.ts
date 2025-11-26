import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { bankAPI } from '../utils/bankAPI';

export class SoapController {
  static async queryCheckbook(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { accountNumber, branchCode, firstChequeNumber } = req.body;

      if (!accountNumber || typeof accountNumber !== 'string') {
        res.status(400).json({ error: 'رقم الحساب مطلوب' });
        return;
      }

      const trimmedAccountNumber = accountNumber.trim();
      
      // استخراج رقم الفرع من أول 3 أرقام من رقم الحساب
      const extractedBranchCode = trimmedAccountNumber.substring(0, 3);
      
      // استخدام رقم الفرع المستخرج أو المرسل أو القيمة الافتراضية
      const finalBranchCode = branchCode?.trim() || extractedBranchCode || '001';

      console.log('📋 SOAP Query Request:', {
        accountNumber: trimmedAccountNumber,
        extractedBranchCode,
        finalBranchCode,
        firstChequeNumber: firstChequeNumber || 'not specified'
      });

      const result = await bankAPI.queryCheckbook({
        accountNumber: trimmedAccountNumber,
        branchCode: finalBranchCode,
        firstChequeNumber: firstChequeNumber ? parseInt(firstChequeNumber, 10) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      console.error('SOAP query error:', error);
      res.status(500).json({ 
        error: 'فشل الاستعلام عن دفتر الشيكات',
        details: error.message 
      });
    }
  }
}
