const Service = require('node-windows').Service

// Create a new service object
const svc = new Service({
  name: 'Hikvision Biometric Listener',
  script: require('path').join(__dirname, 'index.js')
})

// Listen for the "uninstall" event
svc.on('uninstall', () => {
  console.log('✅ Service uninstalled successfully!')
  console.log('🗑️ Service has been removed from Windows Services')
})

svc.on('alreadyuninstalled', () => {
  console.log('⚠️ Service is not installed')
})

svc.on('error', (err) => {
  console.error('❌ Uninstall error:', err)
})

// Uninstall the service
console.log('🗑️ Uninstalling Windows Service...')
console.log('⚠️ This requires Administrator privileges')
console.log('')
svc.uninstall()
