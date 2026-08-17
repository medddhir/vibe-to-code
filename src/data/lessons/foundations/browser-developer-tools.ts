import {
  LESSON_CONTENT_SCHEMA_VERSION,
  type LessonContentDefinition,
} from "@/data/lesson-schema";

export const browserDeveloperToolsLesson = {
  schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  lessonSlug: "browser-developer-tools",
  lessonVersion: 1,
  objective: "Use the Elements, Console, and Network panels as separate evidence sources and choose the panel that can answer a specific debugging question.",
  prerequisites: [
    "Can describe an HTTP request and response.",
    "Can distinguish a page's visible result from its source files.",
  ],
  learningOutcomes: [
    "Use Elements to inspect the browser's current document structure and applied styles.",
    "Use Console messages as JavaScript and browser evidence without assuming every message has one cause.",
    "Use Network records to inspect requests, responses, and status evidence.",
    "Follow an evidence-first debugging sequence instead of making random changes.",
  ],
  misconception: "A temporary DevTools edit changes the project's real source file, and every problem should be solved by trying random code in the Console.",
  guidedSteps: [
    {
      id: "open-devtools-safely",
      title: "Treat DevTools as an evidence workspace",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "Inspect before changing",
          body: [
            "Browser developer tools show what the browser received, interpreted, and attempted. They help answer focused questions about the current page.",
            "DevTools can also change the current page temporarily. Unless a dedicated workspace is configured, those experiments do not edit the project's saved source files and usually disappear after refresh.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "interpret-devtools-change" },
      ],
      requiredActivityIds: ["interpret-devtools-change"],
    },
    {
      id: "inspect-elements",
      title: "Inspect structure in Elements",
      eyebrow: "Inspect",
      blocks: [
        {
          type: "explanation",
          heading: "Elements shows the current document",
          body: [
            "The Elements panel presents the browser's current DOM tree and the styles affecting a selected element. It is useful for checking whether an element exists, how it is nested, and which CSS declarations apply.",
            "The displayed DOM can differ from the original HTML source after the browser repairs markup or JavaScript changes the page. Record that as evidence rather than assuming the source file already matches it.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "read-console-evidence",
      title: "Read Console evidence",
      eyebrow: "Inspect",
      blocks: [
        {
          type: "explanation",
          heading: "Messages point to where investigation can begin",
          body: [
            "The Console displays messages from the browser and page, including errors, warnings, and logged values. Read the message, source location, and timing before deciding on a cause.",
            "This lesson does not use the Console to execute arbitrary JavaScript. The safe skill is interpreting evidence already shown there.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "inspect-network-evidence",
      title: "Inspect Network evidence",
      eyebrow: "Inspect",
      blocks: [
        {
          type: "explanation",
          heading: "Network shows exchanges made by the page",
          body: [
            "The Network panel records requests while it is open. A record can show a request URL, method, response status, timing, headers, and available response details.",
            "Reloading with Network open can reveal whether a missing image was requested and whether its response was successful, redirected, missing, or failed for another reason.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "match-panel-evidence" },
      ],
      requiredActivityIds: ["match-panel-evidence"],
    },
    {
      id: "choose-debugging-panel",
      title: "Follow an evidence-first sequence",
      eyebrow: "Verify",
      blocks: [
        {
          type: "explanation",
          heading: "Question, observe, narrow, then change",
          body: [
            "State one observable problem, choose the panel that can test it, record the evidence, and narrow the likely layer. Make one justified change only after that.",
            "Random changes destroy useful comparisons. A repeatable sequence makes it possible to explain why a fix worked.",
          ],
        },
        { type: "ordering-checkpoint", activityId: "order-debugging-evidence" },
      ],
      requiredActivityIds: ["order-debugging-evidence"],
    },
    {
      id: "recap-evidence-workflow",
      title: "Carry the evidence workflow forward",
      eyebrow: "Transfer",
      blocks: [
        {
          type: "recap",
          heading: "Each panel answers different questions",
          points: [
            "Elements provides current DOM and applied-style evidence.",
            "Console provides browser and JavaScript messages.",
            "Network provides request-and-response evidence.",
            "Temporary inspection changes are experiments, not proof that source files changed.",
          ],
        },
        {
          type: "transfer-challenge",
          heading: "Write a three-panel investigation",
          prompt: "A page heading is visible, its colour is wrong, and an icon is missing. Write one question for Elements, Console, and Network, and state what evidence would answer each question.",
          successCriteria: [
            "Uses Elements for DOM or applied CSS evidence.",
            "Uses Console for relevant messages rather than random execution.",
            "Uses Network for the icon request and response status.",
            "Proposes one justified source change only after evidence is gathered.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
  ],
  activities: [
    {
      type: "single-answer",
      id: "interpret-devtools-change",
      title: "Interpret a temporary edit",
      question: "You change a heading in Elements, refresh, and the old heading returns. What does that show?",
      options: [
        { id: "temporary-dom", label: "The current DOM changed temporarily; the saved source still produced the old heading on reload.", feedback: "Correct. The refreshed page was rebuilt from its actual sources, replacing the temporary inspection edit." },
        { id: "server-broken", label: "The server is broken because it rejected an HTML save.", feedback: "Elements did not save the project source, so the refresh is not evidence that a server rejected a save." },
        { id: "browser-cache-only", label: "Every DevTools change is permanently stored only in the browser cache.", feedback: "A normal Elements edit changes the current document; it is not automatically persisted as a cache or source edit." },
        { id: "html-invalid", label: "The heading must be invalid HTML.", feedback: "The reset follows from the temporary nature of the edit, not from evidence that the heading markup is invalid." },
      ],
      correctOptionId: "temporary-dom",
      successMessage: "You separated a current-page experiment from a saved-source change.",
      hint: "Ask what the browser rebuilds when the page reloads.",
    },
    {
      type: "single-answer",
      id: "match-panel-evidence",
      title: "Choose the strongest panel",
      question: "An image placeholder is visible. You need to know whether the image URL returned 404. Which panel owns that evidence?",
      options: [
        { id: "network", label: "Network, because it records the image request and response status.", feedback: "Correct. Network evidence can show the requested URL and its 404 response." },
        { id: "elements-only", label: "Elements only, because seeing an `<img>` proves the request succeeded.", feedback: "Elements can show that an image element exists, but existence does not prove its request returned successfully." },
        { id: "console-random", label: "Console, by trying unrelated commands until the image appears.", feedback: "Random commands do not establish the request status. The Network record directly answers the question." },
        { id: "styles", label: "Styles, because every missing image is caused by CSS.", feedback: "CSS can affect visibility, but a suspected 404 is request-response evidence found in Network." },
      ],
      correctOptionId: "network",
      successMessage: "You matched the HTTP-status question to Network evidence.",
      hint: "Choose the panel that records requests and responses.",
    },
    {
      type: "ordering",
      id: "order-debugging-evidence",
      title: "Order an evidence-first investigation",
      prompt: "Arrange the debugging stages into a repeatable sequence.",
      items: [
        { id: "make-change", label: "Make one justified source change and repeat the observation." },
        { id: "record-evidence", label: "Record what the chosen panel actually shows." },
        { id: "state-problem", label: "State one observable problem as a focused question." },
        { id: "choose-panel", label: "Choose the panel capable of answering that question." },
        { id: "narrow-cause", label: "Use the evidence to narrow the likely layer or cause." },
      ],
      correctOrder: ["state-problem", "choose-panel", "record-evidence", "narrow-cause", "make-change"],
      successMessage: "Correct. You gathered evidence before changing the source and kept the experiment testable.",
      errorMessage: "Begin with a focused question. A source change belongs after the relevant panel has supplied evidence and narrowed the cause.",
    },
  ],
  completionRule: {
    type: "all-steps-and-required-activities",
    requiredActivityIds: ["interpret-devtools-change", "match-panel-evidence", "order-debugging-evidence"],
  },
  sources: [
    { title: "Chrome DevTools overview — Chrome for Developers", url: "https://developer.chrome.com/docs/devtools" },
    { title: "Inspect and edit the DOM — Chrome DevTools", url: "https://developer.chrome.com/docs/devtools/dom" },
    { title: "Console overview — Chrome DevTools", url: "https://developer.chrome.com/docs/devtools/console" },
    { title: "Inspect network activity — Chrome DevTools", url: "https://developer.chrome.com/docs/devtools/network" },
  ],
  sourceVerifiedAt: "2026-08-17",
} as const satisfies LessonContentDefinition;
