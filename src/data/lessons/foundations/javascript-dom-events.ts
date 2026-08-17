import {
  LESSON_CONTENT_SCHEMA_VERSION,
  type LessonContentDefinition,
} from "@/data/lesson-schema";

export const javascriptDomEventsLesson = {
  schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  lessonSlug: "javascript-dom-events",
  lessonVersion: 1,
  objective: "Trace a deterministic button-click interaction from DOM selection through event handling and state change to a visible text update.",
  prerequisites: [
    "Can build meaningful HTML with a button and visible text.",
    "Can read small code examples without executing arbitrary input.",
  ],
  learningOutcomes: [
    "Describe the DOM as the browser's in-memory representation of the document.",
    "Select one element and recognize that a missing match must be handled deliberately.",
    "Explain that an event listener connects a user event to a handler.",
    "Trace state and visible content through two deterministic button clicks.",
  ],
  misconception: "JavaScript directly edits the saved HTML file whenever a button is clicked, and event handlers run continuously even when no event occurs.",
  guidedSteps: [
    {
      id: "meet-dom",
      title: "Meet the DOM",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "The browser represents the document as objects",
          body: [
            "After parsing HTML, the browser creates a tree-like Document Object Model, or DOM. JavaScript can read and update these objects while the page is open.",
            "Changing a DOM node changes the current page representation. It does not automatically rewrite the saved HTML source file.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "select-element",
      title: "Select the intended element",
      eyebrow: "Build",
      blocks: [
        {
          type: "explanation",
          heading: "A selector connects code to markup",
          body: [
            "`document.querySelector()` returns the first element matching a CSS selector, or `null` if no element matches. The selector must agree with the HTML.",
            "A missing match is evidence to check the selector and document timing, not a reason to keep changing unrelated code.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "choose-dom-operation" },
      ],
      requiredActivityIds: ["choose-dom-operation"],
    },
    {
      id: "listen-for-click",
      title: "Listen for a click",
      eyebrow: "Build",
      blocks: [
        {
          type: "explanation",
          heading: "An event listener waits for a named event",
          body: [
            "`addEventListener('click', handler)` registers a handler for click events on the selected element. The handler runs when that event occurs; it is not continuously rerunning.",
            "A native button can be activated by pointer, touch, and keyboard, so it provides a better interaction foundation than a generic element pretending to be a button.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "update-state",
      title: "Update one state value",
      eyebrow: "Change",
      blocks: [
        {
          type: "explanation",
          heading: "State remembers the current count",
          body: [
            "A variable such as `count` can hold the current value. The click handler can calculate the next state with `count = count + 1`.",
            "Keeping the state change explicit makes it possible to predict the result after zero, one, or two clicks.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "render-visible-result",
      title: "Show the new state",
      eyebrow: "Verify",
      blocks: [
        {
          type: "explanation",
          heading: "Update visible text after state changes",
          body: [
            "Assigning a string to an element's `textContent` replaces its text with the value you provide. The handler can update state first and then render `Count: 1`, `Count: 2`, and so on.",
            "The following checkpoint simulates the data flow deterministically. It does not execute user-entered JavaScript.",
          ],
        },
        { type: "ordering-checkpoint", activityId: "simulate-counter-clicks" },
      ],
      requiredActivityIds: ["simulate-counter-clicks"],
    },
    {
      id: "recap-click-to-screen",
      title: "Explain click to screen",
      eyebrow: "Transfer",
      blocks: [
        { type: "ordering-checkpoint", activityId: "order-dom-interaction" },
        {
          type: "recap",
          heading: "One interaction has a traceable chain",
          points: [
            "The DOM is the browser's current document representation.",
            "A selector finds the intended element, while a missing match returns no element.",
            "An event listener connects a click to a handler.",
            "The handler updates state and then visible DOM content.",
          ],
        },
        {
          type: "transfer-challenge",
          heading: "Design a safe status toggle",
          prompt: "Without executing code, describe a button that changes visible text from ‘Not started’ to ‘Started’. Trace selection, listener, state, and `textContent` update.",
          successCriteria: [
            "Uses a native button and identifies a separate status element.",
            "Selects both elements with selectors that match the described HTML.",
            "Registers a click handler rather than running the update immediately.",
            "Changes state before showing the corresponding text and does not claim the source file was rewritten.",
          ],
        },
      ],
      requiredActivityIds: ["order-dom-interaction"],
    },
  ],
  activities: [
    {
      type: "single-answer",
      id: "choose-dom-operation",
      title: "Choose the DOM operation",
      question: "The HTML contains `<button id=\"increment\">Add one</button>`. Which operation is meant to find that element?",
      options: [
        { id: "query-selector", label: "`document.querySelector('#increment')`", feedback: "Correct. The `#increment` CSS selector matches the element whose ID is `increment`." },
        { id: "change-source", label: "Rewrite the saved HTML file on every click.", feedback: "A page interaction updates the current DOM; it does not require rewriting the source file." },
        { id: "fetch-button", label: "Send a network request just to discover the button already in the document.", feedback: "The button is already represented in the DOM, so document selection—not a network request—finds it." },
        { id: "select-class", label: "`document.querySelector('.increment')` even though the element has no such class.", feedback: "A class selector only matches a corresponding class. The shown HTML supplies an ID instead." },
      ],
      correctOptionId: "query-selector",
      successMessage: "You matched the selector to the element's ID.",
      hint: "An ID selector begins with `#`.",
    },
    {
      type: "ordering",
      id: "simulate-counter-clicks",
      title: "Simulate two clicks",
      prompt: "Arrange the deterministic state and screen sequence from page start through two button clicks.",
      items: [
        { id: "second-render", label: "Render `Count: 2` in the output element." },
        { id: "initial", label: "Start with state `count = 0` and visible text `Count: 0`." },
        { id: "first-state", label: "The first click handler changes state to `count = 1`." },
        { id: "second-state", label: "The second click handler changes state to `count = 2`." },
        { id: "first-render", label: "Render `Count: 1` in the output element." },
      ],
      correctOrder: ["initial", "first-state", "first-render", "second-state", "second-render"],
      successMessage: "Correct. Each click changes state once, then the visible text reflects that new state.",
      errorMessage: "Begin at zero. For each click, update state before rendering that same value; the second click cannot happen before the first result.",
    },
    {
      type: "ordering",
      id: "order-dom-interaction",
      title: "Order click to screen",
      prompt: "Arrange the general interaction from setup to visible result.",
      items: [
        { id: "render", label: "Update the selected output element's text content." },
        { id: "select", label: "Select the button and output elements from the DOM." },
        { id: "event", label: "The visitor activates the button and a click event occurs." },
        { id: "register", label: "Register the click handler on the button." },
        { id: "state", label: "The handler calculates and stores the next state." },
      ],
      correctOrder: ["select", "register", "event", "state", "render"],
      successMessage: "Correct. Setup precedes the event; the handler updates state before showing the result.",
      errorMessage: "Select and register during setup. Only then can a click invoke the handler, update state, and render the new text.",
    },
  ],
  completionRule: {
    type: "all-steps-and-required-activities",
    requiredActivityIds: ["choose-dom-operation", "simulate-counter-clicks", "order-dom-interaction"],
  },
  sources: [
    { title: "Document Object Model (DOM) — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model" },
    { title: "Document.querySelector() — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector" },
    { title: "EventTarget.addEventListener() — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener" },
    { title: "Node.textContent — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent" },
    { title: "The button element — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button" },
  ],
  sourceVerifiedAt: "2026-08-17",
} as const satisfies LessonContentDefinition;
