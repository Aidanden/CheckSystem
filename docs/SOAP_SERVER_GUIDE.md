# دليل استخدام SOAP API المحلي

## نظرة عامة

النظام يحتوي على خادم SOAP تجريبي محلي يحاكي FCUBS API. هذا يسمح بالتطوير والاختبار بدون الحاجة لخادم FCUBS حقيقي.

## الإعداد

### 1. تشغيل خادم SOAP

الخادم يعمل بالفعل على المنفذ 8080:

```bash
# في terminal منفصل
cd d:\CheckSystem\server
npm run soap:test
```

يجب أن ترى:
```
═══════════════════════════════════════════════════════════════
🚀 خادم SOAP التجريبي يعمل على المنفذ: 8080
═══════════════════════════════════════════════════════════════
📍 SOAP Endpoint: http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService
🏥 Health Check: http://10.250.100.40:8080/health
```

### 2. التحقق من عمل الخادم

```bash
# في terminal أو browser
curl http://10.250.100.40:8080/health
```

يجب أن ترى:
```json
{
  "status": "OK",
  "service": "FCUBS SOAP Test Server",
  "timestamp": "2025-11-26T..."
}
```

## التكوين

### تم التحديث التلقائي

الكود الآن يستخدم خادم SOAP المحلي افتراضياً:

```typescript
// في server/src/utils/bankAPI.ts
this.baseUrl = process.env.BANK_API_URL || 'http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService';
```

### إعدادات بيئة اختيارية

يمكنك تخصيص الإعدادات في `.env`:

```env
# خادم SOAP المحلي (افتراضي)
BANK_API_URL=http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService
BANK_API_USER=ADMINUSER1
BANK_DEFAULT_BRANCH_CODE=001

# أو استخدم خادم FCUBS حقيقي
# BANK_API_URL=http://your-fcubs-server:port/FCUBSAccService
```

## كيفية الاستخدام

### من التطبيق

1. **افتح صفحة الطباعة**: `http://10.250.100.40:3040/print`
2. **أدخل رقم حساب**: أي رقم (مثل `001001000811217`)
3. **اضغط "استعلام"**
4. **سترى البيانات من خادم SOAP المحلي**

### البيانات المرجعة

خادم SOAP المحلي يرجع:
- ✅ رقم الحساب المطلوب
- ✅ رقم الفرع
- ✅ 10 شيكات (أول واحد Used، الباقي New)
- ✅ رقم الشيك الأول: 734 (افتراضي)
- ✅ تاريخ الإصدار: التاريخ الحالي

## اختبار SOAP مباشرة

### باستخدام cURL

```bash
curl -X POST http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService \
  -H "Content-Type: text/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fcub="http://fcubs.ofss.com/service/FCUBSAccService">
  <soapenv:Header/>
  <soapenv:Body>
    <fcub:QUERYCHECKBOOK_IOFS_REQ>
      <fcub:FCUBS_HEADER>
        <fcub:SOURCE>FCAT</fcub:SOURCE>
        <fcub:UBSCOMP>FCUBS</fcub:UBSCOMP>
        <fcub:USERID>ADMINUSER1</fcub:USERID>
        <fcub:BRANCH>001</fcub:BRANCH>
        <fcub:SERVICE>FCUBSAccService</fcub:SERVICE>
        <fcub:OPERATION>QueryCheckBook</fcub:OPERATION>
      </fcub:FCUBS_HEADER>
      <fcub:FCUBS_BODY>
        <fcub:Chq-Bk-Details-IO>
          <fcub:ACCOUNT_BRANCH>001</fcub:ACCOUNT_BRANCH>
          <fcub:ACCOUNT>001001000811217</fcub:ACCOUNT>
          <fcub:FIRST_CHEQUE_NUMBER>734</fcub:FIRST_CHEQUE_NUMBER>
        </fcub:Chq-Bk-Details-IO>
      </fcub:FCUBS_BODY>
    </fcub:QUERYCHECKBOOK_IOFS_REQ>
  </soapenv:Body>
</soapenv:Envelope>'
```

## سجلات الخادم

عند استلام طلب، سترى في terminal خادم SOAP:

```
📨 تم استلام طلب SOAP
Content-Type: text/xml
Body Type: string
Body Length: 1234
📋 البيانات المستخرجة:
  - فرع الحساب: 001
  - رقم الحساب: 001001000811217
  - رقم الشيك الأول: 734
✅ تم إنشاء الاستجابة بنجاح
```

## استكشاف الأخطاء

### خطأ: Cannot connect to FCUBS SOAP endpoint

**السبب**: خادم SOAP غير مشغل

**الحل**:
```bash
cd d:\CheckSystem\server
npm run soap:test
```

### خطأ: ECONNREFUSED

**السبب**: المنفذ 8080 مستخدم أو الخادم متوقف

**الحل**:
1. تحقق من أن `npm run soap:test` يعمل
2. تحقق من أن المنفذ 8080 غير مستخدم
3. جرب منفذ آخر في `server_soap_test.js`

### الخادم يعمل لكن لا توجد بيانات

**السبب**: النظام يستخدم mock mode بدلاً من SOAP

**الحل**:
1. تأكد من أن `BANK_API_URL` صحيح
2. أعد تشغيل الخادم الرئيسي
3. تحقق من السجلات

## الملفات ذات الصلة

- ✅ `server/server_soap_test.js` - خادم SOAP المحلي
- ✅ `server/src/utils/bankAPI.ts` - عميل SOAP
- ✅ `server/src/services/account.service.ts` - خدمة الحسابات
- ✅ `server/package.json` - سكريبت `soap:test`

## الخطوات التالية

1. ✅ تأكد من تشغيل `npm run soap:test`
2. ✅ تحقق من `http://10.250.100.40:8080/health`
3. ✅ جرب الاستعلام من التطبيق
4. ✅ راقب سجلات خادم SOAP

الآن النظام يستخدم خادم SOAP المحلي تلقائياً! 🎉
