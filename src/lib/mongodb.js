import mongoose from "mongoose";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
  // Ignore if DNS server setting not permitted in runtime
}

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
