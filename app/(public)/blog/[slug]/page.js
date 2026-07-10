import { getBlogPostBySlug } from "@/server/repositories/blog-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { getTranslatedBlog, getTranslatedBlogUI, COUNTRY_TO_LANG } from "@/server/services/translation-service";
import BlogPostClient from "./BlogPostClient";
import { notFound } from "next/navigation";
import { getMetadataDefaults } from "@/server/services/settings-service";

export const dynamic = "force-dynamic";

function normalizeMetadataText(value) {
  return value ? value.replace(/\s+/g, " ").trim() : "";
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const [post, countryCode] = await Promise.all([
    getBlogPostBySlug(slug),
    resolveRequestCountryCode()
  ]);

  if (!post) {
    return {};
  }

  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";
  const translatedPost = await getTranslatedBlog(post, lang);

  // Compelling title targeting approximately 50-60 characters
  let title = `${translatedPost.title} | CouponChy Blog`;
  if (title.length > 60) {
    title = `${translatedPost.title.slice(0, 48)}... | CouponChy`;
  }

  // Description targeting approximately 140-160 characters
  let description = "";
  if (translatedPost.excerpt && translatedPost.excerpt.trim()) {
    description = translatedPost.excerpt.trim();
  } else if (translatedPost.summary && translatedPost.summary.trim()) {
    description = translatedPost.summary.trim();
  } else if (translatedPost.content && translatedPost.content.trim()) {
    // Basic clean to strip markdown characters
    description = translatedPost.content
      .replace(/[#*_\-`\[\]()]/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 150)
      .trim() + "...";
  }

  // Localized dynamic contextual suffixes for short summaries
  if (description.length < 100) {
    const suffixes = {
      en: "Read the full guide on CouponChy to maximize your savings with our verified tips.",
      de: "Lesen Sie den vollständigen Leitfaden auf CouponChy, um Ihre Ersparnisse zu maximieren.",
      fr: "Lisez le guide complet sur CouponChy pour maximiser vos économies avec nos conseils.",
      es: "Lea la guía completa en CouponChy para maximizar sus ahorros con nuestros consejos.",
      ar: "اقرأ الدليل الكامل على CouponChy لتحقيق أقصى قدر من التوفير مع نصائحنا الموثقة.",
      nl: "Lees de volledige gids op CouponChy om uw besparingen te maximaliseren met onze tips.",
      pl: "Przeczytaj pełny poradnik na CouponChy, aby zmaksymalizować swoje oszczędności.",
      it: "Leggi la guida completa su CouponChy per massimizzare i tuoi risparmi con i nostri consigli.",
      ja: "CouponChyで完全なガイドを読んで、検証済みのヒントで節約を最大化しましょう。",
      pt: "Leia o guia completo no CouponChy para maximizar suas economias com nossas dicas.",
      sv: "Läs hela guiden på CouponChy för att maximera dina besparingar med våra verifierade tips."
    };
    const suffix = suffixes[lang] || suffixes.en;
    description = `${description} ${suffix}`;
  }

  if (description.length > 160) {
    description = description.slice(0, 157) + "...";
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://couponchy.com";
  const canonicalUrl = `${baseUrl}${countryCode ? `/${countryCode.toLowerCase()}` : ""}/blog/${slug}`;

  // Multi-locale alternates configuration (hreflang)
  const supportedLanguages = ["en", "de", "fr", "nl", "pl", "it", "es", "ar", "ja", "pt", "sv"];
  const languageToCountry = {
    en: "us",
    de: "de",
    fr: "fr",
    nl: "nl",
    pl: "pl",
    it: "it",
    es: "es",
    ar: "sa",
    ja: "jp",
    pt: "pt",
    sv: "se"
  };

  const hreflangs = {};
  supportedLanguages.forEach((l) => {
    const cc = languageToCountry[l];
    hreflangs[l] = `${baseUrl}/${cc}/blog/${slug}`;
  });
  hreflangs["x-default"] = `${baseUrl}/us/blog/${slug}`;

  // Use featured/cover image if available, else static default
  const image = translatedPost.image || `${baseUrl}/images/blog-placeholder.jpg`;

  return {
    title: normalizeMetadataText(title),
    description: normalizeMetadataText(description),
    alternates: {
      canonical: canonicalUrl,
      languages: hreflangs,
    },
    openGraph: {
      title: normalizeMetadataText(title),
      description: normalizeMetadataText(description),
      url: canonicalUrl,
      type: "article",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: translatedPost.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: normalizeMetadataText(title),
      description: normalizeMetadataText(description),
      images: [image],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const [post, countryCode] = await Promise.all([
    getBlogPostBySlug(slug),
    resolveRequestCountryCode()
  ]);

  if (!post) {
    notFound();
  }

  const postCountry = String(post.countryCode || "GLOBAL").toUpperCase();
  const currentCountry = String(countryCode || "US").toUpperCase();
  if (postCountry !== "GLOBAL" && postCountry !== currentCountry) {
    notFound();
  }

  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";
  const [translatedPost, translatedUI] = await Promise.all([
    getTranslatedBlog(post, lang),
    getTranslatedBlogUI(lang)
  ]);

  return (
    <BlogPostClient
      slug={slug}
      countryCode={countryCode}
      initialArticle={translatedPost}
      initialUi={translatedUI}
    />
  );
}
