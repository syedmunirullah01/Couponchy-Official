import "server-only";

import { getSettings } from "@/server/repositories/settings-repository";

export async function getPublicSiteSettings() {
  const settings = await getSettings();

  return {
    siteName: settings.general.siteName,
    tagline: settings.general.tagline,
    supportEmail: settings.general.supportEmail,
    social: settings.social,
    seo: settings.seo,
  };
}

export async function getMetadataDefaults(pageTitle, overrides = {}) {
  const settings = await getSettings();
  const title = settings.seo.titleTemplate.replace("%s", pageTitle);
  const description = overrides.description || settings.seo.metaDescription;
  const openGraphTitle = overrides.openGraph?.title || overrides.title || settings.seo.ogTitle;
  const openGraphDescription = overrides.openGraph?.description || description || settings.seo.ogDescription;

  return {
    title: overrides.title || title,
    description,
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
    },
    robots: settings.seo.robots,
  };
}
