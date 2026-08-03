import {
  aiCourseGuide,
  aiLevels,
  foundationCourseGuide,
  foundationLevels,
} from "@/data/course-content";

export type CourseStatus = "Available" | "In progress" | "Mapped";

export type Lesson = {
  title: string;
  slug?: string;
  duration: string;
  goal?: string;
  practice?: string;
  mistake?: string;
};

export type CourseSource = {
  label: string;
  url: string;
  note: string;
};

export type CourseProject = {
  title: string;
  description: string;
};

export type CourseLevel = {
  label: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export type Course = {
  slug: string;
  name: string;
  shortName: string;
  eyebrow: string;
  description: string;
  status: CourseStatus;
  accent: string;
  lessonCount: number;
  levelCount: number;
  firstLesson?: string;
  levels: CourseLevel[];
  audience?: string;
  timeCommitment?: string;
  updatedAt?: string;
  prerequisites?: string[];
  outcomes?: string[];
  projects?: CourseProject[];
  sources?: CourseSource[];
};

const pythonLessons: Lesson[] = [
  { title: "Run your first Python file", duration: "10 min" },
  { title: "print(), statements, and comments", duration: "10 min" },
  { title: "Variables and clear names", duration: "12 min" },
  { title: "Numbers and arithmetic", duration: "12 min" },
  { title: "Strings and useful text", duration: "14 min" },
  { title: "Booleans and comparisons", duration: "12 min" },
  { title: "Input and output", duration: "12 min" },
  { title: "Type conversion", duration: "10 min" },
  { title: "Conditions", duration: "14 min" },
  { title: "Nested decisions", duration: "14 min" },
  { title: "Lists", duration: "15 min" },
  { title: "Tuples and sets", duration: "14 min" },
  { title: "Dictionaries", duration: "16 min" },
  { title: "for loops", duration: "15 min" },
  { title: "while loops", duration: "14 min" },
  { title: "Functions", duration: "16 min" },
  { title: "Parameters and return values", duration: "16 min" },
  { title: "Scope", duration: "12 min" },
  { title: "Errors and exceptions", duration: "16 min" },
  { title: "Modules and imports", duration: "14 min" },
  { title: "Read and write files", duration: "16 min" },
  { title: "JSON and CSV", duration: "18 min" },
  { title: "pip and virtual environments", duration: "16 min" },
  { title: "Build a P&L and risk calculator", duration: "35 min" },
];

const gitLessons: Lesson[] = [
  { title: "Why version control exists", duration: "8 min" },
  { title: "Create a repository", duration: "10 min" },
  { title: "Understand git status", duration: "10 min" },
  { title: "Stage changes", duration: "10 min" },
  { title: "Create useful commits", duration: "12 min" },
  { title: "Read a diff", duration: "12 min" },
  { title: "View project history", duration: "10 min" },
  { title: "Work with branches", duration: "14 min" },
  { title: "Merge and resolve conflicts", duration: "18 min" },
  { title: "Remotes, push, and pull", duration: "14 min" },
  { title: "Pull requests and reviews", duration: "15 min" },
  { title: "Restore, revert, and recover safely", duration: "16 min" },
];

export const courses: Course[] = [
  {
    slug: "foundations",
    name: "Developer Foundations",
    shortName: "Foundations",
    eyebrow: "Start here",
    description:
      "Learn what code is, how your computer and the web work, how to debug a small website, and how to publish it safely.",
    status: "In progress",
    accent: "blue",
    ...foundationCourseGuide,
    lessonCount: foundationLevels.reduce((total, level) => total + level.lessons.length, 0),
    levelCount: foundationLevels.length,
    firstLesson: "/lessons/what-is-code",
    levels: foundationLevels,
  },
  {
    slug: "ai-assisted-development",
    name: "AI-Assisted Development",
    shortName: "AI + Code",
    eyebrow: "Vibe safely",
    description:
      "Turn vibe coding into a disciplined skill: plan, choose models, supervise agents, build, test, secure, deploy, and maintain real products.",
    status: "In progress",
    accent: "violet",
    ...aiCourseGuide,
    lessonCount: aiLevels.reduce((total, level) => total + level.lessons.length, 0),
    levelCount: aiLevels.length,
    levels: aiLevels,
  },
  {
    slug: "python",
    name: "Python Fundamentals",
    shortName: "Python",
    eyebrow: "First language",
    description:
      "Learn readable programming fundamentals through automation, data, APIs, and practical business examples.",
    status: "In progress",
    accent: "cyan",
    lessonCount: 24,
    levelCount: 1,
    levels: [
      {
        label: "Level 1",
        title: "Fundamentals",
        description: "Write small programs, work with data, and understand common errors.",
        lessons: pythonLessons,
      },
    ],
  },
  {
    slug: "git-github",
    name: "Git and GitHub",
    shortName: "Git",
    eyebrow: "Ship safely",
    description:
      "Track changes, inspect AI-generated diffs, collaborate in public, and recover from mistakes without panic.",
    status: "In progress",
    accent: "green",
    lessonCount: 12,
    levelCount: 1,
    levels: [
      {
        label: "Level 1",
        title: "Everyday Git",
        description: "Learn the commands and mental models used in real repositories.",
        lessons: gitLessons,
      },
    ],
  },
  {
    slug: "web-development",
    name: "Web Development",
    shortName: "Web",
    eyebrow: "HTML to Next.js",
    description:
      "Progress from the structure of a page to accessible interfaces, JavaScript, TypeScript, React, and Next.js.",
    status: "Mapped",
    accent: "amber",
    lessonCount: 118,
    levelCount: 5,
    levels: [
      {
        label: "Level 0",
        title: "How the web works",
        description: "Browsers, URLs, requests, responses, and developer tools.",
        lessons: [],
      },
      {
        label: "Level 1",
        title: "HTML and CSS",
        description: "Semantic pages, readable layouts, and responsive design.",
        lessons: [],
      },
      {
        label: "Level 2",
        title: "JavaScript",
        description: "Logic, the DOM, events, modules, and APIs.",
        lessons: [],
      },
      {
        label: "Level 3",
        title: "TypeScript and React",
        description: "Build maintainable component-driven applications.",
        lessons: [],
      },
      {
        label: "Level 4",
        title: "Production Next.js",
        description: "Performance, testing, security, SEO, and deployment.",
        lessons: [],
      },
    ],
  },
  {
    slug: "sql-databases",
    name: "SQL and Databases",
    shortName: "SQL",
    eyebrow: "Make data useful",
    description:
      "Understand tables, relationships, queries, transactions, and safe database design for real applications.",
    status: "Mapped",
    accent: "rose",
    lessonCount: 42,
    levelCount: 4,
    levels: [
      {
        label: "Level 0",
        title: "Data foundations",
        description: "Rows, columns, keys, and why databases exist.",
        lessons: [],
      },
      {
        label: "Level 1",
        title: "SQL fundamentals",
        description: "Create, read, update, delete, filter, and sort.",
        lessons: [],
      },
      {
        label: "Level 2",
        title: "Relational thinking",
        description: "Joins, constraints, normalization, and transactions.",
        lessons: [],
      },
      {
        label: "Level 3",
        title: "Production data",
        description: "Indexes, migrations, backups, access, and performance.",
        lessons: [],
      },
    ],
  },
];

export const coreLessonCount = courses
  .slice(0, 4)
  .reduce((total, course) => total + course.lessonCount, 0);

export function getCourse(slug: string) {
  return courses.find((course) => course.slug === slug);
}
