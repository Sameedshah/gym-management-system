require('dotenv').config();
const ZKLib = require('zklib');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const config = {
  device: {
    ip: process.env.DEVICE_IP || '192.168.1.201',
    port: parseInt(process.env.DEVICE_PORT) || 4370,
    password: process.env.DEVICE_PASSWORD || '0',
    timeout: parseInt(process.env.DEVICE_TIMEOUT) || 5000,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_KEY,
  },
  pollInterval: parseInt(process.env.POLL_INTERVAL) || 3,
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate configuration
if (!config.supabase.url || !config.supabase.key) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.key);

// State management
let zkInstance = null;
let isConnected = false;
let lastProcessedLog = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

// Logging utility
const log = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  debug: (msg) => {
    if (config.logLevel === 'debug') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`);
    }
  },
  success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`),
};

/**
 * Connect to ZKTeco device
 */
async function connectToDevice() {
  try {
    log.info(`Connecting to ZKTeco device at ${config.device.ip}:${config.device.port}...`);
    
    zkInstance = new ZKLib(
      config.device.ip,
      config.device.port,
      config.device.timeout,
      config.device.password
    );

    await zkInstance.createSocket();
    isConnected = true;
    reconnectAttempts = 0;
    
    log.success(`✅ Connected to ZKTeco K40 device`);
    
    // Get device info
    const deviceInfo = await zkInstance.getInfo();
    log.info(`Device Model: ${deviceInfo.model || 'Unknown'}`);
    log.info(`Firmware Version: ${deviceInfo.fwVersion || 'Unknown'}`);
    log.info(`Serial Number: ${deviceInfo.serialNumber || 'Unknown'}`);
    
    return true;
  } catch (error) {
    isConnected = false;
    log.error(`Failed to connect: ${error.message}`);
    return false;
  }
}

/**
 * Disconnect from device
 */
async function disconnectFromDevice() {
  if (zkInstance && isConnected) {
    try {
      await zkInstance.disconnect();
      log.info('Disconnected from device');
    } catch (error) {
      log.error(`Error disconnecting: ${error.message}`);
    }
  }
  isConnected = false;
  zkInstance = null;
}

/**
 * Find member by device user ID
 */
async function findMemberByDeviceId(deviceUserId) {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('id, name, email, member_id')
      .eq('member_id', deviceUserId.toString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        log.debug(`No member found for device user ID: ${deviceUserId}`);
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    log.error(`Error finding member: ${error.message}`);
    return null;
  }
}

/**
 * Check if attendance record already exists (duplicate prevention)
 */
async function isDuplicateAttendance(memberId, timestamp) {
  try {
    const timeWindow = new Date(timestamp.getTime() - 60000); // 1 minute before
    
    const { data, error } = await supabase
      .from('checkins')
      .select('id')
      .eq('member_id', memberId)
      .gte('check_in_time', timeWindow.toISOString())
      .lte('check_in_time', timestamp.toISOString())
      .limit(1);

    if (error) throw error;
    
    return data && data.length > 0;
  } catch (error) {
    log.error(`Error checking duplicate: ${error.message}`);
    return false;
  }
}

/**
 * Save attendance record to Supabase
 */
async function saveAttendanceRecord(member, timestamp, deviceUserId) {
  try {
    // Check for duplicates
    const isDuplicate = await isDuplicateAttendance(member.id, timestamp);
    if (isDuplicate) {
      log.debug(`Skipping duplicate attendance for ${member.name}`);
      return false;
    }

    // Insert check-in record
    const { data, error } = await supabase
      .from('checkins')
      .insert({
        member_id: member.id,
        check_in_time: timestamp.toISOString(),
        entry_method: 'biometric',
        scanner_id: deviceUserId.toString(),
        device_name: 'ZKTeco K40',
        notes: `Auto-synced from ZKTeco K40 - Device User ID: ${deviceUserId}`,
      })
      .select()
      .single();

    if (error) throw error;

    log.success(`✅ Attendance saved for ${member.name} at ${timestamp.toLocaleString()}`);
    return true;
  } catch (error) {
    log.error(`Failed to save attendance: ${error.message}`);
    return false;
  }
}

/**
 * Process attendance logs from device
 */
async function processAttendanceLogs() {
  if (!isConnected || !zkInstance) {
    log.debug('Device not connected, skipping log processing');
    return;
  }

  try {
    log.debug('Fetching attendance logs from device...');
    
    // Get attendance logs
    const logs = await zkInstance.getAttendances();
    
    if (!logs || logs.data.length === 0) {
      log.debug('No new attendance logs found');
      return;
    }

    log.info(`Found ${logs.data.length} attendance log(s)`);

    // Process each log
    for (const logEntry of logs.data) {
      try {
        const deviceUserId = logEntry.deviceUserId;
        const timestamp = logEntry.recordTime;
        
        log.debug(`Processing log: User ID ${deviceUserId} at ${timestamp}`);

        // Skip if we've already processed this exact log
        const logKey = `${deviceUserId}-${timestamp.getTime()}`;
        if (lastProcessedLog === logKey) {
          log.debug('Skipping already processed log');
          continue;
        }

        // Find member in database
        const member = await findMemberByDeviceId(deviceUserId);
        
        if (!member) {
          log.error(`⚠️ Member not found for device user ID: ${deviceUserId}`);
          log.info('Please ensure member_id in database matches device user ID');
          continue;
        }

        // Save attendance record
        const saved = await saveAttendanceRecord(member, timestamp, deviceUserId);
        
        if (saved) {
          lastProcessedLog = logKey;
        }
      } catch (error) {
        log.error(`Error processing log entry: ${error.message}`);
      }
    }

    // Clear processed logs from device (optional - comment out if you want to keep logs on device)
    // await zkInstance.clearAttendanceLog();
    // log.debug('Cleared processed logs from device');
    
  } catch (error) {
    log.error(`Error fetching attendance logs: ${error.message}`);
    
    // If connection error, try to reconnect
    if (error.message.includes('socket') || error.message.includes('timeout')) {
      isConnected = false;
      log.info('Connection lost, will attempt to reconnect...');
    }
  }
}

/**
 * Main polling loop - Optimized for near real-time performance
 */
async function startPolling() {
  log.info(`Starting attendance polling (every ${config.pollInterval} seconds)...`);
  log.info(`Near real-time mode: 3-5 second delay expected`);
  
  setInterval(async () => {
    // Reconnect if disconnected
    if (!isConnected) {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        log.info(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
        await connectToDevice();
      } else {
        log.error('Max reconnection attempts reached. Please check device and restart service.');
        return;
      }
    }

    // Process logs if connected
    if (isConnected) {
      await processAttendanceLogs();
    }
  }, config.pollInterval * 1000);
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  log.info('Shutting down gracefully...');
  await disconnectFromDevice();
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

/**
 * Main entry point
 */
async function main() {
  log.info('='.repeat(60));
  log.info('ZKTeco K40 Biometric Attendance Listener');
  log.info('='.repeat(60));
  log.info(`Device: ${config.device.ip}:${config.device.port}`);
  log.info(`Poll Interval: ${config.pollInterval} seconds`);
  log.info(`Log Level: ${config.logLevel}`);
  log.info('='.repeat(60));

  // Initial connection
  const connected = await connectToDevice();
  
  if (!connected) {
    log.error('Failed to establish initial connection');
    log.info(`Will retry in ${RECONNECT_DELAY / 1000} seconds...`);
    setTimeout(main, RECONNECT_DELAY);
    return;
  }

  // Start polling
  startPolling();
  
  log.success('🚀 Listener is running! Press Ctrl+C to stop.');
}

// Start the application
main().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
