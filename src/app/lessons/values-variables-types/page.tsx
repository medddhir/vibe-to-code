import type { Metadata } from "next";

import {
  ChoiceCheckpoint,
  type ChoiceCheckpointOption,
} from "@/components/choice-checkpoint";
import { CodeWindow } from "@/components/code-window";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import {
  getFoundationsLessonNumber,
  FOUNDATION_TOTAL_LESSONS,
} from "@/data/foundations-level1";
import { type GuidedLessonStep } from "@/components/guided-lesson-flow";
import { PracticeConsole } from "@/components/practice-console";

const lessonSlug = "values-variables-types";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 1;

const lessonSteps: GuidedLessonStep[] = [
  {
    id: "value-lab",
    title: "Build your first variable",
    eyebrow: "Your first win",
    requiresPractice: true,
  },
  {
    id: "compare-types",
    title: "Predict, then compare meaning",
    eyebrow: "Text versus number",
    requiresPractice: true,
  },
  {
    id: "trace-memory",
    title: "See live memory snapshots",
    eyebrow: "Execution trace",
    requiresPractice: true,
  },
  {
    id: "fix-type-mix",
    title: "Repair a type mistake",
    eyebrow: "Fix error messages",
    requiresPractice: true,
  },
  {
    id: "name-things",
    title: "Name checkpoint",
    eyebrow: "Recall what changed",
    requiresPractice: true,
  },
  {
    id: "capstone-change",
    title: "One-shot variable challenge",
    eyebrow: "Transfer your learning",
    requiresPractice: true,
  },
];

const typeOptions: ChoiceCheckpointOption[] = [
  {
    id: "both-different",
    label: "They are different and can never be treated the same.",
    feedback: "You are careful, but they can print the same. This mistake is subtler than it looks.",
  },
  {
    id: "display-same",
    label: "They may print the same, but keep different kinds.",
    feedback:
      "Exactly. `3` is a number; `\"3\"` is text. They print as the same characters, but future operations differ.",
  },
  {
    id: "both-number",
    label: "Both are numbers as long as digits appear.",
    feedback: "Only unquoted 3 is a number. Quotation marks create text.",
  },
];

const kindOptions: ChoiceCheckpointOption[] = [
  {
    id: "player-is-number",
    label: 'player = 3 (number), score = "Mia" (text)',
    feedback: "The names are valid but these types are reversed. `score` starts as a number and `player` starts as text.",
  },
  {
    id: "score-is-number",
    label: 'player is text, score is number',
    feedback:
      "Correct. `player` uses quotes, so it stores text. `score` is a number and can be added safely with other numbers.",
  },
];

export const metadata: Metadata = {
  title: "Lesson 1: Values, variables, and types",
  description:
    "Build a small value lab with Python and watch variable kinds, live memory, and mistakes you can fix for real.",
};

export default function ValuesVariablesTypesLesson() {
  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="Values, variables, and types"
      levelTitle="Level 1"
      totalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={12}
      steps={lessonSteps}
    >
      <section id="value-lab" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Your first win in 30 seconds</p>
        <h2>Turn a label into a working memory box.</h2>
        <p>
          A <strong>variable</strong> is a name for a stored value. Run this one-line change exercise and watch
          the output change immediately.
        </p>

        <PracticeConsole
          stepId="value-lab"
          title="Value Lab"
          instructions="Run this starter and change only one line so the final output becomes 5."
          starterCode={'score = 3\nscore = score + 1\nprint(score)'}
          expectedOutput="5"
          hint="You are already on the right path. Add one more to score before printing."
          successMessage="Nice. Changing one value changes what print shows. You now control one concrete box in memory."
          runnerMode="python-with-trace"
          showTrace
        />
      </section>

      <section id="compare-types" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Before running, predict meaning</p>
        <h2>What looks the same can still be a different kind.</h2>
        <p>
          The learner often expects these two lines to be the same thing. Which sentence is correct?
        </p>

        <CodeWindow
          title="compare.py"
          code={'print(3)\nprint("3")'}
          output="3\n3"
        />

        <ChoiceCheckpoint
          stepId="compare-types"
          title="Choose the right mental model"
          question={`Are \`3\` and "3" the same value?`}
          options={typeOptions}
          correctId="display-same"
          successMessage="Exactly. They print the same for this line, but they are not the same kind. The kind decides what operations are allowed."
          hint="Look for quotes. Quotes change the value kind to text."
        />
      </section>

      <section id="trace-memory" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Make the trace visible</p>
        <h2>Predict what each line stores and then prove it.</h2>
        <p>Run the script. Watch every assignment and print line update the memory map.</p>

        <PracticeConsole
          stepId="trace-memory"
          title="Memory trace lab"
          instructions="Run and compare your prediction with each trace row."
          starterCode={'player = "Mia"\nscore = 2\nscore = score + 3\nprint(player)\nprint(score)'}
          expectedOutput="Mia\n5"
          hint="Every assignment writes to a name. `print(...)` reads that current value and shows it."
          successMessage="Great. The trace now shows both `player` and `score` as names with distinct values."
          runnerMode="python-with-trace"
          showTrace
        />
      </section>

      <section id="fix-type-mix" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Repair the common bug</p>
        <h2>The simulator explains the exact type mistake.</h2>
        <p>
          This one fails by mixing text and numbers. Run it once, read the error, then make one tiny fix.
        </p>

        <PracticeConsole
          stepId="fix-type-mix"
          title="Fix the type mistake"
          instructions='Run the broken script, then keep the value kinds compatible so it prints 10.'
          starterCode={'score = 3\nbonus = "7"\nscore = score + bonus\nprint(score)'}
          expectedOutput="10"
          hint='Only one fix line is needed: remove quotes around `"7"` so bonus becomes a number.'
          successMessage="Correct. Now both values are numbers, so addition works."
          runnerMode="python-with-trace"
          showTrace
        />
      </section>

      <section id="name-things" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Recall and classify</p>
        <h2>Attach meaning, not just labels.</h2>
        <p>Before moving on, identify which variable is text and which is number.</p>

        <CodeWindow
          title="classify.py"
          code={'player = "Maya"\nscore = 2\nprint(player)\nprint(score)'}
          output="Maya\n2"
        />

        <ChoiceCheckpoint
          stepId="name-things"
          title="Which is which?"
          question="Choose the correct classification for this snippet."
          options={kindOptions}
          correctId="score-is-number"
          successMessage="Exactly. Strings use quotes, while plain digits without quotes are numbers."
          hint="Look for quotation marks. They signal text (a string)."
        />
      </section>

      <section id="capstone-change" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Transfer challenge</p>
        <h2>Build a new version of the same idea.</h2>
        <p>
          This is your final Level 1 checkpoint. Use your own thinking, and do not copy the previous fix.
        </p>

        <PracticeConsole
          stepId="capstone-change"
          title="Final code checkpoint"
          instructions='Fix this starter so the output is: 6'
          starterCode={'base = 4\nboost = "2"\ntotal = base + boost\nprint(total)'}
          expectedOutput="6"
          hint="The bonus value needs to be the same kind as `base` before adding."
          successMessage="Perfect. You used one consistent idea in a new example. Lesson checkpoint completed."
          runnerMode="python-with-trace"
          showTrace
        />
      </section>
    </FoundationLessonPage>
  );
}
