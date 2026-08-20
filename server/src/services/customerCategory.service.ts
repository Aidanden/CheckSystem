import {
  CustomerCategoryModel,
  CustomerCategoryData,
  extractCategoryCodeFromAccount,
} from '../models/CustomerCategory.model';

export class CustomerCategoryService {
  static findAll() {
    return CustomerCategoryModel.findAll();
  }

  static create(data: CustomerCategoryData) {
    return CustomerCategoryModel.create(data);
  }

  static update(id: number, data: Partial<CustomerCategoryData>) {
    return CustomerCategoryModel.update(id, data);
  }

  static delete(id: number) {
    return CustomerCategoryModel.delete(id);
  }

  static seedDefaults() {
    return CustomerCategoryModel.seedDefaults();
  }

  static async resolveFromAccount(accountNumber: string) {
    const categoryCode = extractCategoryCodeFromAccount(accountNumber);
    if (!categoryCode) {
      return {
        found: false as const,
        categoryCode: null,
        error: 'رقم الحساب أقصر من أن يحتوي على رمز الفئة (الخانات 4 إلى 6)',
      };
    }

    const category = await CustomerCategoryModel.findByCode(categoryCode);
    if (!category || !category.isActive) {
      return {
        found: false as const,
        categoryCode,
        error: `فئة الحساب ${categoryCode} غير مسجلة في عدادات الفئات`,
      };
    }

    return {
      found: true as const,
      categoryCode,
      description: category.description,
      typeCode: category.typeCode,
      accountType: category.typeCode === '02' ? 2 : 1,
    };
  }

  /**
   * دفتر أفراد = حتى 25 ورقة (المعيار 25؛ 10 أوراق للموظفين مقبولة بدون تنبيه؛ أقل من 25 مسموح مع تنبيه).
   * دفتر شركات = حتى 50 ورقة (المعيار 50؛ أقل من 50 مسموح مع تنبيه).
   * أكثر من الحد الأقصى = منع.
   */
  static leavesMismatchMessage(typeCode: string, chequeLeaves?: number | null) {
    const leaves = Number(chequeLeaves);
    if (!Number.isFinite(leaves) || leaves <= 0) return null;

    if (typeCode === '01' && leaves > 25) {
      return (
        'مشكلة: تعارض نوع الدفتر مع فئة الحساب. ' +
        `فئة الحساب من العدادات أفراد (01) بينما المنظومة أرجعت دفتراً بـ ${leaves} ورقة (الحد الأقصى 25). ` +
        'لا يمكن الطباعة حتى يُصحَّح نوع الدفتر في المنظومة أو فئة الحساب في عدادات الفئات.'
      );
    }

    if (typeCode === '02' && leaves > 50) {
      return (
        'مشكلة: تعارض نوع الدفتر مع فئة الحساب. ' +
        `فئة الحساب من العدادات شركات (02) بينما المنظومة أرجعت دفتراً بـ ${leaves} ورقة (الحد الأقصى 50). ` +
        'لا يمكن الطباعة حتى يُصحَّح نوع الدفتر في المنظومة أو فئة الحساب في عدادات الفئات.'
      );
    }

    return null;
  }

  /**
   * تنبيه عند دفتر بعدد أوراق أقل من المعيار — الطباعة مسموحة.
   * أفراد: أقل من 25 باستثناء دفتر الموظفين 10 أوراق.
   * شركات: أقل من 50.
   */
  static leavesWarningMessage(typeCode: string, chequeLeaves?: number | null) {
    const leaves = Number(chequeLeaves);
    if (!Number.isFinite(leaves) || leaves <= 0) return null;

    if (typeCode === '01' && leaves < 25 && leaves !== 10) {
      return (
        `تنبيه: دفتر أفراد بعدد أوراق أقل من المعيار (25). ` +
        `سيتم طباعة ${leaves} ورقة فقط حسب بيانات المنظومة.`
      );
    }

    if (typeCode === '02' && leaves < 50) {
      return (
        `تنبيه: دفتر شركات بعدد أوراق أقل من المعيار (50). ` +
        `سيتم طباعة ${leaves} ورقة فقط حسب بيانات المنظومة.`
      );
    }

    return null;
  }
}
