const Service = require('node-windows').Service

// Create a new service object
const svc = new Service({
  name: 'Hikvision Biometric Listener',
  description: 'Real-time biometric attendance event listener for Hikvision devices',
  script: require('path').join(__dirname, 'index.js'),
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
})

// Listen for the "install" event
svc.on('install', () => {
  console.log('✅ Service installed successfully!')
  console.log('🚀 Starting service...')
  svc.start()
})

svc.on('start', () => {
  console.log('✅ Service started successfully!')
  console.log('📋 Service Name: Hikvision Biometric Listener')
  console.log('🔧 You can manage it from Windows Services (services.msc)')
  console.log('')
  console.log('Service will now auto-start when Windows boots!')
})

svc.on('alreadyinstalled', () => {
  console.log('⚠️ Service is already installed')
  console.log('💡 Run "npm run uninstall-service" first to reinstall')
})

svc.on('error', (err) => {
  console.error('❌ Service error:', err)
})

// Install the service
console.log('📦 Installing Windows Service...')
console.log('⚠️ This requires Administrator privileges')
console.log('')
svc.install()
