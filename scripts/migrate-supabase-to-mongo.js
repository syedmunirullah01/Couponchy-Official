const fs = require("fs");
const path = require("path");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const { createClient } = require("@supabase/supabase-js");
const mongoose = require("mongoose");

// 1. Manually parse .env.local for credentials
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const parts = trimmed.split("=");
      const key = parts[0].trim();
      let val = parts.slice(1).join("=").trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const mongoUri = process.env.MONGODB_URI;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

if (!mongoUri) {
  console.error("❌ Missing MONGODB_URI in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAllFromSupabase(tableName) {
  let allData = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.warn(`⚠️ Warning fetching table '${tableName}':`, error.message);
      hasMore = false;
      break;
    }

    if (data && data.length) {
      allData = allData.concat(data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  return allData;
}

async function runMigration() {
  console.log("🚀 Starting Supabase to MongoDB Atlas Migration...");
  console.log(`📡 Connecting to MongoDB Atlas...`);

  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB Connected!");

  const db = mongoose.connection.db;

  const tablesToMigrate = [
    { table: "stores", collection: "stores" },
    { table: "offers", collection: "offers" },
    { table: "categories", collection: "categories" },
    { table: "blogs", collection: "blogs" },
    { table: "events", collection: "events" },
    { table: "subscribers", collection: "subscribers" },
    { table: "notifications", collection: "notifications" },
    { table: "ignored_ips", collection: "ignored_ips" },
    { table: "translations", collection: "translations" },
    { table: "users", collection: "users" },
  ];

  const summary = {};

  for (const item of tablesToMigrate) {
    console.log(`\n📦 Migrating table: '${item.table}' -> MongoDB collection: '${item.collection}'...`);
    const rows = await fetchAllFromSupabase(item.table);
    console.log(`   Fetched ${rows.length} rows from Supabase '${item.table}'.`);

    if (rows.length > 0) {
      const collection = db.collection(item.collection);
      // Clean existing documents or update via bulkWrite
      const bulkOps = rows.map((row) => {
        const docId = row.id ? String(row.id) : undefined;
        const filter = docId ? { _id: docId } : { supabase_id: row.id || row.slug };
        
        // Use row.id as _id if string or convert properly
        const docToInsert = { ...row };
        if (docId) {
          docToInsert._id = docId;
        }

        return {
          updateOne: {
            filter,
            update: { $set: docToInsert },
            upsert: true,
          },
        };
      });

      const result = await collection.bulkWrite(bulkOps);
      summary[item.table] = {
        supabaseCount: rows.length,
        mongoUpserted: (result.upsertedCount || 0) + (result.modifiedCount || 0) + (result.matchedCount || 0),
      };
      console.log(`   ✅ Successfully migrated ${rows.length} records into '${item.collection}'.`);
    } else {
      summary[item.table] = { supabaseCount: 0, mongoUpserted: 0 };
      console.log(`   ℹ️ No records found in Supabase '${item.table}'.`);
    }
  }

  // Also migrate local JSON data (Settings & Company) if present
  console.log("\n📦 Migrating Settings & Company JSON storage into MongoDB...");
  const dataDir = path.join(__dirname, "..", "src", "server", "database", "data");
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const name = file.replace(".json", "");
        const content = fs.readFileSync(path.join(dataDir, file), "utf8");
        try {
          const parsed = JSON.parse(content);
          const collection = db.collection(name);
          await collection.updateOne(
            { _id: "global" },
            { $set: { _id: "global", data: parsed, updatedAt: new Date() } },
            { upsert: true }
          );
          console.log(`   ✅ Migrated JSON file '${file}' into MongoDB collection '${name}'.`);
        } catch (e) {
          console.warn(`   ⚠️ Could not parse JSON file '${file}':`, e.message);
        }
      }
    }
  }

  console.log("\n🎉 ============================================");
  console.log("🎉 MIGRATION COMPLETED SUCCESSFULLY!");
  console.log("🎉 Summary of migrated data:");
  console.table(summary);
  console.log("🎉 ============================================");

  await mongoose.disconnect();
  console.log("🔌 MongoDB connection closed.");
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("❌ Fatal Migration Error:", err);
  process.exit(1);
});
