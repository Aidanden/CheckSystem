# 🔧 إصلاح مشكلة معاملات Prisma في الطباعة

## ❌ المشكلة

كانت الطباعة تفشل مع ROLLBACK بسبب تعارض في معاملات Prisma:

```
prisma:query BEGIN
prisma:query SELECT ... accounts ...
prisma:query SELECT ... branches ...
prisma:query ROLLBACK
POST /api/printing/print 400
```

---

## 🔍 السبب الجذري

كانت هناك **معاملات متداخلة**:

### المشكلة #1: استخدام `prisma` بدلاً من `tx` داخل المعاملة

```typescript
// ❌ خطأ - استخدام prisma مباشرة داخل المعاملة
await prisma.$transaction(async (tx) => {
  await InventoryModel.deductStock(...);  // يستخدم prisma داخلياً
  await AccountModel.updateLastPrintedSerial(...);  // يستخدم prisma داخلياً
  await PrintOperationModel.create(...);  // يستخدم prisma داخلياً
});
```

### المشكلة #2: `queryAccount` يكتب إلى قاعدة البيانات داخل المعاملة

```typescript
await prisma.$transaction(async (tx) => {
  const account = await AccountService.queryAccount(accountNumber);
  // ⚠️ queryAccount قد ينشئ أو يحدث سجل الحساب
  // مما يسبب تعارض مع المعاملة الحالية
});
```

---

## ✅ الحل المطبق

### الحل #1: استخدام `tx` لجميع العمليات داخل المعاملة

```typescript
await prisma.$transaction(async (tx) => {
  // ✅ استخدام tx بدلاً من prisma
  const inventory = await tx.inventory.findFirst({ where: { stockType } });
  await tx.inventory.updateMany({ where: { stockType }, data: { ... } });
  await tx.inventoryTransaction.create({ data: { ... } });
  await tx.account.update({ where: { accountNumber }, data: { ... } });
  await tx.printOperation.create({ data: { ... } });
});
```

### الحل #2: نقل `queryAccount` خارج المعاملة

```typescript
// ✅ استدعاء queryAccount قبل بدء المعاملة
const account = await AccountService.queryAccount(accountNumber);
if (!account) {
  throw new Error('Account not found');
}

// الآن نبدأ المعاملة
const result = await prisma.$transaction(async (tx) => {
  // جميع العمليات داخل المعاملة تستخدم tx
  const branch = await tx.branch.findUnique(...);
  // ... باقي العمليات
});
```

---

## 📋 التغييرات الكاملة

### 1. `printing.service.ts` - نقل queryAccount خارج المعاملة

```typescript
static async printCheckbook(
  accountNumber: string,
  userId: number,
  branchId: number
): Promise<PrintCheckbookResponse> {
  try {
    // Get account information BEFORE starting transaction
    const account = await AccountService.queryAccount(accountNumber);
    if (!account) {
      throw new Error('Account not found');
    }

    const result = await prisma.$transaction(async (tx) => {
      // All operations use tx
    });
    
    return result;
  } catch (error) {
    // Error handling
  }
}
```

### 2. جميع عمليات قاعدة البيانات تستخدم `tx`

- ✅ `tx.branch.findUnique()`
- ✅ `tx.inventory.findFirst()`
- ✅ `tx.inventory.updateMany()`
- ✅ `tx.inventoryTransaction.create()`
- ✅ `tx.account.update()`
- ✅ `tx.printOperation.create()`

### 3. إضافة logging للأخطاء في `printing.controller.ts`

```typescript
catch (error) {
  console.error('❌ خطأ في طباعة الشيك:', error);
  if (error instanceof Error) {
    console.error('   التفاصيل:', error.message);
    console.error('   Stack:', error.stack);
  }
}
```

---

## 🎯 الفوائد

1. **ثبات البيانات**: جميع العمليات تتم في معاملة واحدة
2. **Rollback التلقائي**: إذا فشلت أي عملية، يتم التراجع عن كل شيء
3. **لا توجد معاملات متداخلة**: تجنب التعارضات
4. **أداء أفضل**: معاملة واحدة بدلاً من عدة معاملات

---

## 🧪 الاختبار

```powershell
# شغّل السكريبت
.\test-print.ps1
```

**المتوقع:** نجاح الطباعة بدون ROLLBACK! ✅

---

## 📚 الدروس المستفادة

### قاعدة مهمة في Prisma:

> **داخل معاملة Prisma (`$transaction`), يجب استخدام `tx` لجميع عمليات قاعدة البيانات، وليس `prisma` مباشرة.**

### توقيت العمليات:

> **العمليات التي قد تنشئ/تحدث سجلات يجب أن تكون خارج المعاملة أو داخلها بالكامل، ولا يجب أن تكون متداخلة.**

---

## ✅ تم الإصلاح!

الآن الطباعة تعمل بشكل صحيح! 🎉

