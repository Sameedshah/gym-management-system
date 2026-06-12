const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'ZKTeco Biometric Listener',
  description: 'Real-time attendance monitoring for ZKTeco K40 biometric device',
  script: path.join(__dirname, 'index.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    }
  ]
});

// Listen for the "install" event
svc.on('install', function() {
  console.log('✅ Service installed successfully!');
  console.log('');
  console.log('Starting service...');
  svc.start();
});

// Listen for the "start" event
svc.on('start', function() {
  console.log('✅ Service started successfully!');
  console.log('');
  console.log('Service Details:');
  console.log(`  Name: ${svc.name}`);
  console.log(`  Description: ${svc.description}`);
  console.log('');
  console.log('The service will now run automatically on Windows startup.');
  console.log('');
  console.log('To manage the service:');
  console.log('  1. Open Services (services.msc)');
  console.log('  2. Find "ZKTeco Biometric Listener"');
  console.log('  3. Right-click to Start/Stop/Restart');
  console.log('');
  console.log('To uninstall: npm run uninstall-service');
  console.log('');
});

// Listen for errors
svc.on('error', function(err) {
  console.error('❌ Service installation failed:');
  console.error(err.message);
  console.error('');
  console.error('Make sure you are running this as Administrator!');
  console.error('Right-click Command Prompt and select "Run as Administrator"');
  process.exit(1);
});

console.log('='.repeat(60));
console.log('Installing ZKTeco Biometric Listener as Windows Service');
console.log('='.repeat(60));
console.log('');
console.log('⚠️  IMPORTANT: You must run this as Administrator!');
console.log('');
console.log('Installing...');
console.log('');

// Install the service
svc.install();
