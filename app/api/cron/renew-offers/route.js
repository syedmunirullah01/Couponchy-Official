import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/**
 * GET /api/cron/renew-offers
 *
 * Called automatically by Vercel Cron every day at midnight UTC (see vercel.json).
 * Finds all Active offers where:
 *   - auto_renew = true  (no manual expiry date was given at upload time)
 *   - expiry_date <= today  (the 15-day window has elapsed)
 * ...and resets their expiry_date to today + 15 days so the countdown restarts.
 *
 * Protected by CRON_SECRET environment variable to prevent unauthorized calls.
 */
export async function GET(request) {
  // Verify the request is from Vercel Cron or authorized caller
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Delete all expired manual offers (auto_renew = false and expiry_date < today)
    const { data: deletedData, error: deleteError } = await supabase
      .from("offers")
      .delete()
      .eq("auto_renew", false)
      .lt("expiry_date", today)
      .select("id");

    if (deleteError) {
      console.error("[cron/renew-offers] Error deleting expired manual offers:", deleteError);
    }

    const deletedManualOffers = deletedData ? deletedData.length : 0;

    // 2. Find all active auto-renew offers whose expiry has elapsed
    const { data: expiredOffers, error: fetchError } = await supabase
      .from("offers")
      .select("id, expiry_date")
      .eq("auto_renew", true)
      .eq("status", "Active")
      .lte("expiry_date", today);

    if (fetchError) {
      throw fetchError;
    }

    if (!expiredOffers || expiredOffers.length === 0) {
      return NextResponse.json({
        message: `No auto-renew offers due for renewal. Deleted ${deletedManualOffers} expired manual offer(s).`,
        renewed: 0,
        deletedManualOffers,
      });
    }

    // Calculate new expiry using monthly cycle:
    // Days 1–15 → 15th of month; Days 16–31 → last day of month
    const now = new Date();
    const day = now.getUTCDate();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const targetDay = day <= 15 ? 15 : new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const newExpiryDate = new Date(Date.UTC(year, month, targetDay)).toISOString().slice(0, 10);

    const ids = expiredOffers.map((o) => o.id);

    const { error: updateError } = await supabase
      .from("offers")
      .update({
        expiry_date: newExpiryDate,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (updateError) {
      throw updateError;
    }

    // Revalidate public pages so updated timers are reflected immediately
    revalidatePath("/", "layout");

    return NextResponse.json({
      message: `Successfully renewed ${ids.length} auto-expiry offer(s) and deleted ${deletedManualOffers} expired manual offer(s).`,
      renewed: ids.length,
      newExpiryDate,
      deletedManualOffers,
    });
  } catch (error) {
    console.error("[cron/renew-offers] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to renew offers." },
      { status: 500 }
    );
  }
}
