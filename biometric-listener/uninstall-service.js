const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'ZKTeco Biometric Listener',
  script: path.join(__dirname, 'index.js')
});

// Listen for the "uninstall" event
svc.on('uninstall', function() {
  console.log('✅ Service uninstalled successfully!');
  console.log('');
  console.log('The service has been removed from Windows Services.');
  console.log('You can now safely delete this folder if needed.');
  console.log('');
});

// Listen for errors
svc.on('error', function(err) {
  console.error('❌ Service uninstallation failed:');
  console.error(err.message);
  console.error('');
  console.error('Make sure you are running this as Administrator!');
  console.error('Right-click Command Prompt and select "Run as Administrator"');
  process.exit(1);
});

console.log('='.repeat(60));
console.log('Uninstalling ZKTeco Biometric Listener Service');
console.log('='.repeat(60));
console.log('');
console.log('⚠️  IMPORTANT: You must run this as Administrator!');
console.log('');
console.log('Uninstalling...');
console.log('');

// Uninstall the service
svc.uninstall();
