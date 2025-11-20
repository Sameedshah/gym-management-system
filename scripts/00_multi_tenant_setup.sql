-- ============================================
-- MULTI-TENANT GYM MANAGEMENT SYSTEM
-- Complete Database Setup for SaaS Platform
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ORGANIZATIONS (GYM OWNERS)
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_org_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_clerk_id VARCHAR(255) NOT NULL,
    
    -- License & Purchase
    license_type VARCHAR(50) DEFAULT 'standard', -- standard, premium, enterprise
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    license_status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
    
    -- Gym Details
    gym_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    
    -- Settings
    timezone VARCHAR(100) DEFAULT 'UTC',
    currency VARCHAR(10) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    
    -- Limits based on license (optional - can be unlimited)
    max_members INTEGER DEFAULT -1, -- -1 means unlimited
    max_staff INTEGER DEFAULT -1,
    max_biometric_devices INTEGER DEFAULT -1,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. USERS (STAFF & ADMINS)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- User Info
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- Role & Permissions
    role VARCHAR(50) DEFAULT 'staff', -- owner, admin, staff, viewer
    permissions JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Member Identification
    member_id VARCHAR(50) NOT NULL, -- 4-digit or custom ID
    name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Membership Details
    membership_type VARCHAR(50) DEFAULT 'standard',
    plan_name VARCHAR(100),
    join_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, expired, suspended
    
    -- Biometric Integration
    biometric_id VARCHAR(100),
    scanner_device_id VARCHAR(100),
    biometric_enrolled BOOLEAN DEFAULT FALSE,
    
    -- Additional Info
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(50),
    notes TEXT,
    
    -- Tracking
    last_seen TIMESTAMP WITH TIME ZONE,
    total_visits INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, member_id)
);

-- ============================================
-- 4. INVOICES (PAYMENTS)
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    
    -- Invoice Details
    invoice_number VARCHAR(100) NOT NULL,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, invoice_number)
);

-- ============================================
-- 5. CHECK-INS (ATTENDANCE)
-- ============================================

CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
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

-- ============================================
-- 6. BIOMETRIC DEVICES
-- ============================================

CREATE TABLE IF NOT EXISTS biometric_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Device Info
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'hikvision', -- hikvision, zkteco, suprema, etc.
    device_ip VARCHAR(100) NOT NULL,
    device_port INTEGER DEFAULT 80,
    
    -- Authentication
    username VARCHAR(100),
    password_encrypted TEXT,
    api_key TEXT,
    
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, device_ip)
);

-- ============================================
-- 7. SYSTEM SETTINGS (PER ORGANIZATION)
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    category VARCHAR(100) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, category)
);

-- ============================================
-- 8. NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    
    -- Notification Details
    type VARCHAR(50) NOT NULL, -- sms, email, push, in_app
    subject VARCHAR(255),
    message TEXT NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. ACTIVITY LOGS (AUDIT TRAIL)
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Activity Details
    action VARCHAR(100) NOT NULL, -- created, updated, deleted, login, etc.
    entity_type VARCHAR(100), -- member, invoice, device, etc.
    entity_id UUID,
    
    -- Details
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(100),
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. ONBOARDING STEPS
-- ============================================

CREATE TABLE IF NOT EXISTS onboarding_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    step_name VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, step_name)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_clerk_id);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Members
CREATE INDEX IF NOT EXISTS idx_members_org_id ON members(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_biometric_id ON members(biometric_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_member_id ON invoices(member_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Check-ins
CREATE INDEX IF NOT EXISTS idx_checkins_org_id ON checkins(organization_id);
CREATE INDEX IF NOT EXISTS idx_checkins_member_id ON checkins(member_id);
CREATE INDEX IF NOT EXISTS idx_checkins_time ON checkins(check_in_time);
CREATE INDEX IF NOT EXISTS idx_checkins_entry_method ON checkins(entry_method);

-- Biometric Devices
CREATE INDEX IF NOT EXISTS idx_devices_org_id ON biometric_devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_active ON biometric_devices(is_active);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- Activity Logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_id ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        clerk_org_id IN (
            SELECT clerk_org_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Owners can update their organization" ON organizations
    FOR UPDATE USING (
        owner_clerk_id = auth.jwt() ->> 'sub'
    );

-- Users: Can view users in their organization
CREATE POLICY "Users can view org members" ON users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Members: Scoped to organization
CREATE POLICY "Users can manage org members" ON members
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Invoices: Scoped to organization
CREATE POLICY "Users can manage org invoices" ON invoices
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Check-ins: Scoped to organization
CREATE POLICY "Users can manage org checkins" ON checkins
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Biometric Devices: Scoped to organization
CREATE POLICY "Users can manage org devices" ON biometric_devices
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- System Settings: Scoped to organization
CREATE POLICY "Users can manage org settings" ON system_settings
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Notifications: Scoped to organization
CREATE POLICY "Users can view org notifications" ON notifications
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Activity Logs: Scoped to organization
CREATE POLICY "Users can view org activity logs" ON activity_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Onboarding Steps: Scoped to organization
CREATE POLICY "Users can manage org onboarding" ON onboarding_steps
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON biometric_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_updated_at BEFORE UPDATE ON onboarding_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

CREATE TRIGGER increment_visits_on_checkin AFTER INSERT ON checkins
    FOR EACH ROW EXECUTE FUNCTION increment_member_visits();

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Dashboard Stats View
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COUNT(DISTINCT m.id) as total_members,
    COUNT(DISTINCT CASE WHEN m.status = 'active' THEN m.id END) as active_members,
    COUNT(DISTINCT CASE WHEN i.status = 'due' THEN i.id END) as pending_payments,
    COUNT(DISTINCT CASE WHEN DATE(c.check_in_time) = CURRENT_DATE THEN c.id END) as today_checkins,
    COUNT(DISTINCT bd.id) as total_devices,
    COUNT(DISTINCT CASE WHEN bd.is_connected THEN bd.id END) as connected_devices
FROM organizations o
LEFT JOIN members m ON m.organization_id = o.id
LEFT JOIN invoices i ON i.organization_id = o.id
LEFT JOIN checkins c ON c.organization_id = o.id
LEFT JOIN biometric_devices bd ON bd.organization_id = o.id
GROUP BY o.id, o.name;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations (gym owners)';
COMMENT ON TABLE users IS 'Staff and admin users per organization';
COMMENT ON TABLE members IS 'Gym members scoped to organization';
COMMENT ON TABLE invoices IS 'Payment invoices for members';
COMMENT ON TABLE checkins IS 'Member attendance records';
COMMENT ON TABLE biometric_devices IS 'Fingerprint scanner devices per gym';
COMMENT ON TABLE system_settings IS 'Organization-specific settings';
COMMENT ON TABLE notifications IS 'SMS/Email notifications';
COMMENT ON TABLE activity_logs IS 'Audit trail for all actions';
COMMENT ON TABLE onboarding_steps IS 'Track organization onboarding progress';

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- License types metadata (for reference)
COMMENT ON COLUMN organizations.license_type IS 'License types: standard (one-time purchase), premium (enhanced features), enterprise (custom setup). All are one-time purchases, no recurring billing.';

SELECT 'Multi-tenant database setup completed successfully!' as status;