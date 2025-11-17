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

  // Create default branch
  console.log('Creating default branch...');
  const branch = await prisma.branch.upsert({
    where: { routingNumber: '1100000001' },
    update: {},
    create: {
      branchName: 'الفرع الرئيسي',
      branchLocation: 'الرياض - شارع الملك فهد',
      routingNumber: '1100000001',
    },
  });
  console.log('✅ Default branch created with ID:', branch.id);

  // Create admin user
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      branchId: branch.id,
      isAdmin: true,
      isActive: true,
    },
  });
  console.log('✅ Admin user created with ID:', adminUser.id);
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   ⚠️  PLEASE CHANGE THE DEFAULT PASSWORD IN PRODUCTION!');

  // Assign all permissions to admin
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: adminUser.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        permissionId: permission.id,
      },
    });
  }
  console.log('✅ All permissions assigned to admin user');

  // Create demo user
  console.log('Creating demo user...');
  const demoPassword = await bcrypt.hash('demo123', 10);
  const demoUser = await prisma.user.upsert({
    where: { username: 'demo_user' },
    update: {},
    create: {
      username: 'demo_user',
      passwordHash: demoPassword,
      branchId: branch.id,
      isAdmin: false,
      isActive: true,
    },
  });
  console.log('✅ Demo user created with ID:', demoUser.id);
  console.log('   Username: demo_user');
  console.log('   Password: demo123');

  // Assign PRINTING and REPORTING permissions to demo user
  const printingPerm = await prisma.permission.findUnique({
    where: { permissionCode: 'PRINTING' },
  });
  const reportingPerm = await prisma.permission.findUnique({
    where: { permissionCode: 'REPORTING' },
  });

  if (printingPerm) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: demoUser.id,
          permissionId: printingPerm.id,
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        permissionId: printingPerm.id,
      },
    });
  }

  if (reportingPerm) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: demoUser.id,
          permissionId: reportingPerm.id,
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        permissionId: reportingPerm.id,
      },
    });
  }
  console.log('✅ PRINTING and REPORTING permissions assigned to demo user');

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
  
  // Individual Account 1
  await prisma.account.upsert({
    where: { accountNumber: '100012345678901' },
    update: {},
    create: {
      accountNumber: '100012345678901',
      accountHolderName: 'أحمد محمد علي السيد',
      accountType: 1,
      lastPrintedSerial: 0,
    },
  });

  // Individual Account 2
  await prisma.account.upsert({
    where: { accountNumber: '100023456789012' },
    update: {},
    create: {
      accountNumber: '100023456789012',
      accountHolderName: 'فاطمة حسن محمود',
      accountType: 1,
      lastPrintedSerial: 0,
    },
  });

  // Corporate Account
  await prisma.account.upsert({
    where: { accountNumber: '200034567890123' },
    update: {},
    create: {
      accountNumber: '200034567890123',
      accountHolderName: 'شركة التقنية المتقدمة المحدودة',
      accountType: 2,
      lastPrintedSerial: 0,
    },
  });

  console.log('✅ Test accounts created:');
  console.log('  - 100012345678901 (فردي: أحمد محمد علي السيد)');
  console.log('  - 100023456789012 (فردي: فاطمة حسن محمود)');
  console.log('  - 200034567890123 (شركة: شركة التقنية المتقدمة المحدودة)');

  // 8. Create default print settings
  console.log('\n🎨 Creating default print settings...');
  
  // Individual check settings (235 x 86 mm)
  await prisma.printSettings.upsert({
    where: { accountType: 1 },
    update: {},
    create: {
      accountType: 1,
      checkWidth: 235,
      checkHeight: 86,
      branchNameX: 117.5,
      branchNameY: 10,
      branchNameFontSize: 14,
      branchNameAlign: 'center',
      serialNumberX: 200,
      serialNumberY: 18,
      serialNumberFontSize: 12,
      serialNumberAlign: 'right',
      accountHolderNameX: 20,
      accountHolderNameY: 70,
      accountHolderNameFontSize: 10,
      accountHolderNameAlign: 'left',
      micrLineX: 117.5,
      micrLineY: 80,
      micrLineFontSize: 12,
      micrLineAlign: 'center',
    },
  });

  // Corporate check settings (240 x 86 mm)
  await prisma.printSettings.upsert({
    where: { accountType: 2 },
    update: {},
    create: {
      accountType: 2,
      checkWidth: 240,
      checkHeight: 86,
      branchNameX: 120,
      branchNameY: 10,
      branchNameFontSize: 14,
      branchNameAlign: 'center',
      serialNumberX: 205,
      serialNumberY: 18,
      serialNumberFontSize: 12,
      serialNumberAlign: 'right',
      accountHolderNameX: 20,
      accountHolderNameY: 70,
      accountHolderNameFontSize: 10,
      accountHolderNameAlign: 'left',
      micrLineX: 120,
      micrLineY: 80,
      micrLineFontSize: 12,
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

