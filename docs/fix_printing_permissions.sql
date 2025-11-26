-- إصلاح صلاحيات الطباعة
-- هذا السكريبت يضيف صلاحية PRINTING لجميع المستخدمين النشطين

-- 1. تحقق من وجود صلاحية PRINTING
SELECT * FROM "Permission" WHERE "permissionCode" = 'PRINTING';

-- 2. تحقق من المستخدمين الحاليين وصلاحياتهم
SELECT 
  u.id,
  u.username,
  u."isAdmin",
  u."isActive",
  STRING_AGG(p."permissionCode", ', ') as permissions
FROM "User" u
LEFT JOIN "UserPermission" up ON u.id = up."userId"
LEFT JOIN "Permission" p ON up."permissionId" = p.id
GROUP BY u.id, u.username, u."isAdmin", u."isActive"
ORDER BY u.id;

-- 3. أضف صلاحية PRINTING لجميع المستخدمين النشطين الذين لا يملكونها
INSERT INTO "UserPermission" ("userId", "permissionId", "createdAt")
SELECT 
  u.id,
  p.id,
  NOW()
FROM "User" u
CROSS JOIN "Permission" p
WHERE u."isActive" = true
  AND p."permissionCode" = 'PRINTING'
  AND NOT EXISTS (
    SELECT 1 
    FROM "UserPermission" up 
    WHERE up."userId" = u.id 
      AND up."permissionId" = p.id
  );

-- 4. تحقق من النتيجة
SELECT 
  u.id,
  u.username,
  u."isAdmin",
  STRING_AGG(p."permissionCode", ', ') as permissions
FROM "User" u
LEFT JOIN "UserPermission" up ON u.id = up."userId"
LEFT JOIN "Permission" p ON up."permissionId" = p.id
WHERE u."isActive" = true
GROUP BY u.id, u.username, u."isAdmin"
ORDER BY u.id;

-- بديل: اجعل مستخدم معين admin (لديه جميع الصلاحيات)
-- استبدل 'your_username' باسم المستخدم الفعلي
-- UPDATE "User" SET "isAdmin" = true WHERE username = 'your_username';
