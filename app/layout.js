import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./Providers";
import "./globals.css";
import AppToaster from "@/components/ui/Toaster";
import { getMetadataDefaults } from "@/server/services/settings-service";
import { getSettings } from "@/server/repositories/settings-repository";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
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
    <html lang="en">
      <head>
        <CustomMarkup markup={settings.general.customHeadScript} />
      </head>
      <body className={`${plusJakartaSans.variable} antialiased`}>
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
