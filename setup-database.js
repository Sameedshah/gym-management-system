const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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