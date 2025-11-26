# دليل دمج SOAP API في شاشة الطباعة

## 📋 الملفات المنشأة

### 1. Services
- **`client/src/services/soapService.ts`** - خدمة SOAP للاتصال بـ FCUBS API
- **`client/src/hooks/useCheckBook.ts`** - React Hook لاستخدام SOAP service

### 2. Components
- **`client/src/components/CheckSelector.tsx`** - مكون اختيار الشيك من SOAP API

### 3. Server
- **`server/server_soap_test.js`** - خادم SOAP التجريبي (يعمل على المنفذ 8080)

---

## 🚀 كيفية الدمج في شاشة الطباعة

### الخطوة 1: تشغيل خادم SOAP

```bash
cd server
npm run soap:test
```

الخادم سيعمل على: `http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService`

---

### الخطوة 2: استخدام CheckSelector في صفحة الطباعة

افتح ملف صفحة الطباعة (مثلاً `client/src/pages/PrintPage.tsx`) وأضف:

```tsx
import { CheckSelector } from '@/components/CheckSelector';
import { useState } from 'react';

export function PrintPage() {
  const [selectedCheckInfo, setSelectedCheckInfo] = useState<{
    checkNumber: string;
    branch: string;
    account: string;
  } | null>(null);

  const handleCheckSelected = (
    checkNumber: string,
    accountInfo: { branch: string; account: string }
  ) => {
    setSelectedCheckInfo({
      checkNumber,
      branch: accountInfo.branch,
      account: accountInfo.account
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">طباعة الشيكات</h1>

      {/* مكون اختيار الشيك */}
      <CheckSelector onCheckSelected={handleCheckSelected} />

      {/* معلومات الشيك المختار */}
      {selectedCheckInfo && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-lg mb-2">معلومات الشيك المختار:</h3>
          <ul className="space-y-1">
            <li>رقم الشيك: {selectedCheckInfo.checkNumber}</li>
            <li>رقم الحساب: {selectedCheckInfo.account}</li>
            <li>الفرع: {selectedCheckInfo.branch}</li>
          </ul>
        </div>
      )}

      {/* باقي مكونات الطباعة */}
      {selectedCheckInfo && (
        <div>
          {/* هنا يمكنك إضافة مكونات الطباعة الخاصة بك */}
          <p>جاهز للطباعة...</p>
        </div>
      )}
    </div>
  );
}
```

---

### الخطوة 3: استخدام Hook مباشرة (بديل)

إذا أردت استخدام الـ Hook مباشرة بدون المكون:

```tsx
import { useCheckBook } from '@/hooks/useCheckBook';
import { useState, useEffect } from 'react';

export function PrintPage() {
  const { loading, error, queryCheckBook } = useCheckBook();
  const [checkData, setCheckData] = useState(null);

  const loadCheckData = async () => {
    const response = await queryCheckBook({
      accountBranch: '001',
      account: '001001000811217',
      firstChequeNumber: '734'
    });

    if (response.success && response.data) {
      setCheckData(response.data);
      console.log('بيانات دفتر الشيكات:', response.data);
      console.log('الشيكات المتاحة:', response.data.chequeStatuses);
    }
  };

  return (
    <div>
      <button onClick={loadCheckData} disabled={loading}>
        {loading ? 'جاري التحميل...' : 'تحميل بيانات الشيكات'}
      </button>

      {error && <div className="text-red-500">{error}</div>}

      {checkData && (
        <div>
          <h3>معلومات دفتر الشيكات</h3>
          <p>الحساب: {checkData.account}</p>
          <p>عدد الشيكات: {checkData.chequeLeaves}</p>
          <p>الحالة: {checkData.requestStatus}</p>
          
          <h4>الشيكات:</h4>
          <ul>
            {checkData.chequeStatuses.map(check => (
              <li key={check.CHQ_NO}>
                شيك رقم {check.CHQ_NO} - الحالة: {check.STATUS}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 هيكل البيانات

### CheckBookDetails

```typescript
interface CheckBookDetails {
  accountBranch: string;        // فرع الحساب
  account: string;              // رقم الحساب
  firstChequeNumber: string;    // رقم الشيك الأول
  chequeLeaves: number;         // عدد الشيكات
  orderDate: string;            // تاريخ الطلب
  issueDate: string;            // تاريخ الإصدار
  requestStatus: string;        // حالة الطلب (Delivered, Pending, etc.)
  chequeStatuses: ChequeStatus[]; // قائمة الشيكات
}
```

### ChequeStatus

```typescript
interface ChequeStatus {
  CHQ_BOOK_NO: string;  // رقم دفتر الشيكات
  CHQ_NO: string;       // رقم الشيك
  STATUS: 'U' | 'N' | 'C' | 'S';  // U=Used, N=New, C=Cancelled, S=Stopped
}
```

---

## 🔄 سير العمل الكامل

1. **المستخدم يدخل معلومات الحساب** (فرع + رقم حساب)
2. **النظام يستعلم من SOAP API** عن دفتر الشيكات
3. **يتم عرض الشيكات المتاحة** (حالة N = New)
4. **المستخدم يختار الشيك** المراد طباعته
5. **النظام يستخدم رقم الشيك** في عملية الطباعة
6. **بعد الطباعة** يمكن تحديث حالة الشيك إلى U (Used)

---

## ⚙️ الإعدادات

### تغيير SOAP Endpoint

في ملف `client/src/services/soapService.ts`:

```typescript
private soapEndpoint = 'http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService';
// غيّر إلى:
private soapEndpoint = 'http://your-fcubs-server:port/FCUBSAccService';
```

### إضافة Authentication

إذا كان SOAP API يحتاج authentication:

```typescript
const response = await fetch(this.soapEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': 'QueryCheckBook',
    'Authorization': 'Bearer YOUR_TOKEN' // أضف هنا
  },
  body: soapRequest
});
```

---

## 🧪 الاختبار

### 1. اختبار SOAP Service مباشرة

```typescript
import { soapService } from '@/services/soapService';

// في console المتصفح
const result = await soapService.queryCheckBook({
  accountBranch: '001',
  account: '001001000811217'
});
console.log(result);
```

### 2. اختبار الشيكات المتاحة

```typescript
const available = await soapService.getAvailableChecks('001', '001001000811217');
console.log('الشيكات المتاحة:', available);
```

---

## 🎯 الخطوات التالية

1. ✅ دمج `CheckSelector` في صفحة الطباعة
2. ✅ ربط رقم الشيك المختار بنموذج الطباعة
3. ✅ إضافة validation للتأكد من اختيار شيك
4. ✅ تحديث حالة الشيك بعد الطباعة (إذا لزم الأمر)
5. ✅ إضافة error handling شامل

---

## 💡 نصائح

- **تأكد من تشغيل خادم SOAP** قبل استخدام الميزة
- **استخدم فقط الشيكات بحالة N** (New) للطباعة
- **أضف loading states** لتحسين تجربة المستخدم
- **احفظ سجل** للشيكات المطبوعة

---

## 🐛 استكشاف الأخطاء

### CORS Error
تأكد أن خادم SOAP يسمح بـ CORS (موجود بالفعل في `server_soap_test.js`)

### Connection Refused
تأكد أن خادم SOAP يعمل على المنفذ 8080

### XML Parsing Error
تحقق من صحة XML في الـ request والـ response

---

**جاهز للاستخدام! 🚀**
