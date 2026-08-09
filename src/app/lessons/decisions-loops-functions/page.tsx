import type { Metadata } from "next";

import { ChoiceCheckpoint, type ChoiceCheckpointOption } from "@/components/choice-checkpoint";
import { CodeWindow } from "@/components/code-window";
import {
  FoundationLessonPage,
} from "@/components/foundations/foundation-lesson-page";
import { type GuidedLessonStep } from "@/components/guided-lesson-flow";
import { DecisionFunctionLab, DecisionScriptLab } from "@/components/foundations/decision-function-lab";
import {
  getFoundationsLessonNumber,
  FOUNDATION_TOTAL_LESSONS,
} from "@/data/foundations-level1";

const lessonSlug = "decisions-loops-functions";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 2;

const lessonSteps: GuidedLessonStep[] = [
  {
    id: "if-logic",
    title: "Build path logic",
    eyebrow: "Condition",
    requiresPractice: true,
  },
  {
    id: "loop-iteration",
    title: "See every loop step",
    eyebrow: "Loop trace",
    requiresPractice: true,
  },
  {
    id: "broken-loop",
    title: "Break and fix an endless loop",
    eyebrow: "Safety",
    requiresPractice: true,
  },
  {
    id: "predict-path",
    title: "Predict and verify",
    eyebrow: "Concept check",
  },
  {
    id: "function-output",
    title: "Pass input into a rule",
    eyebrow: "Function",
    requiresPractice: true,
  },
  {
    id: "pass-retry-mission",
    title: "Transfer challenge",
    eyebrow: "Finish",
    requiresPractice: true,
  },
];

const conditionChoices: ChoiceCheckpointOption[] = [
  {
    id: "path-pass",
    label: "The first branch sets Pass. If we use `score = 5` and `==`, the first branch wins.",
    feedback: "Yes. `==` compares, and a true branch can set Pass.",
  },
  {
    id: "path-retry",
    label: "Using `<` always makes the first branch better for this script.",
    feedback: "Not always. Here we need one exact threshold. The comparison symbol determines the path.",
  },
  {
    id: "path-error",
    label: "No comparison is needed if the variable uses `=` once.",
    feedback: "`=` writes a value. It does not ask a question.",
  },
];

const predictChoices: ChoiceCheckpointOption[] = [
  {
    id: "trace-one",
    label: "Body runs 1 time; condition checked 2 times",
    feedback: "This script starts at 0 and increments by one; there are more checks than one.",
  },
  {
    id: "trace-two",
    label: "Body runs 2 times; condition checked 3 times",
    feedback: "You’re close, but this loop runs one more body pass before the false check.",
  },
  {
    id: "trace-three-with-checks",
    label: "Body runs 3 times; condition checked 4 times",
    feedback:
      "Correct. The guard checks at 0,1,2, and 3. The body runs for 0,1,2, then stops.",
  },
];

export const metadata: Metadata = {
  title: "Lesson 2: Decisions, repetition, and functions",
  description:
    "Use conditions, one safe loop, and small reusable formula rules to see how program control works.",
};

export default function DecisionsLoopsFunctionsLesson() {
  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="Decisions, repetition, and functions"
      levelTitle="Level 1"
      totalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={14}
      steps={lessonSteps}
    >
      <section id="if-logic" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Your first win in 60 seconds</p>
        <h2>Choose the winning path with one condition.</h2>
        <p>
          In this simulator, one line decides which branch runs. Start with a broken condition and make the path
          become <strong>Pass</strong>.
        </p>

        <CodeWindow
          title="Decision starter"
          code={'score = 4\nif score = 5:\noutcome = "Pass"\nelse:\noutcome = "Retry"'}
          output={`Decision is Unknown`}
        />

        <DecisionScriptLab
          stepId="if-logic"
          title="Fix comparison and path"
          instructions='Change the script so the condition is true and the outcome becomes "Pass". Keep one `if` and one `else`.'
          starterCode={'score = 4\nif score = 5:\noutcome = "Pass"\nelse:\noutcome = "Retry"'}
          target="Pass"
          expectedFinalScore={5}
          hint="Use `==` for comparison and set score to 5 or adjust the comparison to match score = 4."
          stepByStep={false}
        />

        <div className="choice-checkpoint" style={{ marginTop: 16 }}>
          <div className="choice-checkpoint-heading">
            <div>
              <p className="eyebrow">Quick reflection</p>
              <h3>Read before run</h3>
            </div>
          </div>
        <ChoiceCheckpoint
          stepId="if-logic"
          title="What makes a path decision?"
          question="What causes a branch to run, and when is `==` needed?"
          options={conditionChoices}
          correctId="path-pass"
          successMessage="Great. Assignment (`=`) sets a variable; comparison (`==`) reads a question."
            hint="Keep one variable, one `if` line, and one exact operator.">
          </ChoiceCheckpoint>
        </div>
      </section>

      <section id="loop-iteration" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Step-by-step loop control</p>
        <h2>Watch each loop check, one click at a time.</h2>
        <p>
          The same variable is changed repeatedly until a condition changes. The trace list shows each check and each
          update.
        </p>

        <DecisionScriptLab
          stepId="loop-iteration"
          title="Build a bounded loop"
          instructions='Use `while` and `score = score + 1` only. The target end score is 3.'
          starterCode={'score = 0\nwhile score < 3:\nscore = score + 1\noutcome = "Retry"'}
          target="either"
          expectedFinalScore={3}
          hint="Start from 0, keep `while score < 3`, and use `+1` on each loop body line."
          stepByStep
        />

        <ChoiceCheckpoint
          stepId="loop-iteration"
          title="How many loop steps happened?"
          question="For `while score < 3` starting at 0, how many body iterations happen, and how many guard checks occur?"
          options={predictChoices}
          correctId="trace-three-with-checks"
          successMessage="Right. The guard checks four times total, and the body runs three times."
          hint="Body runs at scores 0, 1, 2; the fourth guard check at score 3 fails."
        />
      </section>

      <section id="broken-loop" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Fix the safety issue</p>
        <h2>An endless loop can lock a program. Make it finite.</h2>
        <p>
          This script never reaches the guard failure because its condition never becomes false. Change only the line in the
          condition.
        </p>

        <DecisionScriptLab
          stepId="broken-loop"
          title="Repair an endless loop"
          instructions='Change the `while` condition so execution stops safely. Keep body `score = score + 1`.'
          starterCode={'score = 0\nwhile score >= 0:\nscore = score + 1\noutcome = "Retry"'}
          target="either"
          hint="A safe bound looks like `score < 4` so every `+1` step eventually exits."
          stepByStep
        />

        <ChoiceCheckpoint
          stepId="broken-loop"
          title="Why was it dangerous?"
          question="The loop was endless because the condition was:"
          options={[
            {
              id: "always-false",
              label: "Always false, so the body never ran.",
              feedback: "It was actually true at start, so the body kept running.",
            },
            {
              id: "always-true",
              label: "Always true for this rule; `score` could never become non-true under `+1`.",
              feedback:
                "Exactly. `score >= 0` stays true while we keep adding 1, so the guard never flips.",
            },
            {
              id: "wrong-output",
              label: "Only the print statement was missing.",
              feedback: "There is no print statement in this subset; the control itself was the issue.",
            },
          ]}
          correctId="always-true"
          successMessage="Good. End conditions matter as much as loop body updates."
          hint="A loop is safe when each pass moves closer to a false condition."
        />
      </section>

      <section id="predict-path" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Function preview</p>
        <h2>Predict state before running.</h2>
        <p>
          In this tiny language, each assignment updates memory immediately. The function checkpoint below still uses one
          predictable rule.
        </p>

        <DecisionFunctionLab
          stepId="function-output"
          title="Function simulation"
          instructions='Use this exact style: `result = input + number` so output shows how a rule maps input values.'
          starterCode={'result = input + 0'}
          starterInput={8}
          expectedOutput={12}
          hint='Use `result = input + 4` so 8 becomes 12.'
        />

        <div className="practice-hint">
          <span aria-hidden="true">💡</span>
          <p>
            Keep only one rule line. In these missions, one small function-like block is enough to prove input →
            output mapping.
          </p>
        </div>
      </section>

      <section id="pass-retry-mission" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Final transfer challenge</p>
        <h2>Build a new Pass/Retry route from scratch.</h2>
        <p>
          Do not copy earlier lines. Make a condition that returns <strong>Pass</strong> when score reaches the target.
        </p>

        <DecisionScriptLab
          stepId="pass-retry-mission"
          title="Pass/Retry mission"
          instructions="Write a compact script that assigns outcome based on a score of your choice. Keep one condition and one else."
          starterCode={'score = 1\nif score == 2:\noutcome = "Pass"\nelse:\noutcome = "Retry"'}
          target="Pass"
          expectedFinalScore={4}
          hint="Set score to 4 first, or make the `if` compare your current score against the target before deciding."
          stepByStep
          expectedOutputContains="Decision is Pass"
        />

        <div className="mission-capabilities">
          <h3>Mission summary in your own words</h3>
          <p>One condition chooses path. One loop repeats with a checkpoint. One formula maps input to output.</p>
        </div>
      </section>
    </FoundationLessonPage>
  );
}
