import type { Metadata } from "next";

import {
  ChoiceCheckpoint,
  type ChoiceCheckpointOption,
} from "@/components/choice-checkpoint";
import { CodeWindow } from "@/components/code-window";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import { type GuidedLessonStep } from "@/components/guided-lesson-flow";
import { LanguageSyntaxLab } from "@/components/foundations/language-syntax-lab";
import {
  getFoundationsLessonNumber,
  FOUNDATION_TOTAL_LESSONS,
  getFoundationsCourseLessonNumber,
  FOUNDATION_LEVEL1_TOTAL_LESSONS,
} from "@/data/foundations-level1";

const lessonSlug = "languages-syntax-errors";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 4;
const courseLessonNumber = getFoundationsCourseLessonNumber(lessonSlug) ?? 4;

const lessonSteps: GuidedLessonStep[] = [
  {
    id: "language-jobs",
    title: "Match jobs to files",
    eyebrow: "Concept",
    requiresPractice: true,
  },
  {
    id: "safe-starter",
    title: "Identify language syntax",
    eyebrow: "Predict",
    requiresPractice: true,
  },
  {
    id: "repair-syntax",
    title: "Repair a syntax mistake",
    eyebrow: "Practice",
    requiresPractice: true,
  },
  {
    id: "error-language",
    title: "Read a readable error message",
    eyebrow: "Debug",
    requiresPractice: true,
  },
  {
    id: "language-sorting",
    title: "Sort code to jobs",
    eyebrow: "Challenge",
    requiresPractice: true,
  },
  {
    id: "lesson-recap",
    title: "Mission recap",
    eyebrow: "Finish",
  },
];

const starterFiles = {
  html: `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Learn with Vibe</title>
  <style>
    .banner { color: #2d5ca8; padding: 12px; }
  </style>
</head>
<body>
  <main>
    <p class="banner">Language trainer</p>
    <button id="clicker">Press me</button>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
  css: `.banner { 
  color: #2d5ca8;
  font-weight: 700;
}
body { font-family: sans-serif; }`,
  javascript: `const button = document.getElementById("clicker");
button.textContent = "Press me!";
`,
};

const repairFiles = {
  html: `<!doctype html>
<html>
<head><meta charset="UTF-8"><title>Broken</title><style>.status{color:blue}</style></head>
<body><div class="status" id="status">
<p>Ready</div></body></html>`,
  css: `.status { color: blue; }`,
  javascript: `document.getElementById("status").textContent = "Loaded";`,
};

const jobChoices: ChoiceCheckpointOption[] = [
  {
    id: "correct",
    label: "HTML sets structure, CSS styles appearance, JavaScript controls behavior.",
    feedback: "Exactly. Each file has a distinct role in the same page.",
  },
  {
    id: "wrong",
    label: "JavaScript draws styles, CSS writes logic, HTML stores interactivity code.",
    feedback: "That swaps responsibilities and causes fragile learning.",
  },
];

const sortChoices: ChoiceCheckpointOption[] = [
  {
    id: "html",
    label: "The HTML file, for document structure and content.",
    feedback: "Structure comes from HTML, but this line is not structural markup.",
  },
  {
    id: "js",
    label: "The JavaScript file, for runtime behavior and events.",
    feedback: "This is not a behavior instruction; it is a style rule.",
  },
  {
    id: "css",
    label: "The CSS file, for style rules and layout details.",
    feedback: "Correct. `body { margin: 0; }` is a style rule, so it belongs in CSS.",
  },
];

const languageErrorChoices: ChoiceCheckpointOption[] = [
  {
    id: "closing-tag",
    label: "A missing closing tag broke parsing.",
    feedback: "Great. The preview parser catches missing structure tags before rendering.",
  },
  {
    id: "variable",
    label: "The code only failed because JavaScript uses `let` and `var` differently.",
    feedback: "This is a JavaScript topic, but this file needs structural fixes first.",
  },
];

export const metadata: Metadata = {
  title: `Level 1 · Lesson ${lessonNumber} of ${FOUNDATION_LEVEL1_TOTAL_LESSONS}: Languages, syntax, and error messages`,
  description:
    "Compare HTML, CSS, and JavaScript roles and fix grammar and syntax issues in a safe in-browser simulator.",
};

export default function LanguagesSyntaxErrorsLesson() {
  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="Languages, syntax, and error messages"
      levelTitle="Level 1"
      totalLessons={FOUNDATION_LEVEL1_TOTAL_LESSONS}
      courseLessonNumber={courseLessonNumber}
      courseTotalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={10}
      steps={lessonSteps}
    >
      <section id="language-jobs" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Start simple, learn roles first</p>
        <h2>Three files, one page story.</h2>
        <p>
          The same page can use HTML for structure, CSS for appearance, and JavaScript for logic.
          Predict roles first, then verify in interaction.
        </p>
        <CodeWindow title="Starter snapshot" code={starterFiles.html} output="Language lab ready." />
        <ChoiceCheckpoint
          stepId="language-jobs"
          title="Choose the right mapping"
          question="Which statement describes file responsibilities?"
          options={jobChoices}
          correctId="correct"
          successMessage="Great. Mental clarity here will make all syntax bugs easier."
          hint="Think of HTML as structure, CSS as style, JavaScript as behavior."
        />
      </section>

      <section id="safe-starter" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Visual proof of syntax</p>
        <h2>Run the simulator and validate all three files.</h2>
        <LanguageSyntaxLab
          stepId="safe-starter"
          title="Safe language pass"
          instructions="Keep the starter structure and make it pass all syntax checks."
          starterFiles={starterFiles}
          hint="Keep one clear tag structure, complete CSS braces, and end JavaScript statements with `;`."
        />
      </section>

      <section id="repair-syntax" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Repair and compare</p>
        <h2>Find the parser issue, then repair before the next step.</h2>
        <LanguageSyntaxLab
          stepId="repair-syntax"
          title="Repair broken language mix"
          instructions="This starter has syntax issues in multiple files. Fix them all."
          starterFiles={repairFiles}
          hint="Close every tag, keep braces balanced, and keep one statement per line."
        />
      </section>

      <section id="error-language" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Read the message, do not guess</p>
        <h2>Why did it fail, and where?</h2>
        <ChoiceCheckpoint
          stepId="error-language"
          title="Pick the most likely parser issue"
          question="In the repaired starter, which issue appears first?"
          options={languageErrorChoices}
          correctId="closing-tag"
          successMessage="Correct. Structural parse errors stop page build before some style or script runs."
          hint="HTML must stay well formed before browsers safely apply style and scripts."
        />
      </section>

      <section id="language-sorting" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Sort-and-verify mission</p>
        <h2>Match each snippet to the right file job.</h2>
        <ChoiceCheckpoint
          stepId="language-sorting"
          title="One final sorting checkpoint"
          question="Where should this line most likely live: body { margin: 0; }"
          options={sortChoices}
          correctId="css"
          successMessage="Nice. The lesson now has one full language mapping in your head."
          hint="Use semantic roles first: HTML for structure, CSS for style declarations."
        />
      </section>

      <section id="lesson-recap" className="lesson-section guided-topic mission-topic">
        <div className="mission-capabilities">
          <p className="eyebrow">Lesson recap</p>
          <h2>Write one sentence for yourself.</h2>
          <p>
            Keep HTML, CSS, and JavaScript separate by job, use safe parsers, and trust syntax messages to
            show where to repair first.
          </p>
        </div>
      </section>
    </FoundationLessonPage>
  );
}
