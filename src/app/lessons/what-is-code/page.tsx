import type { Metadata } from "next";

import { CodeWindow } from "@/components/code-window";
import {
  GuidedLessonFlow,
  type GuidedLessonStep,
} from "@/components/guided-lesson-flow";
import { PracticeConsole } from "@/components/practice-console";
import { getCourse } from "@/data/curriculum";

export const metadata: Metadata = {
  title: "What code actually is",
  description: "Understand code, programs, runtimes, and output through one calm beginner lesson.",
};

const vocabulary = [
  ["Code", "Instructions written for a computer to process."],
  ["Source file", "A saved text file containing code, such as hello.py."],
  ["Runtime", "The software that reads or executes the code."],
  ["Program", "A complete set of stored instructions designed to perform a task."],
  ["Process", "A running instance of a program."],
  ["Input", "Information given to a program."],
  ["Output", "The result a program produces."],
];

const lessonSteps: GuidedLessonStep[] = [
  { id: "idea", title: "The simple idea", eyebrow: "Start here" },
  { id: "flow", title: "Code → runtime → output", eyebrow: "See the connection" },
  {
    id: "example",
    title: "Print your first message",
    eyebrow: "Run real practice",
    requiresPractice: true,
  },
  { id: "predict", title: "Predict before running", eyebrow: "Think like a computer" },
  {
    id: "try",
    title: "Change one thing",
    eyebrow: "Tiny practice",
    requiresPractice: true,
  },
  { id: "mistakes", title: "Normal beginner mistakes", eyebrow: "Mistake clinic" },
  {
    id: "debug",
    title: "Fix broken code",
    eyebrow: "Debug challenge",
    requiresPractice: true,
  },
  { id: "vocabulary", title: "Seven starter words", eyebrow: "New vocabulary" },
  { id: "ai", title: "Use AI, then verify", eyebrow: "Vibe coder habit" },
  { id: "check", title: "Explain what you learned", eyebrow: "Mastery check" },
];

const commonMistakes = [
  {
    title: "The file was not saved",
    symptom: "The output still shows the old message.",
    fix: "Save the file, then run or refresh again.",
  },
  {
    title: "Capital letters changed the name",
    symptom: "Python says Print is not defined.",
    fix: "Use the exact lowercase name: print.",
  },
  {
    title: "A quotation mark is missing",
    symptom: "The computer cannot tell where the text ends.",
    fix: "Put matching quotation marks around the complete message.",
  },
];

export default function WhatIsCodeLesson() {
  const totalLessons = getCourse("foundations")?.lessonCount ?? 46;

  return (
    <GuidedLessonFlow
      lessonId="what-is-code"
      courseHref="/courses/foundations"
      courseName="Developer Foundations"
      levelLabel="Level 0"
      lessonNumber={1}
      totalLessons={totalLessons}
      title="What code actually is"
      estimatedMinutes={15}
      steps={lessonSteps}
    >
      <div id="idea" className="guided-topic guided-topic-intro">
        <header className="lesson-header lesson-header-rich">
          <div className="lesson-label">Lesson 01 · About 15 minutes</div>
          <p className="lesson-one-sentence">In one sentence</p>
          <h1>Code is a set of exact instructions.</h1>
          <p>
            You write the instructions, a runtime executes them, and the computer produces
            a result. That result might be text, a webpage, a calculation, a sound, or an
            entire app.
          </p>
          <div className="lesson-ready-note">
            <span aria-hidden="true">✓</span>
            <p><strong>No installation required.</strong> Everything you need for this lesson runs safely on this page.</p>
          </div>
        </header>

        <section className="lesson-section">
          <p className="eyebrow">Start here</p>
          <h2>The simple idea</h2>
          <p>
            Imagine giving directions to a very fast assistant who follows every word
            literally. “Make tea” is vague. A safer instruction says: fill the kettle,
            heat the water, place tea in a cup, then pour the water.
          </p>
          <div className="callout callout-simple">
            <strong>Code is the recipe. Running the program is the cooking.</strong>
            <p>The result on your screen is the finished dish.</p>
          </div>
          <p>
            Programming languages such as Python and JavaScript provide agreed words and
            grammar for those instructions. A computer is fast and consistent, but it does
            not safely guess what you forgot to say.
          </p>
        </section>
      </div>

      <section id="flow" className="lesson-section guided-topic">
        <p className="eyebrow">See the connection</p>
        <h2>Three parts, one clear flow</h2>
        <p>Keeping these three things separate prevents a lot of beginner confusion.</p>
        <div className="concept-beam" aria-label="Source code goes to a runtime, which produces output">
          <div>
            <span>01</span>
            <strong>Source code</strong>
            <p>The instructions you can read and edit.</p>
          </div>
          <i aria-hidden="true" />
          <div>
            <span>02</span>
            <strong>Runtime</strong>
            <p>The software that executes those instructions.</p>
          </div>
          <i aria-hidden="true" />
          <div>
            <span>03</span>
            <strong>Output</strong>
            <p>The text, screen, file, or action you receive.</p>
          </div>
        </div>
        <div className="callout callout-warning">
          <strong>Important for vibe coders</strong>
          <p>AI may write source code. You still need to run it, inspect the output, and decide whether the result is correct.</p>
        </div>
      </section>

      <section id="example" className="lesson-section guided-topic">
        <p className="eyebrow">See it, then do it</p>
        <h2>Print your first message</h2>
        <p>This Python instruction asks the computer to display one piece of text.</p>
        <CodeWindow title="hello.py" code={'print("Hello, coder!")'} output="Hello, coder!" />
        <div className="line-breakdown">
          <div><code>print</code><p>A built-in Python function that displays something.</p></div>
          <div><code>( )</code><p>Parentheses hold the information given to the function.</p></div>
          <div><code>&quot;Hello, coder!&quot;</code><p>Text inside quotation marks is called a string.</p></div>
        </div>

        <PracticeConsole
          stepId="example"
          title="Make Python say hello"
          instructions="Replace the words inside the quotation marks so the output is exactly: Hello, coder! Then run the code."
          starterCode={'print("Type your message")'}
          expectedOutput="Hello, coder!"
          hint={'Use lowercase print, then put the exact message in matching quotes: print("Hello, coder!")'}
        />
      </section>

      <section id="predict" className="lesson-section guided-topic">
        <p className="eyebrow">Predict first</p>
        <h2>Make your brain run the code</h2>
        <p>What will the computer display? Say your answer before opening the reveal.</p>
        <CodeWindow title="predict.py" code={'name = "Mira"\nprint("Hello, " + name)'} />
        <details className="answer-box">
          <summary>Reveal the answer</summary>
          <div>
            <code>Hello, Mira</code>
            <p>The variable <code>name</code> stores text. The <code>+</code> joins the two pieces.</p>
          </div>
        </details>
        <div className="callout callout-simple">
          <strong>Why predict first?</strong>
          <p>Prediction turns you from someone watching code into someone reasoning about it.</p>
        </div>
      </section>

      <section id="try" className="lesson-section guided-topic">
        <p className="eyebrow">Tiny practice</p>
        <h2>Change one thing, observe one result</h2>
        <p>You do not need to understand every word yet. Follow this small loop.</p>
        <ol className="practice-stepper">
          <li><span>01</span><div><strong>Keep the example visible</strong><p>Small examples are easier to reason about.</p></div></li>
          <li><span>02</span><div><strong>Replace Mira with your name</strong><p>Change only the text between quotation marks.</p></div></li>
          <li><span>03</span><div><strong>Predict the result</strong><p>Say what the output should be before checking.</p></div></li>
          <li><span>04</span><div><strong>Explain the change</strong><p>Name the stored value that changed and the output it affected.</p></div></li>
        </ol>
        <div className="expected-output">
          <span>Your goal</span>
          <code>Hello, Ada</code>
        </div>
        <PracticeConsole
          stepId="try"
          title="Change the stored name"
          instructions="Change only Mira to Ada, predict the new output, then run the code."
          starterCode={'name = "Mira"\nprint("Hello, " + name)'}
          expectedOutput="Hello, Ada"
          hint={'Change the first line to name = "Ada". The second line can stay exactly the same.'}
        />
      </section>

      <section id="mistakes" className="lesson-section guided-topic">
        <p className="eyebrow">Mistake clinic</p>
        <h2>Three normal beginner mistakes</h2>
        <p>A mistake is useful when you connect its symptom to a cause and a fix.</p>
        <div className="mistake-grid">
          {commonMistakes.map((mistake, index) => (
            <article key={mistake.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{mistake.title}</h3>
              <p><strong>What you see:</strong> {mistake.symptom}</p>
              <p><strong>What to do:</strong> {mistake.fix}</p>
            </article>
          ))}
        </div>
        <div className="callout callout-simple">
          <strong>Errors are information, not a verdict.</strong>
          <p>Read the first useful line, find the location, change one thing, and run again.</p>
        </div>
      </section>

      <section id="debug" className="lesson-section guided-topic">
        <p className="eyebrow">Debug challenge</p>
        <h2>Find and fix the exact mistake</h2>
        <p>The starter code below fails because Python cares about uppercase and lowercase letters.</p>
        <PracticeConsole
          stepId="debug"
          title="Repair the print instruction"
          instructions="Run the broken code once, read the error, then change only what is wrong. Your goal output is: I am learning"
          starterCode={'Print("I am learning")'}
          expectedOutput="I am learning"
          hint="The built-in function begins with a lowercase p. Keep everything else the same."
        />
      </section>

      <section id="vocabulary" className="lesson-section guided-topic">
        <p className="eyebrow">New words</p>
        <h2>Your seven-word starter glossary</h2>
        <p>You do not need to memorize these today. Recognizing them is enough.</p>
        <div className="vocabulary-grid">
          {vocabulary.map(([word, definition]) => (
            <article key={word}>
              <code>{word}</code>
              <p>{definition}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="ai" className="lesson-section guided-topic">
        <p className="eyebrow">Use AI well</p>
        <h2>Ask for an explanation, then verify it</h2>
        <p>A useful beginner prompt asks for one concept, one example, and one check.</p>
        <div className="prompt-card glow-card">
          <div className="prompt-card-bar"><span>Prompt</span><small>Copy the idea, not necessarily every word</small></div>
          <p>
            Explain this code to a total beginner, one part at a time. Then show the exact
            output, give me one tiny change to try, and ask me to predict the new output.
            Do not add packages or change any files.
          </p>
        </div>
        <ul className="verify-list">
          <li>Does the explanation match the actual code?</li>
          <li>Does running the code produce the claimed output?</li>
          <li>Did the AI stay inside your request?</li>
        </ul>
      </section>

      <div id="check" className="guided-topic guided-topic-finish">
        <section className="lesson-section lesson-recap">
          <p className="eyebrow">Plain-English recap</p>
          <h2>What you should remember</h2>
          <ul>
            <li>Code is written instructions, not the finished app.</li>
            <li>A runtime executes the code.</li>
            <li>Input goes in; output comes out.</li>
            <li>Small symbols and letter case can change the meaning.</li>
            <li>AI can write code, but you remain responsible for checking it.</li>
          </ul>
        </section>

        <section className="lesson-section mastery-card glow-card">
          <p className="eyebrow">Mastery check</p>
          <h2>Can you explain it without copying?</h2>
          <ol>
            <li>What is the difference between source code and a running process?</li>
            <li>What job does a runtime perform?</li>
            <li>Why must instructions to a computer be precise?</li>
            <li>What does <code>print()</code> do in Python?</li>
          </ol>
          <details className="answer-box answer-box-light">
            <summary>Check your answers</summary>
            <div>
              <p><strong>1.</strong> Source code is the written instruction; a process is a running instance executing those instructions.</p>
              <p><strong>2.</strong> It reads or executes code according to the language&apos;s rules.</p>
              <p><strong>3.</strong> A computer follows defined grammar and cannot safely invent missing intent.</p>
              <p><strong>4.</strong> It displays a value as output.</p>
            </div>
          </details>
        </section>
      </div>
    </GuidedLessonFlow>
  );
}
