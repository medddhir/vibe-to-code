import type { Metadata } from "next";

import { ChoiceCheckpoint } from "@/components/choice-checkpoint";
import { TerminalNavigationLab } from "@/components/foundations/computer-confidence-labs";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import type { GuidedLessonStep } from "@/components/guided-lesson-flow";
import {
  FOUNDATION_LEVEL0_TOTAL_LESSONS,
  FOUNDATION_TOTAL_LESSONS,
  getFoundationsCourseLessonNumber,
  getFoundationsLessonNumber,
} from "@/data/foundations-level1";

const lessonSlug = "terminal-without-fear";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 7;
const courseLessonNumber = getFoundationsCourseLessonNumber(lessonSlug) ?? 7;
const lessonSteps: GuidedLessonStep[] = [
  { id: "prompt-model", title: "Read a shell prompt", eyebrow: "You type after the symbol", requiresPractice: true },
  { id: "navigation-mission", title: "Navigate a safe shell", eyebrow: "Command simulator", requiresPractice: true },
  { id: "safe-commands", title: "Know what each command does", eyebrow: "Four useful tools", requiresPractice: true },
  { id: "silent-success", title: "Understand silent success", eyebrow: "No news can be good news", requiresPractice: true },
  { id: "terminal-transfer", title: "Repeat the command journey", eyebrow: "Final checkpoint", requiresPractice: true },
];

export const metadata: Metadata = {
  title: `Level 0 · Lesson ${lessonNumber} of ${FOUNDATION_LEVEL0_TOTAL_LESSONS}: The terminal without fear`,
  description: "Read a prompt and safely practice pwd, ls, mkdir, and cd in a strict browser-only terminal simulator.",
};

export default function TerminalWithoutFearLesson() {
  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="The terminal without fear"
      levelTitle="Level 0"
      totalLessons={FOUNDATION_LEVEL0_TOTAL_LESSONS}
      courseLessonNumber={courseLessonNumber}
      courseTotalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={14}
      steps={lessonSteps}
    >
      <section id="prompt-model" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">You type after the symbol</p>
        <h2>The prompt is information—not part of your command.</h2>
        <p>In <code>/home/learner $ pwd</code>, the prompt shows the current location and where typing begins. You type only <code>pwd</code>.</p>
        <ChoiceCheckpoint
          stepId="prompt-model"
          title="Copy the command correctly"
          question="A tutorial shows $ ls. What should you type into the terminal?"
          options={[
            { id: "ls", label: "ls", feedback: "Correct. The dollar sign represents the prompt in many tutorials." },
            { id: "dollar", label: "$ ls", feedback: "Do not copy the prompt symbol; the terminal already provides its own prompt." },
            { id: "sentence", label: "show me all files please", feedback: "Shells expect exact commands, not ordinary sentences unless an AI tool is specifically involved." },
          ]}
          correctId="ls"
          successMessage="Exactly. Type the command after the prompt, without copying the prompt itself."
          hint="The terminal already displays the $ symbol for you."
        />
      </section>

      <section id="navigation-mission" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Command simulator</p>
        <h2>Ask where you are, look around, create, and enter.</h2>
        <p>Complete the mission with <code>pwd</code>, <code>ls</code>, <code>mkdir practice</code>, <code>cd practice</code>, then <code>pwd</code> again.</p>
        <TerminalNavigationLab
          stepId="navigation-mission"
          title="Enter a new practice folder"
          instructions="Run pwd, ls, mkdir practice, cd practice, and pwd. Type one command at a time without the $ prompt."
          goalFolder="practice"
          successMessage="Mission complete. You created a folder, entered it, and proved your new location."
          hint="Use this exact order: pwd → ls → mkdir practice → cd practice → pwd"
        />
      </section>

      <section id="safe-commands" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Four useful tools</p>
        <h2>Each command asks for one small, clear action.</h2>
        <p><code>pwd</code> prints your location. <code>ls</code> lists contents. <code>mkdir</code> makes a folder. <code>cd</code> changes folder.</p>
        <ChoiceCheckpoint
          stepId="safe-commands"
          title="Choose the navigation command"
          question="Which command moves into an existing folder named projects?"
          options={[
            { id: "cd", label: "cd projects", feedback: "Correct. cd means change directory (folder)." },
            { id: "mkdir", label: "mkdir projects", feedback: "mkdir creates the folder; it does not enter it." },
            { id: "pwd", label: "pwd projects", feedback: "pwd prints the current location and does not take that folder name here." },
          ]}
          correctId="cd"
          successMessage="Right. Use cd plus a folder name to move into it."
          hint="The command's name is short for change directory."
        />
      </section>

      <section id="silent-success" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">No news can be good news</p>
        <h2>Some successful commands print nothing.</h2>
        <p>Commands such as <code>mkdir practice</code> may quietly return to the prompt. Verify with <code>ls</code> instead of assuming silence means failure.</p>
        <ChoiceCheckpoint
          stepId="silent-success"
          title="Respond to silent output"
          question="mkdir demo prints no message and the prompt returns. What should you do?"
          options={[
            { id: "verify", label: "Run ls to verify whether demo exists", feedback: "Correct. Verification replaces guessing with evidence." },
            { id: "panic", label: "Assume the terminal is broken", feedback: "Many commands are silent when successful." },
            { id: "repeat", label: "Run mkdir demo ten more times", feedback: "Repeated creation will likely produce an already-exists error. Verify once instead." },
          ]}
          correctId="verify"
          successMessage="Exactly. Quiet success is normal; use another safe command to prove the state."
          hint="Which command lists the contents of the current folder?"
        />
      </section>

      <section id="terminal-transfer" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Final checkpoint</p>
        <h2>Create a new sandbox and prove where you landed.</h2>
        <p>Repeat the journey with a different folder name. Errors are safe here and give you evidence for the next attempt.</p>
        <TerminalNavigationLab
          stepId="terminal-transfer"
          title="Navigate into sandbox"
          instructions="Use pwd, ls, mkdir sandbox, cd sandbox, and a final pwd."
          goalFolder="sandbox"
          successMessage="Level 0 terminal confidence unlocked. You can read a prompt, navigate, and verify instead of guessing."
          hint="Use this exact order: pwd → ls → mkdir sandbox → cd sandbox → pwd"
        />
      </section>
    </FoundationLessonPage>
  );
}
