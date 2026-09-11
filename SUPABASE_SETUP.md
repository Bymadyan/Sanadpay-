# إعداد Supabase

## الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى https://app.supabase.com
2. اضغط "New Project"
3. اختر organization و اسم المشروع
4. ضع كلمة مرور قوية للـ database
5. اختر المنطقة الأقرب إليك
6. اضغط "Create new project" (قد يستغرق 2-3 دقائق)

## الخطوة 2: إنشاء جداول قاعدة البيانات

بعد إنشاء المشروع، اذهب إلى **SQL Editor** واختر **New Query** وأضف هذا الـ SQL:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT,
  stripe_account_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  description TEXT NOT NULL,
  amount FLOAT NOT NULL,
  currency TEXT DEFAULT 'SAR',
  status TEXT DEFAULT 'pending',
  payment_url TEXT,
  stripe_session_id TEXT UNIQUE,
  payment_received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount FLOAT NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
```

اضغط **Run** لتنفيذ الـ queries.

## الخطوة 3: الحصول على API Keys

1. اذهب إلى **Settings** (الترس الصغير في الأسفل يسار)
2. اختر **API**
3. انسخ:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_KEY`

## الخطوة 4: تحديث متغيرات البيئة

في ملف `.env` على الخادم:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

## الخطوة 5: النشر على Railway

1. أضف نفس متغيرات البيئة في Railway Variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `STRIPE_SECRET_KEY`
   - `SESSION_SECRET`

2. النشر سيتم تلقائياً 🚀

## إذا حدثت مشاكل

- تأكد من API keys صحيحة
- تحقق من أن الجداول تم إنشاؤها بنجاح
- في Railway، اختر **Deploy Logs** لرؤية الأخطاء
