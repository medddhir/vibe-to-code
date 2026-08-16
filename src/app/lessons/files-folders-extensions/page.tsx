import type { Metadata } from "next";

import { requireAuthenticatedLessonAccess } from "@/lib/auth/lesson-access";
import { ChoiceCheckpoint } from "@/components/choice-checkpoint";
import { FileExplorerLab } from "@/components/foundations/computer-confidence-labs";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import type { GuidedLessonStep } from "@/components/guided-lesson-flow";
import {
  FOUNDATION_LEVEL0_TOTAL_LESSONS,
  FOUNDATION_TOTAL_LESSONS,
  getFoundationsCourseLessonNumber,
  getFoundationsLessonNumber,
} from "@/data/foundations-level1";

export const dynamic = "force-dynamic";


const lessonSlug = "files-folders-extensions";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 4;
const courseLessonNumber = getFoundationsCourseLessonNumber(lessonSlug) ?? 4;
const lessonSteps: GuidedLessonStep[] = [
  { id: "file-folder-model", title: "Separate files and folders", eyebrow: "Container versus content", requiresPractice: true },
  { id: "build-project-tree", title: "Build a tiny project", eyebrow: "File Explorer lab", requiresPractice: true },
  { id: "extension-trap", title: "Spot the hidden .txt trap", eyebrow: "Exact names matter", requiresPractice: true },
  { id: "extension-jobs", title: "Read common extensions", eyebrow: "File type clues", requiresPractice: true },
  { id: "organize-transfer", title: "Organize a second project", eyebrow: "Final checkpoint", requiresPractice: true },
];

export const metadata: Metadata = {
  title: `Level 0 · Lesson ${lessonNumber} of ${FOUNDATION_LEVEL0_TOTAL_LESSONS}: Files, folders, and extensions`,
  description: "Create a tidy project tree and learn why exact filenames and extensions such as .html, .css, and .js matter.",
};

export default async function FilesFoldersExtensionsLesson() {
  await requireAuthenticatedLessonAccess("/lessons/files-folders-extensions");

  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="Files, folders, and extensions"
      levelTitle="Level 0"
      totalLessons={FOUNDATION_LEVEL0_TOTAL_LESSONS}
      courseLessonNumber={courseLessonNumber}
      courseTotalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={12}
      steps={lessonSteps}
    >
      <section id="file-folder-model" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Container versus content</p>
        <h2>A folder organizes things; a file holds content.</h2>
        <p>A project folder keeps related code, images, and notes together. Files inside it have names that tools can locate and open.</p>
        <ChoiceCheckpoint
          stepId="file-folder-model"
          title="Choose the clean project structure"
          question="Where should index.html live for a project called my-first-site?"
          options={[
            { id: "inside", label: "Inside the my-first-site folder", feedback: "Correct. The folder contains the files belonging to one project." },
            { id: "folder-is-file", label: "Rename the folder itself to index.html", feedback: "A folder is a container; index.html needs to be a file inside it." },
            { id: "scatter", label: "Anywhere in Downloads with unrelated files", feedback: "Scattered files make paths and project tools harder to reason about." },
          ]}
          correctId="inside"
          successMessage="Exactly. One project folder gives every related file a predictable home."
          hint="Think of the project as a labeled box and the HTML document as one item inside it."
        />
      </section>

      <section id="build-project-tree" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">File Explorer lab</p>
        <h2>Create the structure yourself.</h2>
        <p>Make the folder, open it, then create the file. This is a safe in-browser simulation of a real file explorer.</p>
        <FileExplorerLab
          stepId="build-project-tree"
          title="Build my-first-site/index.html"
          instructions="Create a folder named my-first-site, open it, and create a file named index.html."
          targetFolder="my-first-site"
          targetFile="index.html"
          successMessage="Project created. index.html is now inside my-first-site—not loose in the workspace."
          hint="At /workspace create my-first-site as a folder. Open it, type index.html, then choose New file."
        />
      </section>

      <section id="extension-trap" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Exact names matter</p>
        <h2>index.html.txt is not an HTML filename.</h2>
        <p>The final extension is the strongest clue about file type. Some systems hide known extensions, so inspect the full name when a tool behaves strangely.</p>
        <ChoiceCheckpoint
          stepId="extension-trap"
          title="Catch the extension mistake"
          question="Which filename will a web project normally treat as the HTML home page?"
          options={[
            { id: "html", label: "index.html", feedback: "Correct. The final extension is .html." },
            { id: "text", label: "index.html.txt", feedback: "Its final extension is .txt, so it is a text file with a misleading middle part." },
            { id: "folder", label: "index/html", feedback: "The slash describes a path boundary, not a filename extension." },
          ]}
          correctId="html"
          successMessage="Correct. Read the entire filename and especially its final extension."
          hint="Look at the characters after the last dot."
        />
      </section>

      <section id="extension-jobs" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">File type clues</p>
        <h2>Extensions help humans and tools choose the right language.</h2>
        <p>For a basic website, .html describes structure, .css describes appearance, and .js describes browser behavior.</p>
        <ChoiceCheckpoint
          stepId="extension-jobs"
          title="Match a job to an extension"
          question="Which file would normally contain rules that change a button's color?"
          options={[
            { id: "css", label: "styles.css", feedback: "Correct. CSS is used for visual styling rules." },
            { id: "html", label: "index.html only because HTML means color", feedback: "HTML describes page structure and meaning; CSS is the dedicated styling language." },
            { id: "image", label: "logo.png", feedback: "A PNG stores image pixels, not reusable style rules." },
          ]}
          correctId="css"
          successMessage="Right. The extension gives a useful clue about the file's language and job."
          hint="The letters CSS stand for Cascading Style Sheets."
        />
      </section>

      <section id="organize-transfer" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Final checkpoint</p>
        <h2>Use the same rule for a JavaScript file.</h2>
        <p>Create a project folder named scripts and place app.js inside it.</p>
        <FileExplorerLab
          stepId="organize-transfer"
          title="Build scripts/app.js"
          instructions="Create the scripts folder, open it, and create app.js with the exact extension."
          targetFolder="scripts"
          targetFile="app.js"
          successMessage="Clean structure complete. You can now distinguish containers, files, names, and extensions."
          hint="Create scripts with New folder. Open it before creating app.js with New file."
        />
      </section>
    </FoundationLessonPage>
  );
}
