// Fix: update all active offers (regardless of auto_renew) to monthly cycle expiry
const SUPABASE_URL = "https://ggnxkmuobokpdjeaulcv.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnbnhrbXVvYm9rcGRqZWF1bGN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQxMzA3NiwiZXhwIjoyMDk3OTg5MDc2fQ.CY1KhJG70u-8miGaBbdkH5wgoHiBCzTCAGSLR2lzrY4";

function getMonthCycleExpiry() {
  const now = new Date();
  const day = now.getUTCDate();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const targetDay = day <= 15 ? 15 : new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, targetDay)).toISOString().slice(0, 10);
}

async function fixAll() {
  const newExpiry = getMonthCycleExpiry();
  console.log(`Target expiry: ${newExpiry}`);

  // Update ALL active offers that don't have a far-future manual expiry (> 1 year from now)
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const cutoff = oneYearLater.toISOString().slice(0, 10);

  // Fetch active offers with expiry_date less than 1 year away
  const fetchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/offers?status=eq.Active&expiry_date=lt.${cutoff}&select=id,expiry_date`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  const offers = await fetchRes.json();
  console.log(`Found ${offers.length} offers to update (expiry < ${cutoff})`);

  if (!offers.length) {
    console.log("Nothing to update.");
    return;
  }

  const ids = offers.map((o) => `"${o.id}"`).join(",");

  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/offers?id=in.(${ids})`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        expiry_date: newExpiry,
        auto_renew: true,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!updateRes.ok) {
    console.error("Update failed:", await updateRes.text());
    return;
  }

  console.log(`✅ Updated ${offers.length} offers → expiry: ${newExpiry}, auto_renew: true`);
}

fixAll().catch(console.error);
