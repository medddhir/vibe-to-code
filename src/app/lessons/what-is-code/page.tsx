import type { Metadata } from "next";
import Link from "next/link";

import { CodeWindow } from "@/components/code-window";
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

const lessonSections = [
  ["#idea", "The simple idea"],
  ["#flow", "See the flow"],
  ["#example", "First example"],
  ["#predict", "Predict first"],
  ["#try", "Try it yourself"],
  ["#mistakes", "Mistake clinic"],
  ["#debug", "Debug challenge"],
  ["#vocabulary", "New words"],
  ["#ai", "Use AI well"],
  ["#check", "Mastery check"],
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
  const progress = `${(100 / totalLessons).toFixed(2)}%`;

  return (
    <main id="main-content" className="lesson-main">
      <div className="shell lesson-shell">
        <aside className="lesson-sidebar" aria-label="Lesson progress">
          <Link className="breadcrumb" href="/courses/foundations">
            ← Developer Foundations
          </Link>
          <p className="eyebrow">Level 0 · Lesson 1</p>
          <p className="lesson-sidebar-title">What code actually is</p>
          <div
            className="lesson-progress"
            role="progressbar"
            aria-label="Course progress"
            aria-valuemin={0}
            aria-valuemax={totalLessons}
            aria-valuenow={1}
            aria-valuetext={`Lesson 1 of ${totalLessons}`}
          >
            <span style={{ width: progress }} />
          </div>
          <small>1 of {totalLessons} lessons</small>
          <nav aria-label="On this page">
            {lessonSections.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <details className="lesson-mobile-toc">
            <summary>On this page</summary>
            <nav aria-label="On this page, mobile">
              {lessonSections.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
            </nav>
          </details>
        </aside>

        <article className="lesson-article">
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
              <p><strong>No installation required yet.</strong> Do the thinking exercises now; running Python is optional until the setup lesson.</p>
            </div>
          </header>

          <section id="idea" className="lesson-section">
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

          <section id="flow" className="lesson-section">
            <p className="eyebrow">See the connection</p>
            <h2>See the flow</h2>
            <p>Three different things are involved. Keeping them separate prevents a lot of confusion.</p>
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

          <section id="example" className="lesson-section">
            <p className="eyebrow">See it work</p>
            <h2>Your first example</h2>
            <p>This Python instruction asks the computer to display one piece of text.</p>
            <CodeWindow title="hello.py" code={'print("Hello, coder!")'} output="Hello, coder!" />
            <div className="line-breakdown">
              <div><code>print</code><p>A built-in Python function that displays something.</p></div>
              <div><code>( )</code><p>Parentheses hold the information given to the function.</p></div>
              <div><code>&quot;Hello, coder!&quot;</code><p>Text inside quotation marks is called a string.</p></div>
            </div>
            <details className="answer-box">
              <summary>Why does every symbol matter?</summary>
              <div>
                <p>
                  The runtime uses Python&apos;s grammar. Change <code>print</code> to <code>Print</code>,
                  remove a quotation mark, or forget a parenthesis and the instruction means something
                  different—or cannot be understood at all.
                </p>
              </div>
            </details>
          </section>

          <section id="predict" className="lesson-section">
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
          </section>

          <section id="try" className="lesson-section">
            <p className="eyebrow">Tiny practice</p>
            <h2>Try it yourself</h2>
            <p>You do not need to understand every word yet. Change one thing and observe one result.</p>
            <ol className="practice-stepper">
              <li><span>01</span><div><strong>Keep the example visible</strong><p>You can do this on paper or in your notes; no coding tool is required.</p></div></li>
              <li><span>02</span><div><strong>Replace Mira with your name</strong><p>Change only the text between quotation marks.</p></div></li>
              <li><span>03</span><div><strong>Predict the result</strong><p>Write what the output should be. If Python is already available, you may run it to check.</p></div></li>
              <li><span>04</span><div><strong>Explain the change</strong><p>Say which stored value changed and which output changed.</p></div></li>
            </ol>
            <div className="expected-output">
              <span>Expected pattern</span>
              <code>Hello, Your name</code>
            </div>
          </section>

          <section id="mistakes" className="lesson-section">
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
          </section>

          <section id="debug" className="lesson-section">
            <p className="eyebrow">Debug challenge</p>
            <h2>Find the exact mistake</h2>
            <p>This code fails because Python cares about uppercase and lowercase letters.</p>
            <CodeWindow title="broken.py" code={'Print("I am learning")'} />
            <details className="answer-box">
              <summary>Show the fix</summary>
              <div>
                <code>print(&quot;I am learning&quot;)</code>
                <p>
                  <code>Print</code> and <code>print</code> are different names. The built-in
                  function uses a lowercase <code>p</code>. Change only that letter, then run again.
                </p>
              </div>
            </details>
          </section>

          <section id="vocabulary" className="lesson-section">
            <p className="eyebrow">New words</p>
            <h2>Your seven-word starter glossary</h2>
            <div className="vocabulary-grid">
              {vocabulary.map(([word, definition]) => (
                <article key={word}>
                  <code>{word}</code>
                  <p>{definition}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="ai" className="lesson-section">
            <p className="eyebrow">Use AI well</p>
            <h2>Ask for explanation, then verify it</h2>
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

          <section id="check" className="lesson-section mastery-card glow-card">
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

          <nav className="lesson-navigation" aria-label="Lesson navigation">
            <div>
              <small>Next concept</small>
              <strong>Source code, running programs, and output</strong>
            </div>
            <Link className="button button-primary" href="/courses/foundations#level-1">
              View the course map
            </Link>
          </nav>
        </article>
      </div>
    </main>
  );
}
