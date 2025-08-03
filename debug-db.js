import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tfxymizvvllmqjupjyvm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmeHltaXp2dmxsbXFqdXBqeXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0Mzk2OTQsImV4cCI6MjA2OTAxNTY5NH0.c3ADBGBt470X4IaQE40nCVEwSNPT8Ug8Le6Vhbawwx8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugDatabase() {
  console.log('=== DATABASE DEBUG SCRIPT ===')
  
  try {
    // 1. Check if vapi_call table exists and has data
    console.log('\n1. Checking vapi_call table...')
    const { data: vapiCallData, error: vapiCallError } = await supabase
      .from('vapi_call')
      .select('*')
      .limit(5)
    
    console.log('vapi_call data:', vapiCallData)
    console.log('vapi_call error:', vapiCallError)
    
    // 2. Check if orders table exists and has data
    console.log('\n2. Checking orders table...')
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5)
    
    console.log('orders data:', ordersData)
    console.log('orders error:', ordersError)
    
    // 3. Check app_users table to see business names
    console.log('\n3. Checking app_users table...')
    const { data: usersData, error: usersError } = await supabase
      .from('app_users')
      .select('id, username, business_name, user_type')
      .eq('user_type', 'business')
    
    console.log('Business users:', usersData)
    console.log('users error:', usersError)
    
    // 4. If we have vapi_call data, show business names
    if (vapiCallData && vapiCallData.length > 0) {
      console.log('\n4. Business names in vapi_call table:')
      const businessNames = [...new Set(vapiCallData.map(item => item.business_name))]
      console.log('Unique business names:', businessNames)
    }
    
    // 5. If we have orders data, show business_user_ids
    if (ordersData && ordersData.length > 0) {
      console.log('\n5. Business user IDs in orders table:')
      const businessUserIds = [...new Set(ordersData.map(item => item.business_user_id))]
      console.log('Unique business user IDs:', businessUserIds)
    }
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

debugDatabase() 