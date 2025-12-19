-- Create missing tables for biometric device configuration (without organization references)
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, let's create the system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category)
);

-- Create the biometric_devices table for more detailed device management
CREATE TABLE IF NOT EXISTS biometric_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Device Info
    device_name VARCHAR(255) NOT NULL DEFAULT 'Main Scanner',
    device_type VARCHAR(50) DEFAULT 'hikvision',
    device_ip VARCHAR(100) NOT NULL UNIQUE,
    device_port INTEGER DEFAULT 80,
    
    -- Authentication
    username VARCHAR(100),
    password_encrypted TEXT,
    
    -- Configuration
    settings JSONB DEFAULT '{}',
    auto_sync BOOLEAN DEFAULT TRUE,
    sync_interval INTEGER DEFAULT 5, -- minutes
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_connected BOOLEAN DEFAULT FALSE,
    last_sync TIMESTAMP WITH TIME ZONE,
    last_connection_test TIMESTAMP WITH TIME ZONE,
    
    -- Stats
    enrolled_users_count INTEGER DEFAULT 0,
    total_scans INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table if missing
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    
    -- Invoice Details
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) DEFAULT 0,
    months_due INTEGER DEFAULT 1,
    
    -- Status
    status VARCHAR(50) DEFAULT 'due', -- paid, due, overdue, cancelled
    due_date DATE,
    paid_date DATE,
    
    -- Payment Details
    payment_method VARCHAR(50), -- cash, card, online, bank_transfer
    transaction_id VARCHAR(255),
    
    -- Communication
    description TEXT,
    sms_sent BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    reminder_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checkins table if missing
CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    
    -- Check-in Details
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    
    -- Entry Method
    entry_method VARCHAR(50) DEFAULT 'manual', -- manual, biometric, card, qr_code
    scanner_id VARCHAR(100),
    device_name VARCHAR(255),
    
    -- Additional Info
    notes TEXT,
    created_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_biometric_devices_active ON biometric_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_biometric_devices_ip ON biometric_devices(device_ip);
CREATE INDEX IF NOT EXISTS idx_invoices_member_id ON invoices(member_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_checkins_member_id ON checkins(member_id);
CREATE INDEX IF NOT EXISTS idx_checkins_time ON checkins(check_in_time);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - you can customize later)
CREATE POLICY "Enable all for service role" ON system_settings FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON biometric_devices FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON invoices FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON checkins FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to new tables (with IF NOT EXISTS equivalent)
DO $$
BEGIN
    -- System settings trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at') THEN
        CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Biometric devices trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_biometric_devices_updated_at') THEN
        CREATE TRIGGER update_biometric_devices_updated_at BEFORE UPDATE ON biometric_devices
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Invoices trigger (only if table exists and trigger doesn't)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') 
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_updated_at') THEN
        CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Function to increment member visit count
CREATE OR REPLACE FUNCTION increment_member_visits()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE members 
    SET 
        total_visits = total_visits + 1,
        last_seen = NEW.check_in_time
    WHERE id = NEW.member_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create checkin trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'increment_visits_on_checkin') THEN
        CREATE TRIGGER increment_visits_on_checkin AFTER INSERT ON checkins
            FOR EACH ROW EXECUTE FUNCTION increment_member_visits();
    END IF;
END
$$;

SELECT 'Missing tables created successfully!' as status;