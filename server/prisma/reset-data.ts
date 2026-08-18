/**
 * تصفير بيانات التشغيل في قاعدة البيانات مع الإبقاء على:
 * - مقاسات/إعدادات طباعة الشيكات (print_settings) بكل أنواعها بما فيها المصدقة (1–4)
 * - المستخدمين وصلاحياتهم (users, permissions, user_permissions)
 * - إعدادات النظام (system_settings): روابط SOAP/API، الشاشات المخفية، مواضع القسائم، إلخ
 * - الفروع (branches) لأن المستخدمين مرتبطون بها
 * - فئات العملاء (customer_categories / عدادات الفئات)
 *
 * يُصفَّر / يُحذف:
 * - الحسابات، سجلات الطباعة، عمليات الطباعة، الشيكات المطبوعة
 * - المخزون (الكميات → 0) وسجل حركات المخزون
 * - سجلات المصدق (دفاتر، صكوك فردية، صكوك المنظومة)
 * - عدادات تسلسل المصدق (→ 0)
 *
 * الاستخدام:
 *   npm run db:reset-data -- --confirm
 *
 * ⚠️  عملية لا رجعة فيها. أوقف الخادم قبل التشغيل.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRESERVED = {
  printSettings: 'مقاسات وإعدادات طباعة الشيكات',
  users: 'المستخدمون',
  permissions: 'الصلاحيات',
  userPermissions: 'ربط المستخدمين بالصلاحيات',
  systemSettings: 'إعدادات النظام (روابط API وغيرها)',
  branches: 'الفروع',
  customerCategories: 'فئات العملاء (عدادات الفئات)',
} as const;

async function resetSequences() {
  const tables = [
    'accounts',
    'inventory_transactions',
    'print_operations',
    'print_logs',
    'printed_cheques',
    'certified_check_logs',
    'certified_check_print_records',
    'certified_check_print_update_logs',
    'certified_instrument_logs',
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'), 1, false);`
      );
    } catch {
      // بعض الجداول قد لا تحتوي على تسلسل id أو الاسم مختلف — نتجاهل
    }
  }
}

async function ensureInventoryRows() {
  const rows = [
    { id: 1, stockType: 1 },
    { id: 2, stockType: 2 },
    { id: 3, stockType: 3 },
  ] as const;

  for (const row of rows) {
    await prisma.inventory.upsert({
      where: { id: row.id },
      update: { quantity: 0 },
      create: { id: row.id, stockType: row.stockType, quantity: 0 },
    });
  }
}

async function main() {
  const confirmed = process.argv.includes('--confirm');
  if (!confirmed) {
    console.error(`
❌ يجب تأكيد العملية صراحةً لتجنب الحذف بالخطأ.

   npm run db:reset-data -- --confirm

ما سيُحفظ:
${Object.entries(PRESERVED)
  .map(([key, label]) => `  • ${label}`)
  .join('\n')}

ما سيُصفَّر:
  • كل سجلات الطباعة والحسابات والمخزون التشغيلي
  • سجلات الشيكات المصدقة (دفاتر / فردي / منظومة)
`);
    process.exit(1);
  }

  console.log('🔄 بدء تصفير بيانات التشغيل...\n');

  const before = {
    accounts: await prisma.account.count(),
    printLogs: await prisma.printLog.count(),
    printOperations: await prisma.printOperation.count(),
    printedCheques: await prisma.printedCheque.count(),
    inventoryTx: await prisma.inventoryTransaction.count(),
    certifiedLogs: await prisma.certifiedCheckLog.count(),
    certifiedRecords: await prisma.certifiedCheckPrintRecord.count(),
    instrumentLogs: await prisma.certifiedInstrumentLog.count(),
    categories: await prisma.customerCategory.count(),
  };

  const kept = {
    printSettings: await prisma.printSettings.count(),
    users: await prisma.user.count(),
    permissions: await prisma.permission.count(),
    systemSettings: await prisma.systemSetting.count(),
    branches: await prisma.branch.count(),
    categories: before.categories,
  };

  await prisma.$transaction(async (tx) => {
    await tx.certifiedCheckPrintUpdateLog.deleteMany({});
    await tx.certifiedCheckPrintRecord.deleteMany({});
    await tx.certifiedInstrumentLog.deleteMany({});
    await tx.certifiedCheckLog.deleteMany({});
    await tx.printOperation.deleteMany({});
    await tx.printedCheque.deleteMany({});
    await tx.printLog.deleteMany({});
    await tx.inventoryTransaction.deleteMany({});
    await tx.account.deleteMany({});

    await tx.certifiedCheckSerial.updateMany({
      data: { lastSerial: 0, customStartSerial: null },
    });

    await tx.inventory.updateMany({ data: { quantity: 0 } });
  });

  await ensureInventoryRows();
  await resetSequences();

  console.log('📊 السجلات المحذوفة (قبل التصفير):');
  console.log(`   حسابات: ${before.accounts}`);
  console.log(`   سجلات طباعة (print_logs): ${before.printLogs}`);
  console.log(`   عمليات طباعة (print_operations): ${before.printOperations}`);
  console.log(`   شيكات مطبوعة: ${before.printedCheques}`);
  console.log(`   حركات مخزون: ${before.inventoryTx}`);
  console.log(`   سجلات دفاتر مصدقة: ${before.certifiedLogs}`);
  console.log(`   سجلات صكوك مصدقة فردية: ${before.certifiedRecords}`);
  console.log(`   سجلات صك المنظومة: ${before.instrumentLogs}`);

  console.log('\n✅ ما بقي دون مساس:');
  console.log(`   إعدادات الطباعة (print_settings): ${kept.printSettings}`);
  console.log(`   مستخدمون: ${kept.users}`);
  console.log(`   صلاحيات: ${kept.permissions}`);
  console.log(`   إعدادات نظام (system_settings): ${kept.systemSettings}`);
  console.log(`   فروع: ${kept.branches}`);
  console.log(`   فئات عملاء: ${kept.categories}`);

  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          'soap_api_url',
          'soap_ia_api_url',
          'soap_instrument_api_url',
          'hidden_screens',
          'certified_check_stub_positions',
        ],
      },
    },
    select: { key: true, value: true },
  });

  if (settings.length) {
    console.log('\n🔗 روابط/إعدادات API المحفوظة:');
    for (const s of settings) {
      const preview =
        s.key === 'hidden_screens' || s.key === 'certified_check_stub_positions'
          ? '(JSON محفوظ)'
          : s.value;
      console.log(`   ${s.key}: ${preview}`);
    }
  }

  console.log('\n✅ اكتمل تصفير بيانات التشغيل بنجاح.');
}

main()
  .catch((error) => {
    console.error('❌ فشل تصفير البيانات:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
