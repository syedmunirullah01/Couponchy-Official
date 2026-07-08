import { Outfit } from "next/font/google";
import { Providers } from "./Providers";
import "./globals.css";
import AppToaster from "@/components/ui/Toaster";
import { getMetadataDefaults } from "@/server/services/settings-service";
import { getSettings } from "@/server/repositories/settings-repository";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export async function generateMetadata() {
  return getMetadataDefaults("Home");
}

function CustomMarkup({ markup }) {
  if (!markup?.trim()) {
    return null;
  }

  return <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: markup }} />;
}

export default async function RootLayout({ children }) {
  const settings = await getSettings();

  return (
    <html lang="en" className={`${outfit.variable}`}>
      <head>
        <CustomMarkup markup={settings.general.customHeadScript} />
      </head>
      <body className="antialiased">
        <CustomMarkup markup={settings.general.customBodyStartScript} />
        <Providers>
          {children}
        </Providers>
        <AppToaster />
        <CustomMarkup markup={settings.general.customBodyEndScript} />
      </body>
    </html>
  );
}
