# إعداد متغيرات البيئة (Environment Variables)

تم تحديث المشروع لاستخدام متغيرات البيئة بدلاً من العناوين الثابتة.

## 📋 الخطوات المطلوبة

### 1️⃣ إعداد Backend (Server)

انسخ ملف `.env.example` إلى `.env` في مجلد `server`:

```bash
cd server
cp .env.example .env
```

ثم عدّل الملف `.env` حسب إعداداتك:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@10.250.100.40:5432/checksystem"

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
```

**المتغيرات المهمة:**
- `HOST`: عنوان IP الذي سيعمل عليه السيرفر (مثل: `10.250.100.40` أو `10.250.100.40`)
- `PORT`: المنفذ الذي سيعمل عليه السيرفر (افتراضي: `5000`)
- `CLIENT_URL`: عنوان تطبيق الواجهة الأمامية (للـ CORS)

---

### 2️⃣ إعداد Frontend (Client)

انسخ ملف `.env.local.example` إلى `.env.local` في مجلد `client`:

```bash
cd client
cp .env.local.example .env.local
```

ثم عدّل الملف `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://10.250.100.40:5000/api
```

**ملاحظة مهمة:**
- يجب أن يبدأ المتغير بـ `NEXT_PUBLIC_` ليكون متاحاً في المتصفح
- استبدل `10.250.100.40` بعنوان IP الخاص بالسيرفر
- استبدل `5000` بالمنفذ الذي يعمل عليه السيرفر

---

## 🔄 أمثلة للإعدادات المختلفة

### للتطوير المحلي (Local Development):

**Server (.env):**
```env
HOST=10.250.100.40
PORT=5000
CLIENT_URL=http://10.250.100.40:5000
```

**Client (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://10.250.100.40:5000/api
```

---

### للشبكة المحلية (LAN):

**Server (.env):**
```env
HOST=10.250.100.40
PORT=5000
CLIENT_URL=http://10.250.100.40:5000:3000
```

**Client (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://10.250.100.40:5000/api
```

---

### للإنتاج (Production):

**Server (.env):**
```env
HOST=your-domain.com
PORT=5000
CLIENT_URL=https://your-frontend-domain.com
```

**Client (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

---

## ✅ التحقق من الإعدادات

### 1. تشغيل Backend:
```bash
cd server
npm run dev
```

يجب أن ترى:
```
✅ Database connected successfully
🚀 Server is running on port 5000
📝 Environment: development
🌐 API URL: http://10.250.100.40:5000/api
```

### 2. تشغيل Frontend:
```bash
cd client
npm run dev
```

يجب أن يعمل على `http://10.250.100.40:5000` ويتصل بالـ API بنجاح.

---

## 🔍 استكشاف الأخطاء

### المشكلة: Frontend لا يتصل بـ Backend

**الحل:**
1. تأكد من أن `NEXT_PUBLIC_API_URL` في `.env.local` يطابق عنوان Backend
2. تأكد من تشغيل Backend قبل Frontend
3. أعد تشغيل Frontend بعد تعديل `.env.local`

### المشكلة: CORS Error

**الحل:**
1. تأكد من أن `CLIENT_URL` في server `.env` يطابق عنوان Frontend
2. أعد تشغيل Backend بعد التعديل

---

## 📝 ملاحظات مهمة

1. **لا ترفع ملفات `.env` إلى Git** - هي محمية بـ `.gitignore`
2. **استخدم `.env.example` كمرجع** - يحتوي على جميع المتغيرات المطلوبة
3. **أعد تشغيل التطبيق** بعد تعديل ملفات `.env`
4. **للـ Next.js**: المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` فقط متاحة في المتصفح

---

## 🎯 الملفات المحدثة

تم تحديث الملفات التالية لاستخدام متغيرات البيئة:

### Backend:
- `server/src/index.ts` - استخدام `HOST` و `CLIENT_URL`

### Frontend:
- `client/src/lib/api/client.ts` - استخدام `NEXT_PUBLIC_API_URL`
- `client/src/lib/printSettings.api.ts` - استخدام `NEXT_PUBLIC_API_URL`
- `client/src/app/settings/page.tsx` - استخدام `NEXT_PUBLIC_API_URL`
- `client/src/app/history/page.tsx` - استخدام `NEXT_PUBLIC_API_URL`
- `client/next.config.js` - استخدام `NEXT_PUBLIC_API_URL`

---

## 🚀 البدء السريع

```bash
# 1. إعداد Backend
cd server
cp .env.example .env
# عدّل .env حسب إعداداتك
npm run dev

# 2. إعداد Frontend (في terminal آخر)
cd client
cp .env.local.example .env.local
# عدّل .env.local حسب إعداداتك
npm run dev

# 3. افتح المتصفح
# http://10.250.100.40:5000
```

✨ **الآن النظام يستخدم متغيرات البيئة بشكل كامل!**
