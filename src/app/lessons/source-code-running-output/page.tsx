import type { Metadata } from "next";

import { ChoiceCheckpoint } from "@/components/choice-checkpoint";
import { CodeWindow } from "@/components/code-window";
import { SaveRunLab } from "@/components/foundations/computer-confidence-labs";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import type { GuidedLessonStep } from "@/components/guided-lesson-flow";
import {
  FOUNDATION_LEVEL0_TOTAL_LESSONS,
  FOUNDATION_TOTAL_LESSONS,
  getFoundationsCourseLessonNumber,
  getFoundationsLessonNumber,
} from "@/data/foundations-level1";

const lessonSlug = "source-code-running-output";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 2;
const courseLessonNumber = getFoundationsCourseLessonNumber(lessonSlug) ?? 2;

const lessonSteps: GuidedLessonStep[] = [
  { id: "three-forms", title: "Meet source, runtime, and output", eyebrow: "One program · three forms", requiresPractice: true },
  { id: "save-run-loop", title: "Save and run a real change", eyebrow: "Hands-on proof", requiresPractice: true },
  { id: "stale-output", title: "Explain an old result", eyebrow: "Common beginner mystery", requiresPractice: true },
  { id: "repair-workflow", title: "Repair the edit loop", eyebrow: "Debug the workflow", requiresPractice: true },
  { id: "transfer-model", title: "Prove the mental model", eyebrow: "Final checkpoint", requiresPractice: true },
];

export const metadata: Metadata = {
  title: `Level 0 · Lesson ${lessonNumber} of ${FOUNDATION_LEVEL0_TOTAL_LESSONS}: Source code, running programs, and output`,
  description: "Learn the edit, save, run, observe loop by changing a tiny program and proving which version actually ran.",
};

export default function SourceCodeRunningOutputLesson() {
  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="Source code, running programs, and output"
      levelTitle="Level 0"
      totalLessons={FOUNDATION_LEVEL0_TOTAL_LESSONS}
      courseLessonNumber={courseLessonNumber}
      courseTotalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={10}
      steps={lessonSteps}
    >
      <section id="three-forms" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">One program · three forms</p>
        <h2>Do not mix up the recipe, the cook, and the result.</h2>
        <p>
          <strong>Source code</strong> is the instruction you can read and edit. A <strong>runtime</strong>
          reads that saved instruction and performs it. <strong>Output</strong> is the result you can observe.
          They belong together, but they are not the same thing.
        </p>
        <CodeWindow title="message.py" code={'print("Hello!")'} output="Hello!" />
        <ChoiceCheckpoint
          stepId="three-forms"
          title="Point to the source code"
          question="Which part is the editable source code?"
          options={[
            { id: "instruction", label: 'The text print("Hello!") inside message.py', feedback: "Correct. This is the saved instruction a learner can edit." },
            { id: "runtime", label: "The Python runtime reading the file", feedback: "That is the runner, not the written source." },
            { id: "output", label: "The word Hello! shown after running", feedback: "That is output produced by the source." },
          ]}
          correctId="instruction"
          successMessage="Exactly. Source is the editable instruction; output is evidence of what the saved instruction did."
          hint="Look for the part you could open in an editor and change."
        />
      </section>

      <section id="save-run-loop" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Hands-on proof</p>
        <h2>Your editor and runtime do different jobs.</h2>
        <p>
          Change the message, save it, and run it. The simulator keeps the draft and saved file separate,
          just like a real editor does.
        </p>
        <SaveRunLab
          stepId="save-run-loop"
          title="Make the runtime see your new message"
          instructions={'Change the code to print("Hello, learner!"). Save the file, then run the saved file.'}
          starterSaved={'print("Old message")'}
          starterDraft={'print("Hello, learner!")'}
          expectedOutput="Hello, learner!"
          successMessage="You completed the real loop: edit → save → run → observe."
          hint={'The draft is already changed. Select “Save file” before “Run saved file.”'}
        />
      </section>

      <section id="stale-output" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Common beginner mystery</p>
        <h2>Old output is often a workflow clue—not a coding disaster.</h2>
        <p>
          If you change a draft but forget to save it, the runtime can still read the older saved file.
          That is why the screen may look unchanged even when the editor looks correct.
        </p>
        <ChoiceCheckpoint
          stepId="stale-output"
          title="Diagnose the stale result"
          question="You changed Hello to Namaste, but running still prints Hello. What should you check first?"
          options={[
            { id: "save", label: "Check whether the file was saved, then run again", feedback: "Correct. Confirm the smallest, most likely workflow cause first." },
            { id: "computer", label: "Buy a faster computer", feedback: "Computer speed does not decide which file version the runtime reads." },
            { id: "rewrite", label: "Delete the whole project and rewrite it", feedback: "That loses evidence. Check save and run state before making a large change." },
          ]}
          correctId="save"
          successMessage="Right. Save first, then rerun and observe fresh output."
          hint="The editor can show a newer draft than the version stored on disk."
        />
      </section>

      <section id="repair-workflow" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Debug the workflow</p>
        <h2>Use the output as proof of the saved version.</h2>
        <p>Make the exact requested output appear. If the old text runs, inspect the saved-status label.</p>
        <SaveRunLab
          stepId="repair-workflow"
          title="Repair a stale program"
          instructions={'Make the saved program print exactly: Saved and running'}
          starterSaved={'print("Still old")'}
          starterDraft={'print("Saved and running")'}
          expectedOutput="Saved and running"
          successMessage="The output now proves the changed source was saved and executed."
          hint="Use both controls in order: Save file, then Run saved file."
        />
      </section>

      <section id="transfer-model" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Final checkpoint</p>
        <h2>Tell the complete story from edit to evidence.</h2>
        <p>This sequence works across Python, JavaScript, websites, and most software projects.</p>
        <ChoiceCheckpoint
          stepId="transfer-model"
          title="Choose the reliable workflow"
          question="Which sequence best explains how a code change becomes visible?"
          options={[
            { id: "right-loop", label: "Edit source → save → run or refresh → inspect output", feedback: "Correct. Each step hands the newest version to the next part of the system." },
            { id: "output-first", label: "Edit output → runtime writes source → save later", feedback: "Output is the result; it does not normally rewrite your source." },
            { id: "guess", label: "Edit source → assume it worked → make more edits", feedback: "Assumptions hide bugs. Run and inspect evidence after a controlled change." },
          ]}
          correctId="right-loop"
          successMessage="Perfect. You now know the edit → save → run → observe loop."
          hint="Choose the sequence where the runtime receives the saved source before output appears."
        />
      </section>
    </FoundationLessonPage>
  );
}
