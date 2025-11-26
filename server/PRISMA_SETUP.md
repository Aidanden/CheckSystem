# دليل إعداد Prisma - نظام طباعة الشيكات

## ✨ تم تحويل المشروع لاستخدام Prisma ORM!

Prisma يوفر:
- ✅ Type-safe database queries
- ✅ Auto-completion
- ✅ Migration management
- ✅ Excellent developer experience
- ✅ Built-in connection pooling

---

## 📋 خطوات الإعداد

### 1. تثبيت المكتبات

```powershell
cd server
npm install
```

هذا سيثبت:
- `@prisma/client` - Prisma Client
- `prisma` (dev dependency) - Prisma CLI

### 2. إعداد قاعدة البيانات

**إنشاء قاعدة البيانات (إذا لم تكن موجودة):**

```powershell
# Windows PowerShell
psql -U postgres -c "CREATE DATABASE check_printing_system;"

# أو داخل psql
psql -U postgres
CREATE DATABASE check_printing_system;
\q
```

### 3. تحديث .env

تأكد من وجود `DATABASE_URL` في `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/check_printing_system
```

**Format:**
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

### 4. توليد Prisma Client

```powershell
npm run prisma:generate
```

هذا يولد Prisma Client من schema.prisma

### 5. تشغيل Migrations

```powershell
npm run prisma:migrate
```

سيطلب منك اسم للـ migration. مثلاً: `init`

هذا سيقوم بـ:
- إنشاء جميع الجداول
- إنشاء الـ indexes
- إنشاء الـ relations
- حفظ migration في `prisma/migrations/`

### 6. تشغيل Seed

```powershell
npm run db:seed
```

هذا سيقوم بإضافة:
- ✅ 5 صلاحيات (permissions)
- ✅ فرع افتراضي (الفرع الرئيسي)
- ✅ مستخدم admin (username: admin, password: [REDACTED])
- ✅ مستخدم demo (username: demo_user, password: demo123)
- ✅ مخزون أولي (100 أفراد، 50 شركات)

### 7. تشغيل الخادم

```powershell
npm run dev
```

يجب أن ترى:
```
✅ Database connected successfully
🚀 Server is running on port 5000
```

---

## 📊 Prisma Commands المتاحة

### Development

```powershell
# Generate Prisma Client (بعد تعديل schema)
npm run prisma:generate

# Create & run migration
npm run prisma:migrate

# Reset database (⚠️ يحذف كل البيانات)
npx prisma migrate reset

# Seed database
npm run db:seed
```

### Production

```powershell
# Run existing migrations
npm run prisma:migrate:deploy
```

### Tools

```powershell
# Prisma Studio (GUI للبيانات)
npm run prisma:studio
# ثم افتح: http://localhost:5555
```

---

## 📁 هيكل Prisma

```
server/
├── prisma/
│   ├── schema.prisma        # تعريف Database schema
│   ├── seed.ts              # Script للبيانات الأولية
│   └── migrations/          # Migration files
│       └── YYYYMMDDHHMMSS_migration_name/
│           └── migration.sql
│
└── src/
    ├── lib/
    │   └── prisma.ts        # Prisma Client instance
    ├── models/              # Models (تستخدم Prisma Client)
    └── ...
```

---

## 🗄️ Schema Overview

### الجداول (Models)

```prisma
Branch              // الفروع المصرفية
Permission          // الصلاحيات المتاحة
User                // المستخدمين
UserPermission      // ربط المستخدمين بالصلاحيات
Account             // حسابات العملاء
Inventory           // المخزون الحالي
InventoryTransaction // سجل حركة المخزون
PrintOperation      // سجل عمليات الطباعة
```

### Relations

```
User -> Branch (many-to-one)
User -> UserPermission (one-to-many)
User -> InventoryTransaction (one-to-many)
User -> PrintOperation (one-to-many)

Permission -> UserPermission (one-to-many)

Account -> PrintOperation (one-to-many)

Branch -> PrintOperation (one-to-many)
Branch -> User (one-to-many)
```

---

## 💡 استخدام Prisma في الكود

### مثال: Query

```typescript
import prisma from '../lib/prisma';

// Find all branches
const branches = await prisma.branch.findMany();

// Find by ID
const branch = await prisma.branch.findUnique({
  where: { id: 1 }
});

// Find with relations
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    branch: true,
    userPermissions: {
      include: {
        permission: true
      }
    }
  }
});
```

### مثال: Create

```typescript
const branch = await prisma.branch.create({
  data: {
    branchName: 'فرع جدة',
    branchLocation: 'جدة - شارع التحلية',
    routingNumber: '1100000002'
  }
});
```

### مثال: Update

```typescript
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    isActive: false
  }
});
```

### مثال: Transaction

```typescript
await prisma.$transaction(async (tx) => {
  // Multiple operations
  await tx.inventory.update({...});
  await tx.inventoryTransaction.create({...});
  await tx.printOperation.create({...});
});
```

---

## 🔄 تعديل Schema

إذا أردت تعديل الـ schema:

### 1. عدّل `prisma/schema.prisma`

```prisma
model Branch {
  id             Int       @id @default(autoincrement())
  branchName     String    @map("branch_name")
  // أضف حقل جديد:
  phoneNumber    String?   @map("phone_number")
  // ...
}
```

### 2. إنشاء Migration

```powershell
npm run prisma:migrate
# اسم الـ migration: add_phone_number
```

### 3. توليد Prisma Client جديد

```powershell
npm run prisma:generate
```

الآن الحقل الجديد متاح في الكود!

---

## 🧪 الاختبار

بعد الإعداد، اختبر:

```powershell
# Health check
Invoke-RestMethod http://localhost:5000/api/health

# Login
$body = @{username="admin"; password="[REDACTED]"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:5000/api/auth/login `
    -Method POST -ContentType "application/json" -Body $body
```

---

## 🔍 Prisma Studio

أداة رائعة لعرض وتعديل البيانات:

```powershell
npm run prisma:studio
```

ثم افتح: http://localhost:5555

يمكنك:
- ✅ عرض جميع الجداول
- ✅ تصفح البيانات
- ✅ إضافة/تعديل/حذف records
- ✅ رؤية الـ relations

---

## 🚨 المشاكل الشائعة

### 1. خطأ: "Can't reach database server"

```
Error: P1001: Can't reach database server
```

**الحل:**
- تأكد من تشغيل PostgreSQL
- تحقق من `DATABASE_URL` في `.env`

### 2. خطأ: "Database does not exist"

```
Error: P1003: Database does not exist
```

**الحل:**
```powershell
psql -U postgres -c "CREATE DATABASE check_printing_system;"
```

### 3. خطأ: "Prisma Client not generated"

```
Error: @prisma/client did not initialize yet
```

**الحل:**
```powershell
npm run prisma:generate
```

### 4. خطأ: Migration conflicts

```
Error: Migration ... already exists
```

**الحل:**
```powershell
# Reset database (⚠️ يحذف كل البيانات)
npx prisma migrate reset
# ثم seed مرة أخرى
npm run db:seed
```

---

## ✨ مميزات Prisma المستخدمة

### 1. Type Safety ✅

```typescript
// TypeScript يعرف تلقائياً نوع البيانات
const branch: Branch = await prisma.branch.findUnique({
  where: { id: 1 }
});

// Auto-completion يعمل!
branch.branchName // ✅
branch.wrongField // ❌ TypeScript Error
```

### 2. Relations ✅

```typescript
// جلب المستخدم مع الفرع والصلاحيات تلقائياً
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    branch: true,
    userPermissions: {
      include: { permission: true }
    }
  }
});
```

### 3. Transactions ✅

```typescript
// جميع العمليات تنجح معاً أو تفشل معاً
await prisma.$transaction([
  prisma.inventory.update({...}),
  prisma.printOperation.create({...})
]);
```

### 4. Migrations ✅

```
prisma/migrations/
├── 20240115_init/
│   └── migration.sql
└── 20240116_add_phone/
    └── migration.sql
```

كل تغيير محفوظ ويمكن تطبيقه على Production!

---

## 📚 المراجع

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

## ✅ التحقق من التثبيت

```powershell
# 1. Check Prisma installed
npx prisma --version

# 2. Check database connection
npx prisma db pull --dry-run

# 3. Check Prisma Client generated
# يجب أن يكون موجود في:
# node_modules/.prisma/client/

# 4. Check migrations
# يجب أن تكون موجودة في:
# prisma/migrations/
```

---

## 🎉 الخلاصة

```
✅ Prisma ORM مثبت ويعمل
✅ Schema محدد في prisma/schema.prisma
✅ Models محولة لاستخدام Prisma Client
✅ Services محدثة
✅ Seed script جاهز
✅ Type-safe queries

الخطوة التالية: npm run dev
```

**النظام جاهز مع Prisma!** 🚀

