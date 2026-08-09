import type { Metadata } from "next";

import { ChoiceCheckpoint } from "@/components/choice-checkpoint";
import { SystemStackLab } from "@/components/foundations/computer-confidence-labs";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import type { GuidedLessonStep } from "@/components/guided-lesson-flow";
import {
  FOUNDATION_LEVEL0_TOTAL_LESSONS,
  FOUNDATION_TOTAL_LESSONS,
  getFoundationsCourseLessonNumber,
  getFoundationsLessonNumber,
} from "@/data/foundations-level1";

const lessonSlug = "hardware-operating-systems-apps";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 3;
const courseLessonNumber = getFoundationsCourseLessonNumber(lessonSlug) ?? 3;
const lessonSteps: GuidedLessonStep[] = [
  { id: "stack-sort", title: "Build the computer stack", eyebrow: "Touch to website", requiresPractice: true },
  { id: "os-job", title: "Understand the operating system", eyebrow: "The manager layer", requiresPractice: true },
  { id: "browser-website", title: "Separate browser and website", eyebrow: "Container versus content", requiresPractice: true },
  { id: "failure-layer", title: "Find the failing layer", eyebrow: "Debug without panic", requiresPractice: true },
  { id: "stack-transfer", title: "Trace one click", eyebrow: "Final checkpoint", requiresPractice: true },
];

export const metadata: Metadata = {
  title: `Level 0 · Lesson ${lessonNumber} of ${FOUNDATION_LEVEL0_TOTAL_LESSONS}: Hardware, operating systems, and apps`,
  description: "Build a simple four-layer picture of a computer and learn to locate problems without mixing up hardware, Windows, Chrome, and websites.",
};

export default function HardwareOperatingSystemsAppsLesson() {
  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="Hardware, operating systems, and apps"
      levelTitle="Level 0"
      totalLessons={FOUNDATION_LEVEL0_TOTAL_LESSONS}
      courseLessonNumber={courseLessonNumber}
      courseTotalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={10}
      steps={lessonSteps}
    >
      <section id="stack-sort" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Touch to website</p>
        <h2>A computer is a stack of cooperating layers.</h2>
        <p>
          <strong>Hardware</strong> is physical. The <strong>operating system</strong> manages it.
          An <strong>application</strong> runs on the operating system. A <strong>website</strong> can run inside a browser application.
        </p>
        <SystemStackLab
          stepId="stack-sort"
          title="Sort four familiar things"
          instructions="Place each item into hardware, operating system, application, or website."
          successMessage="Stack complete: keyboard → Windows → Chrome → Vibe to Code lesson."
          hint="Ask: can I touch it, does it manage the machine, is it an installed app, or is it content opened in a browser?"
        />
      </section>

      <section id="os-job" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">The manager layer</p>
        <h2>Windows is software that manages the computer.</h2>
        <p>The operating system helps apps use memory, storage, the screen, keyboard, network, and other hardware.</p>
        <ChoiceCheckpoint
          stepId="os-job"
          title="Name the operating system job"
          question="Which description fits Windows, macOS, or Ubuntu?"
          options={[
            { id: "manager", label: "It manages hardware and provides a place for applications to run", feedback: "Correct. The OS connects applications with the machine's resources." },
            { id: "website", label: "It is one website inside Chrome", feedback: "A website runs much higher in the stack." },
            { id: "keyboard", label: "It is the physical keyboard and screen", feedback: "Those are hardware. The OS controls and coordinates them." },
          ]}
          correctId="manager"
          successMessage="Exactly. The operating system is the machine's main software manager."
          hint="Think about the layer that starts before Chrome and lets many apps run."
        />
      </section>

      <section id="browser-website" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Container versus content</p>
        <h2>Chrome is not the website it displays.</h2>
        <p>A browser is an application. You can open, close, or switch websites inside it, just as a music app can play different songs.</p>
        <ChoiceCheckpoint
          stepId="browser-website"
          title="Separate the browser from its content"
          question="You close one Vibe to Code tab, but Chrome stays open. What does that prove?"
          options={[
            { id: "separate", label: "The website and browser are separate layers", feedback: "Correct. The browser app can continue while one web page closes." },
            { id: "same", label: "Chrome and the website are exactly the same program", feedback: "If they were the same, the browser could not keep other tabs open." },
            { id: "hardware", label: "The website is part of the physical screen", feedback: "The screen displays pixels; it does not store the website layer." },
          ]}
          correctId="separate"
          successMessage="Right. Chrome is the application; the lesson is website content inside it."
          hint="One browser can show many different websites at once."
        />
      </section>

      <section id="failure-layer" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Debug without panic</p>
        <h2>A failure in one layer does not mean everything is broken.</h2>
        <p>Finding the smallest failing layer keeps you from replacing working parts or changing unrelated code.</p>
        <ChoiceCheckpoint
          stepId="failure-layer"
          title="Locate the likely problem"
          question="One website says 404, but other sites open and your keyboard works. Which layer is most likely affected?"
          options={[
            { id: "site", label: "That website or its requested page", feedback: "Correct. Working sites and hardware are evidence that lower layers still function." },
            { id: "keyboard", label: "The keyboard hardware", feedback: "The keyboard working is evidence against this guess." },
            { id: "entire-os", label: "The entire operating system must be destroyed", feedback: "Other apps and sites working make a total OS failure unlikely." },
          ]}
          correctId="site"
          successMessage="Exactly. Use working evidence to isolate the smallest failing layer."
          hint="Ask what still works before deciding what is broken."
        />
      </section>

      <section id="stack-transfer" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Final checkpoint</p>
        <h2>Trace a click through the stack.</h2>
        <p>Your click begins on hardware and travels upward through software layers before the website responds.</p>
        <ChoiceCheckpoint
          stepId="stack-transfer"
          title="Put the layers in order"
          question="Which path best describes clicking a button on this lesson?"
          options={[
            { id: "full-stack", label: "Mouse hardware → operating system → browser app → website", feedback: "Correct. Each layer passes useful information to the next." },
            { id: "website-first", label: "Website → mouse → Windows → browser", feedback: "The physical input happens before the website receives an event." },
            { id: "all-one", label: "There are no layers; every part is the website", feedback: "The sorter showed four different responsibilities working together." },
          ]}
          correctId="full-stack"
          successMessage="You can now name the layers and use them to reason about failures."
          hint="Start with what your hand touches, then move toward what appears in the browser tab."
        />
      </section>
    </FoundationLessonPage>
  );
}
