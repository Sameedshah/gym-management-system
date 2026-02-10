require('dotenv').config()
const axios = require('axios')
const crypto = require('crypto')
const xml2js = require('xml2js')
const { createClient } = require('@supabase/supabase-js')

// Configuration
const CONFIG = {
  device: {
    ip: process.env.DEVICE_IP || '192.168.1.64',
    username: process.env.DEVICE_USERNAME || 'admin',
    password: process.env.DEVICE_PASSWORD || '@Smgym7?',
    port: process.env.DEVICE_PORT || '80'
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_KEY
  },
  reconnectDelay: parseInt(process.env.RECONNECT_DELAY) || 5000,
  logLevel: process.env.LOG_LEVEL || 'info'
}

// Initialize Supabase client
const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.key)

// Logger
const logger = {
  info: (...args) => console.log(`[INFO] ${new Date().toISOString()}`, ...args),
  error: (...args) => console.error(`[ERROR] ${new Date().toISOString()}`, ...args),
  warn: (...args) => console.warn(`[WARN] ${new Date().toISOString()}`, ...args),
  debug: (...args) => CONFIG.logLevel === 'debug' && console.log(`[DEBUG] ${new Date().toISOString()}`, ...args)
}

// HTTP Digest Authentication
class DigestAuth {
  constructor(username, password) {
    this.username = username
    this.password = password
    this.nc = 0
  }

  generateResponse(method, uri, authHeader) {
    const authParams = this.parseAuthHeader(authHeader)
    
    const ha1 = crypto
      .createHash('md5')
      .update(`${this.username}:${authParams.realm}:${this.password}`)
      .digest('hex')
    
    const ha2 = crypto
      .createHash('md5')
      .update(`${method}:${uri}`)
      .digest('hex')
    
    this.nc++
    const ncStr = ('00000000' + this.nc).slice(-8)
    const cnonce = crypto.randomBytes(8).toString('hex')
    
    const response = crypto
      .createHash('md5')
      .update(`${ha1}:${authParams.nonce}:${ncStr}:${cnonce}:${authParams.qop}:${ha2}`)
      .digest('hex')
    
    return {
      username: this.username,
      realm: authParams.realm,
      nonce: authParams.nonce,
      uri: uri,
      qop: authParams.qop,
      nc: ncStr,
      cnonce: cnonce,
      response: response,
      opaque: authParams.opaque
    }
  }

  parseAuthHeader(header) {
    const params = {}
    const regex = /(\w+)=["']?([^"',]+)["']?/g
    let match
    
    while ((match = regex.exec(header)) !== null) {
      params[match[1]] = match[2]
    }
    
    return params
  }

  buildAuthHeader(method, uri, wwwAuth) {
    const authData = this.generateResponse(method, uri, wwwAuth)
    
    return `Digest username="${authData.username}", realm="${authData.realm}", ` +
           `nonce="${authData.nonce}", uri="${authData.uri}", ` +
           `qop=${authData.qop}, nc=${authData.nc}, cnonce="${authData.cnonce}", ` +
           `response="${authData.response}", opaque="${authData.opaque}"`
  }
}

// Event Stream Listener
class HikvisionEventListener {
  constructor() {
    this.isRunning = false
    this.digestAuth = new DigestAuth(CONFIG.device.username, CONFIG.device.password)
    this.eventStreamUrl = `http://${CONFIG.device.ip}:${CONFIG.device.port}/ISAPI/Event/notification/alertStream`
    this.reconnectTimer = null
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Listener already running')
      return
    }

    logger.info('🚀 Starting Hikvision Event Listener...')
    logger.info(`📡 Device: ${CONFIG.device.ip}:${CONFIG.device.port}`)
    logger.info(`👤 Username: ${CONFIG.device.username}`)
    
    this.isRunning = true
    await this.connect()
  }

  async connect() {
    try {
      logger.info('🔌 Connecting to device event stream...')
      
      // First request to get auth challenge
      let response
      try {
        response = await axios.get(this.eventStreamUrl, {
          timeout: 10000,
          responseType: 'stream'
        })
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Got auth challenge, now authenticate
          const wwwAuth = error.response.headers['www-authenticate']
          const authHeader = this.digestAuth.buildAuthHeader('GET', '/ISAPI/Event/notification/alertStream', wwwAuth)
          
          response = await axios.get(this.eventStreamUrl, {
            headers: {
              'Authorization': authHeader
            },
            responseType: 'stream',
            timeout: 0 // No timeout for stream
          })
        } else {
          throw error
        }
      }

      logger.info('✅ Connected to device event stream')
      logger.info('👂 Listening for biometric events...')

      let buffer = ''
      
      response.data.on('data', (chunk) => {
        buffer += chunk.toString()
        
        // Process complete XML events
        const events = buffer.split('--boundary')
        buffer = events.pop() // Keep incomplete event in buffer
        
        events.forEach(event => {
          if (event.trim()) {
            this.processEvent(event)
          }
        })
      })

      response.data.on('end', () => {
        logger.warn('⚠️ Event stream ended')
        this.scheduleReconnect()
      })

      response.data.on('error', (error) => {
        logger.error('❌ Stream error:', error.message)
        this.scheduleReconnect()
      })

    } catch (error) {
      logger.error('❌ Connection failed:', error.message)
      this.scheduleReconnect()
    }
  }

  async processEvent(eventData) {
    try {
      // Extract XML content
      const xmlMatch = eventData.match(/<EventNotificationAlert[\s\S]*?<\/EventNotificationAlert>/)
      if (!xmlMatch) {
        return
      }

      const xmlData = xmlMatch[0]
      logger.debug('📨 Raw XML:', xmlData)

      // Parse XML
      const parser = new xml2js.Parser({ explicitArray: false })
      const result = await parser.parseStringPromise(xmlData)
      
      const alert = result.EventNotificationAlert
      logger.debug('📋 Parsed event:', JSON.stringify(alert, null, 2))

      // Extract attendance data
      const eventType = alert.eventType
      const eventTime = alert.dateTime
      const employeeNo = alert.employeeNoString || alert.cardNo
      const doorName = alert.doorName || alert.channelName || 'Main Door'
      const major = alert.major
      const minor = alert.minor

      logger.info(`🔔 Event received: ${eventType} | Employee: ${employeeNo} | Time: ${eventTime}`)

      // Process attendance event
      if (employeeNo) {
        await this.saveAttendance({
          employeeNo,
          eventTime,
          eventType,
          doorName,
          major,
          minor
        })
      }

    } catch (error) {
      logger.error('❌ Error processing event:', error.message)
      logger.debug('Event data:', eventData)
    }
  }

  async saveAttendance(eventData) {
    try {
      const { employeeNo, eventTime, doorName } = eventData

      // Find member by member_id
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, name, member_id')
        .eq('member_id', employeeNo)
        .single()

      if (memberError || !member) {
        logger.warn(`⚠️ Member not found for employee number: ${employeeNo}`)
        return
      }

      // Check for duplicate (within 1 minute window)
      const checkTime = new Date(eventTime)
      const timeWindow = new Date(checkTime.getTime() - 60000)

      const { data: existingCheckin } = await supabase
        .from('checkins')
        .select('id')
        .eq('member_id', member.id)
        .gte('check_in_time', timeWindow.toISOString())
        .lte('check_in_time', new Date(checkTime.getTime() + 60000).toISOString())
        .single()

      if (existingCheckin) {
        logger.debug(`⏭️ Duplicate check-in prevented for ${member.name}`)
        return
      }

      // Insert check-in record
      const { data: checkin, error: checkinError } = await supabase
        .from('checkins')
        .insert({
          member_id: member.id,
          check_in_time: eventTime,
          entry_method: 'biometric',
          scanner_id: employeeNo,
          device_name: doorName,
          notes: `Auto-synced from biometric device (${doorName})`
        })
        .select()
        .single()

      if (checkinError) {
        logger.error('❌ Failed to insert check-in:', checkinError.message)
        return
      }

      logger.info(`✅ Check-in recorded for ${member.name} (ID: ${member.member_id})`)

      // Update member stats
      await supabase
        .from('members')
        .update({
          last_seen: eventTime
        })
        .eq('id', member.id)

    } catch (error) {
      logger.error('❌ Error saving attendance:', error.message)
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    logger.info(`🔄 Reconnecting in ${CONFIG.reconnectDelay / 1000} seconds...`)
    
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, CONFIG.reconnectDelay)
  }

  stop() {
    logger.info('🛑 Stopping listener...')
    this.isRunning = false
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
  }
}

// Main execution
const listener = new HikvisionEventListener()

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('📴 Received SIGINT, shutting down gracefully...')
  listener.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('📴 Received SIGTERM, shutting down gracefully...')
  listener.stop()
  process.exit(0)
})

// Start listener
listener.start().catch(error => {
  logger.error('❌ Fatal error:', error)
  process.exit(1)
})

logger.info('✨ Hikvision Biometric Listener started successfully')
logger.info('💡 Press Ctrl+C to stop')
