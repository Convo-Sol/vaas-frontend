import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "bcrypt";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const { email, password, username, businessName, callRate, autoPrint, logoUrl } = await req.json();

  if (!email || !password || !username || !businessName) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Hash the password before storing
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const { data, error } = await supabase
    .from("app_users")
    .insert([
      {
        email,
        password_hash: passwordHash,
        username,
        business_name: businessName,
        call_rate: callRate,
        auto_print: autoPrint,
        image_url: logoUrl, // Changed from logo_url to image_url
        user_type: "business",
        is_active: true,
      },
    ])
    .select();

  if (error) {
    console.error("Error creating client:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true, clientId: data[0].id }), { status: 201 });
});
