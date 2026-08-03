import type { Metadata } from "next";

import {
  ChoiceCheckpoint,
  type ChoiceCheckpointOption,
} from "@/components/choice-checkpoint";
import { CodeWindow } from "@/components/code-window";
import {
  GuidedLessonFlow,
  type GuidedLessonStep,
} from "@/components/guided-lesson-flow";
import { PracticeConsole } from "@/components/practice-console";
import { getCourse } from "@/data/curriculum";

export const metadata: Metadata = {
  title: "Mission 01: What code actually is",
  description: "Run, change, predict, and debug your first Python instructions.",
};

const lessonSteps: GuidedLessonStep[] = [
  {
    id: "brief",
    title: "Read the mission",
    eyebrow: "Mission brief",
    continueLabel: "Start the mission",
  },
  {
    id: "flow",
    title: "Find the doer",
    eyebrow: "Follow the signal",
    requiresPractice: true,
  },
  {
    id: "launch",
    title: "Send the first signal",
    eyebrow: "Run real code",
    requiresPractice: true,
  },
  {
    id: "predict",
    title: "Predict the output",
    eyebrow: "Think before running",
    requiresPractice: true,
  },
  {
    id: "remix",
    title: "Remix one value",
    eyebrow: "Edit and observe",
    requiresPractice: true,
  },
  {
    id: "debug",
    title: "Repair the bug",
    eyebrow: "Debug rescue",
    requiresPractice: true,
  },
  {
    id: "verify",
    title: "Verify before trusting",
    eyebrow: "AI builder habit",
    requiresPractice: true,
  },
];

const flowOptions: ChoiceCheckpointOption[] = [
  {
    id: "source",
    label: "Source code",
    feedback: "Source code is the written instruction. It still needs software to run it.",
  },
  {
    id: "runtime",
    label: "Runtime",
    feedback: "Correct—the runtime is the doer.",
  },
  {
    id: "output",
    label: "Output",
    feedback: "Output is the result you receive after the instruction runs.",
  },
];

const predictionOptions: ChoiceCheckpointOption[] = [
  {
    id: "hello-mira",
    label: "Hello, Mira",
    feedback: "Exactly—the name outside quotes is replaced by its stored value.",
  },
  {
    id: "hello-name",
    label: "Hello, name",
    feedback: "Python uses the value stored inside name, not the letters n-a-m-e.",
  },
  {
    id: "mira",
    label: "Mira",
    feedback: "The output also includes the quoted text before the variable.",
  },
  {
    id: "error",
    label: "An error",
    feedback: "Every name is defined and the two text values can be joined, so this code can run.",
  },
];

const verificationOptions: ChoiceCheckpointOption[] = [
  {
    id: "trust",
    label: "Trust it because the AI sounds confident",
    feedback: "Confidence is not evidence. AI can explain broken code convincingly.",
  },
  {
    id: "paste-more",
    label: "Paste in more AI-generated code",
    feedback: "More code creates more things to check. Verify the small example first.",
  },
  {
    id: "run-check",
    label: "Run it, compare the output, then test one small change",
    feedback: "Correct—run, inspect, and test before you trust.",
  },
];

export default function WhatIsCodeLesson() {
  const totalLessons = getCourse("foundations")?.lessonCount ?? 46;

  return (
    <GuidedLessonFlow
      lessonId="what-is-code"
      lessonVersion={2}
      courseHref="/courses/foundations"
      courseName="Developer Foundations"
      levelLabel="Level 0"
      lessonNumber={1}
      totalLessons={totalLessons}
      title="What code actually is"
      estimatedMinutes={12}
      steps={lessonSteps}
      stepNoun="Checkpoint"
      progressLabel="Mission progress"
      finalButtonLabel="Complete mission"
      completionEyebrow="Mission 01 complete"
      completionTitle="You sent your first signal—and proved you understood it."
      completionDescription="You can now read a tiny instruction, predict its result, run it, change it, and repair one bug. That is real progress."
      completionReward="Badge earned · First Signal"
    >
      <div id="brief" className="guided-topic mission-brief-topic">
        <section className="mission-brief-card">
          <div className="mission-brief-copy">
            <div className="lesson-label">Mission 01 · First Signal</div>
            <p className="eyebrow">Your objective</p>
            <h1>Make the machine say exactly what you mean.</h1>
            <p className="mission-lead">
              Code is a list of exact instructions. A computer follows what you write—not
              what you meant. In the next 12 minutes, you will run code, change it, break
              it, and fix it.
            </p>

            <ul className="mission-objectives" aria-label="Mission objectives">
              <li><span aria-hidden="true">01</span> Read one Python instruction</li>
              <li><span aria-hidden="true">02</span> Predict what it will display</li>
              <li><span aria-hidden="true">03</span> Repair a real error</li>
            </ul>
          </div>

          <div className="mission-signal-card" aria-label="System waiting for its first instruction">
            <div className="mission-signal-bar">
              <span>Learning runner</span>
              <small><i aria-hidden="true" /> Online</small>
            </div>
            <div className="mission-signal-screen" aria-hidden="true">
              <span className="signal-line signal-line-short" />
              <span className="signal-line" />
              <span className="signal-line signal-line-medium" />
              <div className="signal-prompt">
                <span>&gt;</span>
                <strong>waiting for an exact instruction</strong>
                <i />
              </div>
            </div>
            <p>No installation. No setup. Your first checkpoint is ready.</p>
          </div>
        </section>

        <div className="lesson-ready-note mission-ready-note">
          <span aria-hidden="true">✓</span>
          <p><strong>Safe practice space.</strong> The small runner cannot access your files or the internet.</p>
        </div>
      </div>

      <section id="flow" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Follow the signal</p>
        <h2>Every result travels through three stops.</h2>
        <p>Keep these roles separate and error messages become much less mysterious.</p>

        <div className="concept-beam" aria-label="Source code goes to a runtime, which produces output">
          <div>
            <span>01</span>
            <strong>Source code</strong>
            <p>The instruction you can read and edit.</p>
          </div>
          <i aria-hidden="true" />
          <div>
            <span>02</span>
            <strong>Runtime</strong>
            <p>The software that executes the instruction.</p>
          </div>
          <i aria-hidden="true" />
          <div>
            <span>03</span>
            <strong>Output</strong>
            <p>The text, screen, file, or action you receive.</p>
          </div>
        </div>

        <ChoiceCheckpoint
          stepId="flow"
          title="Find the doer"
          question="Which part actually runs the instruction?"
          options={flowOptions}
          correctId="runtime"
          successMessage="Correct—the runtime is the doer. Source code goes in; output comes out."
          hint="Look for the part described as software that executes the instruction."
        />
      </section>

      <section id="launch" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Run real code</p>
        <h2>Send your first signal.</h2>
        <p>This Python instruction asks the runtime to display one piece of text.</p>

        <div className="code-anatomy" aria-label="Parts of a Python print instruction">
          <article><code>print</code><p>The command that displays something.</p></article>
          <article><code>( )</code><p>The place where you give the command information.</p></article>
          <article><code>&quot;Hello&quot;</code><p>Text in quotes is called a string.</p></article>
        </div>

        <PracticeConsole
          stepId="launch"
          title="Make Python say hello"
          instructions="Replace the words inside the quotation marks so the output is exactly: Hello, coder!"
          starterCode={'print("Type your message")'}
          expectedOutput="Hello, coder!"
          successMessage="First signal received. You wrote source code, the runner executed it, and the output matched."
          hint={'Use lowercase print and matching quotes: print("Hello, coder!")'}
        />
      </section>

      <section id="predict" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Think before running</p>
        <h2>Make your brain run the code first.</h2>
        <p>A <strong>variable</strong> is a named box that stores a value. Here, the box named <code>name</code> stores the text <code>Mira</code>.</p>

        <CodeWindow
          title="predict.py"
          code={'name = "Mira"\nprint("Hello, " + name)'}
        />

        <ChoiceCheckpoint
          stepId="predict"
          title="Predict the output"
          question="What appears when this code runs?"
          options={predictionOptions}
          correctId="hello-mira"
          successMessage="Exactly—the name outside quotes is replaced by its stored value, so the result is Hello, Mira."
          hint="Read the first line, replace name on the second line with the value it stores, then join the two pieces."
        />
      </section>

      <section id="remix" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Edit and observe</p>
        <h2>Change one value. Watch the result move.</h2>
        <p>Use the smallest useful coding loop: <strong>edit → predict → run → observe.</strong></p>

        <div className="mission-goal-strip">
          <span>Your goal</span>
          <code>Hello, Ada</code>
        </div>

        <PracticeConsole
          stepId="remix"
          title="Remix the stored name"
          instructions="Change only Mira to Ada. Predict the new output, then run the code."
          starterCode={'name = "Mira"\nprint("Hello, " + name)'}
          expectedOutput="Hello, Ada"
          successMessage="Remix complete. One stored value changed the output—that is the edit–run–observe loop."
          hint={'Change the first line to name = "Ada". Leave the second line exactly as it is.'}
        />
      </section>

      <section id="debug" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Debug rescue</p>
        <h2>The code is broken. Good.</h2>
        <p>Debugging means finding why the result is wrong and making a focused repair. Run the broken code once before changing it.</p>

        <ol className="debug-recipe" aria-label="Four-step debugging recipe">
          <li><span>01</span><strong>Read</strong></li>
          <li><span>02</span><strong>Locate</strong></li>
          <li><span>03</span><strong>Change one thing</strong></li>
          <li><span>04</span><strong>Run again</strong></li>
        </ol>

        <PracticeConsole
          stepId="debug"
          title="Repair one character"
          instructions="Run the broken code, read the first useful error line, then fix it. The goal output is: I am learning"
          starterCode={'Print("I am learning")'}
          expectedOutput="I am learning"
          successMessage="Bug repaired. Python names are case-sensitive, so print and Print are different names."
          hint="The built-in command begins with a lowercase p. Keep everything else the same."
          requireInitialRun
        />
      </section>

      <div id="verify" className="guided-topic mission-topic mission-finish-topic">
        <section className="lesson-section">
          <p className="eyebrow">AI builder habit</p>
          <h2>AI can suggest. You still verify.</h2>
          <p>Generated code is a draft until you run it, inspect the result, and test what happens when something changes.</p>

          <ChoiceCheckpoint
            stepId="verify"
            title="Choose the trustworthy next move"
            question="An AI says its code works. What should you do next?"
            options={verificationOptions}
            correctId="run-check"
            successMessage="Correct—run, compare, and test. AI can draft the instruction; you own the evidence."
            hint="Choose the answer that produces evidence instead of asking you to trust confidence."
          />
        </section>

        <section className="mission-recap" aria-labelledby="mission-recap-title">
          <p className="eyebrow">What you can do now</p>
          <h2 id="mission-recap-title">Four abilities. One real foundation.</h2>
          <div className="mission-capabilities">
            <article><span aria-hidden="true">01</span><p>Explain code as exact instructions.</p></article>
            <article><span aria-hidden="true">02</span><p>Predict a tiny program&apos;s output.</p></article>
            <article><span aria-hidden="true">03</span><p>Edit and run Python safely.</p></article>
            <article><span aria-hidden="true">04</span><p>Read an error and repair one bug.</p></article>
          </div>
        </section>
      </div>
    </GuidedLessonFlow>
  );
}
