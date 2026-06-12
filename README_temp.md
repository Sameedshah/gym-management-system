# GymAdmin Pro - Multi-Tenant Gym Management Platform

A modern, production-ready **SaaS platform** for gym management. Built with Next.js 14, Clerk, Supabase, and TypeScript. Perfect for reselling to multiple gym owners with complete data isolation.

## 🎯 Perfect for Resellers

This is a **multi-tenant SaaS platform** designed for reselling to gym owners. Each gym gets:
- ✅ Isolated workspace with complete data separation
- ✅ Custom branding and settings
- ✅ Unlimited members (based on plan)
- ✅ Universal biometric device support
- ✅ Automated onboarding flow
- ✅ Staff management with roles

## 🚀 Key Features

### For Gym Owners
- 🏋️ **Member Management**: Complete member lifecycle tracking
- 💳 **Payment Tracking**: Invoice generation and payment monitoring
- 📊 **Real-time Dashboard**: Live statistics and attendance
- 👆 **Biometric Integration**: ZKTeco fingerprint scanner support
- ⚡ **Real-time Attendance**: Automatic updates (10-15 second delay)
- 📱 **Responsive Design**: Works on all devices
- 🌙 **Dark Mode**: Built-in theme support
- 🔄 **Auto-sync**: Background listener for 24/7 attendance tracking
- 👥 **Staff Management**: Role-based access control

### For Resellers
- 🏢 **Multi-Tenant**: Unlimited gym organizations
- 🔒 **Data Isolation**: Complete separation with RLS
- 🎨 **White-Label Ready**: Customize branding
- 💰 **Subscription Management**: Built-in billing support
- 📈 **Scalable**: From 1 to 1000+ gyms
- 🔧 **Easy Setup**: Automated onboarding for new gyms
- 📊 **Analytics**: Track usage and revenue

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Authentication**: Clerk (Multi-tenant SSO)
- **Database**: Supabase (PostgreSQL with RLS)
- **Styling**: Tailwind CSS, Radix UI
- **Biometric**: ZKTeco device support via TCP/IP SDK
- **Real-time**: Supabase Realtime + polling mechanism
- **Background Service**: Node.js listener for biometric events
- **Deployment**: Vercel (recommended)
- **Monitoring**: Built-in activity logs and audit trails

## ⚡ Quick Start (30 Minutes)

### Prerequisites
- Node.js 18+
- Accounts: Clerk, Supabase, Vercel

### 1. Clone and Install
```bash
git clone <repository-url>
cd gym-management-dashboard
npm install
```

### 2. Set Up Clerk (5 min)
1. Create account at https://dashboard.clerk.com
2. Create application, enable Organizations
3. Copy API keys

### 3. Set Up Supabase (5 min)
1. Create project at https://supabase.com
2. Run `scripts/00_multi_tenant_setup.sql` in SQL Editor
3. Copy API keys

### 4. Configure Environment
```bash
cp .env.example .env.local
# Add your Clerk and Supabase keys
```

### 5. Test Locally
```bash
npm run dev
```
Visit http://localhost:3000, sign up, and complete onboarding!

### 6. Deploy to Vercel
```bash
git push origin main
# Import to Vercel, add env vars, deploy
```

**📚 Detailed Guide**: See [docs/QUICK_START.md](docs/QUICK_START.md)

## 👆 Biometric Integration (Real-time)

This system supports **real-time attendance tracking** with ZKTeco fingerprint devices.

### Supported Devices

#### 1. ZKTeco K40

**Best for:** Standard gym setups, cost-effective solution

**Quick Setup:**
```bash
cd zkteco-listener
npm install
npm test
npm start
```

**Features:**
- ⚡ Real-time updates (10-15 second delay)
- 💰 Cost-effective solution
- 🔄 Auto-reconnect on connection loss
- 🛡️ Duplicate prevention
- 📊 Live dashboard updates
- 🚀 Production-ready

**Documentation:**
- 📖 [Complete Guide](docs/ZKTECO_COMPLETE_GUIDE.md)
- 🔧 [Device Setup](docs/ZKTECO_DEVICE_SETUP_GUIDE.md)
- 💻 [Software Setup](docs/ZKTECO_SOFTWARE_SETUP_GUIDE.md)
- ⚡ [Quick Setup (5 min)](zkteco-listener/QUICK_SETUP.md)
- 🆘 [Troubleshooting](zkteco-listener/TROUBLESHOOTING.md)

**Configuration:**
```env
DEVICE_IP=192.168.1.201
DEVICE_PORT=4370
DEVICE_PASSWORD=0
SUPABASE_SERVICE_KEY=your_service_role_key
POLL_INTERVAL=10
```

### How It Works
```
Fingerprint Scan → Device Stores Log → Listener Polls (10s) → Supabase → Dashboard
     (instant)        (local)            (your PC)           (cloud)    (real-time)
```

### Deployment Options

The listener service supports:
- 🖥️ Manual start (testing)
- 🚀 Windows Startup (simple)
- 🏢 Windows Service (production)
- 💻 Dedicated PC (recommended)

### Choosing a Device

| Feature | ZKTeco K40 | Hikvision |
|---------|------------|-----------|
| Cost | $ | $$$ |
| Setup Difficulty | Easy | Medium |
| Update Speed | 10-15s | 1-2s |
| Reliability | Excellent | Excellent |
| Best For | Most gyms | Enterprise |

**Recommendation:** Start with ZKTeco K40 for cost-effectiveness and ease of setup.

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ⚠️ |

## API Endpoints

- `GET /api/health` - Health check endpoint
- Authentication handled by Supabase Auth

## Database Schema

### Tables

- **admins** - Admin user accounts
- **members** - Gym member information
- **invoices** - Payment and billing data
- **checkins** - Member check-in records

### Key Features

- Row Level Security (RLS) enabled
- Automatic timestamps
- Triggers for data consistency
- Indexes for performance

## Security Features

- ✅ Row Level Security (RLS)
- ✅ Environment variable validation
- ✅ Error boundaries
- ✅ Input sanitization
- ✅ HTTPS enforcement (production)
- ✅ Secure authentication flow

## Performance Optimizations

- ✅ Server-side rendering (SSR)
- ✅ Static generation where possible
- ✅ Image optimization
- ✅ Code splitting
- ✅ Database indexes
- ✅ Connection pooling

## Monitoring & Logging

- Health check endpoint: `/api/health`
- Error boundaries for graceful error handling
- Console logging in development
- Production error tracking ready

## Development

### Project Structure

```
├── app/                    # Next.js 14 app directory
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication
│   ├── members/          # Member management
│   ├── payments/         # Payment tracking
│   └── settings/         # System settings
├── components/           # Reusable components
│   ├── ui/              # Base UI components
│   ├── dashboard/       # Dashboard-specific components
│   ├── layout/          # Layout components
│   └── members/         # Member-specific components
├── lib/                 # Utilities and configurations
│   ├── supabase/       # Supabase client setup
│   ├── types.ts        # TypeScript definitions
│   └── utils.ts        # Helper functions
└── scripts/            # Database setup scripts
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding New Features

1. Create components in appropriate directories
2. Add types to `lib/types.ts`
3. Update database schema if needed
4. Add proper error handling
5. Test thoroughly

## Troubleshooting

### Common Issues

**Build Errors**
- Check environment variables are set
- Ensure Supabase connection is working
- Verify all dependencies are installed

**Authentication Issues**
- Verify Supabase URL and keys
- Check RLS policies are set up correctly
- Ensure admin user exists in database

**Database Connection**
- Test connection with health endpoint
- Verify Supabase project is active
- Check network connectivity

### Getting Help

1. Check the health endpoint: `/api/health`
2. Review browser console for errors
3. Check Supabase dashboard for issues
4. Verify environment variables

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

Built with ❤️ for gym management
