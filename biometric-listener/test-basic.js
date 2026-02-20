require('dotenv').config();
const ZKLib = require('node-zklib');

const config = {
  ip: process.env.DEVICE_IP || '192.168.1.201',
  port: parseInt(process.env.DEVICE_PORT) || 4370,
  timeout: 10000, // Increased timeout
  inport: 4000,
};

console.log('Testing ZKTeco K40 with different configurations...\n');
console.log(`Device IP: ${config.ip}`);
console.log(`Device Port: ${config.port}`);
console.log(`Timeout: ${config.timeout}ms\n`);

async function testWithConfig(password) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing with password: ${password}`);
  console.log('='.repeat(60));
  
  let zkInstance = null;
  
  try {
    zkInstance = new ZKLib(config.ip, config.port, config.timeout, config.inport, password);
    
    console.log('Step 1: Creating socket connection...');
    await zkInstance.createSocket();
    console.log('✅ Socket connected successfully!\n');
    
    // Try to get device info with error handling
    console.log('Step 2: Attempting to get device info...');
    try {
      const info = await zkInstance.getInfo();
      console.log('✅ Device info retrieved:');
      console.log(JSON.stringify(info, null, 2));
    } catch (err) {
      console.log('⚠️ Could not get device info:', err.message);
    }
    
    // Try to get users
    console.log('\nStep 3: Attempting to get users...');
    try {
      const users = await zkInstance.getUsers();
      console.log(`✅ Retrieved ${users.data ? users.data.length : 0} users`);
      if (users.data && users.data.length > 0) {
        console.log('Sample user:', users.data[0]);
      }
    } catch (err) {
      console.log('⚠️ Could not get users:', err.message);
    }
    
    // Try to get attendance
    console.log('\nStep 4: Attempting to get attendance logs...');
    try {
      const logs = await zkInstance.getAttendances();
      console.log(`✅ Retrieved ${logs.data ? logs.data.length : 0} attendance logs`);
      if (logs.data && logs.data.length > 0) {
        console.log('Sample log:', logs.data[0]);
      }
    } catch (err) {
      console.log('⚠️ Could not get attendance logs:', err.message);
    }
    
    console.log('\nStep 5: Disconnecting...');
    await zkInstance.disconnect();
    console.log('✅ Disconnected\n');
    
    return true;
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    if (zkInstance) {
      try {
        await zkInstance.disconnect();
      } catch (e) {
        // Ignore
      }
    }
    return false;
  }
}

async function runTests() {
  console.log('Testing different password configurations...\n');
  
  // Test with different password values
  const passwords = [0, '0', '', 1];
  
  for (const password of passwords) {
    const success = await testWithConfig(password);
    if (success) {
      console.log(`\n✅ SUCCESS! Working password: ${password}`);
      console.log('Update your .env file if this password is different.\n');
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between attempts
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test completed');
  console.log('='.repeat(60));
  console.log('\nIf all tests failed, please verify:');
  console.log('1. Device IP is correct and device is on the network');
  console.log('2. Device is powered on');
  console.log('3. No firewall is blocking port 4370');
  console.log('4. Device communication password is correct');
  console.log('5. Try accessing the device from its web interface or admin software');
}

runTests().catch(console.error);
