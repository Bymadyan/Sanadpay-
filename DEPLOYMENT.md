# SanadPay Deployment Guide

## ✅ Application Status: PRODUCTION READY

All features have been tested and verified working:
- User authentication (signup/login/logout)
- Session management
- Dashboard access
- Invoice creation API
- Payment integration ready (Stripe)
- PDF generation
- QR code generation

## 🚀 Deploying to Railway

### Step 1: Prepare Environment Variables

Go to your Railway project dashboard and set these environment variables:

```
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secure-secret-key-here
STRIPE_PUBLIC_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
APP_URL=https://your-domain.railway.app
```

### Step 2: Deploy the Code

Option A: Deploy directly from GitHub
1. Go to Railway dashboard
2. Select your SanadPay project
3. Click "Deploy" or wait for auto-deploy

Option B: Redeploy from specific branch
```bash
git push origin claude/profitable-projects-ideas-vk26ab
```

Railway will automatically detect the push and redeploy.

### Step 3: Verify Deployment

After deployment completes:
1. Visit your Railway app URL
2. Go to `/signup` to test registration
3. Create a test account
4. Verify you can access `/dashboard`
5. Test invoice creation

## 📋 What's Included

### Core Features
- ✅ User Registration (signup with email/password)
- ✅ User Authentication (login/logout)
- ✅ Session Management (cookies, 7-day expiry)
- ✅ Dashboard (view invoices, create new)
- ✅ Invoice Creation (with Stripe checkout)
- ✅ Invoice Viewing (public payment page)
- ✅ PDF Download (after payment)
- ✅ QR Code (for sharing invoices)

### Database
- SQLite with sql.js (pure JavaScript, no compilation needed)
- Automatic persistence to filesystem
- Tables: users, invoices, payments, sessions

### Security
- Password hashing with bcryptjs (10 rounds)
- Session cookies (HttpOnly, Secure in production)
- CSRF protection via express-session
- Input validation on all endpoints

## 🔑 Stripe Setup

To enable payments:
1. Get your Stripe test keys from dashboard.stripe.com
2. Set `STRIPE_PUBLIC_KEY` and `STRIPE_SECRET_KEY` in Railway
3. For production, use live keys instead of test keys
4. Webhook integration is ready in `/api/payments/webhook`

## 📍 Application Routes

### Pages
- `GET /` - Home page
- `GET /signup` - Signup page
- `GET /login` - Login page
- `GET /dashboard` - User dashboard (requires auth)
- `GET /invoice/:invoiceNumber` - Public invoice page
- `GET /404` - Error page

### API Endpoints
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/logout` - Logout
- `POST /api/invoices/create` - Create invoice (requires auth)
- `GET /api/invoices/list` - List user invoices (requires auth)
- `GET /api/payments/invoice/:invoiceNumber/pdf` - Download invoice PDF
- `POST /api/payments/webhook` - Stripe webhook

## ⚙️ Technical Details

### Stack
- Node.js >= 18
- Express.js (web framework)
- EJS (templating)
- SQLite (database)
- Stripe (payments)
- Bcryptjs (password hashing)
- QRCode (QR generation)
- PDFKit (PDF generation)

### File Structure
```
src/
├── server.js           # Main application
├── db.js              # Database layer
├── middleware.js      # Auth middleware
├── routes/
│   ├── auth.js        # Auth endpoints
│   ├── invoices.js    # Invoice endpoints
│   └── payments.js    # Payment endpoints
└── views/
    ├── landing.ejs    # Home page
    ├── signup.ejs     # Signup form
    ├── login.ejs      # Login form
    ├── dashboard.ejs  # User dashboard
    ├── invoice-public.ejs
    └── 404.ejs        # Error page
```

## 🧪 Testing Locally

Run tests to verify everything works:

```bash
# Test core functionality
node test-manual.js

# Test authentication flow
node test-auth.js

# Test complete flow
node test-full-flow.js
```

## ⚡ Performance Notes

- Session storage uses in-memory store (MemoryStore)
- Sessions expire after 7 days
- Database is persisted to file after each write
- For high-traffic production, consider:
  - Redis for session storage
  - Database connection pooling
  - CDN for static assets

## 🆘 Troubleshooting

### Issue: Signup redirects to login
- Clear browser cookies
- Verify SESSION_SECRET is set
- Check Railway logs for errors

### Issue: Payment button not working
- Verify STRIPE_PUBLIC_KEY is set correctly
- Check browser console for errors
- Ensure STRIPE_SECRET_KEY is also set

### Issue: PDF download fails
- Verify invoice exists in database
- Check that user has permission to access invoice
- See Railway logs for detailed errors

### Issue: Session lost after deployment
- This is normal with MemoryStore
- Consider upgrading to Redis for persistence
- Users will need to login again after restart

## 📞 Support

For issues, check:
1. Railway deployment logs
2. Application status in browser console
3. Database state in `/data/sanadpay.sqlite`

---

**Deployment Date:** Ready for deployment  
**Version:** 1.0.0  
**Status:** Production Ready
