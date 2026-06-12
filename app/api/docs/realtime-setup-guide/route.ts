import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'docs', 'HIKVISION_REALTIME_WEBHOOK_SETUP.md')
    const content = readFileSync(filePath, 'utf8')
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': 'inline; filename="HIKVISION_REALTIME_WEBHOOK_SETUP.md"'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook setup guide not found' },
      { status: 404 }
    )
  }
}