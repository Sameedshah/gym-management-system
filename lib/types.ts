export interface Member {
  id: string
  member_id: string // 4-digit unique ID
  name: string
  father_name: string
  email: string
  phone?: string
  membership_type: string // Will always be 'standard' now
  plan_name: "Strength Training" | "Cardio" | "Personal Training"
  join_date: string
  last_seen?: string
  status: "active" | "inactive" | "expired"
  biometric_id?: string
  scanner_device_id?: string
  biometric_enrolled?: boolean
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  member_id: string
  invoice_number: string
  status: "paid" | "due" // Combine dues and overdues - only "due" and "paid"
  due_date?: string
  paid_date?: string
  description?: string // Optional description for the invoice/payment
  sms_sent: boolean
  email_sent: boolean
  last_reminder_sent?: string
  reminder_count: number
  months_due: number // How many months fees is due (no amounts)
  created_at: string
  updated_at: string
  member?: Member
}

export interface Notification {
  id: string
  invoice_id: string
  member_id: string
  type: "sms" | "email"
  status: "pending" | "sent" | "failed" | "delivered"
  message?: string
  sent_at?: string
  delivered_at?: string
  error_message?: string
  created_at: string
}

export interface CheckIn {
  id: string
  member_id: string
  check_in_time: string
  entry_method?: string
  scanner_id?: string
  notes?: string
  member?: Member
}

export interface Admin {
  id: string
  email: string
  session_jti?: string
  created_at: string
  updated_at: string
}
