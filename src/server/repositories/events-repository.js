import "server-only";

import { readCollection, writeCollection } from "@/server/database/json-store";

const FILE_NAME = "events.json";

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
    seoTitle: String(input.seoTitle || "").trim(),
    seoDescription: String(input.seoDescription || "").trim(),
    shortDescription: String(input.shortDescription || "").trim(),
    longDescription: String(input.longDescription || "").trim(),
    status: input.status === "disabled" ? "disabled" : "enabled",
    createdAt: currentEvent?.createdAt || input.createdAt || now,
    updatedAt: now,
  };
}

export async function getAllEvents() {
  const events = await readCollection(FILE_NAME, []);
  return [...events].sort((a, b) => a.name.localeCompare(b.name));
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
  const events = await getAllEvents();
  const event = normalizeEvent(payload);

  if (events.some((item) => item.slug === event.slug)) {
    throw new Error("An event with this slug already exists.");
  }

  const nextEvents = [...events, event];
  await writeCollection(FILE_NAME, nextEvents);
  return event;
}

export async function updateEvent(slug, payload) {
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
  return merged;
}

export async function deleteEvent(slug) {
  const events = await getAllEvents();
  const nextEvents = events.filter((item) => item.slug !== slug);

  if (nextEvents.length === events.length) {
    return false;
  }

  await writeCollection(FILE_NAME, nextEvents);
  return true;
}
