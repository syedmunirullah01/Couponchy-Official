import "server-only";

import { readCollection, writeCollection } from "@/server/database/json-store";
import { unstable_cache, revalidateTag } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import Event from "@/server/models/Event";

const FILE_NAME = "events.json";

function isMongoEnabled() {
  return process.env.USE_MONGODB === "true" || (process.env.USE_MONGODB !== "false" && Boolean(process.env.MONGODB_URI));
}

function mapDbEventToJs(doc) {
  if (!doc) return null;
  return {
    id: doc.id || doc._id,
    name: doc.name,
    slug: doc.slug,
    keyword: doc.keyword,
    tag: doc.tag || "",
    seoTitle: doc.seoTitle || "",
    seoDescription: doc.seoDescription || "",
    shortDescription: doc.shortDescription || "",
    longDescription: doc.longDescription || "",
    status: doc.status || "enabled",
    countryCode: doc.countryCode || "GLOBAL",
    createdAt: doc.createdAt || doc.created_at,
    updatedAt: doc.updatedAt || doc.updated_at,
  };
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeEvent(input, currentEvent) {
  const now = new Date().toISOString();
  const name = String(input.name || "").trim();
  const slug = slugify(input.slug || name);

  return {
    id: currentEvent?.id || input.id || `event_${slug}`,
    name,
    slug,
    keyword: String(input.keyword || name).trim().toLowerCase(),
    tag: String(input.tag || "").trim(),
    seoTitle: String(input.seoTitle || "").trim(),
    seoDescription: String(input.seoDescription || "").trim(),
    shortDescription: String(input.shortDescription || "").trim(),
    longDescription: String(input.longDescription || "").trim(),
    status: input.status === "disabled" ? "disabled" : "enabled",
    countryCode: String(input.countryCode || "GLOBAL").trim().toUpperCase(),
    createdAt: currentEvent?.createdAt || input.createdAt || now,
    updatedAt: now,
  };
}

async function fetchAllEvents() {
  if (isMongoEnabled()) {
    await connectToDatabase();
    const docs = await Event.find({}).lean();
    return docs.map(mapDbEventToJs).sort((a, b) => a.name.localeCompare(b.name));
  }

  const events = await readCollection(FILE_NAME, []);
  return [...events].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllEvents() {
  return unstable_cache(
    async () => fetchAllEvents(),
    ["events"],
    { revalidate: 1800, tags: ["events"] }
  )();
}

export async function getEnabledEvents() {
  const events = await getAllEvents();
  return events.filter((event) => event.status === "enabled");
}

export async function getEventBySlug(slug) {
  const events = await getAllEvents();
  return events.find((event) => event.slug === slug) || null;
}

export async function createEvent(payload) {
  const event = normalizeEvent(payload);

  if (isMongoEnabled()) {
    await connectToDatabase();
    const existing = await Event.findOne({ slug: event.slug }).lean();
    if (existing) {
      throw new Error("An event with this slug already exists.");
    }
    await Event.create({ _id: event.id, ...event });
    revalidateTag("events");
    return event;
  }

  const events = await getAllEvents();
  if (events.some((item) => item.slug === event.slug)) {
    throw new Error("An event with this slug already exists.");
  }

  const nextEvents = [...events, event];
  await writeCollection(FILE_NAME, nextEvents);
  revalidateTag("events");
  return event;
}

export async function updateEvent(slug, payload) {
  if (isMongoEnabled()) {
    await connectToDatabase();
    const currentEvent = await Event.findOne({ slug }).lean();
    if (!currentEvent) {
      return null;
    }
    
    const currentJs = mapDbEventToJs(currentEvent);
    const merged = normalizeEvent({ ...currentJs, ...payload }, currentJs);

    const existing = await Event.findOne({ slug: merged.slug, _id: { $ne: currentEvent._id } }).lean();
    if (existing) {
      throw new Error("Another event already uses this slug.");
    }

    await Event.updateOne({ _id: currentEvent._id }, { $set: merged });
    revalidateTag("events");
    return merged;
  }

  const events = await getAllEvents();
  const currentEvent = events.find((item) => item.slug === slug);

  if (!currentEvent) {
    return null;
  }

  const merged = normalizeEvent({ ...currentEvent, ...payload }, currentEvent);

  if (events.some((item) => item.slug === merged.slug && item.id !== currentEvent.id)) {
    throw new Error("Another event already uses this slug.");
  }

  const nextEvents = events.map((item) => (item.id === currentEvent.id ? merged : item));
  await writeCollection(FILE_NAME, nextEvents);
  revalidateTag("events");
  return merged;
}

export async function deleteEvent(slug) {
  let event;
  if (isMongoEnabled()) {
    await connectToDatabase();
    event = await Event.findOne({ slug }).lean();
  } else {
    const events = await getAllEvents();
    event = events.find((item) => item.slug === slug);
  }

  if (!event) {
    return false;
  }

  if (isMongoEnabled()) {
    await connectToDatabase();
    await Event.deleteOne({ _id: event._id || event.id });
  } else {
    const events = await getAllEvents();
    const nextEvents = events.filter((item) => item.slug !== slug);
    await writeCollection(FILE_NAME, nextEvents);
  }
  revalidateTag("events");
  return true;
}
