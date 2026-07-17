import { getBlogPostBySlug } from "@/server/repositories/blog-repository";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { getTranslatedBlog, getTranslatedBlogUI, COUNTRY_TO_LANG } from "@/server/services/translation-service";
import { getHomePageData } from "@/server/services/catalog-service";
import { getAllProducts } from "@/server/repositories/products-repository";
import { getAllOffers } from "@/server/repositories/offers-repository";
import BlogPostClient from "./BlogPostClient";
import { notFound } from "next/navigation";
import { getMetadataDefaults } from "@/server/services/settings-service";
import { getSeoAlternates } from "@/server/services/seo-alternates";

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
  const alternates = await getSeoAlternates(`/blog/${slug}`, countryCode);

  // Use featured/cover image if available, else static default
  const image = translatedPost.image || `${baseUrl}/images/blog-placeholder.jpg`;

  return {
    title: normalizeMetadataText(title),
    description: normalizeMetadataText(description),
    alternates,
    openGraph: {
      title: normalizeMetadataText(title),
      description: normalizeMetadataText(description),
      url: alternates.canonical,
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
  const [translatedPost, translatedUI, homepageData, allProducts, allOffers] = await Promise.all([
    getTranslatedBlog(post, lang),
    getTranslatedBlogUI(lang),
    getHomePageData(countryCode),
    getAllProducts().catch(() => []),
    getAllOffers().catch(() => []),
  ]);

  // Resolve custom featured products and coupons
  let featuredProducts = homepageData.featuredProducts || [];
  if (post.selectedProductIds && post.selectedProductIds.length > 0) {
    const selected = allProducts.filter((p) => post.selectedProductIds.includes(p.id));
    if (selected.length > 0) {
      featuredProducts = selected;
    }
  }

  let featuredCoupons = homepageData.featuredCoupons || [];
  if (post.selectedCouponIds && post.selectedCouponIds.length > 0) {
    const selected = allOffers.filter((o) => {
      const offId = o.id || `${o.brand}_${o.title}`;
      return post.selectedCouponIds.includes(offId);
    });
    if (selected.length > 0) {
      featuredCoupons = selected;
    }
  }

  return (
    <BlogPostClient
      slug={slug}
      countryCode={countryCode}
      initialArticle={translatedPost}
      initialUi={translatedUI}
      featuredProducts={featuredProducts}
      featuredCoupons={featuredCoupons}
    />
  );
}
