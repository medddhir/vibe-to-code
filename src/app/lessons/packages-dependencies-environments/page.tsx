import type { Metadata } from "next";

import { ChoiceCheckpoint, type ChoiceCheckpointOption } from "@/components/choice-checkpoint";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import { type GuidedLessonStep } from "@/components/guided-lesson-flow";
import { PackageDependencyLab } from "@/components/foundations/package-dependency-lab";
import {
  getFoundationsLessonNumber,
  FOUNDATION_TOTAL_LESSONS,
} from "@/data/foundations-level1";

const lessonSlug = "packages-dependencies-environments";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 6;

const starterManifest = {
  react: "18.1.0",
  "react-dom": "18.1.0",
  "date-fns": "2.29.1",
};

const starterLock = JSON.stringify(
  {
    name: "learning-lab",
    version: "1.0.0",
    lockfileVersion: 3,
    packages: {
      react: "18.1.0",
      "react-dom": "18.1.0",
      "date-fns": "2.29.1",
    },
  },
  null,
  2,
);

const localEnvironment = {
  react: "18.1.0",
  "react-dom": "18.1.0",
  "date-fns": "2.29.1",
};

const productionEnvironment = {
  react: "18.2.0",
  "react-dom": "18.2.0",
  "date-fns": "2.29.1",
};

const lessonSteps: GuidedLessonStep[] = [
  {
    id: "project-snapshot",
    title: "Read the project tree",
    eyebrow: "Concept",
    requiresPractice: true,
  },
  {
    id: "install-react",
    title: "Add one package via strict terminal",
    eyebrow: "Practice",
    requiresPractice: true,
  },
  {
    id: "compare-env",
    title: "Compare environment alignment",
    eyebrow: "Debug",
    requiresPractice: true,
  },
  {
    id: "lock-mission",
    title: "Understand why lockfiles matter",
    eyebrow: "Concept",
    requiresPractice: true,
  },
  {
    id: "security-verification",
    title: "Protect against fake package names",
    eyebrow: "Safety",
    requiresPractice: true,
  },
  {
    id: "package-mission",
    title: "Mission: pinned install",
    eyebrow: "Finish",
    requiresPractice: true,
  },
  {
    id: "lesson-recap",
    title: "Lesson recap",
    eyebrow: "Finish",
  },
];

const fileRoleChoices: ChoiceCheckpointOption[] = [
  {
    id: "package-json",
    label: "package.json lists direct dependencies and semantic versions.",
    feedback: "Correct. It is the manifest for your project intent.",
  },
  {
    id: "lockfile",
    label: "package-lock.json is optional and never needed to run the same result twice.",
    feedback: "Lockfiles keep exact dependency trees stable. They are important for reproducibility.",
  },
];

const compareChoices: ChoiceCheckpointOption[] = [
  {
    id: "env-diff",
    label: "Local and production mismatch can cause one app to build here and fail there.",
    feedback: "Correct. Environment alignment is one of the most common source-of-truth bugs.",
  },
  {
    id: "env-same",
    label: "If local works, production always matches.",
    feedback: "Different environments can diverge in package resolution and behavior.",
  },
];

const lockChoices: ChoiceCheckpointOption[] = [
  {
    id: "locks",
    label: "A lockfile freezes the resolved tree, making installs deterministic.",
    feedback: "Exactly. It makes 'works for me' less likely to become 'does not work for you'.",
  },
  {
    id: "source-only",
    label: "A lockfile has no value if package.json already exists.",
    feedback: "It still matters for reproducibility and team consistency.",
  },
];

const securityChoices: ChoiceCheckpointOption[] = [
  {
    id: "typed",
    label: "Install only packages from the simulator catalog so versions are controlled.",
    feedback: "Correct. Unknown names are rejected for safety in this lesson.",
  },
  {
    id: "random",
    label: "Any package name is okay if it looks realistic.",
    feedback: "In this simulator it is intentionally blocked to teach safe package discipline.",
  },
];

export const metadata: Metadata = {
  title: "Lesson 6: Packages, dependencies, versions, and environments",
  description:
    "Learn why package manifests and lockfiles matter by running a controlled dependency and environment simulator.",
};

export default function PackagesDependenciesEnvironmentsLesson() {
  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="Packages, dependencies, versions, and environments"
      levelTitle="Level 1"
      totalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={14}
      steps={lessonSteps}
    >
      <section id="project-snapshot" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Open the project snapshot</p>
        <h2>Read the dependency workspace before changing it.</h2>
        <ChoiceCheckpoint
          stepId="project-snapshot"
          title="Choose the manifest role"
          question="Why is package-lock.json usually stored with package.json?"
          options={fileRoleChoices}
          correctId="package-json"
          successMessage="Great. You identified the two key package files in dependency management."
          hint="One file is declarative intent; the other is resolved reality."
        />
      </section>

      <section id="install-react" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Terminal simulation</p>
        <h2>Run one strict install command.</h2>
        <PackageDependencyLab
          stepId="install-react"
          title="Install a pinned package"
          instructions="Use the strict simulator command to install the required React version."
          starterManifest={starterManifest}
          starterLock={starterLock}
          mode="install"
          expectedPackageName="react"
          expectedPackageVersion="18.2.0"
          localEnvironment={localEnvironment}
          productionEnvironment={productionEnvironment}
          starterCommand="npm install react@18.2.0"
          hint="Use only catalog names and exact versions: `npm install react@18.2.0`."
          successMessage="Great. Command accepted, dependency resolved, and lock metadata updated."
        />
      </section>

      <section id="compare-env" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Environment reality check</p>
        <h2>Compare local and production package sets.</h2>
        <ChoiceCheckpoint
          stepId="compare-env"
          title="Why compare environments?"
          question="Why can local success and production failure happen together?"
          options={compareChoices}
          correctId="env-diff"
          successMessage="Correct. Alignment is a real engineering concern, not a theory."
          hint="Different environments can silently run different resolved versions."
        />
      </section>

      <section id="lock-mission" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Reproducibility mission</p>
        <h2>Explain lockfile value in one sentence.</h2>
        <ChoiceCheckpoint
          stepId="lock-mission"
          title="When a teammate clones this project"
          question="Which statement is most accurate?"
          options={lockChoices}
          correctId="locks"
          successMessage="Exactly. Lockfile consistency makes installs predictable."
          hint="A lockfile saves explicit resolved versions and transitive structure."
        />
      </section>

      <section id="security-verification" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Safety checkpoint</p>
        <h2>Challenge: protect yourself from invented package names.</h2>
        <PackageDependencyLab
          stepId="security-verification"
          title="Unknown package should fail"
          instructions="Run a suspicious package name and confirm the simulator rejects it."
          starterManifest={starterManifest}
          starterLock={starterLock}
          mode="reject-unknown"
          expectedFailureMessage="Unknown package name."
          localEnvironment={localEnvironment}
          productionEnvironment={productionEnvironment}
          starterCommand="npm install fakepkg@0.0.1"
          hint="Type a name not in the safe catalog and keep the format strict."
          successMessage="Great. Safe simulator blocked unknown package names."
        />
        <ChoiceCheckpoint
          stepId="security-verification"
          title="Choose a safety rule"
          question="What is the safest habit in this lab?"
          options={securityChoices}
          correctId="typed"
          successMessage="Correct. Safe package choices and predictable versions avoid hidden risk."
          hint="Treat names and versions as inputs that affect runtime behavior and security."
        />
      </section>

      <section id="package-mission" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Final transfer mission</p>
        <h2>Install one more real package with precise versioning.</h2>
        <PackageDependencyLab
          stepId="package-mission"
          title="Pinned install challenge"
          instructions="Complete with a valid command and keep the version exact."
          starterManifest={starterManifest}
          starterLock={starterLock}
          mode="install"
          expectedPackageName="zod"
          expectedPackageVersion="3.24.0"
          localEnvironment={localEnvironment}
          productionEnvironment={productionEnvironment}
          starterCommand="npm install zod@3.24.0"
          hint="Use one command and one valid version from the catalog."
          successMessage="Excellent. This completed the lesson through exact dependency intent and lock update."
        />
      </section>

      <section id="lesson-recap" className="lesson-section guided-topic mission-topic">
        <div className="mission-capabilities">
          <p className="eyebrow">Lesson recap</p>
          <h2>Transfer this in your words.</h2>
          <p>
            Packages are more than names: they are versioned decisions. Lockfiles and environment comparisons keep a
            shared codebase stable.
          </p>
        </div>
      </section>
    </FoundationLessonPage>
  );
}
