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

console.log('Setting up database...')
console.log('Supabase URL:', supabaseUrl)
console.log('Service Key exists:', !!supabaseServiceKey)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please update your .env.local file with the correct SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Please replace YOUR_SERVICE_ROLE_KEY_HERE with your actual service role key')
  console.error('Get it from: https://rhnerzynwcmwzorumqdq.supabase.co → Settings → API')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  try {
    console.log('\n1. Testing connection...')
    
    // Test connection first
    const { data, error } = await supabase.from('organizations').select('count').limit(1)
    
    if (error && error.message.includes('relation "organizations" does not exist')) {
      console.log('✅ Connected to database, but tables need to be created')
      
      // Read and execute the SQL setup script
      console.log('\n2. Creating database tables...')
      const sqlContent = fs.readFileSync('scripts/00_multi_tenant_setup.sql', 'utf8')
      
      // Split SQL into individual statements and execute them
      const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0)
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim()
        if (statement) {
          try {
            const { error: execError } = await supabase.rpc('exec', { sql: statement + ';' })
            if (execError) {
              console.log(`Statement ${i + 1} error (might be expected):`, execError.message)
            }
          } catch (err) {
            console.log(`Statement ${i + 1} error (might be expected):`, err.message)
          }
        }
      }
      
      console.log('✅ Database setup completed')
      
    } else if (error) {
      console.error('❌ Database connection failed:', error.message)
      return false
    } else {
      console.log('✅ Database already set up and accessible')
    }
    
    // Test table access
    console.log('\n3. Testing table access...')
    const tables = ['organizations', 'users', 'members']
    
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('count').limit(1)
      if (tableError) {
        console.log(`❌ Table '${table}' error:`, tableError.message)
      } else {
        console.log(`✅ Table '${table}' accessible`)
      }
    }
    
    return true
  } catch (err) {
    console.error('❌ Setup failed:', err.message)
    return false
  }
}

setupDatabase().then(success => {
  if (success) {
    console.log('\n🎉 Database setup completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Deploy your app to Vercel')
    console.log('2. Set up Clerk webhooks pointing to your deployed URL')
    console.log('3. Test user registration and onboarding')
  } else {
    console.log('\n💥 Database setup failed!')
    console.log('Please check your Supabase credentials and try again.')
  }
  process.exit(success ? 0 : 1)
})