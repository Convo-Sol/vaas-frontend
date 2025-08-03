import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Async function to process webhook data
async function processWebhookData(supabase: any, webhookData: any, businessId: string) {
  try {
    console.log('Processing webhook data for business:', businessId)

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
      return { success: false, error: 'Business not found or inactive' }
    }

    // Extract business name for vapi_call table
    const businessName = business.business_name

    // Insert order data into vapi_call table
    const { data: order, error: orderError } = await supabase
      .from('vapi_call')
      .insert([
        {
          business_name: businessName,
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
      return { success: false, error: 'Failed to create order' }
    }

    console.log('Order created successfully:', order)
    return { success: true, order_id: order.id }

  } catch (error) {
    console.error('Error processing webhook data:', error)
    return { success: false, error: 'Internal processing error' }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Respond immediately for non-POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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

    // Respond immediately with success
    const response = new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook received successfully',
        processing: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

    // Process data asynchronously (don't await)
    processWebhookData(supabase, webhookData, businessId)
      .then(result => {
        if (result.success) {
          console.log('Webhook processing completed successfully:', result.order_id)
        } else {
          console.error('Webhook processing failed:', result.error)
        }
      })
      .catch(error => {
        console.error('Webhook processing error:', error)
      })

    return response

  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})