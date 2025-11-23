import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create default permissions
  const permissions = [
    {
      permissionName: 'إدارة المستخدمين والفروع',
      permissionCode: 'MANAGE_USERS_BRANCHES',
      description: 'القدرة على إضافة/تعديل المستخدمين والفروع',
    },
    {
      permissionName: 'طباعة',
      permissionCode: 'PRINTING',
      description: 'السماح للمستخدم بتنفيذ عملية طباعة الشيكات',
    },
    {
      permissionName: 'تسليم دفاتر الشيكات',
      permissionCode: 'HANDOVER',
      description: 'السماح للمستخدم بتسجيل أن الدفتر المطبوع قد تم تسليمه للعميل',
    },
    {
      permissionName: 'عرض التقارير',
      permissionCode: 'REPORTING',
      description: 'السماح للمستخدم بالاطلاع على تقارير الطباعة والمخزون',
    },
    {
      permissionName: 'إدارة المخزون',
      permissionCode: 'INVENTORY_MANAGEMENT',
      description: 'السماح للمستخدم بإضافة أرصدة دفاتر الشيكات الخام',
    },
  ];

  console.log('Creating permissions...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { permissionCode: perm.permissionCode },
      update: {},
      create: perm,
    });
  }
  console.log('✅ Permissions created');

  // Create two branches: Tripoli (main) and Misrata
  console.log('Creating branches for Tripoli and Misrata...');
  const tripoli = await prisma.branch.upsert({
    where: { routingNumber: '03100111' },
    update: {},
    create: {
      branchName: 'الفرع الرئيسي - طرابلس',
      branchLocation: 'طرابلس - طريق السكة',
      routingNumber: '03100111',
    },
  });

  const misrata = await prisma.branch.upsert({
    where: { routingNumber: '03100231' },
    update: {},
    create: {
      branchName: 'الفرع مصراته',
      branchLocation: 'مصراته - شارع بنغازي',
      routingNumber: '03100231',
    },
  });

  console.log('✅ Branches created: Tripoli ID=', tripoli.id, ' Misrata ID=', misrata.id);

  // Remove other branches (if any) — user requested to delete other branches
  await prisma.branch.deleteMany({
    where: {
      routingNumber: {
        notIn: [tripoli.routingNumber, misrata.routingNumber],
      },
    },
  });
  console.log('✅ Removed other branches (if existed)');

  // Create main admin user (assigned to Tripoli)
  console.log('Creating admin user for Tripoli...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      branchId: tripoli.id,
      isAdmin: true,
      isActive: true,
    },
  });
  console.log('✅ Admin user created with ID:', adminUser.id);
  console.log('   Username: admin');
  console.log('   Password: [REDACTED] (change in production)');
  console.log('   ⚠️  PLEASE CHANGE THE DEFAULT PASSWORD IN PRODUCTION!');

  // Create branch-specific users for Tripoli
  console.log('Creating Tripoli branch users...');
  const tripManagerPass = await bcrypt.hash('trip_manager_123', 10);
  const tripManager = await prisma.user.upsert({
    where: { username: 'trip_manager' },
    update: {},
    create: {
      username: 'trip_manager',
      passwordHash: tripManagerPass,
      branchId: tripoli.id,
      isAdmin: false,
      isActive: true,
    },
  });

  const tripOperatorPass = await bcrypt.hash('trip_operator_123', 10);
  const tripOperator = await prisma.user.upsert({
    where: { username: 'trip_operator' },
    update: {},
    create: {
      username: 'trip_operator',
      passwordHash: tripOperatorPass,
      branchId: tripoli.id,
      isAdmin: false,
      isActive: true,
    },
  });
  console.log('✅ Tripoli users created');

  // Create branch-specific users for Misrata
  console.log('Creating Misrata branch users...');
  const msrManagerPass = await bcrypt.hash('msr_manager_123', 10);
  const msrManager = await prisma.user.upsert({
    where: { username: 'msr_manager' },
    update: {},
    create: {
      username: 'msr_manager',
      passwordHash: msrManagerPass,
      branchId: misrata.id,
      isAdmin: false,
      isActive: true,
    },
  });

  const msrOperatorPass = await bcrypt.hash('msr_operator_123', 10);
  const msrOperator = await prisma.user.upsert({
    where: { username: 'msr_operator' },
    update: {},
    create: {
      username: 'msr_operator',
      passwordHash: msrOperatorPass,
      branchId: misrata.id,
      isAdmin: false,
      isActive: true,
    },
  });
  console.log('✅ Misrata users created');

  // Assign permissions: only global admin gets MANAGE_USERS_BRANCHES; branch users get PRINTING and REPORTING
  const allPermissions = await prisma.permission.findMany();
  const managePerm = await prisma.permission.findUnique({ where: { permissionCode: 'MANAGE_USERS_BRANCHES' } });
  const printingPerm = await prisma.permission.findUnique({ where: { permissionCode: 'PRINTING' } });
  const reportingPerm = await prisma.permission.findUnique({ where: { permissionCode: 'REPORTING' } });

  if (allPermissions.length > 0) {
    for (const permission of allPermissions) {
      if (managePerm && permission.id === managePerm.id) {
        // grant manage permission only to global admin
        await prisma.userPermission.upsert({
          where: { userId_permissionId: { userId: adminUser.id, permissionId: permission.id } },
          update: {},
          create: { userId: adminUser.id, permissionId: permission.id },
        });
      }
    }
  }

  // Grant printing/reporting to branch users
  const branchUsers = [tripManager, tripOperator, msrManager, msrOperator];
  for (const u of branchUsers) {
    if (printingPerm) {
      await prisma.userPermission.upsert({
        where: { userId_permissionId: { userId: u.id, permissionId: printingPerm.id } },
        update: {},
        create: { userId: u.id, permissionId: printingPerm.id },
      });
    }
    if (reportingPerm) {
      await prisma.userPermission.upsert({
        where: { userId_permissionId: { userId: u.id, permissionId: reportingPerm.id } },
        update: {},
        create: { userId: u.id, permissionId: reportingPerm.id },
      });
    }
  }
  console.log('✅ Permissions assigned to branch users and admin');

  // Set all non-admin users' password to '123' (hashed), leave admin unchanged
  console.log('Updating passwords: setting password "123" for all non-admin users...');
  const defaultPassHash = await bcrypt.hash('123', 10);
  await prisma.user.updateMany({
    where: { username: { not: 'admin' } },
    data: { passwordHash: defaultPassHash },
  });
  console.log('✅ Updated passwords for non-admin users (password = 123)');

  // Create initial inventory
  console.log('Creating initial inventory...');
  await prisma.inventory.upsert({
    where: { id: 1 },
    update: { quantity: 100 },
    create: {
      stockType: 1, // Individual
      quantity: 100,
    },
  });

  await prisma.inventory.upsert({
    where: { id: 2 },
    update: { quantity: 50 },
    create: {
      stockType: 2, // Corporate
      quantity: 50,
    },
  });
  console.log('✅ Initial inventory added (100 individual, 50 corporate)');

  // Create test accounts (15 digits each)
  console.log('Creating test accounts...');

  // Create accounts for Tripoli (branchId = tripoli.id)
  await prisma.account.upsert({
    where: { accountNumber: '100031100000001' },
    update: {},
    create: {
      accountNumber: '100031100000001',
      accountHolderName: 'أمينة محمد علي',
      accountType: 1,
      branchId: tripoli.id,
      lastPrintedSerial: 0,
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: '100031100000002' },
    update: {},
    create: {
      accountNumber: '100031100000002',
      accountHolderName: 'خالد حسين سعيد',
      accountType: 1,
      branchId: tripoli.id,
      lastPrintedSerial: 0,
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: '200031100000001' },
    update: {},
    create: {
      accountNumber: '200031100000001',
      accountHolderName: 'شركة طرابلس للتقنية المحدودة',
      accountType: 2,
      branchId: tripoli.id,
      lastPrintedSerial: 0,
    },
  });

  // Create accounts for Misrata (branchId = misrata.id)
  await prisma.account.upsert({
    where: { accountNumber: '100031200000001' },
    update: {},
    create: {
      accountNumber: '100031200000001',
      accountHolderName: 'سارة محمد عبدالرحمن',
      accountType: 1,
      branchId: misrata.id,
      lastPrintedSerial: 0,
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: '100031200000002' },
    update: {},
    create: {
      accountNumber: '100031200000002',
      accountHolderName: 'مروان عبدالغني',
      accountType: 1,
      branchId: misrata.id,
      lastPrintedSerial: 0,
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: '200031200000001' },
    update: {},
    create: {
      accountNumber: '200031200000001',
      accountHolderName: 'شركة مصراته للصناعات',
      accountType: 2,
      branchId: misrata.id,
      lastPrintedSerial: 0,
    },
  });

  console.log('✅ Test accounts created for Tripoli and Misrata (each linked to their branch)');

  // 8. Create default print settings
  console.log('\n🎨 Creating default print settings...');

  // Individual check settings (235 x 86 mm)
  await prisma.printSettings.upsert({
    where: { accountType: 1 },
    update: {
      checkWidth: 235,
      checkHeight: 86,
      branchNameX: 117.5,
      branchNameY: 15,
      branchNameFontSize: 12,
      branchNameAlign: 'center',
      serialNumberX: 200,
      serialNumberY: 25,
      serialNumberFontSize: 10,
      serialNumberAlign: 'right',
      accountHolderNameX: 20,
      accountHolderNameY: 60,
      accountHolderNameFontSize: 10,
      accountHolderNameAlign: 'left',
      micrLineX: 117.5,
      micrLineY: 78,
      micrLineFontSize: 10,
      micrLineAlign: 'center',
    },
    create: {
      accountType: 1,
      checkWidth: 235,
      checkHeight: 86,
      branchNameX: 117.5,
      branchNameY: 15,
      branchNameFontSize: 12,
      branchNameAlign: 'center',
      serialNumberX: 200,
      serialNumberY: 25,
      serialNumberFontSize: 10,
      serialNumberAlign: 'right',
      accountHolderNameX: 20,
      accountHolderNameY: 60,
      accountHolderNameFontSize: 10,
      accountHolderNameAlign: 'left',
      micrLineX: 117.5,
      micrLineY: 78,
      micrLineFontSize: 10,
      micrLineAlign: 'center',
    },
  });

  // Corporate check settings (240 x 86 mm)
  await prisma.printSettings.upsert({
    where: { accountType: 2 },
    update: {
      checkWidth: 240,
      checkHeight: 86,
      branchNameX: 120,
      branchNameY: 15,
      branchNameFontSize: 12,
      branchNameAlign: 'center',
      serialNumberX: 205,
      serialNumberY: 25,
      serialNumberFontSize: 10,
      serialNumberAlign: 'right',
      accountHolderNameX: 20,
      accountHolderNameY: 60,
      accountHolderNameFontSize: 10,
      accountHolderNameAlign: 'left',
      micrLineX: 120,
      micrLineY: 78,
      micrLineFontSize: 10,
      micrLineAlign: 'center',
    },
    create: {
      accountType: 2,
      checkWidth: 240,
      checkHeight: 86,
      branchNameX: 120,
      branchNameY: 15,
      branchNameFontSize: 12,
      branchNameAlign: 'center',
      serialNumberX: 205,
      serialNumberY: 25,
      serialNumberFontSize: 10,
      serialNumberAlign: 'right',
      accountHolderNameX: 20,
      accountHolderNameY: 60,
      accountHolderNameFontSize: 10,
      accountHolderNameAlign: 'left',
      micrLineX: 120,
      micrLineY: 78,
      micrLineFontSize: 10,
      micrLineAlign: 'center',
    },
  });

  console.log('✅ Print settings created:');
  console.log('  - Individual settings (235 x 86 mm)');
  console.log('  - Corporate settings (240 x 86 mm)');

  console.log('\n✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

