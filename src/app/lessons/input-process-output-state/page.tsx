import type { Metadata } from "next";

import { ChoiceCheckpoint, type ChoiceCheckpointOption } from "@/components/choice-checkpoint";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import { type GuidedLessonStep } from "@/components/guided-lesson-flow";
import { CodeWindow } from "@/components/code-window";
import { StateLab } from "@/components/foundations/state-lab";
import {
  getFoundationsLessonNumber,
  FOUNDATION_TOTAL_LESSONS,
  getFoundationsCourseLessonNumber,
  FOUNDATION_LEVEL1_TOTAL_LESSONS,
} from "@/data/foundations-level1";

const lessonSlug = "input-process-output-state";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 3;
const courseLessonNumber = getFoundationsCourseLessonNumber(lessonSlug) ?? 3;

const lessonSteps: GuidedLessonStep[] = [
  {
    id: "input-flow",
    title: "Predict input first",
    eyebrow: "Input and output",
    requiresPractice: true,
  },
  {
    id: "state-journey",
    title: "Process one click",
    eyebrow: "State update",
    requiresPractice: true,
    requiredActivityIds: ["state-journey-simulator", "state-journey-check"],
  },
  {
    id: "broken-update",
    title: "Fix a broken update",
    eyebrow: "Repair",
    requiresPractice: true,
  },
  {
    id: "trace-observe",
    title: "Trace event to output",
    eyebrow: "Observation",
    requiresPractice: true,
    requiredActivityIds: ["trace-observe-simulator", "trace-observe-check"],
  },
  {
    id: "predict-repeat",
    title: "Mini challenge",
    eyebrow: "Transfer",
    requiresPractice: true,
    requiredActivityIds: ["predict-repeat-simulator", "predict-repeat-check"],
  },
  {
    id: "recap",
    title: "Lesson recap",
    eyebrow: "Your own words",
  },
];

const iopsChoices: ChoiceCheckpointOption[] = [
  {
    id: "raw",
    label: "Input is only what appears in the payload.",
    feedback:
      "Input starts as text or number, but output appears only after the process applies rules to current state.",
  },
  {
    id: "state",
    label: "Input is stored directly as screen text, so no state is needed.",
    feedback: "State sits behind the output. The button updates state first, then the screen reads it.",
  },
  {
    id: "combined",
    label: "Input enters process, process reads current state, and state updates screen output.",
    feedback: "Exactly. That chain is what makes one click feel connected and testable.",
  },
];

const summaryChoices: ChoiceCheckpointOption[] = [
  {
    id: "state-matters",
    label: "The screen changes only because state changed after the click.",
    feedback: "Exactly right.",
  },
  {
    id: "screen-only",
    label: "The screen text is just decorative and never uses state.",
    feedback: "It is a view of state, not random output.",
  },
  {
    id: "process-not-used",
    label: "Input is ignored once it reaches the screen.",
    feedback: "The processing step does the arithmetic before showing the result.",
  },
];

export const metadata: Metadata = {
  title: `Level 1 · Lesson ${lessonNumber} of ${FOUNDATION_LEVEL1_TOTAL_LESSONS}: Input, process, output, and state`,
  description:
    "Trace a counter-style interaction through input, processing, state updates, and visible screen output.",
};

export default function InputProcessOutputStateLesson() {
  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="Input, process, output, and state"
      levelTitle="Level 1"
      totalLessons={FOUNDATION_LEVEL1_TOTAL_LESSONS}
      courseLessonNumber={courseLessonNumber}
      courseTotalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={12}
      steps={lessonSteps}
    >
      <section id="input-flow" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Use input to predict output</p>
        <h2>Before you click, predict the next screen value.</h2>
        <p>
          A user click creates input, the app process changes state, and the screen reflects new state. Predict first, run
          second.
        </p>

        <CodeWindow
          title="Counter concept"
          code={`let score = 0\nclick(payload) -> score = score + payload\nshow(score)`}
          output="score starts at 0"
        />

        <ChoiceCheckpoint
          stepId="input-flow"
          title="What path should the learner trace?"
          question="In a counter, where does the visual number come from?"
          options={iopsChoices}
          correctId="combined"
          successMessage="Exactly. The screen reads what state now stores after processing input."
          hint="Think in order: collect input, update memory, then render output."
        />
      </section>

      <section id="state-journey" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Live state laboratory</p>
        <h2>Run one click and observe event flow.</h2>
        <StateLab
          stepId="state-journey-simulator"
          title="State update lab"
          instructions="Use `state = state + input` and choose input so output reaches 3."
          starterInput={1}
          initialState={0}
          starterFormula="state = state + input"
          targetState={3}
          hint="Try input 3 with a clean add formula."
          successMessage="Great. The rule changed the internal state exactly as expected."
        />

        <ChoiceCheckpoint
          stepId="state-journey-check"
          title="State checkpoint check"
          question="If input is 3 and state starts at 0, what should screen show after one click?"
          options={[
            { id: "s1", label: "3", feedback: "Correct: 0 + 3 becomes 3." },
            { id: "s2", label: "0", feedback: "If no update happens, screen may stay 0, but this lab applies the rule." },
            { id: "s3", label: "6", feedback: "You can test this with input 3 once; it should be one add, not two." },
          ]}
          correctId="s1"
          successMessage="Exactly. One click changed state from 0 to 3, then output showed 3."
          hint="Use the current state + input formula.">
        </ChoiceCheckpoint>
      </section>

      <section id="broken-update" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Repair the rule</p>
        <h2>One broken update makes the trace meaningful.</h2>

        <StateLab
          stepId="broken-update"
          title="Fix formula and run"
          instructions='This starter is unsafe: it adds only part of the math. Change it to update state correctly.'
          starterInput={2}
          initialState={4}
          starterFormula="state = state"
          targetState={8}
          hint="Use a rule that uses input once and keeps the old state: `state = state + input` with input 4?"
          successMessage="Great. The function now respects both current state and user input."
        />

        <p className="mission-topic">
          Why did it fail? Because the formula never changed `state`. A processor that does not write new state cannot update
          output.
        </p>
      </section>

      <section id="trace-observe" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Trace the event path</p>
        <h2>Predict each stage before every run.</h2>

        <StateLab
          stepId="trace-observe-simulator"
          title="Multi-step chain"
          instructions="You have 2 clicks available. Try input 1 twice, then target should be 2."
          starterInput={1}
          initialState={0}
          starterFormula="state = state + input"
          targetState={2}
          hint="Each run starts from the current displayed state and adds input once."
          successMessage="Nice. You can see event -> process -> state -> output on each run."
        />

        <ChoiceCheckpoint
          stepId="trace-observe-check"
          title="Trace checkpoint"
          question="After two valid clicks with input 1 from 0 state, what was total state update?"
          options={[
            { id: "t1", label: "2", feedback: "Correct: +1 then +1 becomes +2 total." },
            { id: "t2", label: "1", feedback: "That would mean only one click took effect." },
            { id: "t3", label: "0", feedback: "State needs a process rule to change." },
          ]}
          correctId="t1"
          successMessage="Exactly. Every click reuses the latest state and applies the same process rule."
          hint="Add input on both clicks, not reset state between clicks."
        />
      </section>

      <section id="predict-repeat" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Final transfer challenge</p>
        <h2>Build a tiny reward score update.</h2>

        <StateLab
          stepId="predict-repeat-simulator"
          title="Reward mission"
          instructions="Set input and formula so target becomes 10 from a start of 6 in one click."
          starterInput={2}
          initialState={6}
          starterFormula="state = state + input"
          targetState={10}
          hint="Choose input 4 for one clean add."
          successMessage="Nice. You completed the mission and proved understanding of cumulative state updates."
        />

        <ChoiceCheckpoint
          stepId="predict-repeat-check"
          title="Say it back"
          question="In one sentence, what changed in each click?"
          options={summaryChoices}
          correctId="state-matters"
          successMessage="Perfect. You described state mutation and output linkage."
          hint="Use: input -> process -> state -> screen."
        />
      </section>

      <section id="recap" className="lesson-section guided-topic mission-topic">
        <div className="mission-capabilities">
          <p className="eyebrow">Recap in your own words</p>
          <h2>This lesson is complete when you can explain the full chain.</h2>
          <p>
            Input is collected, process applies a rule, state stores new value, and screen renders from state. That path is
            what makes apps feel alive and testable.
          </p>
        </div>
      </section>
    </FoundationLessonPage>
  );
}
