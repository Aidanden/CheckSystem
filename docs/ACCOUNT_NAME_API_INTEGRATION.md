# إضافة API ثاني لجلب اسم صاحب الحساب

## التاريخ: 2025-12-02

## المشكلة:
API الأول (FCUBSAccService) لا يُرجع اسم صاحب الحساب الذي يجب طباعته على الشيك.

## الحل:
إضافة استدعاء API ثاني (FCUBSIAService) لجلب اسم صاحب الحساب ودمجه مع نتائج API الأول.

## التفاصيل التقنية:

### API الثاني (FCUBSIAService):
- **Endpoint**: `http://fcubsuatapp1.aiib.ly:9005/FCUBSIAService/FCUBSIAService`
- **Operation**: `QueryIACustAcc`
- **البيانات المطلوبة**:
  - `ACC`: رقم الحساب (15 رقم)
  - `BRN`: رقم الفرع (أول 3 أرقام من اليسار من رقم الحساب)

### SOAP Request:
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fcub="http://fcubs.ofss.com/service/FCUBSIAService">
   <soapenv:Header/>
   <soapenv:Body>
      <fcub:QUERYIACUSTACC_IOFS_REQ>
         <fcub:FCUBS_HEADER>
            <fcub:SOURCE>FCAT</fcub:SOURCE>
            <fcub:UBSCOMP>FCUBS</fcub:UBSCOMP>
            <fcub:USERID>FCATOP</fcub:USERID>
            <fcub:BRANCH>001</fcub:BRANCH>
            <fcub:SERVICE>FCUBSIAService</fcub:SERVICE>
            <fcub:OPERATION>QueryIACustAcc</fcub:OPERATION>
            <fcub:SOURCE_OPERATION>QueryIACustAcc</fcub:SOURCE_OPERATION>
         </fcub:FCUBS_HEADER>
         <fcub:FCUBS_BODY>
            <fcub:Cust-Account-IO>
               <fcub:BRN>001</fcub:BRN>
               <fcub:ACC>001001000810319</fcub:ACC>
            </fcub:Cust-Account-IO>
         </fcub:FCUBS_BODY>
      </fcub:QUERYIACUSTACC_IOFS_REQ>
   </soapenv:Body>
</soapenv:Envelope>
```

### SOAP Response:
```xml
<QUERYIACUSTACC_IOFS_RES>
   <FCUBS_BODY>
      <Cust-Account-Full>
         <CUSTNAME>صلاح سالم علي مصطفى</CUSTNAME>
         <ACC>001001000810319</ACC>
         ...
      </Cust-Account-Full>
   </FCUBS_BODY>
</QUERYIACUSTACC_IOFS_RES>
```

## الملفات المعدّلة:

### 1. `server/src/utils/bankAPI.ts`
**الدوال الجديدة**:
- `buildAccountInfoSoapEnvelope()`: بناء SOAP envelope لـ API الثاني
- `postAccountInfoSoapRequest()`: إرسال الطلب إلى FCUBSIAService
- `queryAccountInfo()`: الدالة الرئيسية لجلب اسم صاحب الحساب

**الوظيفة**:
```typescript
async queryAccountInfo(accountNumber: string): Promise<{ 
  customerName: string; 
  accountNumber: string 
}>
```

**المدخلات**:
- `accountNumber`: رقم الحساب (15 رقم)

**المخرجات**:
- `customerName`: اسم صاحب الحساب
- `accountNumber`: رقم الحساب (للتأكيد)

### 2. `server/src/controllers/soap.controller.ts`
**التحديثات**:
- إضافة استدعاء `bankAPI.queryAccountInfo()` بعد `queryCheckbook()`
- دمج `customerName` مع النتيجة النهائية
- معالجة الأخطاء بشكل آمن (لا توقف العملية إذا فشل جلب الاسم)

**سير العمل**:
1. استدعاء API الأول (`queryCheckbook`) للحصول على معلومات دفتر الشيكات
2. استدعاء API الثاني (`queryAccountInfo`) للحصول على اسم صاحب الحساب
3. جلب معلومات الفرع من قاعدة البيانات
4. دمج جميع البيانات وإرسالها للعميل

## استخراج رقم الفرع:
رقم الفرع يتم استخراجه من أول 3 أرقام من اليسار من رقم الحساب:
```typescript
const branchCode = accountNumber.substring(0, 3);
// مثال: "001001000810319" → "001"
```

## معالجة الأخطاء:
- إذا فشل API الثاني، لا توقف العملية
- يتم تسجيل الخطأ في الـ console
- تستمر العملية بدون اسم صاحب الحساب
- هذا يضمن أن فشل API واحد لا يعطل النظام بالكامل

## النتيجة النهائية:
```json
{
  "accountNumber": "001001000810319",
  "accountBranch": "001",
  "branchName": "الفرع الرئيسي",
  "routingNumber": "1100000001",
  "customerName": "صلاح سالم علي مصطفى",
  "firstChequeNumber": 1,
  "chequeLeaves": 25,
  "chequeStatuses": [...]
}
```

## الاختبار:
1. شغّل الخادم:
   ```bash
   cd server
   npm run dev
   ```

2. اختبر من صفحة الطباعة:
   - أدخل رقم حساب صحيح
   - اضغط "استعلام"
   - يجب أن يظهر اسم صاحب الحساب في النتيجة

3. راقب الـ console logs:
   ```
   📋 SOAP Query Request: {...}
   📤 Sending SOAP Request: ...
   📥 Received SOAP Response: ...
   👤 جلب اسم صاحب الحساب من FCUBSIAService...
   📤 Sending Account Info SOAP Request: ...
   📥 Received Account Info SOAP Response: ...
   ✅ تم جلب اسم صاحب الحساب بنجاح: صلاح سالم علي مصطفى
   🔍 البحث عن الفرع برقم: 001
   ✅ تم جلب معلومات الفرع بنجاح: {...}
   📤 إرسال النتيجة: {...}
   ```

## ملاحظات:
- ✅ API الثاني يعمل بشكل مستقل عن API الأول
- ✅ فشل أحد الـ APIs لا يوقف العملية
- ✅ يتم تسجيل جميع الأخطاء في الـ console
- ✅ البيانات تُدمج بشكل آمن
- ✅ رقم الفرع يُستخرج تلقائياً من رقم الحساب

## المتغيرات البيئية:
يمكن تخصيص `BANK_API_USER` في ملف `.env`:
```env
BANK_API_USER=FCATOP
```

إذا لم يتم تعيينه، سيتم استخدام القيمة الافتراضية `FCATOP`.
