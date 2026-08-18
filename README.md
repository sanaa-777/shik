# 🏦 شيك - shik

تطبيق بنكي رقمي متكامل مبني باستخدام React + Firebase Cloud Functions.

## 🚀 الميزات

### الواجهة الأمامية (Frontend)
- **لوحة تحكم** - عرض الأرصدة والمعاملات الأخيرة
- **تحويل أموال** - تحويل فوري بين الحسابات
- **دفع فواتير** - دفع فواتير الكهرباء والمياه والإنترنت
- **سجل المعاملات** - تاريخ كامل مع فلترة وبحث
- **الملف الشخصي** - إدارة المعلومات الشخصية
- **لوحة الإدارة** - إدارة المستخدمين والأدوار (للمديرين)

### الخدمات الخلفية (Cloud Functions)
- **تسجيل المستخدمين** - إنشاء حساب تلقائي مع محفظة افتراضية
- **تحويل الأموال** - معالجة آمنة باستخدام Firestore Transactions
- **دفع الفواتير** - معالجة مدفوعات الفواتير
- **إدارة الأدوار** - تعيين صلاحيات المستخدمين
- **عكس المعاملات** - إمكانية التراجع عن المعاملات (للمديرين)

### الأمان
- **قواعد Firestore** - RBAC مع 4 أدوار (عميل، وكيل، مدير، مدير عام)
- **حماية التخزين** - قواعد أمان للصور والمستندات
- **التحقق من المدخلات** - جميع المدخلات يتم التحقق منها
- **سجلات التدقيق** - تتبع جميع العمليات الحساسة

## 📋 المتطلبات

- Node.js 18+
- Firebase CLI
- حساب Firebase مشروع

## 🛠️ التثبيت

```bash
# تثبيت التبعيات
npm install

# تثبيت تبعيات Cloud Functions
cd functions && npm install && cd ..

# إنشاء ملف البيئة
cp .env.example .env
# قم بتعديل .env بإعدادات Firebase الخاصة بك
```

## ▶️ التشغيل

```bash
# تشغيل التطبيق محلياً
npm run dev

# تشغيل Auth وFirestore وCloud Functions معًا
npm run firebase:emulators

# ربط الواجهة بالمحاكيات في جلسة تطوير محلية
# غيّر VITE_USE_FIREBASE_EMULATORS إلى true في .env ثم شغّل:
npm run dev

# تشغيل Cloud Functions وحدها
npm run functions:serve
```

## 🔌 تكامل الواجهة مع Cloud Functions

تستخدم الواجهة `httpsCallable` لاستدعاء `transferMoney` و`processBillPayment` و`setUserRole`، بينما تنشئ `onUserCreate` ملف المستخدم ومحفظته الافتراضية تلقائيًا. تم توحيد منطقة الدوال على `us-central1`، كما تتطابق عملات الواجهة والدوال مع `YER` و`USD` و`SAR`.

للاختبار المحلي الكامل، شغّل `npm run firebase:emulators`، ثم فعّل `VITE_USE_FIREBASE_EMULATORS=true` في ملف `.env`. لا تفعّل هذا الخيار في بيئة الإنتاج. تتضمن `firebase.json` منافذ Auth `9099` وFirestore `8080` وFunctions `5001` وواجهة المحاكيات `4000`.

## 🚀 النشر

```bash
# بناء التطبيق
npm run build

# نشر كل شي
firebase deploy

# نشر فقط الاستضافة
firebase deploy --only hosting

# نشر فقط Cloud Functions
firebase deploy --only functions

# نشر فقط قواعد الأمان
firebase deploy --only firestore:rules,storage
```

## 📁 هيكل المشروع

```
shik/
├── src/                      # الكود المصدري للواجهة الأمامية
│   ├── components/          # المكونات
│   │   ├── layout/         # مكونات التخطيط
│   │   └── ui/             # مكونات UI
│   ├── config/             # الإعدادات
│   ├── hooks/              # React Hooks
│   ├── pages/              # الصفحات
│   │   ├── admin/         # صفحات الإدارة
│   │   ├── auth/          # صفحات المصادقة
│   │   ├── bills/         # صفحة الفواتير
│   │   ├── dashboard/     # لوحة التحكم
│   │   ├── history/       # سجل المعاملات
│   │   ├── profile/       # الملف الشخصي
│   │   ├── settings/      # الإعدادات
│   │   └── transfer/      # تحويل الأموال
│   ├── services/           # خدمات Firebase
│   ├── store/              # Zustand Stores
│   ├── types/              # أنواع TypeScript
│   └── utils/              # أدوات مساعدة
├── functions/                # Firebase Cloud Functions
│   └── src/
│       ├── auth.ts         # مصادقة المستخدمين
│       ├── transactions.ts # معالجة المعاملات
│       ├── admin.ts        # وظائف الإدارة
│       └── utils/          # أدوات مساعدة
├── firebase.json             # إعدادات Firebase
├── firestore.rules           # قواعد Firestore
├── storage.rules             # قواعد التخزين
└── firestore.indexes.json    # فهارس Firestore
```

## 🔑 الأدوار والصلاحيات

| الدور | الوصف |
|-------|-------|
| `customer` | عميل عادي - يمكنه إدارة حساباته والتحويل |
| `agent` | وكيل - يمكنه مساعدة العملاء |
| `admin` | مدير - يمكنه إدارة المستخدمين |
| `super_admin` | مدير عام - كل الصلاحيات |

## 💡 ملاحظات

- جميع المبالغ بالوحدات الصغيرة (cents) لتجنب مشاكل الفاصلة العشرية
- Cloud Functions تستخدم Node.js 18
- الواجهة تدعم اللغة العربية (RTL)
- التصميم متجاوب مع جميع الشاشات

## 📄 الترخيص

MIT

