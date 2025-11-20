# 💰 One-Time Purchase Model Guide

## Overview

GymAdmin Pro uses a **one-time purchase model** - gym owners pay once and use the software forever. No monthly fees, no recurring charges.

---

## 🎯 License Types

### Standard License - $299 (One-Time)
- ✅ Unlimited members
- ✅ Unlimited staff accounts
- ✅ Unlimited biometric devices
- ✅ All core features
- ✅ Lifetime updates
- ✅ Email support

### Premium License - $499 (One-Time)
- ✅ Everything in Standard
- ✅ Priority support
- ✅ Custom branding
- ✅ API access
- ✅ Advanced analytics
- ✅ Multi-location support

### Enterprise License - Custom Pricing (One-Time)
- ✅ Everything in Premium
- ✅ Custom development
- ✅ Dedicated account manager
- ✅ On-premise deployment option
- ✅ Custom integrations
- ✅ 24/7 priority support

---

## 🔧 How It Works

### For Resellers (You)

1. **Customer Contacts You**
   - They want to buy GymAdmin Pro
   - You discuss their needs
   - Recommend appropriate license

2. **Payment Processing**
   - Customer pays via your preferred method:
     - Bank transfer
     - PayPal
     - Stripe (one-time payment)
     - Credit card
   - You receive payment

3. **License Activation**
   - Customer signs up on your platform
   - You manually activate their license:
   ```sql
   UPDATE organizations 
   SET 
     license_type = 'standard', -- or 'premium', 'enterprise'
     license_status = 'active',
     purchase_date = NOW()
   WHERE clerk_org_id = 'org_xxxxx';
   ```

4. **Customer Gets Access**
   - They complete onboarding
   - Start using all features
   - No expiration date
   - Lifetime access

### For Gym Owners (Your Customers)

1. **Purchase License**
   - Contact you or buy through your website
   - Pay one-time fee
   - Receive activation

2. **Sign Up & Onboard**
   - Create account on your platform
   - Complete 3-step onboarding
   - Access dashboard immediately

3. **Use Forever**
   - No monthly fees
   - No expiration
   - Lifetime updates included
   - Ongoing support

---

## 💳 Payment Processing Options

### Option 1: Manual Processing (Simplest)

**How it works:**
1. Customer contacts you
2. You send invoice/payment details
3. They pay via bank transfer/PayPal
4. You manually activate their license

**Pros:**
- No integration needed
- No transaction fees
- Simple to start

**Cons:**
- Manual work required
- Not automated

### Option 2: Stripe One-Time Payment (Recommended)

**Setup:**
```bash
npm install stripe @stripe/stripe-js
```

**Create Products in Stripe:**
- Standard License: $299
- Premium License: $499
- Enterprise License: Custom

**Implementation:**
1. Customer clicks "Purchase Now"
2. Redirected to Stripe checkout
3. Payment processed
4. Webhook activates license automatically

**Pros:**
- Automated
- Professional
- Secure

**Cons:**
- Stripe fees (~3%)
- Requires integration

### Option 3: PayPal/Other Gateways

Similar to Stripe, integrate your preferred payment gateway.

---

## 🔐 License Management

### Activating a License

```sql
-- After customer pays
UPDATE organizations 
SET 
  license_type = 'standard',
  license_status = 'active',
  purchase_date = NOW(),
  max_members = -1,  -- -1 means unlimited
  max_staff = -1,
  max_biometric_devices = -1
WHERE clerk_org_id = 'org_xxxxx';
```

### Suspending a License (If Needed)

```sql
-- If customer violates terms or requests suspension
UPDATE organizations 
SET license_status = 'suspended'
WHERE clerk_org_id = 'org_xxxxx';
```

### Upgrading a License

```sql
-- Customer upgrades from Standard to Premium
UPDATE organizations 
SET 
  license_type = 'premium',
  updated_at = NOW()
WHERE clerk_org_id = 'org_xxxxx';
```

---

## 📊 Tracking Sales

### View All Customers

```sql
SELECT 
  o.name as gym_name,
  o.license_type,
  o.license_status,
  o.purchase_date,
  u.email as owner_email,
  COUNT(DISTINCT m.id) as total_members
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id AND u.role = 'owner'
LEFT JOIN members m ON m.organization_id = o.id
GROUP BY o.id, o.name, o.license_type, o.license_status, o.purchase_date, u.email
ORDER BY o.purchase_date DESC;
```

### Revenue Tracking

Keep a separate spreadsheet or database:
- Customer name
- License type
- Purchase date
- Amount paid
- Payment method
- Status

---

## 🎁 Offering Discounts

### Launch Discount
```
Standard: $299 → $199 (33% off)
Premium: $499 → $349 (30% off)
```

### Bulk Discount (Multiple Gyms)
```
2-5 licenses: 10% off
6-10 licenses: 20% off
11+ licenses: 30% off
```

### Upgrade Discount
```
Standard → Premium: Pay only $200 (instead of $499)
Premium → Enterprise: Custom pricing
```

---

## 📝 License Agreement Template

```
SOFTWARE LICENSE AGREEMENT

This License Agreement ("Agreement") is entered into between:
- Licensor: [Your Company Name]
- Licensee: [Gym Owner Name]

1. LICENSE GRANT
   Licensor grants Licensee a perpetual, non-transferable license to use 
   GymAdmin Pro software for one gym location.

2. PAYMENT
   One-time payment of $[amount] for [license type] license.

3. UPDATES
   Lifetime updates included at no additional cost.

4. SUPPORT
   [Support level] support included as per license type.

5. RESTRICTIONS
   - Cannot resell or redistribute software
   - Cannot reverse engineer
   - For single gym use only (unless multi-location license)

6. TERMINATION
   License may be terminated if terms are violated.

Agreed on: [Date]
Licensee Signature: _______________
```

---

## 🆘 Common Questions

### "What if customer stops paying?"
**Answer:** They already paid once. No recurring payments needed. They use forever.

### "How do I make recurring revenue?"
**Answer:** 
- Sell to more gyms (one-time each)
- Offer optional paid support packages (annual)
- Sell custom development services
- Offer training and consulting
- Provide managed hosting (optional monthly fee)

### "Can customers get refunds?"
**Answer:** Set your refund policy (e.g., 30-day money-back guarantee)

### "What about updates?"
**Answer:** All licenses include lifetime updates. You maintain the platform, they get updates automatically.

### "How do I handle support?"
**Answer:**
- Standard: Email support (respond within 48 hours)
- Premium: Priority email (respond within 24 hours)
- Enterprise: Dedicated support (phone/chat available)

---

## 💡 Pricing Strategy Tips

### Start Low, Grow Later
- Launch: $199 (Standard), $349 (Premium)
- After 50 customers: $299, $499
- After 100 customers: $399, $599

### Bundle Services
- Software + Setup: $399
- Software + Setup + Training: $499
- Software + Setup + Training + 1-year priority support: $699

### Upsell Opportunities
- Custom branding: +$100
- On-site installation: +$200
- Staff training: +$150
- Custom features: Quote based

---

## 📈 Revenue Projections

### Conservative (Year 1)
- 20 Standard licenses × $299 = $5,980
- 5 Premium licenses × $499 = $2,495
- **Total: $8,475**

### Moderate (Year 1)
- 50 Standard licenses × $299 = $14,950
- 15 Premium licenses × $499 = $7,485
- 2 Enterprise licenses × $1,500 = $3,000
- **Total: $25,435**

### Aggressive (Year 1)
- 100 Standard licenses × $299 = $29,900
- 30 Premium licenses × $499 = $14,970
- 5 Enterprise licenses × $2,000 = $10,000
- **Total: $54,870**

---

## ✅ Action Items

### To Start Selling:

1. **Set Your Prices**
   - Decide on Standard/Premium/Enterprise pricing
   - Consider launch discounts

2. **Choose Payment Method**
   - Manual (bank transfer/PayPal)
   - Or integrate Stripe

3. **Create Sales Materials**
   - Pricing page (already included)
   - Demo video
   - Feature comparison sheet

4. **Set Up Support**
   - Support email
   - Response time commitments
   - Knowledge base

5. **Launch!**
   - Announce to potential customers
   - Offer launch discount
   - Start selling

---

## 🎉 Benefits of One-Time Purchase

### For You (Reseller):
- ✅ Simple to explain
- ✅ Higher conversion rate
- ✅ No churn management
- ✅ Easier accounting
- ✅ Customer owns it (less complaints)

### For Customers (Gym Owners):
- ✅ No monthly fees
- ✅ Predictable cost
- ✅ Own the software
- ✅ Lifetime updates
- ✅ Better ROI

---

**Ready to start selling!** 🚀

Your one-time purchase model makes it easy for gym owners to say yes, and easy for you to manage sales without complex subscription billing.