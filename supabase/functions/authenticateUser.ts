import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "bcrypt";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const { username, password } = await req.json();

  if (!username || !password) {
    return new Response(JSON.stringify({ error: "Username and password are required" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: userProfile, error: profileError } = await supabase
    .from("app_users")
    .select("*")
    .eq("username", username)
    .single();

  if (profileError || !userProfile) {
    return new Response(JSON.stringify({ error: "Invalid username or password" }), { status: 401 });
  }

  const passwordMatch = await bcrypt.compare(password, userProfile.password_hash);
  if (!passwordMatch) {
    return new Response(JSON.stringify({ error: "Invalid username or password" }), { status: 401 });
  }

  return new Response(JSON.stringify({ success: true, user: userProfile }), { status: 200 });
});
