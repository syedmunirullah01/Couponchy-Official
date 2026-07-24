import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (global._mongooseCache.conn) {
    return global._mongooseCache.conn;
  }

  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in your environment variables (.env.local)");
  }

  if (!global._mongooseCache.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 20,
    };

    global._mongooseCache.promise = mongoose
      .connect(MONGODB_URI, opts)
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
