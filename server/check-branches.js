const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBranches() {
  try {
    console.log('🔍 جاري التحقق من الفروع في قاعدة البيانات...\n');
    
    const branches = await prisma.branch.findMany({
      orderBy: { id: 'asc' }
    });

    if (branches.length === 0) {
      console.log('⚠️  لا توجد فروع في قاعدة البيانات!');
      console.log('\nيمكنك إضافة فروع من خلال:');
      console.log('1. الدخول إلى النظام');
      console.log('2. الذهاب إلى صفحة الفروع');
      console.log('3. إضافة الفروع المطلوبة\n');
      return;
    }

    console.log(`✅ تم العثور على ${branches.length} فرع:\n`);
    
    branches.forEach((branch, index) => {
      console.log(`${index + 1}. ${branch.branchName}`);
      console.log(`   - رقم الفرع: ${branch.branchNumber || '❌ غير محدد'}`);
      console.log(`   - رقم التوجيه: ${branch.routingNumber}`);
      console.log(`   - الموقع: ${branch.branchLocation}`);
      console.log('');
    });

    // التحقق من الفروع المطلوبة
    const requiredBranches = ['001', '002', '003'];
    console.log('\n🔍 التحقق من الفروع المطلوبة:\n');
    
    for (const code of requiredBranches) {
      const branch = branches.find(b => b.branchNumber === code);
      if (branch) {
        console.log(`✅ الفرع ${code}: ${branch.branchName}`);
      } else {
        console.log(`❌ الفرع ${code}: غير موجود`);
      }
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBranches();
