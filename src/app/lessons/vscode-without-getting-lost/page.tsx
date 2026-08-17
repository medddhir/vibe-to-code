import type { Metadata } from "next";

import { requireAuthenticatedLessonAccess } from "@/lib/auth/lesson-access";
import { ChoiceCheckpoint } from "@/components/choice-checkpoint";
import { WorkbenchLab } from "@/components/foundations/computer-confidence-labs";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import type { GuidedLessonStep } from "@/components/guided-lesson-flow";
import {
  FOUNDATION_LEVEL0_TOTAL_LESSONS,
  FOUNDATION_TOTAL_LESSONS,
  getFoundationsCourseLessonNumber,
  getFoundationsLessonNumber,
} from "@/data/foundations-level1";

export const dynamic = "force-dynamic";


const lessonSlug = "vscode-without-getting-lost";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 6;
const courseLessonNumber = getFoundationsCourseLessonNumber(lessonSlug) ?? 6;
const lessonSteps: GuidedLessonStep[] = [
  { id: "panel-map", title: "Map the four useful areas", eyebrow: "A small mental map", requiresPractice: true },
  { id: "open-edit-save", title: "Open a project and edit", eyebrow: "VS Code simulator", requiresPractice: true },
  { id: "unsaved-dot", title: "Read the unsaved signal", eyebrow: "Tiny dot · big clue", requiresPractice: true },
  { id: "evidence-panels", title: "Choose Problems or Terminal", eyebrow: "Use the right evidence", requiresPractice: true },
  { id: "workbench-transfer", title: "Repeat without instructions", eyebrow: "Final checkpoint", requiresPractice: true },
];

export const metadata: Metadata = {
  title: `Level 0 · Lesson ${lessonNumber} of ${FOUNDATION_LEVEL0_TOTAL_LESSONS}: VS Code without getting lost`,
  description: "Practice opening a project folder, using Explorer, editing and saving a file, and choosing Problems or Terminal for evidence.",
};

export default async function VSCodeWithoutGettingLostLesson() {
  await requireAuthenticatedLessonAccess("/lessons/vscode-without-getting-lost");

  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="VS Code without getting lost"
      levelTitle="Level 0"
      totalLessons={FOUNDATION_LEVEL0_TOTAL_LESSONS}
      courseLessonNumber={courseLessonNumber}
      courseTotalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={12}
      steps={lessonSteps}
    >
      <section id="panel-map" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">A small mental map</p>
        <h2>You only need four areas to begin.</h2>
        <p><strong>Explorer</strong> shows project files. <strong>Search</strong> finds text. <strong>Problems</strong> lists detected issues. <strong>Terminal</strong> runs commands in the project.</p>
        <ChoiceCheckpoint
          stepId="panel-map"
          title="Choose the right panel"
          question="You need to open index.html from your project. Where do you begin?"
          options={[
            { id: "explorer", label: "Explorer", feedback: "Correct. Explorer shows the folders and files in the opened project." },
            { id: "search", label: "Search", feedback: "Search finds text across files; it is not the simplest place to browse the project tree." },
            { id: "terminal", label: "Terminal only", feedback: "The terminal can navigate files, but Explorer is the beginner-friendly visual map for opening one." },
          ]}
          correctId="explorer"
          successMessage="Exactly. Start with Explorer when you want to see and open project files."
          hint="Choose the panel whose name sounds like browsing a place."
        />
      </section>

      <section id="open-edit-save" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">VS Code simulator</p>
        <h2>Open the folder—not one loose file.</h2>
        <p>Open the project folder, select index.html in Explorer, edit the heading, and save. The preview only reads saved content.</p>
        <WorkbenchLab
          stepId="open-edit-save"
          title="Change a heading in a project"
          instructions={'Open the project folder and index.html. Change the heading to exactly “Hello, coder!” and save.'}
          starterSource="<h1>Old heading</h1>"
          expectedHeading="Hello, coder!"
          successMessage="Saved. Explorer gave you project context, the editor changed the file, and the preview proved the result."
          hint={'Open project folder → select index.html → change only the words inside <h1>...</h1> → save.'}
        />
      </section>

      <section id="unsaved-dot" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Tiny dot · big clue</p>
        <h2>A dot on the tab often means your draft is unsaved.</h2>
        <p>Before debugging code, check the editor’s saved state. An unsaved change may explain why a browser or runtime still shows the older result.</p>
        <ChoiceCheckpoint
          stepId="unsaved-dot"
          title="Read the editor signal"
          question="A small dot appears beside index.html after you type. What is the safest meaning?"
          options={[
            { id: "unsaved", label: "The file has changes that are not saved yet", feedback: "Correct. Save the file before expecting another tool to read the change." },
            { id: "deleted", label: "The project has been deleted", feedback: "A dirty-tab dot normally means modified, not deleted." },
            { id: "virus", label: "The computer has a virus", feedback: "This ordinary editor signal is not evidence of malware." },
          ]}
          correctId="unsaved"
          successMessage="Right. Read interface signals before guessing at bigger problems."
          hint="The dot appears immediately after editing and disappears after saving."
        />
      </section>

      <section id="evidence-panels" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Use the right evidence</p>
        <h2>Problems explains detected issues; Terminal shows command results.</h2>
        <p>You do not need every panel at once. Open the one that answers your current question.</p>
        <ChoiceCheckpoint
          stepId="evidence-panels"
          title="Pick the evidence source"
          question="A build command failed and printed an error. Where should you read that command's output?"
          options={[
            { id: "terminal", label: "Terminal", feedback: "Correct. The terminal keeps the command and the text it produced." },
            { id: "explorer", label: "Explorer", feedback: "Explorer shows the file tree, not the full command transcript." },
            { id: "search", label: "Search for the word failed in every file", feedback: "The error came from a command, so its direct output is better evidence." },
          ]}
          correctId="terminal"
          successMessage="Exactly. Read evidence where it was produced before changing code."
          hint="The question asks about the output of a command."
        />
      </section>

      <section id="workbench-transfer" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Final checkpoint</p>
        <h2>Repeat the workflow with a new heading.</h2>
        <p>This time the controls are familiar. Open the folder, choose the file, edit one exact value, and save.</p>
        <WorkbenchLab
          stepId="workbench-transfer"
          title="Make the project yours"
          instructions={'Change the saved <h1> heading to exactly “My first project”.'}
          starterSource="<h1>Starter project</h1>"
          expectedHeading="My first project"
          successMessage="You can now navigate the essential VS Code workflow without getting lost."
          hint="Use Explorer to open index.html, keep the <h1> tags, replace the inner words, and save."
        />
      </section>
    </FoundationLessonPage>
  );
}
