-- مخزون منفصل لكل فرع (أفراد/شركات). المصدق يبقى عاماً.

ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "branch_id" INTEGER;
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "branch_id" INTEGER;

-- ربط حركات المخزون القديمة بفرع المستخدم إن وُجد
UPDATE "inventory_transactions" t
SET "branch_id" = u."branch_id"
FROM "users" u
WHERE t."user_id" = u."id"
  AND t."branch_id" IS NULL
  AND t."stock_type" IN (1, 2)
  AND u."branch_id" IS NOT NULL;

-- حفظ الكميات الحالية قبل إعادة التوزيع
CREATE TEMP TABLE _inv_qty AS
SELECT "stock_type", COALESCE(SUM("quantity"), 0)::int AS qty
FROM "inventory"
WHERE "stock_type" IN (1, 2)
GROUP BY "stock_type";

-- حذف صفوف أفراد/شركات القديمة (العامة)
DELETE FROM "inventory" WHERE "stock_type" IN (1, 2);

-- إنشاء صف مخزون لكل فرع × (أفراد، شركات)
INSERT INTO "inventory" ("stock_type", "quantity", "branch_id", "created_at", "updated_at")
SELECT s.stock_type, 0, b.id, NOW(), NOW()
FROM "branches" b
CROSS JOIN (VALUES (1), (2)) AS s(stock_type);

-- وضع الكمية القديمة على أول فرع (يمكن تصحيحها لاحقاً من الشاشة)
WITH first_branch AS (
  SELECT id FROM "branches" ORDER BY id ASC LIMIT 1
)
UPDATE "inventory" i
SET "quantity" = q.qty, "updated_at" = NOW()
FROM _inv_qty q, first_branch fb
WHERE i."branch_id" = fb.id
  AND i."stock_type" = q.stock_type;

-- المصدق: التأكد من صف واحد بدون فرع
INSERT INTO "inventory" ("stock_type", "quantity", "branch_id", "created_at", "updated_at")
SELECT 3, 0, NULL, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "inventory" WHERE "stock_type" = 3 AND "branch_id" IS NULL
);

-- قيود العلاقات والفرادة
DO $$ BEGIN
  ALTER TABLE "inventory"
    ADD CONSTRAINT "inventory_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "inventory_branch_id_stock_type_key"
  ON "inventory" ("branch_id", "stock_type");

CREATE INDEX IF NOT EXISTS "inventory_branch_id_idx" ON "inventory"("branch_id");
CREATE INDEX IF NOT EXISTS "inventory_transactions_branch_id_idx" ON "inventory_transactions"("branch_id");
CREATE INDEX IF NOT EXISTS "inventory_transactions_stock_type_idx" ON "inventory_transactions"("stock_type");
