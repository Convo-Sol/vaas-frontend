import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tfxymizvvllmqjupjyvm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmeHltaXp2dmxsbXFqdXBqeXZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzOTY5NCwiZXhwIjoyMDY5MDE1Njk0fQ.ay_bAIv5tI6UW3vUS8DYeTTaS5qXLRRV3fRFJORT4Bc'

export const supabase = createClient(supabaseUrl, supabaseServiceKey)