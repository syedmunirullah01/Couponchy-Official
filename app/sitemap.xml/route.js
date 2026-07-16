import { NextResponse } from "next/server";
import { getAllStores } from "@/server/repositories/stores-repository";
import { getAllCategories } from "@/server/repositories/categories-repository";
import { getAllEvents } from "@/server/repositories/events-repository";
import { getAllBlogPosts } from "@/server/repositories/blog-repository";
import { getSettings } from "@/server/repositories/settings-repository";

export const dynamic = "force-dynamic";

const COUNTRY_TO_LANG = {
  US: "en",
  GB: "en",
  CA: "en",
  AU: "en",
  IN: "en",
  AE: "en",
  CH: "en",
  DE: "de",
  FR: "fr",
  NL: "nl",
  PL: "pl",
  IT: "it",
  ES: "es",
  SA: "ar",
  JP: "ja",
  PT: "pt",
  SE: "sv",
};

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

  // Pre-calculate hreflang for each country code (Google specs: language-REGION)
  const countryHreflangs = {};
  for (const c of countries) {
    const code = String(c.code || "").toUpperCase();
    const lang = COUNTRY_TO_LANG[code] || "en";
    
    if (code === "US") {
      countryHreflangs[code] = "en";
    } else {
      countryHreflangs[code] = `${lang.toLowerCase()}-${code}`;
    }
  }

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
      const alternates = [];
      for (const altCountry of countries) {
        const altCode = String(altCountry.code || "").toUpperCase();
        const altIsDefault = altCode === "US";
        const altSegment = altIsDefault ? "" : `/${altCode.toLowerCase()}`;
        alternates.push({
          hreflang: countryHreflangs[altCode],
          href: `${baseUrl}${altSegment}${page.path}`,
        });
      }
      // Add x-default pointing to the default/US version
      alternates.push({
        hreflang: "x-default",
        href: `${baseUrl}${page.path}`,
      });

      entries.push({
        url: `${baseUrl}${segment}${page.path}`,
        lastModified: now.toISOString(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates,
      });
    }

    // 2. Dynamic Stores
    const activeStores = stores.filter((s) => s.status === "enabled");
    for (const store of activeStores) {
      const lastMod = store.updatedAt ? new Date(store.updatedAt) : now;
      
      const alternates = [];
      for (const altCountry of countries) {
        const altCode = String(altCountry.code || "").toUpperCase();
        const altIsDefault = altCode === "US";
        const altSegment = altIsDefault ? "" : `/${altCode.toLowerCase()}`;
        alternates.push({
          hreflang: countryHreflangs[altCode],
          href: `${baseUrl}${altSegment}/stores/${store.slug}`,
        });
      }
      // Add x-default
      alternates.push({
        hreflang: "x-default",
        href: `${baseUrl}/stores/${store.slug}`,
      });

      entries.push({
        url: `${baseUrl}${segment}/stores/${store.slug}`,
        lastModified: lastMod.toISOString(),
        changeFrequency: "daily",
        priority: 0.9,
        alternates,
      });
    }

    // 3. Dynamic Categories
    for (const category of categories) {
      const alternates = [];
      for (const altCountry of countries) {
        const altCode = String(altCountry.code || "").toUpperCase();
        const altIsDefault = altCode === "US";
        const altSegment = altIsDefault ? "" : `/${altCode.toLowerCase()}`;
        alternates.push({
          hreflang: countryHreflangs[altCode],
          href: `${baseUrl}${altSegment}/stores?category=${category.slug}`,
        });
      }
      // Add x-default
      alternates.push({
        hreflang: "x-default",
        href: `${baseUrl}/stores?category=${category.slug}`,
      });

      entries.push({
        url: `${baseUrl}${segment}/stores?category=${category.slug}`,
        lastModified: now.toISOString(),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates,
      });
    }

    // 4. Dynamic Events
    const activeEvents = events.filter((e) => e.status === "enabled");
    for (const event of activeEvents) {
      const lastMod = event.updatedAt ? new Date(event.updatedAt) : now;
      
      const alternates = [];
      for (const altCountry of countries) {
        const altCode = String(altCountry.code || "").toUpperCase();
        const altIsDefault = altCode === "US";
        const altSegment = altIsDefault ? "" : `/${altCode.toLowerCase()}`;
        alternates.push({
          hreflang: countryHreflangs[altCode],
          href: `${baseUrl}${altSegment}/events/${event.slug}`,
        });
      }
      // Add x-default
      alternates.push({
        hreflang: "x-default",
        href: `${baseUrl}/events/${event.slug}`,
      });

      entries.push({
        url: `${baseUrl}${segment}/events/${event.slug}`,
        lastModified: lastMod.toISOString(),
        changeFrequency: "daily",
        priority: 0.8,
        alternates,
      });
    }

    // 5. Dynamic Blog Posts
    for (const post of posts) {
      const postCountry = String(post.countryCode || "GLOBAL").toUpperCase();
      if (postCountry !== "GLOBAL" && postCountry !== code) {
        continue;
      }

      const lastMod = post.updatedAt ? new Date(post.updatedAt) : now;
      
      const alternates = [];
      if (postCountry === "GLOBAL") {
        for (const altCountry of countries) {
          const altCode = String(altCountry.code || "").toUpperCase();
          const altIsDefault = altCode === "US";
          const altSegment = altIsDefault ? "" : `/${altCode.toLowerCase()}`;
          alternates.push({
            hreflang: countryHreflangs[altCode],
            href: `${baseUrl}${altSegment}/blog/${post.slug}`,
          });
        }
        // Add x-default
        alternates.push({
          hreflang: "x-default",
          href: `${baseUrl}/blog/${post.slug}`,
        });
      } else {
        // If country-specific, only itself is alternate
        alternates.push({
          hreflang: countryHreflangs[postCountry],
          href: `${baseUrl}${segment}/blog/${post.slug}`,
        });
      }

      entries.push({
        url: `${baseUrl}${segment}/blog/${post.slug}`,
        lastModified: lastMod.toISOString(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates,
      });
    }
  }

  // Build the XML response body with xmlns:xhtml namespace
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  for (const entry of entries) {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(entry.url)}</loc>\n`;
    for (const alt of entry.alternates) {
      xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}" />\n`;
    }
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
