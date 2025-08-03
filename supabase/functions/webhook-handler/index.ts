import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const webhookData = await req.json()
    console.log('Received webhook data:', webhookData)

    // Extract business identifier from webhook or query params
    const url = new URL(req.url)
    const businessId = url.searchParams.get('business_id')
    
    if (!businessId) {
      return new Response(
        JSON.stringify({ error: 'Missing business_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify business exists and is active
    const { data: business, error: businessError } = await supabase
      .from('app_users')
      .select('id, business_name, is_active')
      .eq('id', businessId)
      .eq('user_type', 'business')
      .eq('is_active', true)
      .single()

    if (businessError || !business) {
      console.error('Business not found:', businessError)
      return new Response(
        JSON.stringify({ error: 'Business not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert order data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          business_user_id: businessId,
          caller_number: webhookData.caller_number || webhookData.from || 'Unknown',
          call_duration: webhookData.call_duration || webhookData.duration || 0,
          call_status: webhookData.call_status || webhookData.status || 'completed',
          call_transcript: webhookData.transcript || webhookData.message || '',
          webhook_data: webhookData,
        }
      ])
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Order created successfully:', order)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        order_id: order.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})