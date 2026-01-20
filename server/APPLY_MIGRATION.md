# تطبيق Migration للشيكات المصدقة

## خطوات تطبيق Migration

1. قم بتطبيق SQL migration يدوياً:
```bash
cd server
psql -U postgres -d check_printing_system -f prisma/migrations/add_certified_check_fields.sql
```

أو استخدم Prisma Studio:
```bash
npx prisma studio
```

ثم قم بتشغيل SQL التالي:
```sql
ALTER TABLE "certified_check_logs" 
ADD COLUMN IF NOT EXISTS "number_of_books" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "custom_start_serial" INTEGER;

ALTER TABLE "certified_check_serials" 
ADD COLUMN IF NOT EXISTS "custom_start_serial" INTEGER;

CREATE INDEX IF NOT EXISTS "certified_check_logs_first_last_serial_idx" ON "certified_check_logs"("first_serial", "last_serial");
```

2. قم بتوليد Prisma Client:
```bash
npx prisma generate
```

3. أعد تشغيل الخادم:
```bash
npm run dev
```
