export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
}

export const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: "friendly",
    name: "Friendly Reminder",
    subject: "Friendly Payment Reminder - {memberName}",
    message: `Dear {memberName},

This is a friendly reminder that your gym membership payment is due.

Payment Details:
- Months Due: {monthsDue} month{monthsDue > 1 ? 's' : ''}
- Member ID: {memberId}

Please make your payment at your earliest convenience to continue enjoying our gym facilities.

You can pay:
- At the gym reception
- Through our online payment portal
- Via bank transfer

If you have already made the payment, please ignore this reminder.

Thank you for being a valued member!

Best regards,
GymAdmin Team`
  },
  {
    id: "urgent",
    name: "Urgent Notice",
    subject: "Urgent: Payment Due - {memberName}",
    message: `Dear {memberName},

This is an urgent notice regarding your overdue gym membership payment.

Payment Details:
- Months Due: {monthsDue} month{monthsDue > 1 ? 's' : ''}
- Member ID: {memberId}

Your membership access may be suspended if payment is not received within 3 days.

Please contact us immediately to resolve this matter.

Best regards,
GymAdmin Team`
  },
  {
    id: "final",
    name: "Final Notice",
    subject: "Final Notice - Payment Required - {memberName}",
    message: `Dear {memberName},

This is a FINAL NOTICE regarding your overdue gym membership payment.

Payment Details:
- Months Due: {monthsDue} month{monthsDue > 1 ? 's' : ''}
- Member ID: {memberId}

Your membership will be suspended tomorrow if payment is not received.

Please pay immediately or contact us to discuss payment arrangements.

Best regards,
GymAdmin Team`
  }
];

export function formatEmailTemplate(
  template: EmailTemplate, 
  memberData: {
    memberName: string;
    memberId: string;
    monthsDue: number;
    invoiceCount?: number;
  }
): { subject: string; message: string } {
  const replacements = {
    '{memberName}': memberData.memberName,
    '{memberId}': memberData.memberId,
    '{monthsDue}': memberData.monthsDue.toString(),
    '{invoiceCount}': (memberData.invoiceCount || 1).toString()
  };

  let subject = template.subject;
  let message = template.message;

  Object.entries(replacements).forEach(([placeholder, value]) => {
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
    subject = subject.replace(regex, value);
    message = message.replace(regex, value);
  });

  return { subject, message };
}