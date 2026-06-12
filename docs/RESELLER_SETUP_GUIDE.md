# GymAdmin Pro - Reseller Setup Guide

## 🎯 Overview

GymAdmin Pro is a **multi-tenant SaaS platform** designed for reselling to gym owners. Each gym owner gets their own isolated workspace with complete data separation and customizable settings.

## 🏗️ Architecture

### Multi-Tenant Structure
- **Organizations**: Each gym is an organization
- **Users**: Staff members within each gym
- **Data Isolation**: Complete separation using Row Level Security (RLS)
- **Authentication**: Clerk for user management and SSO
- **Database**: Supabase PostgreSQL with RLS policies

### Key Features for Resellers
- ✅ Unlimited gym owners (organizations)
- ✅ Per-gym billing and subscription management
- ✅ White-label ready
- ✅ Universal biometric device support
- ✅ Automated onboarding flow
- ✅ Role-based access control
- ✅ Activity logging and audit trails

## 📋 Initial Setup (One-Time)

### 1. Clone and Install

```bash
git clone <your-repo>
cd gym-management-dashboard
npm install
```

### 2. Set Up Clerk Authentication

1. **Create Clerk Account**
   - Go to https://dashboard.clerk.com
   - Create new application
   - Choose "Next.js" as framework

2. **Configure Clerk**
   - Enable Organizations feature
   - Set up sign-in/sign-up pages
   - Configure OAuth providers (optional)
   - Copy API keys

3. **Add to .env.local**
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   CLERK_SECRET_KEY=sk_test_xxxxx
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
   ```

### 3. Set Up Supabase Database

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Wait for database provisioning

2. **Run Database Setup**
   ```sql
   -- In Supabase SQL Editor, run:
   -- File: scripts/00_multi_tenant_setup.sql
   ```

3. **Add to .env.local**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
   ```

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:
- Clerk keys (authentication)
- Supabase keys (database)
- App URL (your domain)

Optional variables:
- SMS provider (Twilio)
- Email provider (Resend/SendGrid)
- Payment gateway (Stripe)
- Analytics (Google Analytics)

### 5. Test Locally

```bash
npm run dev
```

Visit http://localhost:3000 and test:
- Sign up flow
- Organization creation
- Onboarding process
- Dashboard access

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial setup"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. **Configure Domain**
   - Add custom domain in Vercel
   - Update Clerk allowed origins
   - Update NEXT_PUBLIC_APP_URL

### Other Platforms

The app works on any platform supporting Next.js 14:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## 👥 Onboarding New Gym Owners

### Automated Flow

1. **Gym Owner Signs Up**
   - Visits your app URL
   - Creates account via Clerk
   - Automatically creates organization

2. **Onboarding Wizard**
   - Step 1: Gym information
   - Step 2: Contact details
   - Step 3: Preferences
   - Completes setup

3. **Dashboard Access**
   - Redirected to dashboard
   - Can add members immediately
   - Can configure biometric devices
   - Can invite staff members

### Manual Setup (If Needed)

```sql
-- Create organization manually
INSERT INTO organizations (
    clerk_org_id,
    name,
    slug,
    owner_clerk_id,
    gym_name,
    subscription_plan
) VALUES (
    'org_xxxxx',
    'FitLife Gym',
    'fitlife-gym',
    'user_xxxxx',
    'FitLife Gym & Fitness',
    'trial'
);
```

## 🔧 Biometric Device Setup (Universal)

### Supported Devices

The platform supports multiple biometric device brands:

1. **Hikvision** (DS-K1T804 series)
   - API: ISAPI
   - Port: 80
   - Most common in gyms

2. **ZKTeco** (F18, F19 series)
   - API: SDK
   - Port: 4370
   - Popular in Asia

3. **Suprema** (BioStation series)
   - API: REST API
   - Port: 443
   - Enterprise-grade

4. **Anviz** (W1, W2 series)
   - API: Custom
   - Port: 80
   - Budget-friendly

5. **eSSL** (X990, K90 series)
   - API: SDK
   - Port: 4370
   - Indian market

6. **Generic/Other**
   - Custom configuration
   - Flexible setup

### Setup Process for Gym Owners

1. **Navigate to Settings**
   - Go to Settings → Biometric Devices

2. **Add New Device**
   - Select device type from dropdown
   - Follow device-specific setup guide
   - Enter IP address and credentials
   - Test connection
   - Save device

3. **Enroll Members**
   - Go to Members page
   - Click member actions menu (⋯)
   - Select "Enroll Fingerprint"
   - Guide member through scanning

4. **Automated Sync**
   - Attendance syncs every 5 minutes
   - Manual sync available anytime
   - Real-time status monitoring

### Device Configuration Guide

Each device type includes:
- Step-by-step setup instructions
- Default port numbers
- API type information
- Common troubleshooting tips

## 💰 Subscription Management

### Plans Structure

```javascript
const PLANS = {
  trial: {
    name: 'Trial',
    duration: 30, // days
    maxMembers: 50,
    maxStaff: 2,
    maxDevices: 1,
    price: 0
  },
  basic: {
    name: 'Basic',
    maxMembers: 100,
    maxStaff: 5,
    maxDevices: 1,
    price: 29 // per month
  },
  premium: {
    name: 'Premium',
    maxMembers: 500,
    maxStaff: 15,
    maxDevices: 5,
    price: 79 // per month
  },
  enterprise: {
    name: 'Enterprise',
    maxMembers: -1, // unlimited
    maxStaff: -1,
    maxDevices: -1,
    price: 199 // per month
  }
}
```

### Implementing Billing

1. **Stripe Integration** (Recommended)
   ```bash
   npm install stripe @stripe/stripe-js
   ```

2. **Create Subscription Plans**
   - Set up products in Stripe Dashboard
   - Create pricing tiers
   - Configure webhooks

3. **Handle Subscriptions**
   - Update organization.subscription_plan
   - Set subscription_ends_at
   - Enforce limits in middleware

## 🎨 White-Label Customization

### Branding

1. **Update App Name**
   ```env
   NEXT_PUBLIC_APP_NAME=Your Gym Software
   ```

2. **Logo and Colors**
   - Replace logo in `/public/logo.png`
   - Update colors in `tailwind.config.ts`
   - Customize theme in `app/globals.css`

3. **Domain**
   - Use your own domain
   - Configure SSL certificate
   - Update all environment URLs

### Custom Features

Add custom features per organization:
```sql
ALTER TABLE organizations 
ADD COLUMN custom_features JSONB DEFAULT '{}';

-- Example:
UPDATE organizations 
SET custom_features = '{
  "custom_branding": true,
  "api_access": true,
  "advanced_reports": true
}'
WHERE id = 'org-id';
```

## 📊 Monitoring and Support

### Admin Dashboard

Create super admin dashboard to monitor:
- Total organizations
- Active subscriptions
- Revenue metrics
- System health
- Support tickets

### Activity Logs

All actions are logged in `activity_logs` table:
```sql
SELECT * FROM activity_logs 
WHERE organization_id = 'org-id'
ORDER BY created_at DESC
LIMIT 100;
```

### Support System

Implement support features:
- In-app chat (Intercom, Crisp)
- Email support
- Knowledge base
- Video tutorials

## 🔒 Security Best Practices

### Data Isolation

- ✅ RLS policies enforce organization boundaries
- ✅ No cross-organization data access
- ✅ Clerk handles authentication
- ✅ Supabase handles authorization

### Backup Strategy

1. **Automated Backups**
   - Supabase: Daily automatic backups
   - Point-in-time recovery available

2. **Manual Backups**
   ```bash
   # Export organization data
   pg_dump -h db.xxx.supabase.co -U postgres \
     --table=organizations \
     --table=members \
     --table=invoices \
     > backup.sql
   ```

### Compliance

- GDPR: Data export and deletion
- HIPAA: Encryption at rest and in transit
- SOC 2: Audit logs and access controls

## 📈 Scaling

### Performance Optimization

1. **Database Indexes**
   - Already included in setup script
   - Monitor slow queries
   - Add indexes as needed

2. **Caching**
   - Use Vercel Edge caching
   - Implement Redis for sessions
   - Cache static content

3. **CDN**
   - Vercel includes CDN
   - Serve assets from edge locations
   - Optimize images

### Multi-Region

For global customers:
- Deploy to multiple regions
- Use Supabase read replicas
- Implement geo-routing

## 🆘 Troubleshooting

### Common Issues

**"Organization not found"**
- Check Clerk organization sync
- Verify RLS policies
- Check user permissions

**"Device connection failed"**
- Verify network connectivity
- Check device IP and credentials
- Review device-specific setup guide

**"Subscription expired"**
- Update subscription_ends_at
- Check payment status
- Notify gym owner

### Support Resources

- Documentation: `/docs`
- Setup guides: Device-specific
- Video tutorials: Coming soon
- Email support: support@yourdomain.com

## 🎯 Next Steps

1. **Complete Initial Setup**
   - ✅ Clerk authentication
   - ✅ Supabase database
   - ✅ Environment variables
   - ✅ Deploy to production

2. **Test with Demo Gym**
   - Create test organization
   - Add sample members
   - Test biometric device
   - Verify all features

3. **Launch Marketing**
   - Create landing page
   - Set up pricing page
   - Implement payment gateway
   - Start onboarding customers

4. **Monitor and Iterate**
   - Track usage metrics
   - Gather customer feedback
   - Add requested features
   - Scale infrastructure

## 📞 Support

For reseller support:
- Email: reseller@yourdomain.com
- Documentation: https://docs.yourdomain.com
- Slack Community: [Join here]

---

**Ready to start reselling GymAdmin Pro!** 🚀

This platform is designed to scale from 1 to 1000+ gym owners with minimal operational overhead.