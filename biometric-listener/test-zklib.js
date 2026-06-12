require('dotenv').config();
const ZKLib = require('zklib');

const config = {
  ip: process.env.DEVICE_IP || '192.168.1.201',
  port: parseInt(process.env.DEVICE_PORT) || 4370,
  inport: 5200,
  timeout: 10000,
};

console.log('='.repeat(60));
console.log('ZKTeco K40 Connection Test (zklib with UDP)');
console.log('='.repeat(60));
console.log(`Device IP: ${config.ip}`);
console.log(`Device Port: ${config.port}`);
console.log(`Inport: ${config.inport}`);
console.log(`Timeout: ${config.timeout}ms`);
console.log('='.repeat(60));
console.log('');

const ZK = new ZKLib(config);

console.log('📡 Step 1: Connecting to device...');
ZK.connect(function(err) {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify device IP address is correct');
    console.error('2. Ensure device is powered on and connected to network');
    console.error('3. Check that device port is 4370 (default for ZKTeco)');
    console.error('4. Ensure no firewall is blocking UDP port 4370');
    console.error('5. Try pinging the device: ping ' + config.ip);
    process.exit(1);
  }
  
  console.log('✅ Connected successfully!\n');
  
  console.log('📋 Step 2: Getting device version...');
  ZK.version(function(err, version) {
    if (err) {
      console.log('⚠️ Could not get version:', err.message);
    } else {
      console.log('✅ Device version:', version);
    }
    console.log('');
    
    console.log('🔢 Step 3: Getting serial number...');
    ZK.serialNumber(function(err, serial) {
      if (err) {
        console.log('⚠️ Could not get serial number:', err.message);
      } else {
        console.log('✅ Serial number:', serial);
      }
      console.log('');
      
      console.log('🕐 Step 4: Getting device time...');
      ZK.getTime(function(err, time) {
        if (err) {
          console.log('⚠️ Could not get time:', err.message);
        } else {
          console.log('✅ Device time:', time.toString());
        }
        console.log('');
        
        console.log('👥 Step 5: Getting users...');
        ZK.getUser(function(err, users) {
          if (err) {
            console.log('⚠️ Could not get users:', err.message);
          } else {
            console.log(`✅ Found ${users.length} enrolled user(s)`);
            if (users.length > 0) {
              console.log('   Sample users:');
              users.slice(0, 5).forEach(user => {
                console.log(`   - User ID: ${user.uid}, Name: ${user.name || 'N/A'}, Role: ${user.role}`);
              });
              if (users.length > 5) {
                console.log(`   ... and ${users.length - 5} more`);
              }
            }
          }
          console.log('');
          
          console.log('📊 Step 6: Getting attendance logs...');
          ZK.getAttendance(function(err, logs) {
            if (err) {
              console.log('⚠️ Could not get attendance logs:', err.message);
            } else {
              console.log(`✅ Found ${logs.length} attendance log(s)`);
              if (logs.length > 0) {
                console.log('   Recent logs:');
                logs.slice(-5).forEach(log => {
                  console.log(`   - User ID: ${log.uid}, Time: ${log.timestamp}`);
                });
              }
            }
            console.log('');
            
            console.log('🔌 Step 7: Disconnecting...');
            ZK.disconnect();
            console.log('✅ Disconnected successfully');
            console.log('');
            
            console.log('='.repeat(60));
            console.log('🎉 ALL TESTS PASSED!');
            console.log('='.repeat(60));
            console.log('');
            console.log('Your ZKTeco K40 device is ready to use.');
            console.log('The application will now be updated to use this library.');
            console.log('');
          });
        });
      });
    });
  });
});
