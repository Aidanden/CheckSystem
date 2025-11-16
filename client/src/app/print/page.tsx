'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { accountService, printingService } from '@/lib/api';
import { Account } from '@/types';
import { Search, Printer, CheckCircle } from 'lucide-react';

export default function PrintPage() {
  const [accountNumber, setAccountNumber] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountNumber) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const data = await accountService.query(accountNumber);
      setAccount(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'فشل الاستعلام عن الحساب');
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!account) return;

    setPrinting(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await printingService.printCheckbook({
        account_number: account.accountNumber,
      });

      setSuccess(true);
      setError(null);
      
      // Download PDF automatically if path is provided
      if (result.pdfPath) {
        const filename = result.pdfPath.split('\\').pop() || result.pdfPath.split('/').pop();
        const downloadUrl = `http://localhost:5000/api/printing/download/${filename}`;
        
        // Open PDF in new tab for printing
        window.open(downloadUrl, '_blank');
      }
      
      // Refresh account data after printing
      setTimeout(async () => {
        const updatedAccount = await accountService.query(account.accountNumber);
        setAccount(updatedAccount);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'فشل في طباعة الشيك');
      setSuccess(false);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">طباعة شيك جديد</h1>

        {/* Search Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            الاستعلام عن حساب
          </h2>
          
          <form onSubmit={handleQuery} className="flex gap-4">
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="أدخل رقم الحساب"
              className="input flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !accountNumber}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري البحث...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  استعلام
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">تمت الطباعة بنجاح!</span>
            </div>
            <p className="text-sm text-green-600">
              تم فتح ملف PDF في نافذة جديدة. استخدم Ctrl+P أو ⌘+P للطباعة.
            </p>
          </div>
        )}

        {/* Account Details */}
        {account && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              بيانات الحساب
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">رقم الحساب</p>
                  <p className="font-mono font-semibold text-gray-800 mt-1">
                    {account.accountNumber}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">اسم صاحب الحساب</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {account.accountHolderName}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">نوع الحساب</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {account.accountType === 1 ? 'حساب فردي' : 'حساب شركة'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">آخر رقم تسلسلي مطبوع</p>
                  <p className="font-mono font-semibold text-gray-800 mt-1">
                    {account.lastPrintedSerial}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-6">
                <button
                  onClick={handlePrint}
                  disabled={printing}
                  className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-3"
                >
                  {printing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      جاري الطباعة...
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5" />
                      طباعة دفتر شيكات ({account.accountType === 1 ? '25' : '50'} ورقة)
                    </>
                  )}
                </button>
                
                <p className="text-xs text-gray-500 text-center mt-2">
                  سيتم طباعة {account.accountType === 1 ? '25' : '50'} ورقة شيك للحساب أعلاه
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!account && !error && (
          <div className="card bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">
              تعليمات الطباعة:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>أدخل رقم الحساب المصرفي للاستعلام</li>
              <li>تحقق من بيانات الحساب قبل الطباعة</li>
              <li>سيتم طباعة 25 ورقة للحسابات الفردية و 50 ورقة للشركات</li>
              <li>سيتم تحديث المخزون تلقائياً بعد الطباعة</li>
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

