import { Outfit } from "next/font/google";
import { Providers } from "./Providers";
import "./globals.css";
import AppToaster from "@/components/ui/Toaster";
import { getMetadataDefaults } from "@/server/services/settings-service";
import { getSettings } from "@/server/repositories/settings-repository";
import CustomMarkupClient from "@/components/layout/CustomMarkupClient";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { COUNTRY_TO_LANG } from "@/server/services/translation-service";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata() {
  return getMetadataDefaults("Home");
}

export default async function RootLayout({ children }) {
  const [settings, countryCode] = await Promise.all([
    getSettings(),
    resolveRequestCountryCode(),
  ]);
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";

  return (
    <html lang={lang} translate="no" className={`${outfit.variable} notranslate`} suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {/* All CustomMarkupClient components live inside body so React never
            puts comment placeholder nodes inside <head>. Each component uses
            useEffect to inject into document.head or document.body itself. */}
        <CustomMarkupClient markup={settings.general.customHeadScript} target="head" />
        <CustomMarkupClient markup={settings.general.customBodyStartScript} target="body" />
        <Providers>
          {children}
        </Providers>
        <AppToaster />
        <CustomMarkupClient markup={settings.general.customBodyEndScript} target="body" />
      </body>
    </html>
  );
}
