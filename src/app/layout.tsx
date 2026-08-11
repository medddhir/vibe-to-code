import type { Metadata, Viewport } from "next";
import Script from "next/script";

import "@fontsource-variable/archivo/wght.css";

import { EnvironmentProvider } from "@/components/environment-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StartupScreen } from "@/components/startup-screen";
import { getCurriculumReviewMode } from "@/lib/environment";
import { siteConfig } from "@/lib/site";

import "./globals.css";
import "./impeccable.css";
import "./premium.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Vibe to Code | Learn what your code actually does",
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
    { media: "(prefers-color-scheme: light)", color: "#f2f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#101411" },
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
      meta.setAttribute("content", theme === "dark" ? "#101411" : "#f2f4ef");
    });
  })();
`;

const startupInitScript = `
  (function () {
    var key = "vibe-to-code:intro:v1";
    var root = document.documentElement;

    try {
      if (sessionStorage.getItem(key)) {
        root.dataset.vtcIntro = "seen";
        return;
      }

      sessionStorage.setItem(key, "seen");

      ["/brand/mark-light.png", "/brand/wordmark-dark.png"].forEach(function (href) {
        var preload = document.createElement("link");
        preload.rel = "preload";
        preload.as = "image";
        preload.href = href;
        document.head.appendChild(preload);
      });

      root.dataset.vtcIntro = "play";
    } catch (error) {
      root.dataset.vtcIntro = "seen";
    }
  })();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const curriculumReview = getCurriculumReviewMode();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          id="impeccable-design-contract"
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              thesis: "Turn AI-generated code into an inspectable route from prompt to proof; refuse the generic SaaS hero and card grid.",
              ownWorld: "Porcelain and graphite work surfaces, cobalt route rails, safety-lime pass states, inspection labels, and precise cutaway panels.",
              story: "A beginner sees what the product teaches, starts Level 0, and always knows the next verified action.",
              firstViewport: "A left learning brief faces a large code inspection bench; the primary Level 0 action sits directly under the offer.",
              form: "Code Inspection Bench, grounded candidate 3, seed ee349566.",
              finish: "unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md",
            }).replace(/</g, "\\u003c"),
          }}
        />
        <Script id="vibe-to-code-theme" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <script
          dangerouslySetInnerHTML={{ __html: startupInitScript }}
          id="vibe-to-code-startup"
        />
        <EnvironmentProvider curriculumReview={curriculumReview}>
          <StartupScreen />
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </EnvironmentProvider>
      </body>
    </html>
  );
}
