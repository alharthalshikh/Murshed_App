// ==================== Labels Only - No Mock Data ====================

export const categoryLabels: Record<string, string> = {
  electronics: 'إلكترونيات',
  documents: 'وثائق',
  jewelry: 'مجوهرات',
  bags: 'حقائب ومحافظ',
  keys: 'مفاتيح',
  pets: 'حيوانات أليفة',
  clothing: 'ملابس',
  other: 'أخرى',
};

export const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  processing: 'جاري الفحص',
  matched: 'تم التطابق',
  contacted: 'تم التواصل',
  delivered: 'تم التسليم',
  closed: 'مغلق',
};

// المدن اليمنية
export const yemeniCities = [
  'صنعاء',
  'عدن',
  'تعز',
  'الحديدة',
  'إب',
  'المكلا',
  'ذمار',
  'عمران',
  'صعدة',
  'حجة',
  'البيضاء',
  'لحج',
  'المحويت',
  'مأرب',
  'شبوة',
  'أبين',
  'الضالع',
  'ريمة',
  'حضرموت',
  'سقطرى',
  'أخرى',
];

// رمز الدولة اليمني
export const YEMEN_COUNTRY_CODE = '+967';

// التحقق من رقم الجوال اليمني
export function validateYemeniPhone(phone: string): boolean {
  // أرقام الجوال اليمنية تبدأ بـ 7 وتتكون من 9 أرقام
  const cleanPhone = phone.replace(/\s|-/g, '').replace('+967', '');
  return /^7[0-9]{8}$/.test(cleanPhone);
}

// تنسيق رقم الجوال اليمني
export function formatYemeniPhone(phone: string): string {
  const cleanPhone = phone.replace(/\s|-/g, '').replace('+967', '');
  if (cleanPhone.length === 9) {
    return `+967 ${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
  }
  return phone;
}
