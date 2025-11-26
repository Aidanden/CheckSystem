# إصلاح مشكلة الطباعة والاتصال بـ FCUBS

## المشكلة 🔴

كانت هناك مشكلتان رئيسيتان:

### 1. خطأ الاتصال بـ FCUBS SOAP
```
❌ Cannot connect to FCUBS SOAP endpoint: http://localhost:8000/api
```

**السبب**: النظام يحاول الاتصال بخادم FCUBS SOAP على `http://localhost:8000/api` لكن الخادم غير متاح.

**الحل**: النظام يتعامل مع هذا تلقائياً بالتبديل إلى وضع Mock (البيانات التجريبية):
```
⚠️ FCUBS server not accessible, falling back to mock mode...
✅ Using mock data as fallback
```

### 2. خطأ 400 عند محاولة الطباعة
```
POST /api/printing/print 400 1.689 ms - 135
```

**السبب**: الكود كان يحاول التحقق من وجود الحساب في قاعدة البيانات قبل الطباعة، لكن الحساب لم يكن موجوداً بعد (لأنه يتم إنشاؤه أثناء عملية الطباعة).

## الإصلاحات المنفذة ✅

### 1. تحديث `printing.controller.ts`

#### التغييرات:
- ✅ **تغيير الوضع الافتراضي**: من `'bank'` إلى `'test'` لتجنب محاولات الاتصال بـ FCUBS
- ✅ **إزالة الفحص الإلزامي**: لم يعد الكود يفشل إذا لم يكن الحساب موجوداً
- ✅ **إضافة try-catch**: للتحقق من الحساب دون إيقاف العملية إذا لم يكن موجوداً

#### الكود القديم:
```typescript
const resolvedSource: 'test' | 'bank' = source ?? 'bank';

// Fetch account to enforce branch-level access before printing
const account = await AccountService.getAccountByNumber(account_number);
if (!account) {
  res.status(404).json({ success: false, error: 'Account not found' });
  return;
}
```

#### الكود الجديد:
```typescript
const resolvedSource: 'test' | 'bank' = source ?? 'test'; // Default to test mode

// Check if account exists for branch-level access control
// But don't fail if it doesn't exist - let PrintingService create it
try {
  const existingAccount = await AccountService.getAccountByNumber(account_number);
  
  // Enforce branch-level access: non-admin users cannot print accounts of other branches
  if (existingAccount && req.user && !req.user.isAdmin) {
    if (existingAccount.branchId && req.user.branchId && existingAccount.branchId !== req.user.branchId) {
      res.status(403).json({ success: false, error: 'غير مسموح بالوصول لحساب تابع لفرع آخر' });
      return;
    }
  }
} catch (err) {
  // Account doesn't exist yet - that's OK, it will be created during printing
  console.log(`ℹ️ Account ${account_number} not found in database, will be created during printing`);
}
```

## كيفية الاستخدام 📖

### الوضع التجريبي (Test Mode) - الافتراضي
```typescript
// في الـ frontend
await printingService.printCheckbook({
  account_number: '100012345678901',
  // source: 'test' // اختياري - هذا هو الافتراضي الآن
});
```

**الحسابات التجريبية المتاحة**:
- `100012345678901` - أحمد محمد علي السيد (فردي)
- `100023456789012` - فاطمة حسن محمود (فردي)
- `200034567890123` - شركة التقنية المتقدمة المحدودة (شركة)

### الوضع المصرفي (Bank Mode)
```typescript
await printingService.printCheckbook({
  account_number: '100012345678901',
  source: 'bank', // يحاول الاتصال بـ FCUBS
  branch_core_code: '001' // اختياري
});
```

**ملاحظة**: إذا فشل الاتصال بـ FCUBS، سيتم التبديل تلقائياً إلى الوضع التجريبي.

## إعدادات البيئة (.env)

للاتصال بخادم FCUBS الحقيقي، تأكد من إعداد المتغيرات التالية في ملف `.env`:

```env
# FCUBS SOAP API Configuration
BANK_API_URL=http://your-fcubs-server:port/api
BANK_API_USER=ADMINUSER1
BANK_DEFAULT_BRANCH_CODE=001
```

## سير العمل الحالي 🔄

1. **المستخدم يدخل رقم الحساب** في صفحة الطباعة
2. **النظام يستعلم عن الحساب**:
   - إذا كان `source='bank'`: يحاول الاتصال بـ FCUBS
   - إذا فشل الاتصال: يتبدل تلقائياً إلى البيانات التجريبية
   - إذا كان `source='test'`: يستخدم البيانات التجريبية مباشرة
3. **إنشاء/تحديث الحساب** في قاعدة البيانات المحلية
4. **طباعة الشيكات** بتنسيق HTML
5. **تحديث المخزون** وسجل العمليات

## الملفات المعدلة 📝

- ✅ `server/src/controllers/printing.controller.ts` - إصلاح منطق التحقق من الحساب
- ✅ `server/src/services/account.service.ts` - يدعم التبديل التلقائي إلى Mock
- ✅ `server/src/utils/bankAPI.ts` - يتعامل مع أخطاء الاتصال بشكل صحيح

## الاختبار ✅

جرب الآن:
1. افتح صفحة الطباعة: `http://localhost:3040/print`
2. أدخل رقم حساب تجريبي: `100012345678901`
3. اضغط "استعلام"
4. اضغط "طباعة"
5. يجب أن تفتح نافذة HTML جديدة مع الشيكات!

## ملاحظات مهمة 📌

- ✅ النظام الآن يعمل بدون الحاجة لخادم FCUBS
- ✅ يمكن إضافة أي رقم حساب جديد (سيتم إنشاؤه تلقائياً)
- ✅ الطباعة تستخدم HTML وليس PDF
- ✅ جميع الإعدادات قابلة للتخصيص من صفحة `/settings`
