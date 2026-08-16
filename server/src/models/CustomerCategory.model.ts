import prisma from '../lib/prisma';

/** فئات العملاء (CUSTOMER_CATEGORY) لتمييز 01 أفراد / 02 شركات */

export interface CustomerCategoryData {
  categoryCode: string;
  description: string;
  typeCode: string;
  isActive?: boolean;
}

export function extractCategoryCodeFromAccount(accountNumber: string): string | null {
  const digits = String(accountNumber || '').replace(/\D/g, '');
  if (digits.length < 6) return null;
  return digits.substring(3, 6);
}

export const DEFAULT_CUSTOMER_CATEGORIES: CustomerCategoryData[] = [
  { categoryCode: '227', description: 'الأغراض الشخصية وسترن يونيو', typeCode: '01' },
  { categoryCode: '214', description: 'أفراد / أعمال حرة / رجال أعمال', typeCode: '01' },
  { categoryCode: '203', description: 'شركات خاصة', typeCode: '02' },
  { categoryCode: '217', description: 'موظفي القطاع الخاص', typeCode: '01' },
  { categoryCode: '201', description: 'موظفي المصرف', typeCode: '01' },
  { categoryCode: '234', description: 'نشاط تجاري / صناعي / حرفي (رخصة فردية)', typeCode: '02' },
  { categoryCode: '209', description: 'غير مقيمين / أفراد', typeCode: '01' },
  { categoryCode: '224', description: 'مصارف أجنبية / عملة أجنبية - يورو', typeCode: '02' },
  { categoryCode: '202', description: 'موظفي الدولة', typeCode: '01' },
  { categoryCode: '204', description: 'شركات و مؤسسات عامة', typeCode: '02' },
  { categoryCode: '220', description: 'شركات / عملة أجنبية - دولار', typeCode: '02' },
  { categoryCode: '236', description: 'التجارة الالكترونية', typeCode: '02' },
  { categoryCode: '212', description: 'مؤسسات عسكرية', typeCode: '02' },
  { categoryCode: '222', description: 'شركات / عملة أجنبية - يورو', typeCode: '02' },
  { categoryCode: '218', description: 'التضامن الاجتماعي', typeCode: '01' },
  { categoryCode: '210', description: 'شركات الأجنبية', typeCode: '02' },
  { categoryCode: '219', description: 'أفراد / عملة أجنبية - دولار', typeCode: '01' },
];

export class CustomerCategoryModel {
  static findAll() {
    return prisma.customerCategory.findMany({
      orderBy: [{ typeCode: 'asc' }, { categoryCode: 'asc' }],
    });
  }

  static findById(id: number) {
    return prisma.customerCategory.findUnique({ where: { id } });
  }

  static findByCode(categoryCode: string) {
    return prisma.customerCategory.findUnique({ where: { categoryCode } });
  }

  static create(data: CustomerCategoryData) {
    return prisma.customerCategory.create({
      data: {
        categoryCode: data.categoryCode,
        description: data.description,
        typeCode: data.typeCode,
        isActive: data.isActive ?? true,
      },
    });
  }

  static update(id: number, data: Partial<CustomerCategoryData>) {
    return prisma.customerCategory.update({
      where: { id },
      data,
    });
  }

  static delete(id: number) {
    return prisma.customerCategory.delete({ where: { id } });
  }

  static async count() {
    return prisma.customerCategory.count();
  }

  static async seedDefaults() {
    const count = await prisma.customerCategory.count();
    if (count > 0) return;
    await prisma.customerCategory.createMany({
      data: DEFAULT_CUSTOMER_CATEGORIES,
      skipDuplicates: true,
    });
  }
}
