import TermsOfServicePage from "@/features/terms-of-service/components/TermsOfServicePage";
import { getPublicSiteSettings } from "@/server/services/settings-service";
import { getCompanyContent } from "@/server/repositories/company-repository";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  try {
    const company = await getCompanyContent();
    return {
      title: `${company.termsOfService.title || "Terms of Service"} | Couponchy`,
      description: "Review the Terms of Service for using Couponchy. Understand user obligations, content guidelines, and legal terms.",
    };
  } catch {
    return {
      title: "Terms of Service | Couponchy",
      description: "Review the Terms of Service for using Couponchy. Understand user obligations, content guidelines, and legal terms.",
    };
  }
}

export default async function Page() {
  const [settings, company] = await Promise.all([
    getPublicSiteSettings().catch(() => ({})),
    getCompanyContent().catch(() => null),
  ]);
  return <TermsOfServicePage settings={settings} company={company} />;
}
