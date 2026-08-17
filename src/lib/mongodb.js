import dns from "dns";

try {
  dns.setDefaultResultOrder("ipv4first");
  if (process.env.NODE_ENV === "development") {
    console.log("Current DNS servers:", dns.getServers());
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    console.log("Updated DNS servers:", dns.getServers());
  }
} catch (e) {
  console.error("Failed to set DNS servers:", e);
}

import mongoose from "mongoose";

if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (global._mongooseCache.conn) {
    return global._mongooseCache.conn;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Please define MONGODB_URI in your environment variables (.env.local)");
  }

  if (!global._mongooseCache.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 20,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    global._mongooseCache.promise = mongoose
      .connect(mongoUri, opts)
      .then((m) => m);
  }

  try {
    global._mongooseCache.conn = await global._mongooseCache.promise;
  } catch (e) {
    global._mongooseCache.promise = null;
    throw e;
  }

  return global._mongooseCache.conn;
}
