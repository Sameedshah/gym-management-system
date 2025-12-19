const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables manually
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSqlFile(filename) {
  try {
    const sqlContent = fs.readFileSync(path.join('scripts', filename), 'utf8')
    console.log(`Running ${filename}...`)
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error(`Error running ${filename}:`, error)
      return false
    }
    
    console.log(`✅ ${filename} completed successfully`)
    return true
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message)
    return false
  }
}

async function setupDatabase() {
  console.log('Setting up database...')
  
  const scripts = [
    '001_create_tables.sql',
    '002_seed_data.sql', 
    '003_functions_and_triggers.sql'
  ]
  
  for (const script of scripts) {
    const success = await runSqlFile(script)
    if (!success) {
      console.error('Database setup failed')
      process.exit(1)
    }
  }
  
  console.log('🎉 Database setup completed successfully!')
}

setupDatabase().catch(console.error)