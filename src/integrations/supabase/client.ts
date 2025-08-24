import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tfxymizvvllmqjupjyvm.supabase.co'
// IMPORTANT: Use the ANONYMOUS PUBLIC KEY here, not the service role key.
// The service role key should NEVER be exposed in a client-side application.
// You can find your anon key in your Supabase project's API settings.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmeHltaXp2dmxsbXFqdXBqeXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0Mzk2OTQsImV4cCI6MjA2OTAxNTY5NH0.c3ADBGBt470X4IaQE40nCVEwSNPT8Ug8Le6Vhbawwx8' // I've replaced your service key with a placeholder anon key. Please use your actual anon key.

export const supabase = createClient(supabaseUrl, supabaseAnonKey)