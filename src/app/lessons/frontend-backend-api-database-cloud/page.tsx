import type { Metadata } from "next";

import { ChoiceCheckpoint, type ChoiceCheckpointOption } from "@/components/choice-checkpoint";
import { FoundationLessonPage } from "@/components/foundations/foundation-lesson-page";
import { type GuidedLessonStep } from "@/components/guided-lesson-flow";
import { FrontendJourneyLab } from "@/components/foundations/frontend-journey-lab";
import {
  getFoundationsLessonNumber,
  FOUNDATION_TOTAL_LESSONS,
  getFoundationsCourseLessonNumber,
  FOUNDATION_LEVEL1_TOTAL_LESSONS,
} from "@/data/foundations-level1";

const lessonSlug = "frontend-backend-api-database-cloud";
const lessonNumber = getFoundationsLessonNumber(lessonSlug) ?? 7;
const courseLessonNumber = getFoundationsCourseLessonNumber(lessonSlug) ?? 7;

const lessonSteps: GuidedLessonStep[] = [
  {
    id: "journey-concept",
    title: "Trace one click to one line",
    eyebrow: "Concept",
    requiresPractice: true,
  },
  {
    id: "frontend-journey-success",
    title: "Send a successful request",
    eyebrow: "Practice",
    requiresPractice: true,
  },
  {
    id: "backend-validation",
    title: "Diagnose invalid input",
    eyebrow: "Debug",
    requiresPractice: true,
    requiredActivityIds: ["backend-validation-simulator", "backend-validation-check"],
  },
  {
    id: "secret-placement",
    title: "Protect secrets",
    eyebrow: "Safety",
    requiresPractice: true,
    requiredActivityIds: ["secret-placement-simulator", "secret-placement-check"],
  },
  {
    id: "journey-repair",
    title: "Repair request and get status 200",
    eyebrow: "Practice",
    requiresPractice: true,
  },
  {
    id: "journey-mission",
    title: "Final app journey transfer challenge",
    eyebrow: "Finish",
    requiresPractice: true,
  },
  {
    id: "lesson-recap",
    title: "Lesson recap",
    eyebrow: "Finish",
  },
];

const conceptChoices: ChoiceCheckpointOption[] = [
  {
    id: "correct-flow",
    label: "Frontend builds payload -> backend validates -> DB writes -> response updates screen state.",
    feedback: "Correct. This is the full request-response journey in one page view.",
  },
  {
    id: "frontend-only",
    label: "Frontend can update the user balance with JavaScript only.",
    feedback: "In this model, persistence and validation are backend responsibilities.",
  },
  {
    id: "database-only",
    label: "Database writes happen before frontend builds any payload.",
    feedback: "Frontend must send a request before backend routes and DB operations can run.",
  },
];

const validationChoices: ChoiceCheckpointOption[] = [
  {
    id: "user-id-first",
    label: "Backend checks schema-like fields first, then validation rule, then response.",
    feedback: "Yes. The journey is deterministic: request → validation → DB and response.",
  },
  {
    id: "ui-first",
    label: "The frontend screen shows an answer before backend validation.",
    feedback: "Screens should render the response after backend success.",
  },
  {
    id: "db-first",
    label: "DB actions happen before validation.",
    feedback: "Invalid payload should be blocked before database mutation.",
  },
];

const secretChoice: ChoiceCheckpointOption[] = [
  {
    id: "secret-in-env",
    label: "Keep secrets outside frontend payload, in server-side environment config.",
    feedback: "Correct. Frontend payload is visible to the browser, so do not place secrets there.",
  },
  {
    id: "secret-in-json",
    label: "Include secret fields in each API request payload for convenience.",
    feedback: "This exposes secrets to the user and browser tools.",
  },
  {
    id: "secret-in-code",
    label: "Save secrets in frontend JavaScript files for quick testing.",
    feedback: "Frontend code is not a secret vault and can be read from browsers.",
  },
];

const repairPayload = `{"userId":"a","amount":50}`;

export const metadata: Metadata = {
  title: `Level 1 · Lesson ${lessonNumber} of ${FOUNDATION_LEVEL1_TOTAL_LESSONS}: Frontend, backend, API, database, and cloud`,
  description:
    "Follow a browser click through request preparation, API validation, DB read/write and UI state update.",
};

export default function FrontendBackendApiDatabaseCloudLesson() {
  return (
    <FoundationLessonPage
      lessonSlug={lessonSlug}
      lessonNumber={lessonNumber}
      lessonTitle="Frontend, backend, API, database, and cloud"
      levelTitle="Level 1"
      totalLessons={FOUNDATION_LEVEL1_TOTAL_LESSONS}
      courseLessonNumber={courseLessonNumber}
      courseTotalLessons={FOUNDATION_TOTAL_LESSONS}
      estimatedMinutes={16}
      steps={lessonSteps}
    >
      <section id="journey-concept" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Predict before you run</p>
        <h2>Trace the journey one click at a time.</h2>
        <p>
          A browser button builds an event payload, sends it to an endpoint, a backend validates it,
          the database updates, and the screen reads the returned state.
        </p>

        <ChoiceCheckpoint
          stepId="journey-concept"
          title="Choose the full journey order"
          question="Which statement is the best high-level sequence?"
          options={conceptChoices}
          correctId="correct-flow"
          successMessage="Great. You can now explain this chain in your own words."
          hint="Front-end, API route, DB, then a response that updates visible state."
        />
      </section>

      <section id="frontend-journey-success" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Happy path simulation</p>
        <h2>Run one successful request and read the trace.</h2>
        <FrontendJourneyLab
          stepId="frontend-journey-success"
          title="Frontend journey starter"
          instructions="Start with a valid payload and run one simulated button click."
          starterPayload={`{"userId":"Maya","amount":10}`}
          expectedGoal={{
            minUserIdLength: 2,
            requireAmountNumber: true,
          }}
          hint="Use a real userId and amount number to keep backend and database checks passing."
          successMessage="Nice. You can now trace screen, backend, and database behavior from one click."
        />
      </section>

      <section id="backend-validation" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Broken journey checkpoint</p>
        <h2>Debug an intentionally invalid request.</h2>
        <p>Start with a short user id and fix it so the simulator returns success.</p>

        <FrontendJourneyLab
          stepId="backend-validation-simulator"
          title="Repair request validation"
          instructions="Run with an invalid payload, fix what the backend flagged, then get a 200 response."
          starterPayload={repairPayload}
          expectedGoal={{
            minUserIdLength: 3,
            requiredAmount: 50,
            requireAmountNumber: true,
          }}
          hint="Keep userId at least three characters long and keep amount numeric."
          successMessage="Great repair. Validation now passes, and the journey returns status 200."
        />

        <ChoiceCheckpoint
          stepId="backend-validation-check"
          title="Validation checkpoint"
          question="Which validation occurs before DB write in this simulator?"
          options={validationChoices}
          correctId="user-id-first"
          successMessage="Correct. Validation runs in backend before mutation."
          hint="This is why short or invalid values should return 422 before DB write."
        />
      </section>

      <section id="secret-placement" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Safety checkpoint</p>
        <h2>Find the safer payload shape for secrets.</h2>
        <FrontendJourneyLab
          stepId="secret-placement-simulator"
          title="Keep secrets out of payload"
          instructions="Run with a payload that includes secret-like text and then move it out."
          starterPayload={`{"userId":"Maya","amount":12,"api_key":"sk_live_example"}`}
          expectedGoal={{
            disallowSecretFields: true,
            requireAmountNumber: true,
            minUserIdLength: 2,
          }}
          hint="Do not send secret strings from frontend. Use a clean payload with only userId and amount."
          successMessage="Perfect. Secret-like fields are removed from client payload before sending."
        />

        <ChoiceCheckpoint
          stepId="secret-placement-check"
          title="Choose a safe secret strategy"
          question="Which is the safest approach in this model?"
          options={secretChoice}
          correctId="secret-in-env"
          successMessage="Correct. Keep sensitive config on the server side."
          hint="Frontend payload is visible in browser tools and logs."
        />
      </section>

      <section id="journey-repair" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Trace repair mission</p>
        <h2>Match a broken chain and prove the result.</h2>
        <FrontendJourneyLab
          stepId="journey-repair"
          title="Repair route and inspect status"
          instructions="Break and then fix request fields so status becomes 200 with clean output."
          starterPayload={`{"userId":"","amount":"10"}`}
          expectedGoal={{
            exactUserId: "Ari",
            requiredAmount: 30,
            requireAmountNumber: true,
          }}
          hint="Ensure userId is text and amount is a number. 200 happens after both checks pass."
          successMessage="Great. The same simulator now runs full frontend->backend->DB update in one shot."
        />
      </section>

      <section id="journey-mission" className="lesson-section guided-topic mission-topic">
        <p className="eyebrow">Final transfer challenge</p>
        <h2>Produce one target balance outcome in one click.</h2>
        <p>
          Start from mock balance 100. Send a request so the new balance is exactly 165.
          Then explain the traced route in your answer above.
        </p>

        <FrontendJourneyLab
          stepId="journey-mission"
          title="Final challenge"
          instructions="Use one clean payload to make final balance exactly 165."
          starterPayload={`{"userId":"Sam","amount":20}`}
          expectedGoal={{
            exactUserId: "Sam",
            requireAmountNumber: true,
            expectedBalance: 165,
          }}
          hint="Balance starts from 100. Ask for amount 65 to reach 165."
          successMessage="Excellent. You completed the full full-stack learning mission."
        />
      </section>

      <section id="lesson-recap" className="lesson-section guided-topic mission-topic">
        <div className="mission-capabilities">
          <p className="eyebrow">Lesson recap</p>
          <h2>One sentence in your own words.</h2>
          <p>
            A click is not magic: the frontend sends payload, the API validates and runs rules,
            database state changes, and returned response updates visible UI.
          </p>
        </div>
      </section>
    </FoundationLessonPage>
  );
}
