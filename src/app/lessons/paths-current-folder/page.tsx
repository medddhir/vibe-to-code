import type { Metadata } from "next";

import { ChoiceCheckpoint } from "@/components/choice-checkpoint";
import { PathResolverLab } from "@/components/foundations/computer-confidence-labs";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import type { GuidedLessonStep } from "@/components/guided-lesson-flow";
import {
  FOUNDATION_LEVEL0_TOTAL_LESSONS,
  FOUNDATION_TOTAL_LESSONS,
  getFoundationsCourseLessonNumber,
  getFoundationsLessonNumber,
} from "@/data/foundations-level1";

const lessonSlug = "paths-current-folder";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 5;
const courseLessonNumber = getFoundationsCourseLessonNumber(lessonSlug) ?? 5;
const knownPaths = [
  "/project/index.html",
  "/project/images/logo.svg",
  "/project/pages/about.html",
  "/project/styles/main.css",
];
const lessonSteps: GuidedLessonStep[] = [
  { id: "path-model", title: "Read absolute and relative paths", eyebrow: "An address for a file", requiresPractice: true },
  { id: "same-folder", title: "Resolve from the project folder", eyebrow: "Current folder matters", requiresPractice: true },
  { id: "move-up", title: "Move up with two dots", eyebrow: "Parent folder", requiresPractice: true },
  { id: "case-slashes", title: "Respect case and separators", eyebrow: "Exact addresses", requiresPractice: true },
  { id: "path-transfer", title: "Connect a nested page", eyebrow: "Final checkpoint", requiresPractice: true },
];

export const metadata: Metadata = {
  title: `Level 0 · Lesson ${lessonNumber} of ${FOUNDATION_LEVEL0_TOTAL_LESSONS}: Paths and your current folder`,
  description: "Resolve absolute and relative file paths, use parent folders safely, and understand why the current folder changes an address.",
};

export default function PathsCurrentFolderLesson() {
  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="Paths and your current folder"
      levelTitle="Level 0"
      totalLessons={FOUNDATION_LEVEL0_TOTAL_LESSONS}
      courseLessonNumber={courseLessonNumber}
      courseTotalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={12}
      steps={lessonSteps}
    >
      <section id="path-model" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">An address for a file</p>
        <h2>A path tells a tool where to look.</h2>
        <p>
          An <strong>absolute path</strong> starts from a fixed root, such as <code>/project/images/logo.svg</code>.
          A <strong>relative path</strong> starts from your current file or folder, such as <code>images/logo.svg</code>.
        </p>
        <ChoiceCheckpoint
          stepId="path-model"
          title="Recognize a relative path"
          question="Which path is relative to the current project folder?"
          options={[
            { id: "relative", label: "images/logo.svg", feedback: "Correct. It begins from wherever the current folder is." },
            { id: "absolute", label: "/project/images/logo.svg", feedback: "The leading slash makes this an absolute path in our learning workspace." },
            { id: "url", label: "https://example.com/logo.svg", feedback: "That is a web URL, not a local relative file path." },
          ]}
          correctId="relative"
          successMessage="Exactly. A relative path needs a starting location to make sense."
          hint="Choose the path without a leading slash or web protocol."
        />
      </section>

      <section id="same-folder" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Current folder matters</p>
        <h2>Resolve a path from /project.</h2>
        <p>The current folder is the starting point. Add each path segment from left to right.</p>
        <PathResolverLab
          stepId="same-folder"
          title="Find the logo from the project root"
          instructions="Enter the relative path from /project to /project/images/logo.svg."
          currentFolder="/project"
          starterPath="logo.svg"
          targetPath="/project/images/logo.svg"
          knownPaths={knownPaths}
          successMessage="Resolved. images/logo.svg starts inside /project, so it reaches the logo."
          hint="The file is inside the images folder, so include both path segments: images/logo.svg"
        />
      </section>

      <section id="move-up" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Parent folder</p>
        <h2>Two dots mean “go up one folder.”</h2>
        <p>From /project/pages, the images folder is not inside pages. First move up to /project, then move into images.</p>
        <PathResolverLab
          stepId="move-up"
          title="Reach a sibling folder"
          instructions="Resolve the logo path while your current folder is /project/pages."
          currentFolder="/project/pages"
          starterPath="images/logo.svg"
          targetPath="/project/images/logo.svg"
          knownPaths={knownPaths}
          successMessage="Correct. ../ moved from pages up to project before entering images."
          hint="Start with ../ and then add images/logo.svg"
        />
      </section>

      <section id="case-slashes" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Exact addresses</p>
        <h2>Computers can treat Logo.svg and logo.svg as different files.</h2>
        <p>Use forward slashes in web paths and copy the exact letter case. A path can be almost right and still point nowhere.</p>
        <ChoiceCheckpoint
          stepId="case-slashes"
          title="Choose the exact path"
          question="The file is saved as images/logo.svg. Which web path matches it exactly?"
          options={[
            { id: "exact", label: "images/logo.svg", feedback: "Correct. Folder, slash, filename, case, and extension all match." },
            { id: "case", label: "images/Logo.svg", feedback: "Capital L may point to a different filename on a case-sensitive system." },
            { id: "backslash", label: "images\\logo.svg", feedback: "Web paths use forward slashes, even if some Windows file tools display backslashes." },
          ]}
          correctId="exact"
          successMessage="Right. Treat a path like an exact address, not a rough description."
          hint="Match every character in images/logo.svg."
        />
      </section>

      <section id="path-transfer" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Final checkpoint</p>
        <h2>Connect a nested page to a stylesheet.</h2>
        <p>about.html is inside /project/pages. Find main.css inside the sibling /project/styles folder.</p>
        <PathResolverLab
          stepId="path-transfer"
          title="Resolve the stylesheet path"
          instructions="Enter the relative path from /project/pages to /project/styles/main.css."
          currentFolder="/project/pages"
          starterPath="styles/main.css"
          targetPath="/project/styles/main.css"
          knownPaths={knownPaths}
          successMessage="Path connected. You used the current folder, parent folder, and exact file address together."
          hint="Move up from pages with ../, then enter styles/main.css"
        />
      </section>
    </FoundationLessonPage>
  );
}
