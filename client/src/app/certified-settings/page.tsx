'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { certifiedCheckService, systemSettingsService } from '@/lib/api';
import { Save, RotateCcw, Eye, Settings as SettingsIcon, RefreshCw } from 'lucide-react';

interface PrintPosition {
    x: number;
    y: number;
    fontSize: number;
    align: 'left' | 'center' | 'right';
}

interface CertifiedPrintSettings {
    id?: number;
    checkWidth: number;
    checkHeight: number;
    beneficiaryName: PrintPosition;
    accountNumber: PrintPosition;
    amountNumbers: PrintPosition;
    amountWords: PrintPosition;
    issueDate: PrintPosition;
    checkType: PrintPosition;
    checkNumber: PrintPosition;
    accountHolderName: PrintPosition;
    branchName: PrintPosition;
    micrLine: PrintPosition;
}

const DEFAULT_SETTINGS: CertifiedPrintSettings = {
    checkWidth: 235,
    checkHeight: 86,
    checkNumber: { x: 185, y: 18, fontSize: 8, align: 'left' },
    branchName: { x: 110, y: 4, fontSize: 8, align: 'center' },
    issueDate: { x: 185, y: 12, fontSize: 8, align: 'left' },
    accountNumber: { x: 30, y: 12, fontSize: 8, align: 'right' },
    accountHolderName: { x: 30, y: 18, fontSize: 8, align: 'right' },
    beneficiaryName: { x: 155, y: 41, fontSize: 8, align: 'right' },
    amountNumbers: { x: 200, y: 42, fontSize: 8, align: 'right' },
    amountWords: { x: 117.5, y: 48, fontSize: 8, align: 'center' },
    checkType: { x: 120, y: 10, fontSize: 8, align: 'center' },
    micrLine: { x: 117.5, y: 70, fontSize: 14, align: 'center' },
};

export default function CertifiedSettingsPage() {
    const [settings, setSettings] = useState<CertifiedPrintSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);
    const [instrumentEndpoint, setInstrumentEndpoint] = useState('');
    const [instrumentEndpointLoading, setInstrumentEndpointLoading] = useState(true);
    const [instrumentEndpointSaving, setInstrumentEndpointSaving] = useState(false);
    const [instrumentEndpointMessage, setInstrumentEndpointMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadSettings();
        loadInstrumentEndpoint();
    }, []);

    const loadInstrumentEndpoint = async () => {
        try {
            setInstrumentEndpointLoading(true);
            const { endpoint } = await systemSettingsService.getSoapInstrumentEndpoint();
            setInstrumentEndpoint(endpoint);
        } catch {
            setInstrumentEndpointMessage({ type: 'error', text: 'تعذر تحميل رابط خدمة الصكوك المصدقة' });
        } finally {
            setInstrumentEndpointLoading(false);
        }
    };

    const saveInstrumentEndpoint = async () => {
        const value = instrumentEndpoint.trim();
        if (!value) {
            setInstrumentEndpointMessage({ type: 'error', text: 'الرجاء إدخال رابط صالح' });
            return;
        }
        setInstrumentEndpointSaving(true);
        setInstrumentEndpointMessage(null);
        try {
            const { endpoint } = await systemSettingsService.updateSoapInstrumentEndpoint(value);
            setInstrumentEndpoint(endpoint);
            setInstrumentEndpointMessage({ type: 'success', text: 'تم حفظ رابط الخدمة بنجاح' });
        } catch (err: any) {
            setInstrumentEndpointMessage({
                type: 'error',
                text: err?.response?.data?.error || 'فشل حفظ رابط الخدمة',
            });
        } finally {
            setInstrumentEndpointSaving(false);
        }
    };

    const loadSettings = async () => {
        try {
            setInitialLoading(true);
            const data = await certifiedCheckService.getSettings();

            if (data) {
                setSettings({
                    ...DEFAULT_SETTINGS,
                    id: data.id,
                    checkWidth: data.checkWidth ?? DEFAULT_SETTINGS.checkWidth,
                    checkHeight: data.checkHeight ?? DEFAULT_SETTINGS.checkHeight,
                    micrLine: {
                        x: (data as any).micrLine?.x ?? data.micrLineX ?? DEFAULT_SETTINGS.micrLine.x,
                        y: (data as any).micrLine?.y ?? data.micrLineY ?? DEFAULT_SETTINGS.micrLine.y,
                        fontSize: 14,
                        align: ((data as any).micrLine?.align ?? data.micrLineAlign ?? DEFAULT_SETTINGS.micrLine.align) as any,
                    },
                });
            } else {
                setSettings(DEFAULT_SETTINGS);
            }
        } catch (err) {
            console.error('Error loading settings:', err);
            setError('فشل في تحميل الإعدادات');
        } finally {
            setInitialLoading(false);
        }
    };

    const updatePosition = (
        field: keyof Omit<CertifiedPrintSettings, 'id' | 'checkWidth' | 'checkHeight'>,
        key: keyof PrintPosition,
        value: number | string
    ) => {
        // منع القيم غير الصالحة (NaN)
        const finalValue = (typeof value === 'number' && isNaN(value)) ? 0 : value;

        setSettings(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [key]: finalValue
            }
        }));
    };

    const updateCheckSize = (key: 'checkWidth' | 'checkHeight', value: number) => {
        // منع القيم غير الصالحة (NaN)
        const finalValue = isNaN(value) ? 0 : value;

        setSettings(prev => ({
            ...prev,
            [key]: finalValue
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                accountType: 4, // Certified checks
                checkWidth: settings.checkWidth,
                checkHeight: settings.checkHeight,
                beneficiaryNameX: settings.beneficiaryName.x,
                beneficiaryNameY: settings.beneficiaryName.y,
                beneficiaryNameFontSize: settings.beneficiaryName.fontSize,
                beneficiaryNameAlign: settings.beneficiaryName.align,
                accountNumberX: settings.accountNumber.x,
                accountNumberY: settings.accountNumber.y,
                accountNumberFontSize: settings.accountNumber.fontSize,
                accountNumberAlign: settings.accountNumber.align,
                amountNumbersX: settings.amountNumbers.x,
                amountNumbersY: settings.amountNumbers.y,
                amountNumbersFontSize: settings.amountNumbers.fontSize,
                amountNumbersAlign: settings.amountNumbers.align,
                amountWordsX: settings.amountWords.x,
                amountWordsY: settings.amountWords.y,
                amountWordsFontSize: settings.amountWords.fontSize,
                amountWordsAlign: settings.amountWords.align,
                issueDateX: settings.issueDate.x,
                issueDateY: settings.issueDate.y,
                issueDateFontSize: settings.issueDate.fontSize,
                issueDateAlign: settings.issueDate.align,
                checkTypeX: settings.checkType.x,
                checkTypeY: settings.checkType.y,
                checkTypeFontSize: settings.checkType.fontSize,
                checkTypeAlign: settings.checkType.align,
                checkNumberX: settings.checkNumber.x,
                checkNumberY: settings.checkNumber.y,
                checkNumberFontSize: settings.checkNumber.fontSize,
                checkNumberAlign: settings.checkNumber.align,
                accountHolderNameX: settings.accountHolderName.x,
                accountHolderNameY: settings.accountHolderName.y,
                accountHolderNameFontSize: settings.accountHolderName.fontSize,
                accountHolderNameAlign: settings.accountHolderName.align,
                branchName: settings.branchName,
                branchNameX: settings.branchName.x,
                branchNameY: settings.branchName.y,
                branchNameFontSize: settings.branchName.fontSize,
                branchNameAlign: settings.branchName.align,
                micrLine: settings.micrLine,
                micrLineX: settings.micrLine.x,
                micrLineY: settings.micrLine.y,
                micrLineFontSize: settings.micrLine.fontSize,
                micrLineAlign: settings.micrLine.align,
            };

            await certifiedCheckService.updateSettings(payload);
            setSuccess('تم حفظ إعدادات الطباعة بنجاح!');

            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'فشل في حفظ الإعدادات');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (confirm('هل أنت متأكد من إعادة تعيين الإعدادات للقيم الافتراضية؟')) {
            setSettings(DEFAULT_SETTINGS);
            setSuccess('تم إعادة تعيين الإعدادات');
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const handleTestPrint = () => {
        const testData = {
            beneficiaryName: 'أحمد محمد علي السيد',
            accountNumber: '001001000811217',
            amountDinars: '37500',
            amountDirhams: '000',
            amountInWords: 'سبعة وثلاثون ألفاً وخمسمائة دينار ليبي لا غير',
            issueDate: new Date().toISOString().split('T')[0],
            checkType: 'شيك مصدق',
            checkNumber: '001123456',
        };

        const amountFormatted = `${testData.amountDinars}.${testData.amountDirhams}`;

        const printHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>معاينة إعدادات الطباعة - شيك مصدق</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: ${settings.checkWidth}mm ${settings.checkHeight}mm; margin: 0; }
    @font-face { font-family: 'MICR'; src: url('/font/micrenc.ttf') format('truetype'); }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: 'Cairo', sans-serif; }
    .check-wrapper { margin: 0; padding: 0; width: ${settings.checkWidth}mm; height: ${settings.checkHeight}mm; page-break-inside: avoid; overflow: hidden; }
    .check { position: relative; width: ${settings.checkWidth}mm; height: ${settings.checkHeight}mm; background: #fff; border: 1px dashed #ccc; }
    .field { position: absolute; }
    .beneficiary-name { left: ${settings.beneficiaryName.x}mm; top: ${settings.beneficiaryName.y}mm; font-size: ${settings.beneficiaryName.fontSize}pt; text-align: ${settings.beneficiaryName.align}; font-weight: 600; }
    .account-number { left: ${settings.accountNumber.x}mm; top: ${settings.accountNumber.y}mm; font-size: ${settings.accountNumber.fontSize}pt; text-align: ${settings.accountNumber.align}; font-family: 'Courier New', monospace; }
    .amount-numbers { left: ${settings.amountNumbers.x}mm; top: ${settings.amountNumbers.y}mm; font-size: ${settings.amountNumbers.fontSize}pt; text-align: ${settings.amountNumbers.align}; font-weight: bold; font-family: 'Courier New', monospace; direction: ltr; transform: ${settings.amountNumbers.align === 'right' ? 'translateX(-100%)' : settings.amountNumbers.align === 'center' ? 'translateX(-50%)' : 'none'}; }
    .amount-words { left: ${settings.amountWords.x}mm; top: ${settings.amountWords.y}mm; font-size: ${settings.amountWords.fontSize}pt; text-align: ${settings.amountWords.align}; max-width: 180mm; }
    .micr-line { position: absolute; left: ${settings.micrLine.x}mm; top: ${settings.micrLine.y}mm; font-size: ${settings.micrLine.fontSize}pt; text-align: ${settings.micrLine.align}; font-family: 'MICR', monospace; letter-spacing: 0.15em; direction: ltr; white-space: nowrap; font-weight: bold; transform: ${settings.micrLine.align === 'center' ? 'translateX(-50%)' : 'none'}; }
    .issue-date { left: ${settings.issueDate.x}mm; top: ${settings.issueDate.y}mm; font-size: ${settings.issueDate.fontSize}pt; text-align: ${settings.issueDate.align}; }
    .check-type { left: ${settings.checkType.x}mm; top: ${settings.checkType.y}mm; font-size: ${settings.checkType.fontSize}pt; text-align: ${settings.checkType.align}; font-weight: bold; color: #000; }
    .check-number { left: ${settings.checkNumber.x}mm; top: ${settings.checkNumber.y}mm; font-size: ${settings.checkNumber.fontSize}pt; text-align: ${settings.checkNumber.align}; font-family: 'Courier New', monospace; font-weight: bold; direction: ltr; }
    .branch-name { left: ${settings.branchName.x}mm; top: ${settings.branchName.y}mm; font-size: ${settings.branchName.fontSize}pt; text-align: ${settings.branchName.align}; font-weight: 600; transform: ${settings.branchName.align === 'center' ? 'translateX(-50%)' : 'none'}; }
    .account-holder-name { left: ${settings.accountHolderName.x}mm; top: ${settings.accountHolderName.y}mm; font-size: ${settings.accountHolderName.fontSize}pt; text-align: ${settings.accountHolderName.align}; }
    @media print { .check { border: none; } }
    @media screen { body { display: flex; align-items: center; justify-content: center; padding: 20px; background: #f3f4f6; } .check-wrapper { box-shadow: 0 4px 6px rgba(0,0,0,0.1); } }
  </style>
</head>
<body>
  <div class="check-wrapper">
    <section class="check">

      <div class="field check-number">${testData.checkNumber}</div>
      <div class="field branch-name">فرع طرابلس</div>
      <div class="field issue-date">${new Date(testData.issueDate).toLocaleDateString('ar-LY')}</div>
      <div class="field account-holder-name">أحمد محمد علي السيد</div>
      <div class="field beneficiary-name">${testData.beneficiaryName}</div>
      <div class="field account-number">${testData.accountNumber}</div>
      <div class="field amount-numbers">${amountFormatted}</div>
      <div class="field amount-words">${testData.amountInWords}</div>
      <div class="micr-line">C001123456C A02800116A 0000000001C 03</div>
    </section>
  </div>
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printHtml);
            printWindow.document.close();
        } else {
            setError('فشل في فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.');
        }
    };

    if (initialLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg">
                            <SettingsIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">إعدادات طباعة الشيك المصدق</h1>
                            <p className="text-gray-600">رابط خدمة المصرف ومواضع القيمة والمستفيد والتفقيط والترميز</p>
                        </div>
                    </div>
                </div>

                <div className="card space-y-3">
                    <h2 className="text-lg font-semibold text-gray-800">رابط خدمة الصكوك المصدقة (InstrumentListService)</h2>
                    <p className="text-sm text-gray-600">QueryFetchInstrumentList — استخدم خادم الاختبار: http://10.250.100.40:8080/InstrumentListService</p>
                    {instrumentEndpointMessage && (
                        <div className={`${instrumentEndpointMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'} border px-3 py-2 rounded`}>
                            {instrumentEndpointMessage.text}
                        </div>
                    )}
                    <input
                        type="text"
                        className="input w-full"
                        dir="ltr"
                        value={instrumentEndpoint}
                        onChange={(e) => setInstrumentEndpoint(e.target.value)}
                        disabled={instrumentEndpointLoading || instrumentEndpointSaving}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={saveInstrumentEndpoint}
                            disabled={instrumentEndpointSaving || instrumentEndpointLoading}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            حفظ الرابط
                        </button>
                        <button
                            onClick={loadInstrumentEndpoint}
                            disabled={instrumentEndpointLoading}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${instrumentEndpointLoading ? 'animate-spin' : ''}`} />
                            إعادة تحميل
                        </button>
                    </div>
                </div>

                {/* Messages */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Settings Form */}
                    <div className="card space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">
                            مواصفات الشيك المصدق
                        </h2>

                        {/* Check Dimensions */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-700">المقاسات (ملم)</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        العرض (الطول)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.checkWidth}
                                        onChange={(e) => updateCheckSize('checkWidth', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        الارتفاع
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.checkHeight}
                                        onChange={(e) => updateCheckSize('checkHeight', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-medium text-gray-700">رقم الشيك (أعلى الشيك)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">X</label>
                                    <input type="number" value={settings.checkNumber.x} onChange={(e) => updatePosition('checkNumber', 'x', parseFloat(e.target.value))} className="input w-full" step="0.1" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Y</label>
                                    <input type="number" value={settings.checkNumber.y} onChange={(e) => updatePosition('checkNumber', 'y', parseFloat(e.target.value))} className="input w-full" step="0.1" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                                    <input type="number" value={settings.checkNumber.fontSize} onChange={(e) => updatePosition('checkNumber', 'fontSize', parseInt(e.target.value))} className="input w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                                    <select value={settings.checkNumber.align} onChange={(e) => updatePosition('checkNumber', 'align', e.target.value)} className="input w-full">
                                        <option value="left">يسار</option>
                                        <option value="center">وسط</option>
                                        <option value="right">يمين</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-medium text-gray-700">اسم الفرع (أعلى الشيك)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">X</label>
                                    <input type="number" value={settings.branchName.x} onChange={(e) => updatePosition('branchName', 'x', parseFloat(e.target.value))} className="input w-full" step="0.1" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Y</label>
                                    <input type="number" value={settings.branchName.y} onChange={(e) => updatePosition('branchName', 'y', parseFloat(e.target.value))} className="input w-full" step="0.1" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                                    <input type="number" value={settings.branchName.fontSize} onChange={(e) => updatePosition('branchName', 'fontSize', parseInt(e.target.value))} className="input w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                                    <select value={settings.branchName.align} onChange={(e) => updatePosition('branchName', 'align', e.target.value)} className="input w-full">
                                        <option value="left">يسار</option>
                                        <option value="center">وسط</option>
                                        <option value="right">يمين</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Issue Date Position */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-medium text-gray-700">تاريخ الإصدار</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">X</label>
                                    <input
                                        type="number"
                                        value={settings.issueDate.x}
                                        onChange={(e) => updatePosition('issueDate', 'x', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Y</label>
                                    <input
                                        type="number"
                                        value={settings.issueDate.y}
                                        onChange={(e) => updatePosition('issueDate', 'y', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                                    <input
                                        type="number"
                                        value={settings.issueDate.fontSize}
                                        onChange={(e) => updatePosition('issueDate', 'fontSize', parseInt(e.target.value))}
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                                    <select
                                        value={settings.issueDate.align}
                                        onChange={(e) => updatePosition('issueDate', 'align', e.target.value)}
                                        className="input w-full"
                                    >
                                        <option value="left">يسار</option>
                                        <option value="center">وسط</option>
                                        <option value="right">يمين</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Account Holder Name Position */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-medium text-gray-700">اسم صاحب الحساب</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">X</label>
                                    <input
                                        type="number"
                                        value={settings.accountHolderName.x}
                                        onChange={(e) => updatePosition('accountHolderName', 'x', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Y</label>
                                    <input
                                        type="number"
                                        value={settings.accountHolderName.y}
                                        onChange={(e) => updatePosition('accountHolderName', 'y', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                                    <input
                                        type="number"
                                        value={settings.accountHolderName.fontSize}
                                        onChange={(e) => updatePosition('accountHolderName', 'fontSize', parseInt(e.target.value))}
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                                    <select
                                        value={settings.accountHolderName.align}
                                        onChange={(e) => updatePosition('accountHolderName', 'align', e.target.value)}
                                        className="input w-full"
                                    >
                                        <option value="left">يسار</option>
                                        <option value="center">وسط</option>
                                        <option value="right">يمين</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Beneficiary Name Position */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-medium text-gray-700">اسم المستفيد</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">X</label>
                                    <input
                                        type="number"
                                        value={settings.beneficiaryName.x}
                                        onChange={(e) => updatePosition('beneficiaryName', 'x', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Y</label>
                                    <input
                                        type="number"
                                        value={settings.beneficiaryName.y}
                                        onChange={(e) => updatePosition('beneficiaryName', 'y', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                                    <input
                                        type="number"
                                        value={settings.beneficiaryName.fontSize}
                                        onChange={(e) => updatePosition('beneficiaryName', 'fontSize', parseInt(e.target.value))}
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                                    <select
                                        value={settings.beneficiaryName.align}
                                        onChange={(e) => updatePosition('beneficiaryName', 'align', e.target.value)}
                                        className="input w-full"
                                    >
                                        <option value="left">يسار</option>
                                        <option value="center">وسط</option>
                                        <option value="right">يمين</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Account Number Position */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-medium text-gray-700">رقم الحساب</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">X</label>
                                    <input
                                        type="number"
                                        value={settings.accountNumber.x}
                                        onChange={(e) => updatePosition('accountNumber', 'x', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Y</label>
                                    <input
                                        type="number"
                                        value={settings.accountNumber.y}
                                        onChange={(e) => updatePosition('accountNumber', 'y', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                                    <input
                                        type="number"
                                        value={settings.accountNumber.fontSize}
                                        onChange={(e) => updatePosition('accountNumber', 'fontSize', parseInt(e.target.value))}
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                                    <select
                                        value={settings.accountNumber.align}
                                        onChange={(e) => updatePosition('accountNumber', 'align', e.target.value)}
                                        className="input w-full"
                                    >
                                        <option value="left">يسار</option>
                                        <option value="center">وسط</option>
                                        <option value="right">يمين</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Amount Numbers Position */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-medium text-gray-700">المبلغ بالأرقام</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">X</label>
                                    <input
                                        type="number"
                                        value={settings.amountNumbers.x}
                                        onChange={(e) => updatePosition('amountNumbers', 'x', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Y</label>
                                    <input
                                        type="number"
                                        value={settings.amountNumbers.y}
                                        onChange={(e) => updatePosition('amountNumbers', 'y', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                                    <input
                                        type="number"
                                        value={settings.amountNumbers.fontSize}
                                        onChange={(e) => updatePosition('amountNumbers', 'fontSize', parseInt(e.target.value))}
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                                    <select
                                        value={settings.amountNumbers.align}
                                        onChange={(e) => updatePosition('amountNumbers', 'align', e.target.value)}
                                        className="input w-full"
                                    >
                                        <option value="left">يسار</option>
                                        <option value="center">وسط</option>
                                        <option value="right">يمين</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Amount Words Position */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-medium text-gray-700">المبلغ بالحروف</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">X</label>
                                    <input
                                        type="number"
                                        value={settings.amountWords.x}
                                        onChange={(e) => updatePosition('amountWords', 'x', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Y</label>
                                    <input
                                        type="number"
                                        value={settings.amountWords.y}
                                        onChange={(e) => updatePosition('amountWords', 'y', parseFloat(e.target.value))}
                                        className="input w-full"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                                    <input
                                        type="number"
                                        value={settings.amountWords.fontSize}
                                        onChange={(e) => updatePosition('amountWords', 'fontSize', parseInt(e.target.value))}
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                                    <select
                                        value={settings.amountWords.align}
                                        onChange={(e) => updatePosition('amountWords', 'align', e.target.value)}
                                        className="input w-full"
                                    >
                                        <option value="left">يسار</option>
                                        <option value="center">وسط</option>
                                        <option value="right">يمين</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* MICR encoding */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-medium text-gray-700">ترميز MICR أسفل الشيك</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">X</label>
                                    <input type="number" value={settings.micrLine.x} onChange={(e) => updatePosition('micrLine', 'x', parseFloat(e.target.value))} className="input w-full" step="0.1" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Y</label>
                                    <input type="number" value={settings.micrLine.y} onChange={(e) => updatePosition('micrLine', 'y', parseFloat(e.target.value))} className="input w-full" step="0.1" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                                    <input type="number" value={settings.micrLine.fontSize} onChange={(e) => updatePosition('micrLine', 'fontSize', parseInt(e.target.value))} className="input w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                                    <select value={settings.micrLine.align} onChange={(e) => updatePosition('micrLine', 'align', e.target.value)} className="input w-full">
                                        <option value="left">يسار</option>
                                        <option value="center">وسط</option>
                                        <option value="right">يمين</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="btn btn-primary flex items-center gap-2 flex-1"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        حفظ الإعدادات
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleReset}
                                className="btn btn-secondary flex items-center gap-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                إعادة تعيين
                            </button>

                            <button
                                onClick={handleTestPrint}
                                className="btn bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                            >
                                <Eye className="w-5 h-5" />
                                معاينة
                            </button>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-6">
                            معاينة الشيك المصدق
                        </h2>

                        <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                            <div
                                className="bg-white shadow-lg mx-auto relative border border-gray-200"
                                style={{
                                    width: `${settings.checkWidth * 2}px`,
                                    height: `${settings.checkHeight * 2}px`,
                                    transform: 'scale(0.85)',
                                    transformOrigin: 'top center',
                                }}
                            >


                                {/* Issue Date */}
                                <div
                                    className="absolute"
                                    style={{
                                        left: `${settings.issueDate.x * 2}px`,
                                        top: `${settings.issueDate.y * 2}px`,
                                        fontSize: `${settings.issueDate.fontSize * 1.5}px`,
                                        textAlign: settings.issueDate.align as any,
                                    }}
                                >
                                    {new Date().toLocaleDateString('ar-LY')}
                                </div>

                                {/* Beneficiary Name */}
                                <div
                                    className="absolute font-semibold"
                                    style={{
                                        left: `${settings.beneficiaryName.x * 2}px`,
                                        top: `${settings.beneficiaryName.y * 2}px`,
                                        fontSize: `${settings.beneficiaryName.fontSize * 1.5}px`,
                                        textAlign: settings.beneficiaryName.align as any,
                                    }}
                                >
                                    أحمد محمد علي السيد
                                </div>

                                {/* Account Holder Name */}
                                <div
                                    className="absolute font-semibold text-gray-600"
                                    style={{
                                        left: `${settings.accountHolderName.x * 2}px`,
                                        top: `${settings.accountHolderName.y * 2}px`,
                                        fontSize: `${settings.accountHolderName.fontSize * 1.5}px`,
                                        textAlign: settings.accountHolderName.align as any,
                                    }}
                                >
                                    أحمد محمد علي السيد
                                </div>

                                {/* Account Number */}
                                <div
                                    className="absolute font-mono"
                                    style={{
                                        left: `${settings.accountNumber.x * 2}px`,
                                        top: `${settings.accountNumber.y * 2}px`,
                                        fontSize: `${settings.accountNumber.fontSize * 1.5}px`,
                                        textAlign: settings.accountNumber.align as any,
                                    }}
                                >
                                    001001000811217
                                </div>

                                {/* Amount Numbers */}
                                <div
                                    className="absolute font-mono font-bold"
                                    style={{
                                        left: `${settings.amountNumbers.x * 2}px`,
                                        top: `${settings.amountNumbers.y * 2}px`,
                                        fontSize: `${settings.amountNumbers.fontSize * 1.5}px`,
                                        textAlign: settings.amountNumbers.align as any,
                                        direction: 'ltr',
                                        transform: settings.amountNumbers.align === 'right' ? 'translateX(-100%)' : settings.amountNumbers.align === 'center' ? 'translateX(-50%)' : 'none',
                                    }}
                                >
                                    37,500.000
                                </div>

                                {/* Amount Words */}
                                <div
                                    className="absolute"
                                    style={{
                                        left: `${settings.amountWords.x * 2}px`,
                                        top: `${settings.amountWords.y * 2}px`,
                                        fontSize: `${settings.amountWords.fontSize * 1.5}px`,
                                        textAlign: settings.amountWords.align as any,
                                        maxWidth: '360px',
                                    }}
                                >
                                    سبعة وثلاثون ألفاً وخمسمائة دينار ليبي لا غير
                                </div>

                                <div
                                    className="absolute font-mono font-bold"
                                    style={{
                                        left: `${settings.micrLine.x * 2}px`,
                                        top: `${settings.micrLine.y * 2}px`,
                                        fontSize: `${Math.max(10, settings.micrLine.fontSize)}px`,
                                        textAlign: settings.micrLine.align as any,
                                        transform: settings.micrLine.align === 'center' ? 'translateX(-50%)' : 'none',
                                        direction: 'ltr',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    C001123456C A02800116A ... 03
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <h3 className="font-semibold text-amber-800 mb-2">ملاحظات:</h3>
                            <ul className="text-sm text-amber-700 space-y-1">
                                <li>• استخدم "معاينة" لفتح نافذة جديدة بمقاس الشيك الحقيقي</li>
                                <li>• يمكنك طباعة المعاينة للتأكد من المحاذاة الصحيحة</li>
                                <li>• القيم بالملليمتر (mm) من الزاوية اليسرى العليا</li>
                                <li>• احفظ الإعدادات قبل الانتقال لشاشة الطباعة</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
