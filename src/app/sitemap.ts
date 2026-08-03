import type { MetadataRoute } from "next";

import { courses } from "@/data/curriculum";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/learn", "/lessons/what-is-code", "/contribute"];
  const courseRoutes = courses.map((course) => `/courses/${course.slug}`);

  return [...staticRoutes, ...courseRoutes].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date("2026-08-03"),
    changeFrequency: path.startsWith("/lessons") ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/lessons") ? 0.9 : 0.8,
  }));
}
