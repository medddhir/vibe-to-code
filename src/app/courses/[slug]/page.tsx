import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CourseOverview } from "@/components/course-overview";
import { courses, getCourse } from "@/data/curriculum";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    return { title: "Course not found" };
  }

  return {
    title: course.name,
    description: course.description,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    notFound();
  }

  return (
    <main id="main-content">
      <CourseOverview course={course} />
    </main>
  );
}
