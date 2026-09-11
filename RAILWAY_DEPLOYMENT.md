# نشر SanadPay على Railway

## الخطوات:

### 1. اذهب إلى Railway
- https://railway.app

### 2. سجّل الدخول أو أنشئ حساب

### 3. أنشئ مشروع جديد
- اضغط "New Project"
- اختر "Deploy from GitHub"

### 4. اختر الـ Repository
- اختر: `Bymadyan/Sanadpay-`
- اختر branch: `main`

### 5. انتظر البناء الأول
- Railway سيبني وينشر التطبيق تلقائياً
- يستغرق 2-5 دقايق

### 6. أضف متغيرات البيئة
في لوحة تحكم Railway:
- اضغط على المشروع
- اذهب إلى "Variables"
- أضف المتغيرات التالية:

```
NODE_ENV=production
PORT=3000
SESSION_SECRET=<اختر كلمة مرور قوية>
APP_URL=<رابط Railway الخاص بك، مثل: https://sanadpay-production-xyz.railway.app>
STRIPE_SECRET_KEY=sk_live_<مفتاحك الفعلي>
STRIPE_PUBLISHABLE_KEY=pk_live_<مفتاحك الفعلي>
STRIPE_WEBHOOK_SECRET=whsec_<سرك الفعلي>
```

### 7. تفعيل Auto Deploy (اختياري)
- في الإعدادات، فعّل "Auto Deploy"
- هذا يعني أن أي push إلى GitHub سينشر تلقائياً

### 8. الاختبار
- اضغط على الرابط العام للتطبيق
- جرّب Signup وLogin

## معلومات مهمة

✅ قاعدة البيانات: SQLite محفوظة تلقائياً على Railway
✅ الـ SSL: Railway توفر HTTPS بشكل افتراضي
✅ الـ Port: لا تحتاج لتغييره، Railway تتعامل معه تلقائياً

## استكشاف الأخطاء

إذا حدث خطأ:
1. اذهب إلى "Logs" في لوحة التحكم
2. ابحث عن الخطأ
3. تأكد من أن جميع متغيرات البيئة صحيحة

## الدعم

للمساعدة: https://docs.railway.app
