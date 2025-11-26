# ⚡ دليل الإعداد السريع للمتغيرات البيئية

## 🎯 الخطوات الأساسية (3 دقائق)

### 1️⃣ Backend Setup
```bash
cd server
cp .env.example .env
```

**عدّل `.env`:**
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/checksystem"
JWT_SECRET=your_very_secure_secret_key_here
PORT=5000
HOST=10.250.100.40
CLIENT_URL=http://localhost:3040
```

### 2️⃣ Frontend Setup
```bash
cd client
cp .env.local.example .env.local
```

**عدّل `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3️⃣ تشغيل المشروع
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

---

## 📝 المتغيرات المطلوبة فقط

### Backend (`.env`):
| المتغير | مثال | ملاحظة |
|---------|------|--------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/db` | **مطلوب** |
| `JWT_SECRET` | `my_secret_key_2024` | **مطلوب** - استخدم قيمة قوية |
| `CLIENT_URL` | `http://localhost:3040` | **مطلوب** - للـ CORS |
| `HOST` | `10.250.100.40` | اختياري (افتراضي: localhost) |
| `PORT` | `5000` | اختياري (افتراضي: 5000) |

### Frontend (`.env.local`):
| المتغير | مثال | ملاحظة |
|---------|------|--------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | **مطلوب** |

---

## ✅ التحقق السريع

### Backend يعمل؟
```bash
curl http://localhost:5000/api/health
# يجب أن ترى: {"status":"ok"}
```

### Frontend يتصل بـ Backend؟
افتح: http://localhost:3040
سجل الدخول: `admin` / `Admin@123`

---

## 🔧 إعدادات شائعة

### للتطوير المحلي:
**Backend:**
```env
HOST=localhost
CLIENT_URL=http://localhost:3040
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### للشبكة المحلية (LAN):
**Backend:**
```env
HOST=10.250.100.40
CLIENT_URL=http://localhost:3000
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## ⚠️ أخطاء شائعة

| الخطأ | السبب | الحل |
|-------|-------|------|
| Database connection failed | `DATABASE_URL` خاطئ | تحقق من اسم المستخدم/كلمة المرور |
| CORS Error | `CLIENT_URL` لا يطابق Frontend | تأكد من التطابق الكامل |
| Cannot connect to API | `NEXT_PUBLIC_API_URL` خاطئ | تحقق من عنوان Backend |
| JWT Error | `JWT_SECRET` مفقود | أضف قيمة قوية للـ JWT_SECRET |

---

## 📚 للمزيد من التفاصيل

- **[ENV_VARIABLES_USAGE.md](./docs/ENV_VARIABLES_USAGE.md)** - شرح كامل لكل متغير
- **[ENV_SETUP.md](./docs/ENV_SETUP.md)** - دليل الإعداد الشامل
- **[START_HERE.md](./docs/START_HERE.md)** - دليل البدء الكامل

---

✨ **جاهز للبدء!**
