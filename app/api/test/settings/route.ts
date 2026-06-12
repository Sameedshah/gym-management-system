import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    console.log('Testing settings database operations...')
    
    // Test 1: Check if system_settings table exists
    const { data: systemSettings, error: systemError } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1)
    
    console.log('System settings query:', { data: systemSettings, error: systemError })
    
    // Test 2: Try to insert/update a test setting
    const testSettings = {
      category: 'test',
      settings: {
        testValue: 'Hello World',
        timestamp: new Date().toISOString()
      }
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('system_settings')
      .upsert(testSettings)
      .select()
    
    console.log('Insert test:', { data: insertData, error: insertError })
    
    // Test 3: Read back the test setting
    const { data: readData, error: readError } = await supabase
      .from('system_settings')
      .select('*')
      .eq('category', 'test')
      .single()
    
    console.log('Read test:', { data: readData, error: readError })
    
    // Clean up test data
    await supabase
      .from('system_settings')
      .delete()
      .eq('category', 'test')
    
    return NextResponse.json({
      success: true,
      tests: {
        tableExists: !systemError,
        canInsert: !insertError,
        canRead: !readError && readData?.settings?.testValue === 'Hello World'
      },
      errors: {
        systemError: systemError?.message,
        insertError: insertError?.message,
        readError: readError?.message
      },
      data: {
        systemSettings: systemSettings?.length || 0,
        testData: readData
      }
    })
    
  } catch (error) {
    console.error('Settings test failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      },
      { status: 500 }
    )
  }
}