import type { Metadata } from "next";
import Link from "next/link";

import { CodeWindow } from "@/components/code-window";

export const metadata: Metadata = {
  title: "What code actually is",
  description: "Your first Vibe to Code lesson: understand what code is in plain English.",
};

export default function WhatIsCodeLesson() {
  return (
    <main id="main-content" className="lesson-main">
      <div className="shell lesson-shell">
        <aside className="lesson-sidebar" aria-label="Lesson progress">
          <Link className="breadcrumb" href="/courses/foundations">
            ← Developer Foundations
          </Link>
          <p className="eyebrow">Level 0 · Lesson 1</p>
          <h2>What code actually is</h2>
          <div className="lesson-progress" aria-label="1 of 12 lessons">
            <span style={{ width: "8.33%" }} />
          </div>
          <small>1 of 12 lessons</small>
          <nav aria-label="On this page">
            <a href="#idea">The simple idea</a>
            <a href="#example">First example</a>
            <a href="#predict">Predict the output</a>
            <a href="#debug">Debug challenge</a>
            <a href="#check">Mastery check</a>
          </nav>
        </aside>

        <article className="lesson-article">
          <header className="lesson-header">
            <div className="lesson-label">Lesson 01 · About 8 minutes</div>
            <h1>What code actually is</h1>
            <p>
              Code is a set of exact instructions written in a language a computer can
              process. It is not magic, and it is not the finished app you see on screen.
            </p>
          </header>

          <section id="idea" className="lesson-section">
            <h2>The simple idea</h2>
            <p>
              Imagine giving directions to a very fast assistant who follows every word
              literally. “Make tea” is too vague. The assistant needs smaller instructions:
              fill the kettle, heat the water, place tea in a cup, and pour.
            </p>
            <div className="callout callout-simple">
              <strong>Code is the recipe. The running program is the cooking.</strong>
              <p>The result on your screen is the finished dish.</p>
            </div>
            <p>
              Programming languages such as Python and JavaScript give us agreed words and
              rules for writing those instructions.
            </p>
          </section>

          <section id="example" className="lesson-section">
            <h2>Your first example</h2>
            <p>This Python instruction asks the computer to display a piece of text.</p>
            <CodeWindow
              title="hello.py"
              code={'print("Hello, coder!")'}
              output="Hello, coder!"
            />
            <div className="line-breakdown">
              <div><code>print</code><p>A built-in Python function that displays something.</p></div>
              <div><code>( )</code><p>Parentheses hold the information given to the function.</p></div>
              <div><code>&quot;Hello, coder!&quot;</code><p>Text inside quotation marks is called a string.</p></div>
            </div>
          </section>

          <section id="predict" className="lesson-section">
            <h2>Predict before you reveal</h2>
            <p>What will the computer display?</p>
            <CodeWindow title="predict.py" code={'name = "Mira"\nprint("Hello, " + name)'} />
            <details className="answer-box">
              <summary>Reveal the answer</summary>
              <div>
                <code>Hello, Mira</code>
                <p>The variable <code>name</code> stores text. The <code>+</code> joins the two pieces.</p>
              </div>
            </details>
          </section>

          <section id="debug" className="lesson-section">
            <h2>Debug challenge</h2>
            <p>This code fails because Python cares about uppercase and lowercase letters. Find the mistake.</p>
            <CodeWindow title="broken.py" code={'Print("I am learning")'} />
            <details className="answer-box">
              <summary>Show the fix</summary>
              <div>
                <code>print(&quot;I am learning&quot;)</code>
                <p><code>Print</code> and <code>print</code> are different names. The built-in function uses a lowercase <code>p</code>.</p>
              </div>
            </details>
          </section>

          <section id="check" className="lesson-section mastery-card">
            <p className="eyebrow">Mastery check</p>
            <h2>Can you explain it without copying?</h2>
            <ol>
              <li>What is the difference between source code and a running program?</li>
              <li>Why must instructions to a computer be precise?</li>
              <li>What does <code>print()</code> do in Python?</li>
            </ol>
            <details className="answer-box answer-box-light">
              <summary>Check your answers</summary>
              <div>
                <p><strong>1.</strong> Source code is the written instruction; the running program is the computer executing it.</p>
                <p><strong>2.</strong> Computers follow defined rules and cannot safely guess missing intent.</p>
                <p><strong>3.</strong> It displays a value as output.</p>
              </div>
            </details>
          </section>

          <nav className="lesson-navigation" aria-label="Lesson navigation">
            <div>
              <small>You completed the idea</small>
              <strong>Next: source code, programs, and output</strong>
            </div>
            <Link className="button button-primary" href="/courses/foundations">
              View course plan
            </Link>
          </nav>
        </article>
      </div>
    </main>
  );
}
