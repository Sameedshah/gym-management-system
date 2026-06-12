require('dotenv').config();
const ZKLib = require('zklib');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const config = {
  device: {
    ip: process.env.DEVICE_IP || '192.168.1.201',
    port: parseInt(process.env.DEVICE_PORT) || 4370,
    inport: parseInt(process.env.DEVICE_INPORT) || 5200,
    timeout: parseInt(process.env.DEVICE_TIMEOUT) || 10000,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_KEY,
  },
  pollInterval: parseInt(process.env.POLL_INTERVAL) || 3,
  useRealtime: process.env.USE_REALTIME !== 'false', // Default to true
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
let isConnecting = false; // Prevent multiple simultaneous connection attempts
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;
const processedLogs = new Set(); // Track processed logs to avoid duplicates

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
function connectToDevice() {
  return new Promise((resolve, reject) => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
      reject(new Error('Connection attempt already in progress'));
      return;
    }
    
    isConnecting = true;
    
    try {
      log.info(`Connecting to ZKTeco device at ${config.device.ip}:${config.device.port}...`);
      
      // Clean up any existing instance first
      if (zkInstance) {
        try {
          zkInstance.disconnect();
        } catch (e) {
          // Ignore errors during cleanup
        }
        zkInstance = null;
      }
      
      zkInstance = new ZKLib(config.device);
      
      zkInstance.connect((err) => {
        isConnecting = false;
        
        if (err) {
          isConnected = false;
          log.error(`Failed to connect: ${err.message}`);
          log.error(`Error details: ${JSON.stringify(err)}`);
          
          // Clean up failed instance
          if (zkInstance) {
            try {
              zkInstance.disconnect();
            } catch (e) {
              // Ignore
            }
            zkInstance = null;
          }
          
          reject(err);
          return;
        }
        
        isConnected = true;
        reconnectAttempts = 0;
        log.success(`✅ Connected to ZKTeco K40 device`);
        
        // Get device info
        zkInstance.version((err, version) => {
          if (!err) {
            log.info(`Device Version: ${version}`);
          }
        });
        
        zkInstance.serialNumber((err, serial) => {
          if (!err) {
            log.info(`Serial Number: ${serial}`);
          }
        });
        
        // Enable device for communication
        zkInstance.enableDevice((err) => {
          if (err) {
            log.debug(`Could not enable device: ${err.message}`);
          } else {
            log.debug('Device enabled for communication');
          }
        });
        
        resolve();
      });
    } catch (error) {
      isConnecting = false;
      isConnected = false;
      log.error(`Exception during connection: ${error.message}`);
      log.error(`Stack: ${error.stack}`);
      
      // Clean up on exception
      if (zkInstance) {
        try {
          zkInstance.disconnect();
        } catch (e) {
          // Ignore
        }
        zkInstance = null;
      }
      
      reject(error);
    }
  });
}

/**
 * Disconnect from device
 */
function disconnectFromDevice() {
  if (zkInstance && isConnected) {
    try {
      zkInstance.disconnect();
      log.info('Disconnected from device');
    } catch (error) {
      log.error(`Error disconnecting: ${error.message}`);
    }
  }
  isConnected = false;
  zkInstance = null;
  
  // Wait a bit for socket to fully close
  return new Promise(resolve => setTimeout(resolve, 1000));
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
 * Process a single attendance log entry
 */
async function processLogEntry(logEntry) {
  try {
    const deviceUserId = logEntry.uid;
    const timestamp = logEntry.timestamp;
    
    // Enhanced debugging
    log.info(`📋 RAW LOG DATA: ${JSON.stringify(logEntry)}`);
    log.info(`👤 Device User ID: ${deviceUserId} (Type: ${typeof deviceUserId})`);
    log.debug(`Processing log: User ID ${deviceUserId} at ${timestamp}`);

    // Create unique log key
    const logKey = `${deviceUserId}-${timestamp.getTime()}`;
    
    // Skip if already processed in this session
    if (processedLogs.has(logKey)) {
      log.debug('Skipping already processed log');
      return;
    }

    // Find member in database
    const member = await findMemberByDeviceId(deviceUserId);
    
    if (!member) {
      log.error(`⚠️ Member not found for device user ID: ${deviceUserId}`);
      log.error(`🔍 TROUBLESHOOTING:`);
      log.error(`   1. Check if User ID "${deviceUserId}" exists in members table (member_id column)`);
      log.error(`   2. Verify fingerprint was enrolled on K40 device with correct User ID`);
      log.error(`   3. User ID "0" means fingerprint not enrolled or enrolled with ID 0`);
      log.error(`   4. Run: SELECT member_id, name FROM members; in Supabase to see all member IDs`);
      return;
    }

    // Save attendance record
    const saved = await saveAttendanceRecord(member, timestamp, deviceUserId);
    
    if (saved) {
      processedLogs.add(logKey);
      lastProcessedLog = logKey;
    }
  } catch (error) {
    log.error(`Error processing log entry: ${error.message}`);
  }
}

/**
 * Setup real-time log monitoring
 */
function setupRealTimeMonitoring() {
  if (!isConnected || !zkInstance) {
    log.error('Cannot setup real-time monitoring: device not connected');
    return false;
  }

  try {
    log.info('Setting up real-time attendance monitoring...');
    
    zkInstance.getRealTimeLogs((err, logEntry) => {
      if (err) {
        log.error(`Real-time log error: ${err.message}`);
        return;
      }
      
      if (logEntry) {
        log.info(`📍 Real-time log received: User ${logEntry.uid}`);
        processLogEntry(logEntry);
      }
    });
    
    log.success('✅ Real-time monitoring active');
    return true;
  } catch (error) {
    log.error(`Failed to setup real-time monitoring: ${error.message}`);
    log.info('Will continue with polling mode only');
    return false;
  }
}

/**
 * Process attendance logs from device
 */
function processAttendanceLogs() {
  return new Promise((resolve, reject) => {
    if (!isConnected || !zkInstance) {
      log.debug('Device not connected, skipping log processing');
      resolve();
      return;
    }

    log.debug('Fetching attendance logs from device...');
    
    try {
      zkInstance.getAttendance((err, logs) => {
        if (err) {
          // Check if it's a "no data" error
          if (err.message && (err.message.includes('out of range') || err.message.includes('Timeout'))) {
            log.debug('No attendance logs available on device');
            resolve();
            return;
          }
          
          log.error(`Error fetching attendance logs: ${err.message}`);
          
          // If connection error, mark as disconnected
          if (err.message.includes('socket') || err.message.includes('timeout')) {
            isConnected = false;
            log.info('Connection lost, will attempt to reconnect...');
          }
          
          resolve(); // Don't reject, just continue
          return;
        }
        
        if (!logs || logs.length === 0) {
          log.debug('No attendance logs found');
          resolve();
          return;
        }

        log.info(`Found ${logs.length} attendance log(s)`);

        // Process each log
        (async () => {
          for (const logEntry of logs) {
            await processLogEntry(logEntry);
          }
          
          resolve();
        })();
      });
    } catch (error) {
      log.error(`Exception while fetching logs: ${error.message}`);
      resolve(); // Don't reject, just continue
    }
  });
}

/**
 * Main polling loop
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
        try {
          await connectToDevice();
        } catch (error) {
          log.error(`Reconnection failed: ${error.message}`);
        }
      } else {
        log.error('Max reconnection attempts reached. Please check device and restart service.');
        return;
      }
    }

    // Process logs if connected
    if (isConnected) {
      try {
        await processAttendanceLogs();
      } catch (error) {
        log.error(`Error in polling cycle: ${error.message}`);
      }
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
  log.info(`Real-time Mode: ${config.useRealtime ? 'Enabled' : 'Disabled'}`);
  log.info(`Log Level: ${config.logLevel}`);
  log.info('='.repeat(60));

  // Initial connection
  try {
    await connectToDevice();
    
    // Setup real-time monitoring if enabled
    if (config.useRealtime) {
      setupRealTimeMonitoring();
    }
  } catch (error) {
    log.error('Failed to establish initial connection');
    log.info(`Will retry in ${RECONNECT_DELAY / 1000} seconds...`);
    
    // Ensure cleanup and wait for socket to be released
    if (zkInstance) {
      try {
        zkInstance.disconnect();
      } catch (e) {
        // Ignore
      }
      zkInstance = null;
    }
    
    // Wait before retrying to allow socket to be released
    await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
    
    // Retry connection (don't call main again, just retry connect)
    return main();
  }

  // Start polling as backup (in case real-time monitoring misses something)
  startPolling();
  
  log.success('🚀 Listener is running! Press Ctrl+C to stop.');
  log.info('💡 Using real-time monitoring for instant attendance capture');
}

// Start the application
main().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
