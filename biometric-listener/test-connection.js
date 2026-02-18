require('dotenv').config();
const ZKLib = require('zklib');

const config = {
  ip: process.env.DEVICE_IP || '192.168.1.201',
  port: parseInt(process.env.DEVICE_PORT) || 4370,
  password: process.env.DEVICE_PASSWORD || '0',
  timeout: parseInt(process.env.DEVICE_TIMEOUT) || 5000,
};

console.log('='.repeat(60));
console.log('ZKTeco K40 Connection Test');
console.log('='.repeat(60));
console.log(`Device IP: ${config.ip}`);
console.log(`Device Port: ${config.port}`);
console.log(`Timeout: ${config.timeout}ms`);
console.log('='.repeat(60));
console.log('');

async function testConnection() {
  let zkInstance = null;
  
  try {
    console.log('📡 Step 1: Testing network connectivity...');
    
    // Create ZKLib instance
    zkInstance = new ZKLib(config.ip, config.port, config.timeout, config.password);
    
    console.log('✅ ZKLib instance created');
    console.log('');
    
    console.log('🔌 Step 2: Connecting to device...');
    await zkInstance.createSocket();
    console.log('✅ Socket connection established');
    console.log('');
    
    console.log('📋 Step 3: Getting device information...');
    const deviceInfo = await zkInstance.getInfo();
    console.log('✅ Device information retrieved:');
    console.log(`   Model: ${deviceInfo.model || 'Unknown'}`);
    console.log(`   Firmware: ${deviceInfo.fwVersion || 'Unknown'}`);
    console.log(`   Serial Number: ${deviceInfo.serialNumber || 'Unknown'}`);
    console.log(`   Platform: ${deviceInfo.platform || 'Unknown'}`);
    console.log('');
    
    console.log('👥 Step 4: Getting user count...');
    const users = await zkInstance.getUsers();
    console.log(`✅ Found ${users.data.length} enrolled user(s)`);
    
    if (users.data.length > 0) {
      console.log('   Sample users:');
      users.data.slice(0, 5).forEach(user => {
        console.log(`   - User ID: ${user.userId}, Name: ${user.name || 'N/A'}`);
      });
      if (users.data.length > 5) {
        console.log(`   ... and ${users.data.length - 5} more`);
      }
    }
    console.log('');
    
    console.log('📊 Step 5: Getting attendance logs...');
    const logs = await zkInstance.getAttendances();
    console.log(`✅ Found ${logs.data.length} attendance log(s)`);
    
    if (logs.data.length > 0) {
      console.log('   Recent logs:');
      logs.data.slice(-5).forEach(log => {
        console.log(`   - User ID: ${log.deviceUserId}, Time: ${log.recordTime}`);
      });
    }
    console.log('');
    
    console.log('🔌 Step 6: Disconnecting...');
    await zkInstance.disconnect();
    console.log('✅ Disconnected successfully');
    console.log('');
    
    console.log('='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Your ZKTeco K40 device is ready to use.');
    console.log('Run "npm start" to begin monitoring attendance.');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify device IP address is correct');
    console.error('2. Ensure device is powered on and connected to network');
    console.error('3. Check that device port is 4370 (default for ZKTeco)');
    console.error('4. Verify device password (default is "0")');
    console.error('5. Ensure no firewall is blocking the connection');
    console.error('6. Try pinging the device: ping ' + config.ip);
    console.error('');
    
    if (zkInstance) {
      try {
        await zkInstance.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
    
    process.exit(1);
  }
}

testConnection();
