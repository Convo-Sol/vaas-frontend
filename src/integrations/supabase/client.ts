import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tfxymizvvllmqjupjyvm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmeHltaXp2dmxsbXFqdXBqeXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0Mzk2OTQsImV4cCI6MjA2OTAxNTY5NH0.c3ADBGBt470X4IaQE40nCVEwSNPT8Ug8Le6Vhbawwx8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)