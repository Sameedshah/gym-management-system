// Notification service for SMS and Email reminders

export interface NotificationConfig {
  smsProvider?: 'twilio' | 'local' // Add your SMS provider
  emailProvider?: 'resend' | 'sendgrid' | 'local' // Add your email provider
  smsApiKey?: string
  emailApiKey?: string
}

export interface NotificationMessage {
  to: string
  subject?: string
  message: string
  type: 'sms' | 'email'
}

export class NotificationService {
  private config: NotificationConfig

  constructor(config: NotificationConfig = {}) {
    this.config = config
  }

  async sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, simulate SMS sending
      // In production, integrate with your SMS provider (Twilio, etc.)
      console.log(`SMS to ${to}: ${message}`)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulate 95% success rate
      if (Math.random() > 0.05) {
        return { success: true }
      } else {
        return { success: false, error: 'SMS delivery failed' }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async sendEmail(to: string, subject: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, simulate email sending
      // In production, integrate with your email provider (Resend, SendGrid, etc.)
      console.log(`Email to ${to}: ${subject} - ${message}`)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate 98% success rate
      if (Math.random() > 0.02) {
        return { success: true }
      } else {
        return { success: false, error: 'Email delivery failed' }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  generatePaymentReminderSMS(memberName: string, invoiceNumber: string, monthsDue: number, dueDate: string): string {
    return `Dear ${memberName}, your gym membership payment for ${monthsDue} month${monthsDue > 1 ? 's' : ''} (Invoice: ${invoiceNumber}) was due on ${new Date(dueDate).toLocaleDateString()}. Please pay at your earliest convenience. Thank you!`
  }

  generatePaymentReminderEmail(memberName: string, invoiceNumber: string, monthsDue: number, dueDate: string): { subject: string; message: string } {
    const subject = `Payment Reminder - Invoice ${invoiceNumber}`
    
    const message = `
Dear ${memberName},

This is a friendly reminder that your gym membership payment is due.

Invoice Details:
- Invoice Number: ${invoiceNumber}
- Months Due: ${monthsDue} month${monthsDue > 1 ? 's' : ''}
- Due Date: ${new Date(dueDate).toLocaleDateString()}

Please make your payment at your earliest convenience to avoid any interruption to your gym access.

You can pay:
- At the gym reception
- Through our online payment portal
- Via bank transfer

If you have already made the payment, please ignore this reminder.

Thank you for being a valued member!

Best regards,
GymAdmin Team
    `.trim()

    return { subject, message }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// Types for API integration
export interface SMSProviderConfig {
  twilio?: {
    accountSid: string
    authToken: string
    fromNumber: string
  }
  // Add other SMS providers as needed
}

export interface EmailProviderConfig {
  resend?: {
    apiKey: string
    fromEmail: string
  }
  sendgrid?: {
    apiKey: string
    fromEmail: string
  }
  // Add other email providers as needed
}