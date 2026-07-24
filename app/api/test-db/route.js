import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Store from "@/server/models/Store";
import Offer from "@/server/models/Offer";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = {
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    mongoUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.slice(0, 25) + "..." : "MISSING",
    useMongoFlag: process.env.USE_MONGODB,
    mongoConnected: false,
    storesCount: 0,
    offersCount: 0,
    error: null,
  };

  try {
    await connectToDatabase();
    result.mongoConnected = true;
    result.storesCount = await Store.countDocuments({});
    result.offersCount = await Offer.countDocuments({});
  } catch (err) {
    result.error = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }

  return NextResponse.json(result);
}
