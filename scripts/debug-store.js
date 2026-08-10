const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const mongoose = require("mongoose");

async function run() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Please provide a store slug: node scripts/debug-store.js <slug>");
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI is missing from env");
    return;
  }

  await mongoose.connect(mongoUri);

  const Store = mongoose.model("Store", new mongoose.Schema({}, { strict: false }));
  const store = await Store.findOne({ slug: slug.trim().toLowerCase() }).lean();

  if (!store) {
    console.log(`Store with slug "${slug}" not found in database.`);
  } else {
    console.log("=== STORE FOUND ===");
    console.log({
      _id: store._id,
      name: store.name,
      slug: store.slug,
      countryCode: store.countryCode,
    });
  }

  await mongoose.disconnect();
}

run().catch(console.error);
