import "server-only";

import { getSettings } from "@/server/repositories/settings-repository";

export async function getPublicSiteSettings() {
  const settings = await getSettings();

  return {
    siteName: settings.general?.siteName,
    tagline: settings.general?.tagline,
    supportEmail: settings.general?.supportEmail,
    social: settings.social,
    seo: settings.seo,
  };
}

export async function getMetadataDefaults(pageTitle, overrides = {}) {
  const settings = await getSettings();
  const seo = settings.seo || {};
  const general = settings.general || {};

  const titleTemplate = seo.titleTemplate || "%s | Couponchy";
  const title = titleTemplate.replace("%s", pageTitle);
  const description = overrides.description || seo.metaDescription || "";
  const openGraphTitle = overrides.openGraph?.title || overrides.title || seo.ogTitle || title;
  const openGraphDescription = overrides.openGraph?.description || description || seo.ogDescription || "";
  const favicon = general.faviconUrl || "/favicon.ico";

  return {
    title: overrides.title || title,
    description,
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
    },
    robots: seo.robots,
  };
}
