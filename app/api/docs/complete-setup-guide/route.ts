import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'docs', 'COMPLETE_HIKVISION_SETUP_GUIDE.md')
    const content = readFileSync(filePath, 'utf8')
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': 'inline; filename="COMPLETE_HIKVISION_SETUP_GUIDE.md"'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Complete setup guide not found' },
      { status: 404 }
    )
  }
}