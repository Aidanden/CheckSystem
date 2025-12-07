import { Request, Response } from 'express';
import { CertifiedCheckModel } from '../models/CertifiedCheck.model';
import { BranchModel } from '../models/Branch.model';
import { PrintSettingsModel } from '../models/PrintSettings.model';

// Get branches available for certified check printing
export const getBranches = async (req: Request, res: Response) => {
    try {
        const branches = await BranchModel.findAll();

        // Get serial info for each branch
        const branchesWithSerials = await Promise.all(
            branches.map(async (branch) => {
                const lastSerial = await CertifiedCheckModel.getLastSerial(branch.id);
                return {
                    ...branch,
                    lastSerial,
                };
            })
        );

        res.json(branchesWithSerials);
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ error: 'فشل في جلب الفروع' });
    }
};

// Get next serial range for a branch
export const getNextSerialRange = async (req: Request, res: Response) => {
    try {
        const branchId = parseInt(req.params.branchId);
        if (isNaN(branchId)) {
            return res.status(400).json({ error: 'رقم الفرع غير صالح' });
        }

        const branch = await BranchModel.findById(branchId);
        if (!branch) {
            return res.status(404).json({ error: 'الفرع غير موجود' });
        }

        const range = await CertifiedCheckModel.getNextSerialRange(branchId, 50);

        return res.json({
            branchId,
            branchName: branch.branchName,
            accountingNumber: branch.accountingNumber,
            routingNumber: branch.routingNumber,
            ...range,
            checksCount: 50,
        });
    } catch (error) {
        console.error('Error getting next serial range:', error);
        return res.status(500).json({ error: 'فشل في جلب نطاق الأرقام التسلسلية' });
    }
};

// Print a new certified check book
export const printBook = async (req: Request, res: Response) => {
    try {
        const { branchId, notes } = req.body;
        const user = (req as any).user;

        if (!branchId) {
            return res.status(400).json({ error: 'يرجى تحديد الفرع' });
        }

        const branch = await BranchModel.findById(branchId);
        if (!branch) {
            return res.status(404).json({ error: 'الفرع غير موجود' });
        }

        if (!branch.accountingNumber) {
            return res.status(400).json({ error: 'الفرع ليس لديه رقم محاسبي. يرجى تحديثه أولاً.' });
        }

        const range = await CertifiedCheckModel.getNextSerialRange(branchId, 50);

        const log = await CertifiedCheckModel.printBook({
            branchId,
            branchName: branch.branchName,
            accountingNumber: branch.accountingNumber,
            routingNumber: branch.routingNumber,
            firstSerial: range.firstSerial,
            lastSerial: range.lastSerial,
            totalChecks: 50,
            operationType: 'print',
            printedBy: user.id,
            printedByName: user.username,
            notes,
        });

        return res.json({
            success: true,
            log,
            printData: {
                branchId,
                branchName: branch.branchName,
                accountingNumber: branch.accountingNumber,
                routingNumber: branch.routingNumber,
                firstSerial: range.firstSerial,
                lastSerial: range.lastSerial,
                checksCount: 50,
            },
        });
    } catch (error) {
        console.error('Error printing certified check book:', error);
        return res.status(500).json({ error: 'فشل في طباعة دفتر الصكوك المصدقة' });
    }
};

// Reprint a certified check book from logs
export const reprintBook = async (req: Request, res: Response) => {
    try {
        const logId = parseInt(req.params.logId);
        const user = (req as any).user;

        if (isNaN(logId)) {
            return res.status(400).json({ error: 'رقم السجل غير صالح' });
        }

        const originalLog = await CertifiedCheckModel.findLogById(logId);
        if (!originalLog) {
            return res.status(404).json({ error: 'السجل غير موجود' });
        }

        // Create a new log for the reprint
        const log = await CertifiedCheckModel.printBook({
            branchId: originalLog.branchId,
            branchName: originalLog.branchName,
            accountingNumber: originalLog.accountingNumber,
            routingNumber: originalLog.routingNumber,
            firstSerial: originalLog.firstSerial,
            lastSerial: originalLog.lastSerial,
            totalChecks: originalLog.totalChecks,
            operationType: 'reprint',
            printedBy: user.id,
            printedByName: user.username,
            notes: `إعادة طباعة للسجل رقم ${logId}`,
        });

        return res.json({
            success: true,
            log,
            printData: {
                branchId: originalLog.branchId,
                branchName: originalLog.branchName,
                accountingNumber: originalLog.accountingNumber,
                routingNumber: originalLog.routingNumber,
                firstSerial: originalLog.firstSerial,
                lastSerial: originalLog.lastSerial,
                checksCount: originalLog.totalChecks,
            },
        });
    } catch (error) {
        console.error('Error reprinting certified check book:', error);
        return res.status(500).json({ error: 'فشل في إعادة طباعة دفتر الصكوك المصدقة' });
    }
};

// Get print logs
export const getLogs = async (req: Request, res: Response) => {
    try {
        const skip = parseInt(req.query.skip as string) || 0;
        const take = parseInt(req.query.take as string) || 20;
        const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;

        const { logs, total } = await CertifiedCheckModel.findAllLogs({
            skip,
            take,
            branchId,
        });

        res.json({ logs, total, skip, take });
    } catch (error) {
        console.error('Error fetching certified check logs:', error);
        res.status(500).json({ error: 'فشل في جلب سجلات الطباعة' });
    }
};

// Get statistics
export const getStatistics = async (req: Request, res: Response) => {
    try {
        const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
        const stats = await CertifiedCheckModel.getStatistics(branchId);
        const branchSerials = await CertifiedCheckModel.getAllBranchSerials();

        res.json({
            ...stats,
            branchSerials,
        });
    } catch (error) {
        console.error('Error fetching certified check statistics:', error);
        res.status(500).json({ error: 'فشل في جلب الإحصائيات' });
    }
};

// Get print settings for certified checks (accountType = 3)
export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await PrintSettingsModel.getOrDefault(3);
        res.json(settings);
    } catch (error) {
        console.error('Error fetching certified check settings:', error);
        res.status(500).json({ error: 'فشل في جلب إعدادات الطباعة' });
    }
};

// Update print settings for certified checks
export const updateSettings = async (req: Request, res: Response) => {
    try {
        const data = req.body;

        const settings = await PrintSettingsModel.upsert({
            accountType: 3,
            checkWidth: data.checkWidth,
            checkHeight: data.checkHeight,
            branchNameX: data.branchName.x,
            branchNameY: data.branchName.y,
            branchNameFontSize: data.branchName.fontSize,
            branchNameAlign: data.branchName.align,
            serialNumberX: data.serialNumber.x,
            serialNumberY: data.serialNumber.y,
            serialNumberFontSize: data.serialNumber.fontSize,
            serialNumberAlign: data.serialNumber.align,
            accountNumberX: data.accountNumber?.x ?? 117.5,
            accountNumberY: data.accountNumber?.y ?? 10,
            accountNumberFontSize: data.accountNumber?.fontSize ?? 14,
            accountNumberAlign: data.accountNumber?.align ?? 'center',
            checkSequenceX: data.checkSequence?.x ?? 20,
            checkSequenceY: data.checkSequence?.y ?? 18,
            checkSequenceFontSize: data.checkSequence?.fontSize ?? 12,
            checkSequenceAlign: data.checkSequence?.align ?? 'left',
            accountHolderNameX: data.accountHolderName.x,
            accountHolderNameY: data.accountHolderName.y,
            accountHolderNameFontSize: data.accountHolderName.fontSize,
            accountHolderNameAlign: data.accountHolderName.align,
            micrLineX: data.micrLine.x,
            micrLineY: data.micrLine.y,
            micrLineFontSize: data.micrLine.fontSize,
            micrLineAlign: data.micrLine.align,
        });

        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error updating certified check settings:', error);
        res.status(500).json({ error: 'فشل في حفظ إعدادات الطباعة' });
    }
};
