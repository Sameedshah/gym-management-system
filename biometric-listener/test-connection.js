require('dotenv').config()
const axios = require('axios')
const crypto = require('crypto')

const CONFIG = {
  ip: process.env.DEVICE_IP || '192.168.1.64',
  username: process.env.DEVICE_USERNAME || 'admin',
  password: process.env.DEVICE_PASSWORD || '@Smgym7?',
  port: process.env.DEVICE_PORT || '80'
}

console.log('🔍 Testing Hikvision Device Connection...')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`📡 Device IP: ${CONFIG.ip}:${CONFIG.port}`)
console.log(`👤 Username: ${CONFIG.username}`)
console.log(`🔑 Password: ${CONFIG.password.replace(/./g, '*')}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

// Test 1: Ping test
console.log('Test 1: Network Connectivity')
console.log('─────────────────────────────')

const testUrl = `http://${CONFIG.ip}:${CONFIG.port}/ISAPI/System/deviceInfo`

async function testConnection() {
  try {
    // Try basic connection
    console.log('⏳ Testing basic HTTP connection...')
    const response = await axios.get(testUrl, {
      timeout: 5000,
      validateStatus: () => true // Accept any status
    })
    
    if (response.status === 401) {
      console.log('✅ Device is reachable!')
      console.log('✅ Device requires authentication (expected)')
      console.log('')
      
      // Test 2: Authentication
      console.log('Test 2: Authentication')
      console.log('─────────────────────────────')
      await testAuth()
    } else if (response.status === 200) {
      console.log('✅ Device is reachable!')
      console.log('⚠️ Device does not require authentication (unusual)')
      console.log('')
      console.log('Device Info:', response.data)
    } else {
      console.log(`⚠️ Unexpected response: ${response.status}`)
      console.log('Device may not support ISAPI')
    }
    
  } catch (error) {
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot reach device')
      console.log('')
      console.log('Troubleshooting:')
      console.log('1. Check device is powered on')
      console.log('2. Verify IP address is correct')
      console.log('3. Ensure device and computer are on same network')
      console.log('4. Try: ping ' + CONFIG.ip)
    } else {
      console.log('❌ Connection error:', error.message)
    }
    process.exit(1)
  }
}

async function testAuth() {
  try {
    console.log('⏳ Testing authentication...')
    
    // Get auth challenge
    let authResponse
    try {
      authResponse = await axios.get(testUrl, { timeout: 5000 })
    } catch (error) {
      if (error.response && error.response.status === 401) {
        authResponse = error.response
      } else {
        throw error
      }
    }
    
    const wwwAuth = authResponse.headers['www-authenticate']
    
    if (!wwwAuth) {
      console.log('❌ Device does not support Digest authentication')
      return
    }
    
    // Parse auth header
    const authParams = {}
    const regex = /(\w+)=["']?([^"',]+)["']?/g
    let match
    while ((match = regex.exec(wwwAuth)) !== null) {
      authParams[match[1]] = match[2]
    }
    
    // Generate auth response
    const ha1 = crypto
      .createHash('md5')
      .update(`${CONFIG.username}:${authParams.realm}:${CONFIG.password}`)
      .digest('hex')
    
    const ha2 = crypto
      .createHash('md5')
      .update(`GET:/ISAPI/System/deviceInfo`)
      .digest('hex')
    
    const cnonce = crypto.randomBytes(8).toString('hex')
    const nc = '00000001'
    
    const response = crypto
      .createHash('md5')
      .update(`${ha1}:${authParams.nonce}:${nc}:${cnonce}:${authParams.qop}:${ha2}`)
      .digest('hex')
    
    const authHeader = `Digest username="${CONFIG.username}", realm="${authParams.realm}", ` +
                      `nonce="${authParams.nonce}", uri="/ISAPI/System/deviceInfo", ` +
                      `qop=${authParams.qop}, nc=${nc}, cnonce="${cnonce}", ` +
                      `response="${response}", opaque="${authParams.opaque}"`
    
    // Try authenticated request
    const deviceResponse = await axios.get(testUrl, {
      headers: { 'Authorization': authHeader },
      timeout: 5000
    })
    
    if (deviceResponse.status === 200) {
      console.log('✅ Authentication successful!')
      console.log('✅ Credentials are correct')
      console.log('')
      
      // Parse device info
      const deviceInfo = deviceResponse.data
      console.log('Device Information:')
      console.log('─────────────────────────────')
      
      if (typeof deviceInfo === 'string' && deviceInfo.includes('<DeviceInfo>')) {
        // Parse XML
        const modelMatch = deviceInfo.match(/<model>(.*?)<\/model>/)
        const serialMatch = deviceInfo.match(/<serialNumber>(.*?)<\/serialNumber>/)
        const firmwareMatch = deviceInfo.match(/<firmwareVersion>(.*?)<\/firmwareVersion>/)
        
        if (modelMatch) console.log(`📱 Model: ${modelMatch[1]}`)
        if (serialMatch) console.log(`🔢 Serial: ${serialMatch[1]}`)
        if (firmwareMatch) console.log(`💾 Firmware: ${firmwareMatch[1]}`)
      }
      console.log('')
      
      // Test 3: Event stream endpoint
      console.log('Test 3: Event Stream Support')
      console.log('─────────────────────────────')
      await testEventStream(authHeader)
    }
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('❌ Authentication failed!')
      console.log('❌ Username or password is incorrect')
      console.log('')
      console.log('Please check:')
      console.log('1. Username in .env file')
      console.log('2. Password in .env file')
      console.log('3. Device credentials haven\'t changed')
    } else {
      console.log('❌ Authentication error:', error.message)
    }
    process.exit(1)
  }
}

async function testEventStream(authHeader) {
  try {
    console.log('⏳ Testing event stream endpoint...')
    
    const streamUrl = `http://${CONFIG.ip}:${CONFIG.port}/ISAPI/Event/notification/alertStream`
    
    const response = await axios.get(streamUrl, {
      headers: { 'Authorization': authHeader },
      timeout: 3000,
      responseType: 'stream',
      validateStatus: () => true
    })
    
    if (response.status === 200) {
      console.log('✅ Event stream endpoint is accessible!')
      console.log('✅ Device supports ISAPI event notifications')
      console.log('')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎉 ALL TESTS PASSED!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('')
      console.log('✅ Device is reachable')
      console.log('✅ Authentication works')
      console.log('✅ Event stream supported')
      console.log('')
      console.log('🚀 You can now run: npm start')
      console.log('')
      
      // Close the stream
      response.data.destroy()
    } else if (response.status === 404) {
      console.log('⚠️ Event stream endpoint not found')
      console.log('⚠️ Device may not support event notifications')
      console.log('')
      console.log('Your device might use a different endpoint.')
      console.log('Check device documentation for ISAPI event support.')
    } else {
      console.log(`⚠️ Unexpected response: ${response.status}`)
    }
    
  } catch (error) {
    if (error.code === 'ETIMEDOUT') {
      console.log('⚠️ Event stream endpoint timeout (this might be normal)')
      console.log('✅ Device likely supports event stream')
      console.log('')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎉 TESTS COMPLETED!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('')
      console.log('🚀 You can now run: npm start')
      console.log('')
    } else {
      console.log('❌ Event stream test error:', error.message)
    }
  }
}

// Run tests
testConnection()
