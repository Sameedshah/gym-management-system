import axios, { AxiosInstance } from 'axios'
import { parseString } from 'xml2js'

export interface HikvisionConfig {
  deviceIP: string
  username: string
  password: string
  port?: number
  timeout?: number
}

export interface UserData {
  employeeNo: string
  name: string
  userType: string
}

export interface AttendanceRecord {
  employeeNo: string
  time: string
  eventType: string
  doorName?: string
}

export class HikvisionService {
  private client: AxiosInstance
  private config: HikvisionConfig

  constructor(config: HikvisionConfig) {
    this.config = config
    
    this.client = axios.create({
      baseURL: `http://${config.deviceIP}:${config.port || 80}`,
      auth: {
        username: config.username,
        password: config.password
      },
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/xml'
      }
    })
  }

  // Test device connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.get('/ISAPI/System/deviceInfo')
      return { success: response.status === 200 }
    } catch (error) {
      console.error('Device connection failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      }
    }
  }

  // Get device information
  async getDeviceInfo() {
    try {
      const response = await this.client.get('/ISAPI/System/deviceInfo')
      return this.parseXMLResponse(response.data)
    } catch (error) {
      throw new Error(`Failed to get device info: ${error}`)
    }
  }

  // Get device status
  async getDeviceStatus() {
    try {
      const response = await this.client.get('/ISAPI/System/status')
      return this.parseXMLResponse(response.data)
    } catch (error) {
      throw new Error(`Failed to get device status: ${error}`)
    }
  }

  // Add user with fingerprint
  async addUser(userData: UserData) {
    const userXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <User>
        <employeeNo>${userData.employeeNo}</employeeNo>
        <name>${userData.name}</name>
        <userType>${userData.userType}</userType>
        <Valid>
          <enable>true</enable>
          <beginTime>2024-01-01T00:00:00</beginTime>
          <endTime>2030-12-31T23:59:59</endTime>
        </Valid>
      </User>
    `

    try {
      const response = await this.client.post('/ISAPI/AccessControl/UserInfo/Record', userXML)
      return this.parseXMLResponse(response.data)
    } catch (error) {
      throw new Error(`Failed to add user: ${error}`)
    }
  }

  // Enroll fingerprint for user
  async enrollFingerprint(employeeNo: string, fingerIndex: number = 1) {
    const enrollXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <FingerPrintEnroll>
        <employeeNo>${employeeNo}</employeeNo>
        <fingerPrintID>${fingerIndex}</fingerPrintID>
      </FingerPrintEnroll>
    `

    try {
      const response = await this.client.put('/ISAPI/AccessControl/FingerPrintEnroll', enrollXML)
      return this.parseXMLResponse(response.data)
    } catch (error) {
      throw new Error(`Failed to enroll fingerprint: ${error}`)
    }
  }

  // Get attendance records
  async getAttendanceRecords(startTime: string, endTime: string): Promise<AttendanceRecord[]> {
    const searchXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <AcsEventCond>
        <searchID>001</searchID>
        <searchResultPosition>0</searchResultPosition>
        <maxResults>100</maxResults>
        <major>5</major>
        <minor>75</minor>
        <startTime>${startTime}</startTime>
        <endTime>${endTime}</endTime>
      </AcsEventCond>
    `

    try {
      const response = await this.client.post('/ISAPI/AccessControl/AcsEvent', searchXML)
      const result = await this.parseXMLResponse(response.data)
      
      const records: AttendanceRecord[] = []
      
      if (result.AcsEvent?.InfoList?.[0]?.Item) {
        for (const item of result.AcsEvent.InfoList[0].Item) {
          const employeeNo = item.employeeNoString?.[0]
          const time = item.time?.[0]
          const eventType = item.major?.[0]
          
          if (employeeNo && time) {
            records.push({
              employeeNo,
              time,
              eventType: eventType || 'unknown',
              doorName: item.doorName?.[0] || 'Main Door'
            })
          }
        }
      }
      
      return records
    } catch (error) {
      throw new Error(`Failed to get attendance records: ${error}`)
    }
  }

  // Delete user
  async deleteUser(employeeNo: string) {
    try {
      const response = await this.client.delete(`/ISAPI/AccessControl/UserInfo/Record?format=json&employeeNo=${employeeNo}`)
      return response.status === 200
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`)
    }
  }

  // Get user count
  async getUserCount() {
    try {
      const response = await this.client.get('/ISAPI/AccessControl/UserInfo/Count')
      return this.parseXMLResponse(response.data)
    } catch (error) {
      throw new Error(`Failed to get user count: ${error}`)
    }
  }

  // Parse XML response to JSON
  private parseXMLResponse(xmlData: string): Promise<any> {
    return new Promise((resolve, reject) => {
      parseString(xmlData, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }
}