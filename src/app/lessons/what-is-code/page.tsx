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
import { SignalPathChallenge } from "@/components/signal-path-challenge";
import { getCourse } from "@/data/curriculum";

export const metadata: Metadata = {
  title: "Mission 01: What code actually is",
  description: "Wake a bot, run Python, personalize output, fix a bug, and verify an AI claim.",
};

const lessonSteps: GuidedLessonStep[] = [
  {
    id: "launch",
    title: "Wake Byte",
    eyebrow: "Your first win",
    requiresPractice: true,
  },
  {
    id: "flow",
    title: "Build the signal path",
    eyebrow: "Connect the system",
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
    title: "Make it yours",
    eyebrow: "Personalize the code",
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

export default function WhatIsCodeLesson() {
  const totalLessons = getCourse("foundations")?.lessonCount ?? 46;

  return (
    <GuidedLessonFlow
      lessonId="what-is-code"
      lessonVersion={3}
      courseHref="/courses/foundations"
      courseName="Developer Foundations"
      levelLabel="Level 0"
      lessonNumber={1}
      totalLessons={totalLessons}
      title="What code actually is"
      estimatedMinutes={10}
      steps={lessonSteps}
      stepNoun="Checkpoint"
      progressLabel="Mission progress"
      finalButtonLabel="Complete mission"
      completionEyebrow="Mission 01 complete"
      completionTitle="The bot is awake—and you stayed in control."
      completionDescription="You built the path, predicted a result, ran real Python, personalized it, repaired a bug, and checked an AI claim with evidence."
      completionReward="Skill unlocked · Code Operator"
    >
      <section id="launch" className="lesson-section guided-topic mission-topic">
        <div className="mission-kickoff">
          <div>
            <div className="lesson-label">Mission 01 · Wake the bot</div>
            <p className="eyebrow">Your first win starts now</p>
            <h2>Make a silent bot speak.</h2>
            <p className="mission-lead">
              Code is an exact instruction. Change one message below and run it—Byte will
              do precisely what you wrote.
            </p>
          </div>
          <div className="mission-kickoff-status" aria-label="Byte is waiting for an instruction">
            <span aria-hidden="true">&gt;_</span>
            <div>
              <small>Byte · learning bot</small>
              <strong>Waiting for your signal</strong>
            </div>
          </div>
        </div>

        <PracticeConsole
          stepId="launch"
          title="Wake Byte with one line"
          instructions="Change only the words inside the quotation marks. Make the output exactly: Hello, Byte!"
          starterCode={'print("I am sleeping")'}
          expectedOutput="Hello, Byte!"
          successMessage="Byte is awake. You changed source code, ran it, and created a visible result."
          hint={'Keep print and the brackets. Change the message to: print("Hello, Byte!")'}
        />

        <div className="lesson-ready-note mission-ready-note">
          <span aria-hidden="true">✓</span>
          <p><strong>Safe practice space.</strong> This small runner cannot access your files or the internet.</p>
        </div>
      </section>

      <section id="flow" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Connect the system</p>
        <h2>You made output. Now build the path it travelled.</h2>
        <p>
          Three things worked together: the instruction you wrote, the software that ran it,
          and the result you saw. Put them in order instead of memorizing a definition.
        </p>

        <SignalPathChallenge stepId="flow" />
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
        <p className="eyebrow">Personalize the code</p>
        <h2>Give Byte a name you actually care about.</h2>
        <p>
          Change the value stored in <code>name</code> to your name, nickname, or a character
          you like. Then use the real coding loop: <strong>edit → predict → run → observe.</strong>
        </p>

        <div className="mission-goal-strip">
          <span>Your goal</span>
          <code>Hello, [a name you choose]</code>
        </div>

        <PracticeConsole
          stepId="remix"
          title="Make the greeting yours"
          instructions="Replace Mira with any name you choose. Predict the result, then run the code."
          starterCode={'name = "Mira"\nprint("Hello, " + name)'}
          expectedOutput="Hello, followed by a name you choose"
          validationMode="personal-greeting"
          successMessage="That greeting is yours. One stored value changed the result without rewriting the print instruction."
          hint={'Change only the text between quotes on line 1, for example: name = "Sam".'}
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
          <h2>The AI sounds sure. Catch its mistake.</h2>
          <p>
            An AI claims the code below greets Mira. Confidence is not evidence, so run the
            draft, compare what it actually does, and repair it.
          </p>

          <blockquote className="ai-claim-card">
            <span aria-hidden="true">AI</span>
            <div>
              <small>AI-generated explanation</small>
              <p>“This code will display <code>Hello, Mira</code>.”</p>
            </div>
          </blockquote>

          <PracticeConsole
            stepId="verify"
            title="Run the claim, then make it true"
            instructions="First run the AI draft. It will run without an error—but the result is wrong. Fix the second line so the output is exactly: Hello, Mira"
            starterCode={'name = "Mira"\nprint("Hello, name")'}
            expectedOutput="Hello, Mira"
            successMessage="Claim verified and repaired. You trusted the evidence, not the confident explanation."
            hint={'Remove name from inside the quotation marks, then join the stored value: print("Hello, " + name)'}
            requireInitialRun
            initialRunLabel="Run the AI draft"
            initialRunInstructions="Run the AI draft once. The editor unlocks after you see what it actually does."
          />
        </section>

        <section className="mission-recap" aria-labelledby="mission-recap-title">
          <p className="eyebrow">What you can do now</p>
          <h2 id="mission-recap-title">Five wins. One real foundation.</h2>
          <div className="mission-capabilities">
            <article><span aria-hidden="true">01</span><p>Turn an instruction into visible output.</p></article>
            <article><span aria-hidden="true">02</span><p>Explain source, runtime, and output.</p></article>
            <article><span aria-hidden="true">03</span><p>Predict and personalize a variable.</p></article>
            <article><span aria-hidden="true">04</span><p>Read an error and repair one bug.</p></article>
            <article><span aria-hidden="true">05</span><p>Test an AI claim before trusting it.</p></article>
          </div>
        </section>
      </div>
    </GuidedLessonFlow>
  );
}
