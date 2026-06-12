# Email Reminder System

## Overview

The email reminder system allows gym administrators to send bulk email reminders to members with outstanding dues. The system provides pre-built templates and supports custom messages.

## Features

### 1. EmailReminderButton Component
- Located in `components/admin/email-reminder-button.tsx`
- Integrated into the admin overview dues section
- Provides bulk email functionality for selected members

### 2. Email Templates
- **Friendly Reminder**: Standard payment reminder
- **Urgent Notice**: For overdue payments with warning
- **Final Notice**: Last warning before suspension
- **Custom Template**: User-defined subject and message

### 3. Template Variables
All templates support the following variables:
- `{memberName}`: Member's full name
- `{memberId}`: Member's 4-digit ID
- `{monthsDue}`: Number of months due
- `{invoiceCount}`: Number of outstanding invoices

### 4. API Endpoint
- **Endpoint**: `/api/notifications/bulk-email`
- **Method**: POST
- **Purpose**: Sends individual email reminders
- **Updates**: Invoice reminder tracking fields

## Usage

1. Navigate to the admin dashboard
2. Go to the "Members with Dues" tab
3. Click the "Email Reminders" button
4. Select members to send reminders to
5. Choose an email template or create a custom one
6. Preview the email content
7. Send reminders

## Technical Implementation

### Components
- `EmailReminderButton`: Main component for bulk email interface
- `defaultEmailTemplates`: Pre-defined email templates
- `formatEmailTemplate`: Template formatting utility

### API Integration
- Uses existing notification service for email delivery
- Updates invoice records with reminder tracking
- Provides real-time sending status

### Database Updates
When emails are sent successfully:
- `invoices.last_reminder_sent`: Updated with current timestamp
- `invoices.email_sent`: Set to true
- `invoices.reminder_count`: Incremented

## Future Enhancements

### Database Table (Optional)
The system is designed to work with an optional `email_reminders` table for enhanced tracking:

```sql
CREATE TABLE email_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_ids UUID[] NOT NULL,
  template_used VARCHAR(50) NOT NULL DEFAULT 'friendly',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reminder_type VARCHAR(50) NOT NULL DEFAULT 'dues',
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Scheduling
- Automatic reminder scheduling
- Recurring reminder campaigns
- Member-specific reminder preferences

### Analytics
- Email open rates (with email provider integration)
- Response rates and payment correlation
- Template effectiveness metrics

## Configuration

### Email Service
The system uses the existing `NotificationService` which can be configured for:
- Resend
- SendGrid
- Custom email providers

### Template Customization
Templates can be modified in `lib/email-templates.ts` to match gym branding and communication style.

## Error Handling

- Failed email sends are tracked and reported
- Network errors are handled gracefully
- User feedback is provided for all operations
- Partial failures are supported (some emails succeed, others fail)

## Security Considerations

- Uses Supabase service role key for database operations
- Member email addresses are protected
- Bulk operations are rate-limited to prevent abuse
- All email content is sanitized before sending