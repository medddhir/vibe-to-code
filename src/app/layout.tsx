import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { RepoStarCta } from "@/components/repo-star-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
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
    url: siteConfig.url,
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f14" },
  ],
  colorScheme: "light dark",
};

const themeInitScript = `
  (function () {
    var key = "vibe-to-code:theme:v1";
    var theme = "light";
    try {
      var saved = localStorage.getItem(key);
      theme = saved === "dark" || saved === "light"
        ? saved
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch (error) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
      meta.setAttribute("content", theme === "dark" ? "#0d0f14" : "#f7f7f2");
    });
  })();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="vibe-to-code-theme" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <RepoStarCta />
        <SiteFooter />
      </body>
    </html>
  );
}
