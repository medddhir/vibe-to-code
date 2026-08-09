import type { MetadataRoute } from "next";

import { courses } from "@/data/curriculum";
import { FOUNDATION_PUBLISHED_LESSONS } from "@/data/foundations-level1";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/learn", "/contribute"];
  const courseRoutes = courses.map((course) => `/courses/${course.slug}`);
  const lessonRoutes = FOUNDATION_PUBLISHED_LESSONS.flatMap((lesson) =>
    lesson.slug ? [`/lessons/${lesson.slug}`] : [],
  );

  return [...staticRoutes, ...courseRoutes, ...lessonRoutes].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date("2026-08-10"),
    changeFrequency: path.startsWith("/lessons") ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/lessons") ? 0.9 : 0.8,
  }));
}
