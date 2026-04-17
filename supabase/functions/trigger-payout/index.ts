import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

/**
 * Handles payout simulation request by validating latest zone risk and writing transaction records.
 * @param {Request} req
 * @returns {Promise<Response>}
 */
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing Supabase environment configuration."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json();
    const riderId = body?.riderId as string | undefined;
    const amount = Number(body?.amount ?? 0);
    const reason = (body?.reason as string | undefined) || "Parametric trigger payout";

    if (!riderId || amount <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid payout request payload."
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { data: rider, error: riderError } = await supabase
      .from("riders")
      .select("id, assigned_zone_id, wallet_balance")
      .eq("id", riderId)
      .single();

    if (riderError || !rider) {
      throw riderError || new Error("Rider not found.");
    }

    const { data: zone, error: zoneError } = await supabase
      .from("zones")
      .select("id, risk_threshold")
      .eq("id", rider.assigned_zone_id)
      .single();

    if (zoneError || !zone) {
      throw zoneError || new Error("Zone not found.");
    }

    const { data: latestRisk, error: riskError } = await supabase
      .from("risk_scores")
      .select("risk_score, payout_triggered")
      .eq("zone_id", zone.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (riskError) {
      throw riskError;
    }

    const threshold = Number(zone.risk_threshold || 80);
    const score = Number(latestRisk?.risk_score || 0);
    const payoutEligible = Boolean(latestRisk?.payout_triggered) || score >= threshold;

    if (!payoutEligible) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Risk threshold not crossed for payout trigger."
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const transactionPayload = {
      rider_id: riderId,
      type: "payout",
      amount,
      description: reason
    };

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert(transactionPayload)
      .select("id")
      .single();

    if (transactionError || !transaction) {
      throw transactionError || new Error("Failed to create payout transaction.");
    }

    const currentBalance = Number(rider.wallet_balance || 0);
    const { error: walletUpdateError } = await supabase
      .from("riders")
      .update({
        wallet_balance: currentBalance + amount
      })
      .eq("id", riderId);

    if (walletUpdateError) {
      throw walletUpdateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transaction.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unexpected payout function error."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
