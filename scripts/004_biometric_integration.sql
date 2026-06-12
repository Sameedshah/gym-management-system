-- Add biometric fields to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS biometric_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS scanner_device_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS biometric_enrolled BOOLEAN DEFAULT FALSE;

-- Create system_settings table for storing configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category)
);

-- Add biometric entry method to checkins table
ALTER TABLE checkins 
ADD COLUMN IF NOT EXISTS entry_method VARCHAR(20) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS scanner_id VARCHAR(100);

-- Create index for biometric_id lookups
CREATE INDEX IF NOT EXISTS idx_members_biometric_id ON members(biometric_id);
CREATE INDEX IF NOT EXISTS idx_checkins_entry_method ON checkins(entry_method);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Insert default biometric settings
INSERT INTO system_settings (category, settings) 
VALUES ('biometric', '{
    "enabled": false,
    "deviceIP": "192.168.1.64",
    "username": "gymapi",
    "password": "",
    "port": 80,
    "autoSync": true,
    "syncInterval": 5
}'::jsonb)
ON CONFLICT (category) DO NOTHING;

-- Add RLS policies for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.id = auth.uid()
        )
    );

-- Update checkins table to include more detailed information
ALTER TABLE checkins 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for system_settings
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE system_settings IS 'Stores system configuration settings in JSON format';
COMMENT ON COLUMN members.biometric_id IS 'Unique identifier used in biometric device';
COMMENT ON COLUMN members.scanner_device_id IS 'IP address of the scanner device where user is enrolled';
COMMENT ON COLUMN members.biometric_enrolled IS 'Whether member has enrolled their fingerprint';
COMMENT ON COLUMN checkins.entry_method IS 'How the member checked in: manual, biometric, card, etc.';
COMMENT ON COLUMN checkins.scanner_id IS 'Identifier of the device used for check-in';
COMMENT ON COLUMN checkins.notes IS 'Additional notes about the check-in';