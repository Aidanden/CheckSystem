# خادم SOAP التجريبي - FCUBS CheckBook Service

## 📋 الوصف
هذا خادم SOAP تجريبي يحاكي خدمة FCUBS للاستعلام عن دفتر الشيكات (`FCUBSAccService - QueryCheckBook`).

## 🚀 تشغيل الخادم

### الطريقة 1: باستخدام npm
```bash
cd server
npm run soap:test
```

### الطريقة 2: مباشرة
```bash
node server_soap_test.js
```

الخادم سيعمل على المنفذ: **8080**

## 🔗 Endpoints

### 1. SOAP Service Endpoint
```
POST http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService
Content-Type: text/xml
```

### 2. Health Check
```
GET http://10.250.100.40:8080/health
```

## 📤 مثال على الطلب (Request)

```xml
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
</soapenv:Envelope>
```

## 📥 مثال على الاستجابة (Response)

الخادم سيرد بـ XML يحتوي على:
- معلومات دفتر الشيكات
- قائمة بـ 10 شيكات مع حالاتها
- رسالة نجاح العملية

## 🔧 البيانات المتغيرة

البيانات التالية يمكن تغييرها من Frontend:

| الحقل | الوصف | مثال |
|------|------|------|
| `ACCOUNT_BRANCH` | فرع الحساب | `001` |
| `ACCOUNT` | رقم الحساب | `001001000811217` |
| `FIRST_CHEQUE_NUMBER` | رقم الشيك الأول (اختياري) | `734` |

## 📊 البيانات الثابتة

البيانات التالية ثابتة في الـ Header:
- `SOURCE`: FCAT
- `UBSCOMP`: FCUBS
- `USERID`: ADMINUSER1
- `BRANCH`: 001
- `SERVICE`: FCUBSAccService
- `OPERATION`: QueryCheckBook

## 🧪 اختبار باستخدام cURL

```bash
curl -X POST http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService \
  -H "Content-Type: text/xml" \
  -d @- << 'EOF'
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
</soapenv:Envelope>
EOF
```

## 🧪 اختبار باستخدام SoapUI (الطريقة الموصى بها)

### ⚡ الطريقة السريعة: استيراد المشروع الجاهز

لقد قمت بإنشاء ملف مشروع SoapUI جاهز للاستخدام!

1. **تشغيل الخادم أولاً:**
   ```bash
   cd server
   npm run soap:test
   ```

2. **افتح SoapUI**

3. **استيراد المشروع:**
   - اذهب إلى **File** → **Import Project**
   - اختر الملف: `d:\CheckSystem\server\FCUBS-CheckBook-soapui-project.xml`
   - اضغط **Open**

4. **تشغيل الطلب:**
   - في الشجرة اليسرى، افتح: **FCUBS CheckBook Test** → **FCUBSAccServiceSoapBinding** → **QueryCheckBook** → **Request 1**
   - اضغط على زر **▶ Submit Request** (الزر الأخضر)
   - شاهد الاستجابة في الجانب الأيمن!

5. **تشغيل الاختبارات التلقائية:**
   - افتح: **CheckBook Test Suite** → **Test Query CheckBook**
   - اضغط بزر الماوس الأيمن → **Run**
   - شاهد النتائج (يجب أن تكون جميعها ✅ خضراء)

---

### 📝 الطريقة اليدوية: إنشاء المشروع من الصفر


### الخطوة 1: تشغيل الخادم
تأكد أن الخادم يعمل:
```bash
cd server
npm run soap:test
```
يجب أن ترى رسالة: `🚀 خادم SOAP التجريبي يعمل على المنفذ: 8080`

### الخطوة 2: إنشاء مشروع جديد في SoapUI

1. افتح **SoapUI**
2. اضغط على **File** → **New SOAP Project**
3. في نافذة الإنشاء:
   - **Project Name**: `FCUBS CheckBook Test`
   - **Initial WSDL**: اتركه فارغاً (لأننا نستخدم خدمة بدون WSDL)
   - اضغط **OK**

### الخطوة 3: إضافة طلب SOAP يدوياً

1. انقر بزر الماوس الأيمن على المشروع
2. اختر **New SOAP Mock Service** أو **Add WSDL** → **Cancel**
3. بدلاً من ذلك، اختر **New Request**
4. أو استخدم الطريقة التالية:

#### الطريقة الأسهل:
1. في SoapUI، اذهب إلى **File** → **New REST Project**
2. ثم احذفه واختر **New SOAP Project**
3. في خانة **Initial WSDL**، ضع: `http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService?wsdl`
   (حتى لو لم يكن موجود، سنضيف الطلب يدوياً)

### الخطوة 4: إنشاء طلب يدوي

1. انقر بزر الماوس الأيمن على المشروع
2. اختر **New Request**
3. سمّه: `QueryCheckBook`
4. في نافذة الطلب:
   - **Endpoint**: `http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService`
   - **Method**: POST

### الخطوة 5: إضافة محتوى الطلب (Request XML)

في منطقة الطلب، الصق الكود التالي:

```xml
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
</soapenv:Envelope>
```

### الخطوة 6: تعيين الـ Headers

في SoapUI، في أسفل نافذة الطلب:
1. اذهب إلى تبويب **Headers**
2. أضف Header جديد:
   - **Name**: `Content-Type`
   - **Value**: `text/xml; charset=utf-8`

### الخطوة 7: إرسال الطلب

1. اضغط على زر **▶ Submit Request** (الزر الأخضر)
2. انتظر الاستجابة

### الخطوة 8: مراجعة الاستجابة

يجب أن ترى استجابة XML مشابهة لهذه:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
   <S:Body>
      <QUERYCHECKBOOK_IOFS_RES xmlns="http://fcubs.ofss.com/service/FCUBSAccService">
         <FCUBS_HEADER>
            <MSGSTAT>SUCCESS</MSGSTAT>
            ...
         </FCUBS_HEADER>
         <FCUBS_BODY>
            <Chq-Bk-Details-Full>
               <ACCOUNT>001001000811217</ACCOUNT>
               <FIRST_CHEQUE_NUMBER>734</FIRST_CHEQUE_NUMBER>
               <CHEQUE_LEAVES>10</CHEQUE_LEAVES>
               ...
            </Chq-Bk-Details-Full>
         </FCUBS_BODY>
      </QUERYCHECKBOOK_IOFS_RES>
   </S:Body>
</S:Envelope>
```

### 🎯 اختبار بيانات مختلفة

جرّب تغيير القيم التالية في الطلب:

```xml
<!-- مثال 1: حساب مختلف -->
<fcub:ACCOUNT_BRANCH>002</fcub:ACCOUNT_BRANCH>
<fcub:ACCOUNT>002002000999888</fcub:ACCOUNT>
<fcub:FIRST_CHEQUE_NUMBER>1000</fcub:FIRST_CHEQUE_NUMBER>

<!-- مثال 2: رقم شيك مختلف -->
<fcub:ACCOUNT_BRANCH>001</fcub:ACCOUNT_BRANCH>
<fcub:ACCOUNT>001001000811217</fcub:ACCOUNT>
<fcub:FIRST_CHEQUE_NUMBER>500</fcub:FIRST_CHEQUE_NUMBER>
```

### ⚠️ استكشاف الأخطاء

#### المشكلة: Connection Refused
**الحل**: تأكد أن الخادم يعمل على المنفذ 8080
```bash
npm run soap:test
```

#### المشكلة: Invalid XML
**الحل**: تأكد من نسخ الـ XML بشكل صحيح بدون أخطاء في الـ tags

#### المشكلة: No Response
**الحل**: تحقق من الـ endpoint URL:
```
http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService
```

### 📊 فحص السجلات (Logs)

في terminal حيث يعمل الخادم، ستشاهد:
```
📨 تم استلام طلب SOAP
📋 البيانات المستخرجة:
  - فرع الحساب: 001
  - رقم الحساب: 001001000811217
  - رقم الشيك الأول: 734
✅ تم إنشاء الاستجابة بنجاح
```

---

## 🧪 اختبار باستخدام Postman (بديل)

1. افتح Postman
2. أنشئ طلب جديد من نوع `POST`
3. ضع الـ URL: `http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService`
4. في Headers أضف:
   - `Content-Type`: `text/xml`
5. في Body اختر `raw` و `XML` والصق محتوى الطلب أعلاه
6. اضغط Send

## 📝 ملاحظات

- الخادم يولد تلقائياً:
  - رقم رسالة عشوائي (MSGID)
  - التاريخ والوقت الحالي
  - قائمة بـ 10 شيكات (الأول بحالة "U" والباقي "N")
  
- الخادم يدعم CORS للسماح بالطلبات من Frontend

- يمكنك تشغيل هذا الخادم بالتوازي مع خادم التطبيق الرئيسي

## 🔍 معلومات إضافية

### حالات الشيكات:
- `U`: Used (مستخدم)
- `N`: New (جديد)
- `C`: Cancelled (ملغي)
- `S`: Stopped (موقوف)

### رموز النجاح:
- `MSGSTAT: SUCCESS` - العملية نجحت
- `WCODE: ST-SAVE-023` - تم استرجاع السجل بنجاح
