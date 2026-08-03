import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vibe to Code — Learn what your code actually does",
    template: "%s · Vibe to Code",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "learn coding",
    "vibe coding",
    "Python course",
    "AI-assisted development",
    "free coding course",
    "open-source education",
  ],
  authors: [{ name: "Medhir", url: "https://turbo-pay.in" }],
  creator: "Medhir",
  publisher: "TurboPay Technologies",
  openGraph: {
    title: "Vibe to Code",
    description: siteConfig.description,
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary",
    title: "Vibe to Code",
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f7f2",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
