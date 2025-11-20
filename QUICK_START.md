# 🚀 Quick Start Guide - GymAdmin Pro

## Get Your Multi-Tenant Gym Management Platform Running in 30 Minutes

### Prerequisites
- Node.js 18+ installed
- Git installed
- Accounts ready: Clerk, Supabase, Vercel

---

## Step 1: Clone & Install (2 minutes)

```bash
git clone <your-repo-url>
cd gym-management-dashboard
npm install
```

---

## Step 2: Clerk Setup (5 minutes)

1. Go to https://dashboard.clerk.com
2. Click "Add Application"
3. Name it "GymAdmin Pro"
4. Enable **Organizations** feature
5. Copy your keys:
   - Publishable Key: `pk_test_...`
   - Secret Key: `sk_test_...`

---

## Step 3: Supabase Setup (5 minutes)

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Wait for provisioning (~2 minutes)
4. Go to **SQL Editor**
5. Copy & paste entire content of `scripts/00_multi_tenant_setup.sql`
6. Click "Run"
7. Wait for completion
8. Go to **Settings** → **API**
9. Copy your keys:
   - Project URL: `https://xxx.supabase.co`
   - Anon Key: `eyJ...`
   - Service Role Key: `eyJ...`

---

## Step 4: Environment Setup (3 minutes)

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```env
# Clerk (from Step 2)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Supabase (from Step 3)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 5: Test Locally (5 minutes)

```bash
npm run dev
```

Open http://localhost:3000

**Test Flow:**
1. Click "Sign Up"
2. Create account
3. Complete onboarding wizard
4. Access dashboard
5. Add a test member
6. Check all features work

---

## Step 6: Deploy to Vercel (10 minutes)

### Push to GitHub
```bash
git add .
git commit -m "Initial setup"
git push origin main
```

### Deploy
1. Go to https://vercel.com
2. Click "Import Project"
3. Select your GitHub repo
4. Add environment variables (same as `.env.local`)
5. Click "Deploy"
6. Wait for deployment (~2 minutes)

### Configure Production
1. Copy your Vercel URL: `https://your-app.vercel.app`
2. Update in `.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
3. Go to Clerk Dashboard
4. Add to "Allowed Origins": `https://your-app.vercel.app`
5. Redeploy on Vercel

---

## ✅ You're Live!

Your multi-tenant gym management platform is now running!

### What You Can Do Now:

1. **Test Production**
   - Visit your Vercel URL
   - Sign up as a gym owner
   - Complete onboarding
   - Explore all features

2. **Add Custom Domain** (Optional)
   - Go to Vercel → Settings → Domains
   - Add your domain
   - Update DNS records
   - Update environment variables

3. **Configure Biometric Devices**
   - Each gym owner can add their own devices
   - Supports: Hikvision, ZKTeco, Suprema, and more
   - Universal setup wizard included

4. **Start Onboarding Customers**
   - Share your app URL
   - Gym owners sign up
   - They complete onboarding
   - Start using immediately

---

## 📚 Next Steps

### For Resellers:
- Read `docs/RESELLER_SETUP_GUIDE.md` for detailed info
- Check `DEPLOYMENT_CHECKLIST.md` for production readiness
- Review `docs/BIOMETRIC_SETUP_GUIDE.md` for device setup

### For Gym Owners:
- Complete onboarding wizard
- Add members
- Configure biometric devices (optional)
- Set up payment tracking
- Invite staff members

---

## 🆘 Troubleshooting

### "Authentication Error"
- Check Clerk keys in environment variables
- Verify allowed origins in Clerk dashboard
- Clear browser cache and try again

### "Database Connection Failed"
- Verify Supabase keys
- Check if SQL script ran successfully
- Test connection in Supabase dashboard

### "Page Not Found"
- Ensure all files are committed
- Check Vercel build logs
- Verify deployment completed

---

## 🎯 Key Features

### For Gym Owners:
- ✅ Member management
- ✅ Payment tracking
- ✅ Attendance monitoring
- ✅ Biometric integration
- ✅ Real-time dashboard
- ✅ Staff management
- ✅ Automated notifications

### For Resellers:
- ✅ Multi-tenant architecture
- ✅ Complete data isolation
- ✅ Subscription management ready
- ✅ White-label capable
- ✅ Scalable infrastructure
- ✅ Universal device support
- ✅ Automated onboarding

---

## 💡 Pro Tips

1. **Test Thoroughly**
   - Create multiple test gyms
   - Test all features
   - Verify data isolation

2. **Monitor Performance**
   - Set up error tracking
   - Monitor database queries
   - Watch API response times

3. **Gather Feedback**
   - Talk to early customers
   - Iterate based on needs
   - Add requested features

4. **Scale Gradually**
   - Start with 5-10 gyms
   - Optimize based on usage
   - Scale infrastructure as needed

---

## 📞 Support

- **Documentation**: Check `/docs` folder
- **Issues**: Create GitHub issue
- **Email**: support@yourdomain.com

---

## 🎉 Success!

You now have a production-ready, multi-tenant gym management platform!

**Time to start onboarding gym owners and growing your business!** 💪

---

### Quick Reference

**Local Development:**
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
```

**Important URLs:**
- Clerk Dashboard: https://dashboard.clerk.com
- Supabase Dashboard: https://supabase.com/dashboard
- Vercel Dashboard: https://vercel.com/dashboard

**Key Files:**
- `scripts/00_multi_tenant_setup.sql` - Database schema
- `.env.example` - Environment template
- `middleware.ts` - Authentication & routing
- `docs/RESELLER_SETUP_GUIDE.md` - Complete guide