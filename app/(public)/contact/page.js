import ContactPage from "@/features/contact/components/ContactPage";
import { getPublicSiteSettings } from "@/server/services/settings-service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact Us | Couponchy",
  description:
    "Have questions, suggestions, or want to submit a new coupon code? Reach out to the Couponchy team directly.",
};

export default async function Page() {
  const settings = await getPublicSiteSettings();
  return <ContactPage settings={settings} />;
}
