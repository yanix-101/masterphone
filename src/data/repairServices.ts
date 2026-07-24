import { RepairServiceItem } from '../types';

export const defaultRepairServices: RepairServiceItem[] = [
  { id: 'srv_screen', nameEn: 'Screen Damage', nameAr: 'إصلاح وتغيير الشاشة', descEn: 'Cracked or unresponsive display', descAr: 'شاشة مكسورة أو غير مستجيبة لمسياً', priceUsd: 129, iconName: 'Award' },
  { id: 'srv_battery', nameEn: 'Battery Issues', nameAr: 'مشاكل واستبدال البطارية', descEn: 'Not charging or rapid drain', descAr: 'نفاد شحن سريع أو عدم شحن الهاتف', priceUsd: 69, iconName: 'Battery' },
  { id: 'srv_camera', nameEn: 'Camera Repair', nameAr: 'صيانة وإصلاح الكاميرا', descEn: 'Blurry focus, broken lens, or black camera screen', descAr: 'عدم وضوح التركيز، كسر العدسة أو ظهور شاشة سوداء', priceUsd: 79, iconName: 'Camera' },
  { id: 'srv_backglass', nameEn: 'Back Glass Replacement', nameAr: 'استبدال الزجاج الخلفي المكسور', descEn: 'Cracked or shattered back housing cover', descAr: 'غطاء خلفي مكسور أو متشظٍ للهاتف', priceUsd: 89, iconName: 'ImageIcon' },
  { id: 'srv_port', nameEn: 'Charging Port', nameAr: 'منفذ الشحن والتوصيل', descEn: 'Loose or blocked connection', descAr: 'اتصال ضعيف أو منفذ مغلق بالأتربة', priceUsd: 49, iconName: 'Settings' },
  { id: 'srv_water', nameEn: 'Water Damage', nameAr: 'أضرار تسرب السوائل والمياه', descEn: 'Liquid contact or corrosion', descAr: 'تعرض الجهاز للماء أو السوائل', priceUsd: 159, iconName: 'Droplet' },
  { id: 'srv_speaker', nameEn: 'Speaker & Microphone', nameAr: 'سماعة ومكبر الصوت والميكروفون', descEn: 'Low sound, crackling speaker or no mic audio', descAr: 'صوت منخفض، مكبر صوت مشوش أو عدم التقاط الصوت', priceUsd: 39, iconName: 'Volume2' },
  { id: 'srv_biometrics', nameEn: 'Biometrics (Face ID / Touch ID)', nameAr: 'بصمة الإصبع وبصمة الوجه', descEn: 'Face ID failed or fingerprint sensor not working', descAr: 'تعطل ميزة Face ID أو عدم استشعار البصمة', priceUsd: 59, iconName: 'Fingerprint' },
  { id: 'srv_software', nameEn: 'Software & System Errors', nameAr: 'أخطاء نظام التشغيل والسوفتوير', descEn: 'Bootloop, stuck on logo, or data recovery request', descAr: 'تكرار التشغيل، التوقف عند الشعار، أو استعادة البيانات', priceUsd: 49, iconName: 'Cpu' },
  { id: 'srv_other', nameEn: 'Other Issues', nameAr: 'أعطال أو مشاكل أخرى', descEn: 'Unlisted problem (Custom diagnostics & quote)', descAr: 'مشكلة غير مدرجة (فحص مخصص وتسعيرة دقيقة)', priceUsd: 29, iconName: 'HelpCircle' },
];
