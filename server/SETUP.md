# دليل إعداد وتشغيل Server

## المتطلبات الأساسية

قبل البدء، تأكد من تثبيت:

1. **Node.js** (الإصدار 18 أو أحدث)
   ```bash
   node --version
   ```

2. **PostgreSQL** (الإصدار 14 أو أحدث)
   ```bash
   psql --version
   ```

3. **npm** أو **yarn**
   ```bash
   npm --version
   ```

## خطوات التثبيت

### 1. تثبيت المكتبات

```bash
cd server
npm install
```

### 2. إعداد قاعدة البيانات

#### إنشاء قاعدة البيانات

**على Windows:**
```powershell
# افتح PostgreSQL من cmd
psql -U postgres

# داخل PostgreSQL shell
CREATE DATABASE check_printing_system;
\q
```

**على Linux/Mac:**
```bash
sudo -u postgres psql
CREATE DATABASE check_printing_system;
\q
```

#### تحديث ملف .env

الملف `.env` موجود بالفعل في المجلد. قم بتحديث بيانات الاتصال بقاعدة البيانات:

```env
DB_HOST=10.250.100.40
DB_PORT=5432
DB_NAME=check_printing_system
DB_USER=postgres
DB_PASSWORD=your_password_here  # ضع كلمة المرور الخاصة بك
```

### 3. تشغيل Migration (إنشاء الجداول)

```bash
npm run migrate
```

يجب أن ترى رسالة: `Migration completed successfully!`

### 4. تشغيل Seed (إضافة بيانات أولية)

```bash
npm run seed
```

هذا سيقوم بإنشاء:
- فرع افتراضي (الفرع الرئيسي)
- مستخدم admin (username: `admin`, password: `[REDACTED]`)
- مستخدم تجريبي (username: `demo_user`, password: `demo123`)
- مخزون أولي (100 دفتر أفراد، 50 دفتر شركات)

⚠️ **مهم:** قم بتغيير كلمة مرور admin في بيئة الإنتاج!

### 5. تشغيل Server

**Development mode (مع hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

يجب أن ترى:
```
✅ Database connected successfully
🚀 Server is running on port 5000
📝 Environment: development
🌐 API URL: http://10.250.100.40:5000/api
```

## اختبار API

### 1. فحص صحة الخادم

```bash
curl http://10.250.100.40:5000/api/health
```

يجب أن تحصل على:
```json
{
  "status": "ok",
  "message": "Check Printing System API is running"
}
```

### 2. تسجيل الدخول

```bash
curl -X POST http://10.250.100.40:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "[REDACTED]"
  }'
```

يجب أن تحصل على token و معلومات المستخدم.

### 3. الحصول على قائمة الفروع

```bash
curl http://10.250.100.40:5000/api/branches \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## هيكل المشروع

```
server/
├── src/
│   ├── controllers/         # معالجات الطلبات
│   │   ├── auth.controller.ts
│   │   ├── branch.controller.ts
│   │   ├── user.controller.ts
│   │   ├── inventory.controller.ts
│   │   ├── account.controller.ts
│   │   └── printing.controller.ts
│   │
│   ├── database/           # إدارة قاعدة البيانات
│   │   ├── pool.ts        # اتصال قاعدة البيانات
│   │   ├── schema.sql     # هيكل الجداول
│   │   ├── migrate.ts     # تشغيل Migration
│   │   └── seed.ts        # البيانات الأولية
│   │
│   ├── middleware/         # Middleware functions
│   │   ├── auth.middleware.ts          # المصادقة والتفويض
│   │   ├── validation.middleware.ts     # التحقق من المدخلات
│   │   └── errorHandler.middleware.ts   # معالجة الأخطاء
│   │
│   ├── models/             # نماذج قاعدة البيانات
│   │   ├── Branch.model.ts
│   │   ├── User.model.ts
│   │   ├── Permission.model.ts
│   │   ├── Account.model.ts
│   │   ├── Inventory.model.ts
│   │   └── PrintOperation.model.ts
│   │
│   ├── routes/             # تعريف المسارات
│   │   ├── auth.routes.ts
│   │   ├── branch.routes.ts
│   │   ├── user.routes.ts
│   │   ├── inventory.routes.ts
│   │   ├── account.routes.ts
│   │   ├── printing.routes.ts
│   │   └── index.ts
│   │
│   ├── services/           # منطق الأعمال
│   │   ├── auth.service.ts
│   │   ├── branch.service.ts
│   │   ├── user.service.ts
│   │   ├── inventory.service.ts
│   │   ├── account.service.ts
│   │   └── printing.service.ts
│   │
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   │
│   ├── utils/              # أدوات مساعدة
│   │   └── bankAPI.ts     # عميل API البنك
│   │
│   └── index.ts            # نقطة البداية
│
├── dist/                   # الملفات المترجمة
├── node_modules/
├── .env                    # متغيرات البيئة
├── .env.example            # نموذج ملف البيئة
├── .gitignore
├── package.json
├── tsconfig.json
├── nodemon.json
└── README.md
```

## الأوامر المتاحة

```bash
# Development
npm run dev          # تشغيل الخادم مع hot reload

# Production
npm run build        # ترجمة TypeScript إلى JavaScript
npm start            # تشغيل الخادم من الملفات المترجمة

# Database
npm run migrate      # تشغيل migration (إنشاء الجداول)
npm run seed         # إضافة بيانات أولية
```

## المستخدمون الافتراضيون

بعد تشغيل `npm run seed`:

### Admin User
- **Username:** admin
- **Password:** [REDACTED]
- **الصلاحيات:** جميع الصلاحيات

### Demo User
- **Username:** demo_user
- **Password:** demo123
- **الصلاحيات:** PRINTING, REPORTING

## المشاكل الشائعة

### 1. خطأ في الاتصال بقاعدة البيانات

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**الحل:**
- تأكد من تشغيل PostgreSQL
- تحقق من بيانات الاتصال في `.env`

### 2. خطأ Migration failed

```
Migration failed: relation already exists
```

**الحل:**
- الجداول موجودة بالفعل، لا داعي للقلق
- أو قم بحذف قاعدة البيانات وإعادة إنشائها:
```bash
dropdb check_printing_system
createdb check_printing_system
npm run migrate
npm run seed
```

### 3. خطأ Permission denied

```
EACCES: permission denied
```

**الحل:**
- تأكد من صلاحيات PostgreSQL user
- أو استخدم superuser في `.env`

## التطوير

### إضافة Endpoint جديد

1. إنشاء Service في `src/services/`
2. إنشاء Controller في `src/controllers/`
3. إضافة Route في `src/routes/`
4. تحديث `src/routes/index.ts`

### إضافة جدول جديد

1. تحديث `src/database/schema.sql`
2. إنشاء Model في `src/models/`
3. تشغيل `npm run migrate`

## الأمان

- ✅ كلمات المرور مشفرة (bcrypt)
- ✅ JWT للمصادقة
- ✅ Helmet للأمان
- ✅ CORS محدد
- ✅ Input validation
- ✅ صلاحيات على مستوى الـ endpoints

## الدعم

في حالة وجود مشاكل:
1. تحقق من ملف `.env`
2. تأكد من تشغيل PostgreSQL
3. راجع logs في terminal

