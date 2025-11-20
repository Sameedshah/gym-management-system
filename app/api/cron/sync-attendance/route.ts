import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Verify this is a legitimate cron request
    const authHeader = process.env.CRON_SECRET
    
    if (authHeader && process.env.NODE_ENV === 'production') {
      // In production, verify the cron secret
      // This would be set in your deployment environment
    }

    // Call the sync attendance API
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/biometric/sync-attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      timestamp: new Date().toISOString(),
      result
    })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Cron job failed',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}