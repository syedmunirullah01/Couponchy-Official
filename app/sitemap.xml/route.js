import { NextResponse } from "next/server";
import { getAllStores } from "@/server/repositories/stores-repository";
import { getAllCategories } from "@/server/repositories/categories-repository";
import { getAllEvents } from "@/server/repositories/events-repository";
import { getAllBlogPosts } from "@/server/repositories/blog-repository";
import { getSettings } from "@/server/repositories/settings-repository";

export const dynamic = "force-dynamic";

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://couponchy.com";

  // Fetch all dynamic entities
  const [stores, categories, events, posts, settings] = await Promise.all([
    getAllStores().catch(() => []),
    getAllCategories().catch(() => []),
    getAllEvents().catch(() => []),
    getAllBlogPosts().catch(() => []),
    getSettings().catch(() => ({})),
  ]);

  // Extract countries
  const countries = settings?.general?.countries?.length
    ? settings.general.countries
    : [
        { code: "US" },
        { code: "GB" },
        { code: "CA" },
        { code: "AU" },
        { code: "IN" },
        { code: "DE" }
      ];

  const now = new Date();
  const entries = [];

  // Generate sitemap items for each country prefix
  for (const country of countries) {
    const code = String(country.code || "").toUpperCase();
    const isDefault = code === "US";
    const segment = isDefault ? "" : `/${code.toLowerCase()}`;

    // 1. Static Pages
    const staticPages = [
      { path: "", changeFrequency: "daily", priority: 1.0 },
      { path: "/stores", changeFrequency: "daily", priority: 0.8 },
      { path: "/blog", changeFrequency: "daily", priority: 0.8 },
      { path: "/events", changeFrequency: "daily", priority: 0.8 },
      { path: "/about", changeFrequency: "weekly", priority: 0.5 },
      { path: "/contact", changeFrequency: "weekly", priority: 0.5 },
      { path: "/privacy-policy", changeFrequency: "monthly", priority: 0.3 },
      { path: "/terms-of-service", changeFrequency: "monthly", priority: 0.3 },
      { path: "/imprint", changeFrequency: "monthly", priority: 0.3 },
      { path: "/affiliate-disclosure", changeFrequency: "monthly", priority: 0.3 },
    ];

    for (const page of staticPages) {
      entries.push({
        url: `${baseUrl}${segment}${page.path}`,
        lastModified: now.toISOString(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }

    // 2. Dynamic Stores
    const activeStores = stores.filter((s) => s.status === "enabled");
    for (const store of activeStores) {
      const lastMod = store.updatedAt ? new Date(store.updatedAt) : now;
      entries.push({
        url: `${baseUrl}${segment}/stores/${store.slug}`,
        lastModified: lastMod.toISOString(),
        changeFrequency: "daily",
        priority: 0.9,
      });
    }

    // 3. Dynamic Categories
    for (const category of categories) {
      entries.push({
        url: `${baseUrl}${segment}/stores?category=${category.slug}`,
        lastModified: now.toISOString(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // 4. Dynamic Events
    const activeEvents = events.filter((e) => e.status === "enabled");
    for (const event of activeEvents) {
      const lastMod = event.updatedAt ? new Date(event.updatedAt) : now;
      entries.push({
        url: `${baseUrl}${segment}/events/${event.slug}`,
        lastModified: lastMod.toISOString(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    // 5. Dynamic Blog Posts
    for (const post of posts) {
      const postCountry = String(post.countryCode || "GLOBAL").toUpperCase();
      if (postCountry !== "GLOBAL" && postCountry !== code) {
        continue;
      }

      const lastMod = post.updatedAt ? new Date(post.updatedAt) : now;
      entries.push({
        url: `${baseUrl}${segment}/blog/${post.slug}`,
        lastModified: lastMod.toISOString(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // Build the XML response body
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const entry of entries) {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(entry.url)}</loc>\n`;
    xml += `    <lastmod>${entry.lastModified}</lastmod>\n`;
    xml += `    <changefreq>${entry.changeFrequency}</changefreq>\n`;
    xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60",
    },
  });
}
