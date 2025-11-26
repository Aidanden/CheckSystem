# دليل استكشاف أخطاء الطباعة

## المشكلة الحالية
```
POST /api/printing/print 400 2.743 ms - 135
Validation failed
```

## الأسباب المحتملة

### 1. مشكلة في التحقق من البيانات (Validation)
الـ validation middleware يتحقق من:
- ✅ `account_number` يجب أن يكون موجوداً وليس فارغاً
- ✅ `account_number` يجب أن يكون نصاً (string)
- ✅ `serial_from` (اختياري) يجب أن يكون رقماً صحيحاً موجباً
- ✅ `serial_to` (اختياري) يجب أن يكون رقماً صحيحاً موجباً

### 2. مشكلة في الصلاحيات (Permissions)
المستخدم يحتاج إلى صلاحية `PRINTING` للطباعة.

## خطوات الحل

### الخطوة 1: تحقق من السجلات (Logs)

بعد التحديثات الأخيرة، سترى رسائل مفصلة في terminal الخادم:

```
❌ Validation failed for request: POST /api/printing/print
Request body: {
  "account_number": "..."
}
Validation errors: [
  {
    "msg": "رقم الحساب مطلوب",
    "param": "account_number",
    "location": "body"
  }
]
```

### الخطوة 2: تحقق من الصلاحيات

#### تحقق من صلاحيات المستخدم:
```sql
SELECT u.username, p.permissionCode 
FROM "User" u
LEFT JOIN "UserPermission" up ON u.id = up.userId
LEFT JOIN "Permission" p ON up.permissionId = p.id
WHERE u.username = 'your_username';
```

#### إضافة صلاحية الطباعة:
```sql
-- احصل على معرف الصلاحية
SELECT id FROM "Permission" WHERE "permissionCode" = 'PRINTING';

-- احصل على معرف المستخدم
SELECT id FROM "User" WHERE username = 'your_username';

-- أضف الصلاحية
INSERT INTO "UserPermission" ("userId", "permissionId", "createdAt")
VALUES (user_id_here, permission_id_here, NOW());
```

### الخطوة 3: اختبار من المتصفح Console

افتح Developer Tools (F12) واكتب:

```javascript
// احصل على الـ token
const token = localStorage.getItem('token');
console.log('Token:', token);

// اختبر الطباعة
fetch('http://localhost:5000/api/printing/print', {
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
.then(data => {
  console.log('Response:', data);
  if (!data.success) {
    console.error('Error:', data.error);
    console.error('Details:', data.details);
  }
})
.catch(err => console.error('Network error:', err));
```

### الخطوة 4: تحقق من البيانات المرسلة

في صفحة الطباعة، افتح Network tab في Developer Tools:
1. اضغط F12
2. اختر tab "Network"
3. حاول الطباعة
4. ابحث عن طلب `/api/printing/print`
5. انقر عليه واختر "Payload" لرؤية البيانات المرسلة

## الحلول السريعة

### الحل 1: استخدم حساب Admin
حسابات Admin لديها جميع الصلاحيات تلقائياً.

```sql
-- اجعل المستخدم admin
UPDATE "User" 
SET "isAdmin" = true 
WHERE username = 'your_username';
```

### الحل 2: أضف صلاحية PRINTING

```sql
-- أضف صلاحية الطباعة للمستخدم
INSERT INTO "UserPermission" ("userId", "permissionId", "createdAt")
SELECT 
  u.id,
  p.id,
  NOW()
FROM "User" u, "Permission" p
WHERE u.username = 'your_username'
  AND p."permissionCode" = 'PRINTING'
  AND NOT EXISTS (
    SELECT 1 FROM "UserPermission" up 
    WHERE up."userId" = u.id AND up."permissionId" = p.id
  );
```

### الحل 3: تحقق من البيانات

تأكد من أن الطلب يحتوي على:
```json
{
  "account_number": "100012345678901"
}
```

وليس:
```json
{
  "accountNumber": "100012345678901"  // ❌ خطأ - underscore مطلوب
}
```

## الملفات المحدثة

1. ✅ `server/src/middleware/validation.middleware.ts` - إضافة logging مفصل
2. ✅ `server/src/routes/printing.routes.ts` - رسائل خطأ بالعربية
3. ✅ `server/src/controllers/printing.controller.ts` - logging مفصل

## الخطوات التالية

1. **جرب الطباعة مرة أخرى**
2. **انسخ السجلات من terminal الخادم** (ستكون مفصلة الآن)
3. **تحقق من صلاحيات المستخدم**
4. **إذا استمرت المشكلة، شارك السجلات الكاملة**

## أمثلة على رسائل الخطأ الجديدة

### خطأ: رقم الحساب فارغ
```json
{
  "success": false,
  "error": "رقم الحساب مطلوب (Account number is required)",
  "details": [...]
}
```

### خطأ: لا توجد صلاحية
```json
{
  "error": "You do not have permission to perform this action",
  "required_permission": "PRINTING"
}
```

### خطأ: المستخدم غير مصادق
```json
{
  "error": "No token provided"
}
```
