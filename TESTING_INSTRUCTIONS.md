# تعليمات الاختبار الفوري

## المشكلة
```
Request body: {}  ← البيانات فارغة!
```

## الخطوات للاختبار

### 1. أعد تشغيل الخادم والعميل
```bash
# في terminal الخادم
Ctrl+C
npm run dev

# في terminal العميل  
Ctrl+C
npm run dev
```

### 2. افتح التطبيق
1. افتح `http://10.250.100.40:5000/print`
2. افتح Developer Tools (F12)
3. اختر tab "Console"

### 3. جرب الطباعة
1. أدخل رقم حساب: `100012345678901`
2. اضغط "استعلام"
3. اضغط "طباعة"

### 4. راقب Console
يجب أن ترى:
```
🖨️ Sending print request with data: { account_number: "100012345678901" }
Account object: { ... }
📤 printingService.printCheckbook called with: { account_number: "100012345678901" }
🌐 API Request: {
  method: "POST",
  url: "/printing/print",
  data: { account_number: "100012345678901" }
}
🔧 Axios Interceptor - Request config: {
  method: "POST",
  url: "/printing/print",
  data: { account_number: "100012345678901" },
  headers: { ... }
}
```

### 5. راقب terminal الخادم
يجب أن ترى:
```
🖨️ ===== PRINT REQUEST RECEIVED =====
Request Body: {
  "account_number": "100012345678901"
}
```

## إذا لم تظهر البيانات في Console

### الاحتمال 1: الحساب غير موجود
```javascript
// في Console المتصفح
console.log('Account:', account);
```
إذا كان `null` أو `undefined` → المشكلة في الاستعلام

### الاحتمال 2: مشكلة في الكود
انسخ الرسائل من Console وشاركها

## اختبار بديل - استخدم fetch مباشرة

في Console المتصفح:
```javascript
const token = localStorage.getItem('token');

fetch('http://10.250.100.40:5000/api/printing/print', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    account_number: '100012345678901'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

إذا نجح هذا → المشكلة في axios
إذا فشل → المشكلة في الصلاحيات أو الخادم

## اختبار من صفحة HTML
1. افتح `d:\CheckSystem\test-print.html`
2. احصل على token من Console: `localStorage.getItem('token')`
3. الصقه في الصفحة
4. اضغط "اختبار الطباعة"

## ما يجب أن تشاركه معي:
1. ✅ جميع الرسائل من Console المتصفح
2. ✅ جميع الرسائل من terminal الخادم
3. ✅ نتيجة اختبار fetch المباشر
4. ✅ نتيجة صفحة test-print.html
