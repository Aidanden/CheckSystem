import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { bankAPI } from '../utils/bankAPI';
import { BranchModel } from '../models/Branch.model';
import { CertifiedInstrumentLogService } from '../services/certifiedInstrumentLog.service';
import { CustomerCategoryService } from '../services/customerCategory.service';
import {
  assertAccountBelongsToUserBranch,
  assertSameBranchCode,
  sendBranchError,
} from '../utils/branchAccess';

export class SoapController {
  static async queryCheckbook(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { accountNumber, branchCode, firstChequeNumber } = req.body;

      if (!accountNumber || typeof accountNumber !== 'string') {
        res.status(400).json({ error: 'رقم الحساب مطلوب' });
        return;
      }

      const trimmedAccountNumber = accountNumber.trim();

      // استخراج رقم الفرع من أول 3 أرقام من رقم الحساب (كما طلب المستخدم)
      const extractedBranchCode = trimmedAccountNumber.substring(0, 3);

      try {
        await assertAccountBelongsToUserBranch(req.user, trimmedAccountNumber);
      } catch (err) {
        if (sendBranchError(res, err)) return;
        throw err;
      }

      // الأولوية للرقم المستخرج من الحساب لضمان الدقة
      const finalBranchCode = extractedBranchCode || branchCode?.trim() || '001';

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

      // جلب اسم صاحب الحساب من API الثاني
      let customerName: string | undefined;
      try {
        console.log('👤 جلب اسم صاحب الحساب من FCUBSIAService...');
        const accountInfo = await bankAPI.queryAccountInfo(trimmedAccountNumber);
        customerName = accountInfo.customerName;
        console.log('✅ تم جلب اسم صاحب الحساب بنجاح:', customerName);
      } catch (accountInfoError: any) {
        console.error('❌ خطأ في جلب اسم صاحب الحساب:', accountInfoError.message);
        console.warn('⚠️ سيتم المتابعة بدون اسم صاحب الحساب');
        // لا نوقف العملية، فقط نسجل الخطأ
      }

      // جلب معلومات الفرع من قاعدة البيانات
      try {
        console.log('🔍 البحث عن الفرع برقم:', finalBranchCode);
        const branch = await BranchModel.findByBranchCode(finalBranchCode);

        if (branch) {
          // إضافة معلومات الفرع واسم صاحب الحساب إلى النتيجة
          (result as any).branchName = branch.branchName;
          (result as any).routingNumber = branch.routingNumber;
          if (customerName) {
            (result as any).customerName = customerName;
          }
          console.log('✅ تم جلب معلومات الفرع بنجاح:', {
            searchCode: finalBranchCode,
            foundBranchNumber: branch.branchNumber,
            branchName: branch.branchName,
            routingNumber: branch.routingNumber,
            customerName: customerName || 'غير متوفر'
          });
        } else {
          // حتى لو لم نجد الفرع، نضيف اسم صاحب الحساب
          if (customerName) {
            (result as any).customerName = customerName;
          }
          console.warn('⚠️ لم يتم العثور على الفرع في قاعدة البيانات!');
          console.warn('   - رقم الفرع المطلوب:', finalBranchCode);
          console.warn('   - تأكد من وجود فرع برقم (branchNumber) يطابق هذا الرقم');
        }
      } catch (branchError) {
        console.error('❌ خطأ في جلب معلومات الفرع:', branchError);
        // حتى لو فشل جلب الفرع، نضيف اسم صاحب الحساب إن وجد
        if (customerName) {
          (result as any).customerName = customerName;
        }
      }

      const category = await CustomerCategoryService.resolveFromAccount(trimmedAccountNumber);
      (result as any).customerCategoryCode = category.categoryCode;
      (result as any).customerCategoryFound = category.found;
      if (category.found) {
        (result as any).customerCategoryDescription = category.description;
        (result as any).micrTypeCode = category.typeCode;
        (result as any).accountType = category.accountType;
        const leavesMismatch = CustomerCategoryService.leavesMismatchMessage(
          category.typeCode,
          (result as any).chequeLeaves
        );
        if (leavesMismatch) {
          (result as any).categoryLeavesMismatch = true;
          (result as any).categoryLeavesMismatchError = leavesMismatch;
        } else {
          const leavesWarning = CustomerCategoryService.leavesWarningMessage(
            category.typeCode,
            (result as any).chequeLeaves
          );
          if (leavesWarning) {
            (result as any).categoryLeavesWarning = true;
            (result as any).categoryLeavesWarningMessage = leavesWarning;
            (result as any).sheetsToPrint = Number((result as any).chequeLeaves);
          }
        }
      } else {
        (result as any).customerCategoryError = category.error;
      }

      console.log('📤 إرسال النتيجة:', {
        accountNumber: result.accountNumber,
        accountBranch: result.accountBranch,
        branchName: (result as any).branchName || 'غير محدد',
        routingNumber: (result as any).routingNumber || 'غير محدد',
        customerName: (result as any).customerName || 'غير محدد'
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

  static async queryInstrumentList(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { txnRefNo, branchCode } = req.body;

      if (!txnRefNo || typeof txnRefNo !== 'string' || !txnRefNo.trim()) {
        res.status(400).json({ error: 'الرقم المرجعي للعملية مطلوب' });
        return;
      }

      const trimmedRef = txnRefNo.trim();
      const result = await bankAPI.queryInstrumentList({
        txnRefNo: trimmedRef,
        branchCode: typeof branchCode === 'string' && branchCode.trim() ? branchCode.trim() : undefined,
      });

      const branchLookupCode = String(result.txnBranch || '').trim();
      if (!branchLookupCode) {
        res.status(400).json({
          error: 'رقم الفرع غير موجود في استجابة المصرف',
          details: 'حقل TXN_BRANCH فارغ، لا يمكن جلب الرقم التوجيهي والمحاسبي',
        });
        return;
      }

      try {
        const branch = await BranchModel.findByBranchCode(branchLookupCode);
        if (!branch) {
          res.status(400).json({
            error: `لم يتم العثور على الفرع رقم ${branchLookupCode} في النظام`,
            details: 'أضف الفرع في شاشة إدارة الفروع مع الرقم التوجيهي والرقم المحاسبي',
          });
          return;
        }

        if (!branch.routingNumber || !String(branch.accountingNumber || '').trim()) {
          res.status(400).json({
            error: `بيانات الفرع ${branch.branchName} غير مكتملة`,
            details: 'يجب تعبئة الرقم التوجيهي والرقم المحاسبي للفرع قبل طباعة الترميز',
          });
          return;
        }

        (result as any).branchName = branch.branchName;
        (result as any).routingNumber = branch.routingNumber;
        (result as any).accountingNumber = branch.accountingNumber;
        (result as any).branchId = branch.id;
        (result as any).branchNumber = branch.branchNumber || branchLookupCode;
      } catch (branchError) {
        console.error('تعذر جلب بيانات الفرع للصك المصدق:', branchError);
        res.status(500).json({
          error: 'فشل جلب بيانات الفرع من النظام',
          details: branchError instanceof Error ? branchError.message : 'خطأ غير معروف',
        });
        return;
      }

      try {
        await assertSameBranchCode(req.user, result.txnBranch || (result as any).branchNumber);
      } catch (err) {
        if (sendBranchError(res, err)) return;
        throw err;
      }

      if (req.user) {
        try {
          await CertifiedInstrumentLogService.create({
            operationType: 'query',
            txnRefNo: trimmedRef,
            instrumentNo: result.instrumentNo,
            accountNumber: result.accountNumber,
            accountHolderName: result.accountHolderName,
            beneficiaryName: result.beneficiaryName,
            amount: result.amount,
            currency: result.currency,
            issueDate: result.issueDate || result.bookDate,
            txnBranch: result.txnBranch,
            branchId: (result as any).branchId ?? null,
            branchName: (result as any).branchName ?? null,
            routingNumber: (result as any).routingNumber ?? null,
            accountingNumber: (result as any).accountingNumber ?? null,
            performedBy: req.user.userId,
            performedByName: req.user.username,
          });
        } catch (logError) {
          console.error('فشل تسجيل استعلام الصك المصدق:', logError);
        }
      }

      const alreadyPrinted = await CertifiedInstrumentLogService.isPrinted(trimmedRef);
      res.json({ ...result, alreadyPrinted });
    } catch (error: any) {
      console.error('InstrumentList SOAP query error:', error);
      const message = String(error?.message || '');
      const notFound = message.includes('لم يتم العثور') || message.includes('غير موجود');
      res.status(notFound ? 404 : 500).json({
        error: notFound ? 'لم يتم العثور على صك مصدق بهذا الرقم المرجعي' : 'فشل الاستعلام عن الصك المصدق',
        details: error.message,
      });
    }
  }
}
