import "server-only";

import { readCollection, writeCollection } from "@/server/database/json-store";

const FILE_NAME = "company.json";

const defaultContent = {
  aboutUs: {
    // Hero section
    heroBadge: "Our Story",
    heroTitleLine1: "We killed the",
    heroTitleAccent: "expired code.",
    heroDescription: "Couponchy was built out of frustration. Every other coupon site was full of dead links and fake discounts. We built the infrastructure to verify every code — automatically, in real time, at scale.",
    // Stats (Stores & Deals counts are auto from DB)
    statMonthlyUsers: "4.6M+",
    statCodeAccuracy: "98%",
    // Mission section
    missionQuote: "Nobody should waste money on a coupon that doesn't work.",
    missionParagraph1: "We started Couponchy because we kept getting burned — coupon code after coupon code failing at checkout. The problem wasn't a lack of deals. The problem was a lack of honesty.",
    missionParagraph2: "So we built a real-time verification engine. Not just a database of codes — an automated system that actually tests them, removes the dead ones, and surfaces the ones that genuinely save you money.",
    // Promise card (right side of mission section)
    promiseTitle: "The Promise",
    promiseDescription: "Every coupon you see on Couponchy has been verified by our automated system. If it stopped working — it's already gone.",
    promiseBullet1: "Real-time code verification",
    promiseBullet2: "Auto-removal of expired deals",
    promiseBullet3: "Zero fake or misleading discounts",
    // CTA banner
    ctaEyebrow: "Start Saving Today",
    ctaTitleLine1: "Every code. Verified.",
    ctaTitleAccent: "Every time.",
    ctaDescription: "Browse our verified stores and start saving on every order — with codes that actually work.",
  },
  contactUs: {
    title: "Contact Us",
    subtitle: "We'd love to hear from you.",
    email: "support@couponchy.com",
    phone: "",
    address: "",
    businessHours: "Monday – Friday, 9am – 6pm",
    formEnabled: true,
    formNote: "Fill out the form below and we'll get back to you within 24 hours.",
  },
  privacyPolicy: {
    title: "Privacy Policy",
    lastUpdated: "2026-03-01",
    // Section 1
    introText: "Welcome to Couponchy (\"we\", \"us\", or \"our\"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safe-keep the information when you visit our platform. By accessing or using our services, you consent to the practices described in this policy.",
    // Section 2
    collectText: "We prioritize your privacy and minimize data collection. The only data we process is:",
    collectBullet1Title: "Voluntary Contact Info:",
    collectBullet1Desc: "Email address, name, or comments if you submit a coupon or use our contact form.",
    collectBullet2Title: "Usage and Device Data:",
    collectBullet2Desc: "IP address, country localization (to show relevant regional coupons), browser type, and anonymous interaction stats.",
    // Section 3
    useText: "We use collected information solely to:",
    useGrid1: "Deliver regional storefront configurations and active coupon lists.",
    useGrid2: "Verify coupon submissions and validate them using simulated headless browser checkouts.",
    useGrid3: "Process and resolve support requests submitted through our contact channels.",
    useGrid4: "Prevent fraud, security breaches, and coordinate automated abuse prevention.",
    // Section 4
    cookiesText: "We utilize cookies to remember your country preferences (e.g. storing your region preference in cookies) so that you do not need to select it again. These cookies do not track your browsing habits outside our domain. You can disable cookies in your browser settings, though some regional features may fall back to default configurations.",
    // Section 5
    dataSecurityText: "We apply industry-standard security measures, including SSL encryption and secure database controls. We never lease, trade, or sell your personal details to outside marketing agencies or aggregators.",
    // Section 6
    thirdPartyText: "Our site lists deals and links to third-party brand websites. Once you click a link and navigate away, we do not have authority over their privacy structures. We strongly advise checking the individual privacy policies of any site you visit.",
    // Section 7
    userRightsText: "Depending on your localization, you possess rights under the GDPR or CCPA to view, modify, or erase any personal information we hold (e.g. deleting contact form requests). Reach out to us via email to request details.",
    // Section 8
    policyUpdatesText: "We reserve the right to revise this Privacy Policy at any time. Any changes will be posted directly on this page with an updated modification date. We recommend checking back periodically to stay informed.",
  },
  termsOfService: {
    title: "Terms of Service",
    lastUpdated: "2026-03-01",
    // Section 1
    acceptanceText: "By accessing the website at Couponchy, you agree to comply with and be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.",
    // Section 2
    licenseText: "Permission is granted to temporarily view the materials (information or codes) on Couponchy for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:",
    licenseBullet1: "Modify or copy the materials for commercial distributions.",
    licenseBullet2: "Use the materials for any commercial purpose, or for any public display (commercial or non-commercial).",
    licenseBullet3: "Attempt to decompile, reverse engineer, or script crawlers against the internal data layers of Couponchy.",
    licenseBullet4: "Remove any copyright or other proprietary notations from the materials.",
    // Section 3
    disclaimerText: "The materials on Couponchy are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.",
    // Section 4
    limitationsText: "In no event shall Couponchy or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our platform, even if Couponchy has been notified orally or in writing of the possibility of such damage.",
    // Section 5
    revisionsText: "The materials appearing on Couponchy could include technical, typographical, or photographic errors. We do not warrant that any of the materials on the platform are accurate, complete, or current. We may make changes to the materials contained on the platform at any time without notice.",
    // Section 6
    linksText: "We have not reviewed all of the sites linked to our website and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Couponchy of the site. Use of any such linked website is at the user's own risk.",
    // Section 7
    modificationsText: "We may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.",
    // Section 8
    governingLawText: "These terms and conditions are governed by and construed in accordance with standard legal procedures, and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.",
  },
  sitemap: {
    title: "Sitemap",
    subtitle: "Find everything on Couponchy.",
    showAutoGeneratedStores: true,
    showAutoGeneratedCategories: true,
    showBlogSection: true,
    customLinks: [],
  },
};

export async function getCompanyContent() {
  const stored = await readCollection(FILE_NAME);

  if (!stored || typeof stored !== "object") {
    return defaultContent;
  }

  return {
    aboutUs: { ...defaultContent.aboutUs, ...stored.aboutUs },
    contactUs: { ...defaultContent.contactUs, ...stored.contactUs },
    privacyPolicy: { ...defaultContent.privacyPolicy, ...stored.privacyPolicy },
    termsOfService: { ...defaultContent.termsOfService, ...stored.termsOfService },
    sitemap: { ...defaultContent.sitemap, ...stored.sitemap },
  };
}

export async function updateCompanyContent(payload) {
  const current = await getCompanyContent();

  const next = {
    aboutUs: { ...current.aboutUs, ...payload.aboutUs },
    contactUs: { ...current.contactUs, ...payload.contactUs },
    privacyPolicy: { ...current.privacyPolicy, ...payload.privacyPolicy },
    termsOfService: { ...current.termsOfService, ...payload.termsOfService },
    sitemap: { ...current.sitemap, ...payload.sitemap },
  };

  await writeCollection(FILE_NAME, next);
  return next;
}
