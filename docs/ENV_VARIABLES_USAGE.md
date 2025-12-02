# 📝 استخدام المتغيرات البيئية في المشروع

هذا الدليل يوضح كيف يستخدم المشروع ملفات `.env` والمتغيرات البيئية.

---

## 📂 ملفات البيئة في المشروع

### Backend (Server):
- **`.env.example`** - ملف نموذجي يحتوي على جميع المتغيرات المطلوبة (موجود في Git)
- **`.env`** - ملف الإعدادات الفعلي (محمي بـ `.gitignore` - لا يُرفع إلى Git)

### Frontend (Client):
- **`.env.local.example`** - ملف نموذجي للمتغيرات (موجود في Git)
- **`.env.local`** - ملف الإعدادات الفعلي (محمي بـ `.gitignore` - لا يُرفع إلى Git)

---

## 🔧 المتغيرات المستخدمة في Backend

### 1. Database Configuration
```typescript
// في: server/src/lib/prisma.ts
DATABASE_URL="postgresql://username:password@localhost:5432/checksystem"
```

**الاستخدام:**
- يُستخدم بواسطة Prisma للاتصال بقاعدة البيانات
- يتم قراءته تلقائياً من ملف `.env`

---

### 2. JWT Configuration
```typescript
// في: server/src/services/auth.service.ts
JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'
JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
```

**الاستخدام:**
- `JWT_SECRET`: مفتاح سري لتشفير الـ tokens
- `JWT_EXPIRES_IN`: مدة صلاحية الـ token (مثل: 24h, 7d, 30d)

**مثال:**
```env
JWT_SECRET=check_printing_secret_key_2024_very_secure
JWT_EXPIRES_IN=24h
```

---

### 3. Server Configuration
```typescript
// في: server/src/index.ts
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';
```

**الاستخدام:**
- `PORT`: المنفذ الذي سيعمل عليه السيرفر
- `HOST`: عنوان IP أو domain للسيرفر

**مثال:**
```env
PORT=5000
HOST=10.250.100.40
```

---

### 4. Client Configuration (CORS)
```typescript
// في: server/src/index.ts
origin: process.env.CLIENT_URL || 'http://10.250.100.40:5000'
```

**الاستخدام:**
- `CLIENT_URL`: عنوان تطبيق Frontend (للسماح بـ CORS)

**مثال:**
```env
CLIENT_URL=http://10.250.100.40:5000
```

---

### 5. Banking API Configuration (اختياري)
```typescript
// في: server/src/utils/bankAPI.ts
this.baseUrl = process.env.BANK_API_URL || 'http://10.250.100.40:5000:8000/api';
this.apiKey = process.env.BANK_API_KEY || '';
```

**الاستخدام:**
- `BANK_API_URL`: عنوان API البنك الخارجي
- `BANK_API_KEY`: مفتاح API للمصادقة

**مثال:**
```env
BANK_API_URL=http://10.250.100.40:5000:8000/api
BANK_API_KEY=test_bank_api_key
```

---

### 6. Environment Mode
```typescript
// في: server/src/index.ts و config/logger.config.ts
process.env.NODE_ENV
```

**الاستخدام:**
- يحدد بيئة التشغيل (development, production, test)
- يؤثر على مستوى الـ logging والأداء

**مثال:**
```env
NODE_ENV=development
```

---

## 🎨 المتغيرات المستخدمة في Frontend

### 1. API URL
```typescript
// في: client/src/lib/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://10.250.100.40:5000/api';
```

**الاستخدام:**
- عنوان Backend API
- **يجب** أن يبدأ بـ `NEXT_PUBLIC_` ليكون متاحاً في المتصفح

**مثال:**
```env
NEXT_PUBLIC_API_URL=http://10.250.100.40:5000/api
```

**ملاحظة مهمة:**
- في Next.js، فقط المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` تكون متاحة في كود المتصفح
- المتغيرات الأخرى تكون متاحة فقط في server-side code

---

## 📋 ملف .env.example الكامل (Backend)

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/checksystem"

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
HOST=10.250.100.40

# Client Configuration
CLIENT_URL=http://10.250.100.40:5000

# Banking API Configuration (Optional)
BANK_API_URL=http://10.250.100.40:5000:8000/api
BANK_API_KEY=test_bank_api_key

# Environment Mode (optional)
NODE_ENV=development
```

---

## 📋 ملف .env.local.example الكامل (Frontend)

```env
# API Configuration
# استخدم عنوان الـ backend server الخاص بك
NEXT_PUBLIC_API_URL=http://10.250.100.40:5000/api
```

---

## 🚀 كيفية الإعداد

### الخطوة 1: Backend
```bash
cd server

# نسخ الملف النموذجي
cp .env.example .env

# تعديل الملف حسب إعداداتك
nano .env  # أو استخدم أي محرر نصوص
```

### الخطوة 2: Frontend
```bash
cd client

# نسخ الملف النموذجي
cp .env.local.example .env.local

# تعديل الملف حسب إعداداتك
nano .env.local  # أو استخدم أي محرر نصوص
```

### الخطوة 3: إعادة التشغيل
```bash
# أوقف التطبيقات (Ctrl+C)

# أعد تشغيل Backend
cd server
npm run dev

# أعد تشغيل Frontend (في terminal آخر)
cd client
npm run dev
```

---

## ⚠️ ملاحظات أمنية مهمة

### ✅ افعل:
1. **استخدم `.env.example`** كمرجع للمتغيرات المطلوبة
2. **احفظ `.env` محلياً** ولا ترفعه إلى Git
3. **استخدم قيم قوية** للـ `JWT_SECRET`
4. **غيّر القيم الافتراضية** في الإنتاج

### ❌ لا تفعل:
1. **لا ترفع `.env`** إلى Git أبداً
2. **لا تشارك `.env`** مع أحد
3. **لا تستخدم كلمات مرور ضعيفة**
4. **لا تترك القيم الافتراضية** في الإنتاج

---

## 🔍 التحقق من الإعدادات

### Backend:
```bash
cd server
npm run dev
```

**يجب أن ترى:**
```
✅ Database connected successfully
🚀 Server is running on port 5000
📝 Environment: development
🌐 API URL: http://10.250.100.40:5000/api
```

### Frontend:
```bash
cd client
npm run dev
```

**يجب أن ترى:**
```
✓ Ready on http://10.250.100.40:5000
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: "Database connection failed"
**الحل:**
- تحقق من `DATABASE_URL` في `.env`
- تأكد من تشغيل PostgreSQL
- تأكد من صحة اسم المستخدم وكلمة المرور

### المشكلة: "CORS Error"
**الحل:**
- تحقق من `CLIENT_URL` في server `.env`
- يجب أن يطابق عنوان Frontend بالضبط
- أعد تشغيل Backend بعد التعديل

### المشكلة: "Cannot connect to API"
**الحل:**
- تحقق من `NEXT_PUBLIC_API_URL` في client `.env.local`
- يجب أن يطابق عنوان Backend
- أعد تشغيل Frontend بعد التعديل

### المشكلة: "JWT Error"
**الحل:**
- تحقق من `JWT_SECRET` في `.env`
- تأكد من أنه نفس القيمة في جميع instances
- امسح الـ tokens القديمة وسجل الدخول مرة أخرى

---

## 📊 جدول المتغيرات

| المتغير | الموقع | الاستخدام | مطلوب؟ | القيمة الافتراضية |
|---------|--------|-----------|--------|-------------------|
| `DATABASE_URL` | Backend | اتصال قاعدة البيانات | ✅ نعم | - |
| `JWT_SECRET` | Backend | تشفير الـ tokens | ✅ نعم | - |
| `JWT_EXPIRES_IN` | Backend | مدة صلاحية token | ❌ لا | 24h |
| `PORT` | Backend | منفذ السيرفر | ❌ لا | 5000 |
| `HOST` | Backend | عنوان السيرفر | ❌ لا | localhost |
| `CLIENT_URL` | Backend | عنوان Frontend (CORS) | ✅ نعم | http://10.250.100.40:5000 |
| `BANK_API_URL` | Backend | API البنك الخارجي | ❌ لا | - |
| `BANK_API_KEY` | Backend | مفتاح API البنك | ❌ لا | - |
| `NODE_ENV` | Backend | بيئة التشغيل | ❌ لا | development |
| `NEXT_PUBLIC_API_URL` | Frontend | عنوان Backend API | ✅ نعم | http://10.250.100.40:5000/api |

---

## 🔗 روابط ذات صلة

- [ENV_SETUP.md](./ENV_SETUP.md) - دليل الإعداد الشامل
- [START_HERE.md](./START_HERE.md) - دليل البدء
- [PRISMA_MIGRATION_COMPLETE.md](./PRISMA_MIGRATION_COMPLETE.md) - إعداد قاعدة البيانات

---

**آخر تحديث:** نوفمبر 2025
