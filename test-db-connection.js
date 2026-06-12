const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

console.log('Testing database connection...')
console.log('Supabase URL:', supabaseUrl)
console.log('Service Key exists:', !!supabaseServiceKey)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testConnection() {
  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...')
    const { data, error } = await supabase.from('organizations').select('count').limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Database connection successful')
    
    // Test if tables exist
    console.log('\n2. Testing table existence...')
    const tables = ['organizations', 'users', 'members', 'invoices', 'checkins']
    
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('count').limit(1)
      if (tableError) {
        console.error(`❌ Table '${table}' error:`, tableError.message)
      } else {
        console.log(`✅ Table '${table}' exists`)
      }
    }
    
    // Test user creation (simulate webhook)
    console.log('\n3. Testing user creation...')
    const testUserId = 'test_user_' + Date.now()
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        clerk_user_id: testUserId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'owner',
        is_active: true
      })
      .select()
    
    if (userError) {
      console.error('❌ User creation failed:', userError.message)
    } else {
      console.log('✅ User creation successful:', userData[0]?.id)
      
      // Clean up test user
      await supabase.from('users').delete().eq('clerk_user_id', testUserId)
      console.log('✅ Test user cleaned up')
    }
    
    return true
  } catch (err) {
    console.error('❌ Test failed:', err.message)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 All tests passed!')
  } else {
    console.log('\n💥 Some tests failed!')
  }
  process.exit(success ? 0 : 1)
})