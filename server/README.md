# Check Printing System - Server (مع Prisma)

Backend server للنظام طباعة الشيكات المصرفية مع دعم MICR - **الآن مع Prisma ORM!**

## 🚀 البدء السريع

```bash
# 1. تثبيت المكتبات
cd server
npm install

# 2. إنشاء قاعدة البيانات
psql -U postgres -c "CREATE DATABASE check_printing_system;"

# 3. تحديث معلومات قاعدة البيانات في .env
# تحقق من DATABASE_URL

# 4. تشغيل Prisma migrations
npm run prisma:migrate
# اسم الـ migration: init

# 5. إضافة بيانات أولية
npm run db:seed

# 6. تشغيل الخادم
npm run dev
```

الخادم سيعمل على: **http://localhost:5000**

## ✨ الجديد: Prisma ORM

تم تحويل المشروع بالكامل لاستخدام Prisma بدلاً من raw SQL queries!

### المميزات:
- ✅ **Type-safe queries** - TypeScript types تلقائية
- ✅ **Auto-completion** - IntelliSense ممتاز
- ✅ **Migration management** - إدارة احترافية للـ database changes
- ✅ **Relations** - سهولة في العلاقات بين الجداول
- ✅ **Prisma Studio** - GUI رائع لإدارة البيانات

### أوامر Prisma:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Reset database (development)
npx prisma migrate reset

# Seed database
npm run db:seed

# Open Prisma Studio (GUI)
npm run prisma:studio
```

راجع **[PRISMA_SETUP.md](./PRISMA_SETUP.md)** للدليل الكامل!

## 📚 الوثائق

- **[PRISMA_SETUP.md](./PRISMA_SETUP.md)** - دليل Prisma الشامل ⭐ جديد
- **[SETUP.md](./SETUP.md)** - دليل التثبيت المفصل
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - توثيق كامل لجميع endpoints
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - خلاصة شاملة للمشروع
- **[postman_collection.json](./postman_collection.json)** - مجموعة Postman للاختبار

## 👤 المستخدمون الافتراضيون

### Admin
- Username: `admin`
- Password: `[REDACTED]`

### Demo User  
- Username: `demo_user`
- Password: `demo123`

## المتطلبات

- Node.js 18+
- PostgreSQL 14+
- npm أو yarn

## الأوامر المتاحة

```bash
# Development
npm run dev              # تشغيل الخادم مع hot reload
npm run build            # بناء للإنتاج

# Prisma
npm run prisma:generate  # توليد Prisma Client
npm run prisma:migrate   # تشغيل migrations
npm run prisma:studio    # فتح Prisma Studio GUI
npm run db:seed          # إضافة بيانات أولية

# Production
npm start                # تشغيل النسخة المبنية
npm run prisma:migrate:deploy  # Run migrations في production
```

## الهيكل

```
server/
├── prisma/
│   ├── schema.prisma        # Prisma schema
│   ├── seed.ts              # Seed script
│   └── migrations/          # Migration files
│
├── src/
│   ├── controllers/         # معالجات الطلبات (6 files)
│   ├── lib/
│   │   └── prisma.ts        # Prisma Client instance
│   ├── middleware/          # Middleware (3 files)
│   ├── models/              # Models مع Prisma (6 files)
│   ├── routes/              # المسارات (7 files)
│   ├── services/            # منطق الأعمال (6 files)
│   ├── types/               # TypeScript types
│   ├── utils/               # أدوات مساعدة
│   └── index.ts             # Entry point
│
├── package.json
├── tsconfig.json
└── .env
```

## API Endpoints

### Authentication (1)
- `POST /api/auth/login` - تسجيل الدخول

### Branches (5)
- `GET /api/branches` - عرض الكل
- `GET /api/branches/:id` - عرض واحد
- `POST /api/branches` - إنشاء (Admin)
- `PUT /api/branches/:id` - تحديث (Admin)
- `DELETE /api/branches/:id` - حذف (Admin)

### Users (7)
- `GET /api/users/me` - المستخدم الحالي
- `GET /api/users` - الكل (Admin)
- `GET /api/users/:id` - واحد (Admin)
- `POST /api/users` - إنشاء (Admin)
- `PUT /api/users/:id` - تحديث (Admin)
- `DELETE /api/users/:id` - حذف (Admin)
- `GET /api/users/permissions` - الصلاحيات

### Inventory (4)
- `GET /api/inventory` - عرض المخزون
- `GET /api/inventory/:stockType` - بالنوع
- `POST /api/inventory/add` - إضافة
- `GET /api/inventory/transactions/history` - السجل

### Accounts (3)
- `GET /api/accounts` - الكل
- `GET /api/accounts/:id` - واحد
- `POST /api/accounts/query` - استعلام

### Printing (3)
- `POST /api/printing/print` - طباعة دفتر شيكات ⭐
- `GET /api/printing/history` - سجل الطباعة
- `GET /api/printing/statistics` - إحصائيات

### Health (1)
- `GET /api/health` - فحص صحة الخادم

## Security

- ✅ كلمات المرور مشفرة (bcrypt)
- ✅ JWT للمصادقة
- ✅ Helmet للأمان
- ✅ CORS محدد
- ✅ Validation على جميع المدخلات
- ✅ Prisma للحماية من SQL injection

## 🆕 Changes in Prisma Version

### What Changed:

1. **Dependencies:**
   - ❌ Removed `pg` package
   - ✅ Added `@prisma/client` and `prisma`

2. **Database Layer:**
   - ❌ Removed `src/database/pool.ts`
   - ❌ Removed `src/database/migrate.ts`
   - ❌ Removed `src/database/seed.ts`
   - ✅ Added `src/lib/prisma.ts`
   - ✅ Added `prisma/schema.prisma`
   - ✅ Added `prisma/seed.ts`

3. **Models:**
   - All models now use Prisma Client
   - Type-safe queries
   - Auto-completion support

4. **Scripts:**
   - ❌ Removed `npm run migrate`
   - ❌ Removed `npm run seed`
   - ✅ Added `npm run prisma:migrate`
   - ✅ Added `npm run db:seed`
   - ✅ Added `npm run prisma:studio`

## 🔧 Troubleshooting

### خطأ: "Prisma Client not generated"

```bash
npm run prisma:generate
```

### خطأ: "Database does not exist"

```bash
psql -U postgres -c "CREATE DATABASE check_printing_system;"
```

### خطأ: "Can't reach database server"

تحقق من:
1. PostgreSQL يعمل
2. `DATABASE_URL` في `.env` صحيح

### مشاهدة البيانات:

```bash
npm run prisma:studio
# ثم افتح http://localhost:5000:5555
```

## 📖 التالي

- راجع **[PRISMA_SETUP.md](./PRISMA_SETUP.md)** للتفاصيل الكاملة
- راجع **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** لتوثيق API
- استورد **[postman_collection.json](./postman_collection.json)** للاختبار

---

**تم تحديث المشروع لاستخدام Prisma ORM!** ✨🚀
