import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log("Starting expired orders cleanup...");

    // Time limits
    const PIX_EXPIRATION_HOURS = 1; // PIX is fast, 1 hour is plenty
    const CREDIT_CARD_EXPIRATION_HOURS = 24; // Cards might need more time

    const now = new Date();
    const pixThreshold = new Date(now.getTime() - PIX_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString();
    const cardThreshold = new Date(now.getTime() - CREDIT_CARD_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString();

    // 1. Find expired PIX orders
    const { data: expiredPixOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("status", "Aguardando Pagamento")
      .eq("payment_method", "pix")
      .lt("created_at", pixThreshold);

    // 2. Find expired Credit Card orders (if they stayed in 'Aguardando' for too long)
    const { data: expiredCardOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("status", "Aguardando Pagamento")
      .eq("payment_method", "credit_card")
      .lt("created_at", cardThreshold);

    const allExpired = [...(expiredPixOrders || []), ...(expiredCardOrders || [])];

    if (allExpired.length === 0) {
      return new Response(JSON.stringify({ message: "No expired orders found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${allExpired.length} expired orders. Cancelling...`);

    for (const order of allExpired) {
      // A. Update status to Cancelado
      await supabase
        .from("orders")
        .update({ status: "Cancelado" })
        .eq("id", order.id);

      // B. Restore stock using our RPC function
      // NOTE: We only restore if the order was previously confirmed (but here we only target 'Aguardando', 
      // where stock wasn't even deducted yet based on our previous logic. 
      // HOWEVER, if you ever change to deduct stock at checkout, this RPC handles it safely.)
      // Since our current logic only deducts stock on 'Pago', this step is for safety/consistency.
      await supabase.rpc("restore_stock", { p_order_id: order.id });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      cancelledCount: allExpired.length,
      ids: allExpired.map(o => o.id)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Cleanup function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
