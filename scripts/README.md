# Gym Management System - Database Setup

This directory contains fresh SQL scripts to set up your gym management system database on a new Supabase account.

## 🗂️ Files Overview

### Core Database Scripts

- **`01_create_database_schema.sql`** - Creates all tables, indexes, triggers, and security policies
- **`02_insert_sample_data.sql`** - Inserts sample data for testing and development
- **`03_database_views_and_reports.sql`** - Creates views and stored procedures for reports

### Utility Scripts

- **`setup-admin.js`** - Node.js script to create admin users
- **`run-consolidation-migration.js`** - Migration utility script
- **`deploy.sh`** - Deployment script

## 🚀 Quick Setup Instructions

### Step 1: Create Database Schema

Run this script first in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of 01_create_database_schema.sql
```

### Step 2: Insert Sample Data

Run this script second to populate with test data:

```sql
-- Copy and paste the contents of 02_insert_sample_data.sql
```

### Step 3: Create Views and Reports

Run this script third to set up reporting views:

```sql
-- Copy and paste the contents of 03_database_views_and_reports.sql
```

## 📊 Database Schema Overview

### Core Tables

- **`admins`** - System administrators and staff
- **`members`** - Gym members with personal and membership details
- **`invoices`** - Monthly membership invoices and payments
- **`checkins`** - Member check-in/check-out records
- **`payment_history`** - Complete payment transaction history
- **`membership_plans`** - Available membership plans and pricing

### Key Features

- **Auto-generated IDs** - Member IDs (GM0001) and Invoice numbers (INV-202412-0001)
- **Biometric Support** - Fingerprint data and scanner integration
- **Payment Tracking** - Multiple payment methods and transaction history
- **Activity Monitoring** - Check-in/out times and workout duration
- **Automated Reminders** - SMS and email reminder tracking
- **Row Level Security** - Secure data access with Supabase auth

## 🔐 Default Admin Credentials

After running the sample data script, you can login with:

| Email           | Password   |
| --------------- | ---------- |
| leader@smgym.pk | smgym@1965 |

## 📈 Available Views

The system includes several pre-built views for reporting:

- **`member_dashboard`** - Complete member overview with payment status
- **`financial_summary`** - Revenue and financial metrics
- **`member_activity_summary`** - Member visit patterns and activity levels
- **`overdue_payments`** - Outstanding payments with risk classification
- **`membership_expiry`** - Members with expiring memberships
- **`daily_attendance`** - Daily attendance patterns and peak hours

## 🛠️ Sample Queries

### Get all active members with pending payments

```sql
SELECT * FROM member_dashboard
WHERE membership_status = 'Active'
AND total_pending > 0;
```

### View financial summary

```sql
SELECT * FROM financial_summary;
```

### Check today's attendance

```sql
SELECT * FROM daily_attendance
WHERE attendance_date = CURRENT_DATE;
```

### Find overdue payments

```sql
SELECT * FROM overdue_payments
WHERE days_overdue > 30
ORDER BY days_overdue DESC;
```

## 🔄 Migration from Old Database

If you're migrating from an existing database:

1. Export your current member data
2. Run the schema creation script
3. Import your data using INSERT statements
4. Update member IDs and invoice numbers as needed
5. Run the views script to enable reporting

## 📝 Notes

- All timestamps are stored in UTC with timezone support
- Member IDs are auto-generated in format GM0001, GM0002, etc.
- Invoice numbers follow format INV-YYYYMM-0001
- The system supports multiple payment methods and currencies
- Biometric data is stored securely with encryption support
- All tables have Row Level Security enabled for data protection

## 🆘 Troubleshooting

If you encounter issues:

1. **Permission Errors**: Ensure you're running scripts as a database admin
2. **Duplicate Data**: Use `ON CONFLICT DO NOTHING` clauses in INSERT statements
3. **Missing Extensions**: The schema script enables required PostgreSQL extensions
4. **View Errors**: Run the schema script before creating views

## 📞 Support

For additional help with database setup or migration, refer to the main project documentation or create an issue in the repository.
