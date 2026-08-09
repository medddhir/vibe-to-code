import type { Metadata } from "next";

import {
  ChoiceCheckpoint,
  type ChoiceCheckpointOption,
} from "@/components/choice-checkpoint";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import { type GuidedLessonStep } from "@/components/guided-lesson-flow";
import { CodeJourneyLab } from "@/components/foundations/code-journey-lab";
import {
  getFoundationsLessonNumber,
  FOUNDATION_TOTAL_LESSONS,
  getFoundationsCourseLessonNumber,
  FOUNDATION_LEVEL1_TOTAL_LESSONS,
} from "@/data/foundations-level1";

const lessonSlug = "interpreters-compilers-runtimes";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 5;
const courseLessonNumber = getFoundationsCourseLessonNumber(lessonSlug) ?? 5;

const lessonSteps: GuidedLessonStep[] = [
  {
    id: "journey-concept",
    title: "Know where source becomes action",
    eyebrow: "Concept",
    requiresPractice: true,
  },
  {
    id: "python-route",
    title: "Route matching: Python",
    eyebrow: "Practice",
    requiresPractice: true,
  },
  {
    id: "javascript-route",
    title: "Route matching: JavaScript",
    eyebrow: "Practice",
    requiresPractice: true,
  },
  {
    id: "compiled-route",
    title: "Route matching: compiled",
    eyebrow: "Practice",
    requiresPractice: true,
  },
  {
    id: "broken-runtime",
    title: "Compare with broken runtime",
    eyebrow: "Debug",
    requiresPractice: true,
  },
  {
    id: "mission-route",
    title: "Final route mission",
    eyebrow: "Finish",
    requiresPractice: true,
  },
  {
    id: "journey-recap",
    title: "Completion recap",
    eyebrow: "Finish",
  },
];

const journeyChoices: ChoiceCheckpointOption[] = [
  {
    id: "python",
    label: "Python source goes to an interpreter and then runtime execution.",
    feedback: "Correct. In this lesson model, Python is interpreted into runnable bytecode first.",
  },
  {
    id: "compiled",
    label: "Python becomes machine code directly with no runtime.",
    feedback: "Python still needs an interpreter path in this model.",
  },
  {
    id: "js",
    label: "JavaScript always compiles like C++ before running.",
    feedback: "Modern engines use parsing and optimization, but not the same direct-compile model as C++ here.",
  },
];

const compareChoices: ChoiceCheckpointOption[] = [
  {
    id: "compiled",
    label: "Compiled languages are usually translated before execution.",
    feedback: "Exactly. A compile step happens before runtime can consume machine instructions.",
  },
  {
    id: "javascript",
    label: "JavaScript always skips parsing.",
    feedback: "Parsing still happens first. It is still prepared before execution.",
  },
];

export const metadata: Metadata = {
  title: `Level 1 · Lesson ${lessonNumber} of ${FOUNDATION_LEVEL1_TOTAL_LESSONS}: Interpreters, compilers, and runtimes`,
  description:
    "Trace how source passes through interpreters, compilers, runtimes, and output in three different styles.",
};

export default function InterpretersCompilersRuntimesLesson() {
  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="Interpreters, compilers, and runtimes"
      levelTitle="Level 1"
      totalLessons={FOUNDATION_LEVEL1_TOTAL_LESSONS}
      courseLessonNumber={courseLessonNumber}
      courseTotalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={12}
      steps={lessonSteps}
    >
      <section id="journey-concept" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Understand the big picture</p>
        <h2>Source is text. It still needs a route to become behavior.</h2>
        <p>
          Think in three parts: reader, translator, and executor. Then compare your prediction with a live route view.
        </p>
        <ChoiceCheckpoint
          stepId="journey-concept"
          title="Pick the clean mapping"
          question="Which option best describes the route idea?"
          options={journeyChoices}
          correctId="python"
          successMessage="Great. You can now reason about route differences without guessing."
          hint="Different language families begin with different processing steps."
        />
      </section>

      <section id="python-route" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Predict before running</p>
        <h2>Choose a language path and route mode.</h2>
        <CodeJourneyLab
          stepId="python-route"
          title="Pick Python route"
          instructions="Choose the route where Python goes through normal interpreter flow."
          expectedLanguage="python"
          expectedMode="normal"
          hint="Select Python and Normal mode."
          targetDecisionLabel="Python"
          successMessage="Correct. Python uses an interpreter to convert source to bytecode then runtime."
        />
      </section>

      <section id="javascript-route" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Route confidence</p>
        <h2>Find JavaScript&apos;s route in the same simulator.</h2>
        <CodeJourneyLab
          stepId="javascript-route"
          title="Pick JavaScript route"
          instructions="Select JavaScript and normal mode, then verify the steps."
          expectedLanguage="javascript"
          expectedMode="normal"
          hint="Pick JS + Normal for the browser-oriented route."
          targetDecisionLabel="JavaScript"
          successMessage="Correct. JS runs through source parsing and an execution engine."
        />
      </section>

      <section id="compiled-route" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Compare performance models</p>
        <h2>Now pick the compiled path.</h2>
        <CodeJourneyLab
          stepId="compiled-route"
          title="Pick compiled app route"
          instructions="Choose compiled and normal mode first; watch CPU and result labels."
          expectedLanguage="compiled"
          expectedMode="normal"
          hint="A compiled path includes compiler and machine-instruction output."
          targetDecisionLabel="Compiled app"
          successMessage="Correct. Compilers translate once, then the CPU executes machine instructions."
        />
      </section>

      <section id="broken-runtime" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Debug the failure path</p>
        <h2>Use a broken runtime mode to see failure behavior.</h2>
        <CodeJourneyLab
          stepId="broken-runtime"
          title="Simulate broken runtime behavior"
          instructions="Set broken mode and predict why some language routes cannot start."
          expectedLanguage="python"
          expectedMode="broken-runtime"
          targetDecisionLabel="Python"
          hint="In this lesson, broken runtime means missing platform support."
          successMessage="Correct. The route changes, and you can see the runtime check failure."
        />
      </section>

      <section id="mission-route" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Transfer mission</p>
        <h2>Pick the route for this scenario:</h2>
        <ChoiceCheckpoint
          stepId="mission-route"
          title="Which route is correct for compiled binaries?"
          question="A team says 'ship one app executable to a server for direct run.' Which model is this?"
          options={compareChoices}
          correctId="compiled"
          successMessage="Excellent. Executables are usually the result of a compile step."
          hint="Interpreted and JIT paths are different from static native binaries."
        />
      </section>

      <section id="journey-recap" className="lesson-section guided-topic mission-topic">
        <div className="mission-capabilities">
          <p className="eyebrow">Lesson recap</p>
          <h2>One sentence in your own words.</h2>
          <p>
            A program is not “just code.” It is source text, then language-specific processing, then execution in an
            environment.
          </p>
        </div>
      </section>
    </FoundationLessonPage>
  );
}
