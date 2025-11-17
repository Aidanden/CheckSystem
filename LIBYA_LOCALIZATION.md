# إعدادات ليبيا - التواريخ والأرقام
## Libya Localization - Dates & Numbers

---

## 📋 ملخص / Summary

تم تحويل جميع التواريخ والأرقام والتوقيت في المشروع بالكامل إلى:
- ✅ **الأرقام الإنجليزية** (0-9) بدلاً من العربية (٠-٩)
- ✅ **المنطقة الزمنية لليبيا** (Africa/Tripoli - UTC+2)
- ✅ **إعدادات ليبيا** (العملة، الدولة، الرموز)

All dates, numbers, and times throughout the project have been converted to:
- ✅ **English numerals** (0-9) instead of Arabic (٠-٩)
- ✅ **Libya timezone** (Africa/Tripoli - UTC+2)
- ✅ **Libya settings** (currency, country, symbols)

---

## 🇱🇾 إعدادات ليبيا / Libya Configuration

### المعلومات الأساسية:
```typescript
{
  locale: 'en-US',              // استخدام الأرقام الإنجليزية
  timezone: 'Africa/Tripoli',   // المنطقة الزمنية (UTC+2)
  currency: 'LYD',              // الدينار الليبي
  currencySymbol: 'د.ل',        // رمز الدينار الليبي
  country: 'Libya',             // الدولة
  countryCode: 'LY'             // رمز الدولة
}
```

---

## 📁 الملفات المضافة / Added Files

### 1. Frontend Utilities
**الملف:** `client/src/utils/locale.ts`

**الوظائف المتاحة:**

#### تنسيق التواريخ:
```typescript
// تاريخ قصير: DD/MM/YYYY
formatDateShort(date)
// مثال: 17/11/2025

// تاريخ متوسط: DD/MM/YYYY HH:MM
formatDateMedium(date)
// مثال: 17/11/2025 14:30

// تاريخ كامل: DD/MM/YYYY HH:MM:SS
formatDateLong(date)
// مثال: 17/11/2025 14:30:45
```

#### تنسيق الأرقام:
```typescript
// تنسيق رقم عادي
formatNumber(1234567.89)
// مثال: 1,234,567.89

// تنسيق عملة
formatCurrency(1500)
// مثال: LYD 1,500.00

// تنسيق دينار ليبي
formatLibyanCurrency(1500)
// مثال: 1,500.00 د.ل
```

#### وظائف إضافية:
```typescript
// الحصول على الوقت الحالي في ليبيا
getLibyaTime()

// تحويل الأرقام العربية إلى إنجليزية
arabicToEnglishNumerals('١٢٣٤٥')
// النتيجة: '12345'

// التأكد من استخدام الأرقام الإنجليزية
ensureEnglishNumerals(str)
```

### 2. Backend Utilities
**الملف:** `server/src/utils/locale.ts`

نفس الوظائف المتاحة في Frontend لضمان التوافق.

---

## 🔄 الملفات المعدلة / Modified Files

### Frontend Pages:

#### 1. Dashboard (`client/src/app/dashboard/page.tsx`)
```typescript
// قبل:
new Date(op.printDate).toLocaleDateString('ar-EG')

// بعد:
formatDateShort(op.printDate)
```

#### 2. Reports (`client/src/app/reports/page.tsx`)
```typescript
// قبل:
new Date(op.printDate).toLocaleString('ar-EG')

// بعد:
formatDateMedium(op.printDate)
```

#### 3. History (`client/src/app/history/page.tsx`)
```typescript
// قبل:
new Date(operation.printDate).toLocaleString('ar-SA')

// بعد:
formatDateMedium(operation.printDate)
```

#### 4. Inventory (`client/src/app/inventory/page.tsx`)
```typescript
// قبل:
new Date(trans.createdAt).toLocaleDateString('ar-EG')

// بعد:
formatDateShort(trans.createdAt)
```

### Backend Files:

#### 5. PDF Generator (`server/src/utils/pdfGenerator.ts`)
```typescript
// قبل:
operation.printDate.toLocaleString()

// بعد:
formatDateLong(operation.printDate)
```

---

## 🎯 الفوائد / Benefits

### 1. **توحيد التنسيق**
- جميع التواريخ والأرقام بنفس التنسيق
- سهولة القراءة والفهم
- تجربة مستخدم متسقة

### 2. **التوافق مع ليبيا**
- المنطقة الزمنية الصحيحة (UTC+2)
- العملة الليبية (الدينار)
- الرموز المحلية

### 3. **سهولة الصيانة**
- دوال مركزية في ملف واحد
- سهولة التعديل والتحديث
- تقليل الأخطاء

### 4. **الأرقام الإنجليزية**
- ✅ واضحة ومقروءة
- ✅ متوافقة مع الأنظمة الدولية
- ✅ لا تحتاج لخطوط خاصة
- ✅ تعمل في جميع البيئات

---

## 📊 أمثلة عملية / Practical Examples

### مثال 1: عرض تاريخ في جدول
```typescript
// قبل
<td>{new Date(op.printDate).toLocaleDateString('ar-EG')}</td>
// النتيجة: ١٧/١١/٢٠٢٥ (أرقام عربية)

// بعد
<td>{formatDateShort(op.printDate)}</td>
// النتيجة: 17/11/2025 (أرقام إنجليزية)
```

### مثال 2: عرض تاريخ ووقت
```typescript
// قبل
<td>{new Date(op.printDate).toLocaleString('ar-SA')}</td>
// النتيجة: ١٧/١١/٢٠٢٥ ١٤:٣٠:٤٥ (أرقام عربية)

// بعد
<td>{formatDateMedium(op.printDate)}</td>
// النتيجة: 17/11/2025 14:30 (أرقام إنجليزية)
```

### مثال 3: تنسيق عملة
```typescript
// استخدام الدينار الليبي
formatLibyanCurrency(1500.50)
// النتيجة: 1,500.50 د.ل
```

### مثال 4: في PDF
```typescript
// قبل
doc.text(`Print Date: ${operation.printDate.toLocaleString()}`);
// النتيجة: Print Date: ١٧/١١/٢٠٢٥ ١٤:٣٠:٤٥

// بعد
doc.text(`Print Date: ${formatDateLong(operation.printDate)}`);
// النتيجة: Print Date: 17/11/2025 14:30:45
```

---

## 🔧 الاستخدام / Usage

### في Frontend Components:

```typescript
import { 
  formatDateShort, 
  formatDateMedium, 
  formatDateLong,
  formatNumber,
  formatLibyanCurrency,
  LIBYA_CONFIG 
} from '@/utils/locale';

// في المكون
function MyComponent() {
  const date = new Date();
  
  return (
    <div>
      <p>التاريخ: {formatDateShort(date)}</p>
      <p>التاريخ والوقت: {formatDateMedium(date)}</p>
      <p>المبلغ: {formatLibyanCurrency(1500)}</p>
      <p>الدولة: {LIBYA_CONFIG.country}</p>
    </div>
  );
}
```

### في Backend Services:

```typescript
import { 
  formatDateLong, 
  formatNumber,
  LIBYA_CONFIG 
} from '../utils/locale';

// في الخدمة
const formattedDate = formatDateLong(new Date());
console.log(`Print Date: ${formattedDate}`);
// النتيجة: Print Date: 17/11/2025 14:30:45
```

---

## 🌍 المنطقة الزمنية / Timezone

### ليبيا (Africa/Tripoli):
- **UTC Offset:** +2 (طوال العام)
- **لا يوجد توقيت صيفي** (Daylight Saving Time)
- **ثابت على UTC+2**

### أمثلة:
```typescript
// الحصول على الوقت الحالي في ليبيا
const libyaTime = getLibyaTime();

// تنسيق التاريخ بتوقيت ليبيا
const formatted = formatDateTime(new Date());
// يتم تلقائياً استخدام Africa/Tripoli
```

---

## 💱 العملة / Currency

### الدينار الليبي (LYD):
- **الرمز:** د.ل
- **الكود الدولي:** LYD
- **التقسيم:** 1 دينار = 1000 درهم

### أمثلة:
```typescript
// تنسيق بالرمز الدولي
formatCurrency(1500)
// النتيجة: LYD 1,500.00

// تنسيق بالرمز المحلي
formatLibyanCurrency(1500)
// النتيجة: 1,500.00 د.ل
```

---

## 📝 تحويل الأرقام / Number Conversion

### تحويل الأرقام العربية إلى إنجليزية:

```typescript
// الأرقام العربية
const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';

// التحويل
const englishNumbers = arabicToEnglishNumerals(arabicNumbers);
// النتيجة: '0123456789'

// مثال عملي
const accountNumber = '١٠٠٠١٢٣٤٥٦٧٨٩٠١';
const converted = ensureEnglishNumerals(accountNumber);
// النتيجة: '100012345678901'
```

---

## 🎨 التنسيقات المتاحة / Available Formats

### التواريخ:

| الوظيفة | التنسيق | مثال |
|---------|---------|------|
| `formatDateShort` | DD/MM/YYYY | 17/11/2025 |
| `formatDateMedium` | DD/MM/YYYY HH:MM | 17/11/2025 14:30 |
| `formatDateLong` | DD/MM/YYYY HH:MM:SS | 17/11/2025 14:30:45 |
| `formatTime` | HH:MM:SS | 14:30:45 |

### الأرقام:

| الوظيفة | التنسيق | مثال |
|---------|---------|------|
| `formatNumber` | 1,234,567.89 | 1,234,567.89 |
| `formatCurrency` | LYD 1,500.00 | LYD 1,500.00 |
| `formatLibyanCurrency` | 1,500.00 د.ل | 1,500.00 د.ل |

---

## ⚠️ ملاحظات مهمة / Important Notes

### 1. **التوقيت الصيفي**
ليبيا لا تستخدم التوقيت الصيفي، لذلك الوقت ثابت على UTC+2 طوال العام.

### 2. **تنسيق 24 ساعة**
جميع الأوقات تستخدم تنسيق 24 ساعة (00:00 - 23:59) وليس 12 ساعة.

### 3. **الفاصلة العشرية**
يتم استخدام النقطة (.) كفاصلة عشرية، والفاصلة (,) كفاصل للآلاف.

### 4. **تنسيق التاريخ**
التنسيق المستخدم هو DD/MM/YYYY (اليوم/الشهر/السنة).

---

## 🔄 التحديثات المستقبلية / Future Updates

### محتمل:
- [ ] إضافة دعم للغات أخرى
- [ ] إضافة تنسيقات تاريخ إضافية
- [ ] دعم عملات إضافية
- [ ] تنسيقات أرقام هواتف ليبية
- [ ] تنسيقات عناوين ليبية

---

## 🧪 الاختبار / Testing

### اختبار التواريخ:
```typescript
const testDate = new Date('2025-11-17T14:30:45');

console.log(formatDateShort(testDate));
// المتوقع: 17/11/2025

console.log(formatDateMedium(testDate));
// المتوقع: 17/11/2025 14:30

console.log(formatDateLong(testDate));
// المتوقع: 17/11/2025 14:30:45
```

### اختبار الأرقام:
```typescript
console.log(formatNumber(1234567.89));
// المتوقع: 1,234,567.89

console.log(formatLibyanCurrency(1500));
// المتوقع: 1,500.00 د.ل
```

### اختبار التحويل:
```typescript
console.log(arabicToEnglishNumerals('١٢٣٤٥'));
// المتوقع: 12345
```

---

## 📞 الدعم / Support

إذا واجهت مشاكل مع التنسيقات:
1. تحقق من استيراد الدوال الصحيحة
2. تأكد من تمرير البيانات بالتنسيق الصحيح
3. راجع الأمثلة في هذا الملف
4. اتصل بفريق الدعم الفني

---

## ✨ الخلاصة / Summary

### قبل التحديث:
- ❌ أرقام عربية (٠-٩)
- ❌ تنسيقات مختلطة
- ❌ مناطق زمنية متعددة
- ❌ عدم توحيد العملة

### بعد التحديث:
- ✅ أرقام إنجليزية (0-9)
- ✅ تنسيق موحد
- ✅ منطقة زمنية ليبيا (UTC+2)
- ✅ الدينار الليبي (د.ل)
- ✅ دوال مركزية سهلة الاستخدام
- ✅ تجربة مستخدم متسقة

---

**تاريخ التنفيذ / Implementation Date:** November 17, 2025  
**الإصدار / Version:** 1.3.0  
**الحالة / Status:** ✅ مطبق ونشط / Implemented and Active  
**الدولة / Country:** 🇱🇾 Libya (ليبيا)
