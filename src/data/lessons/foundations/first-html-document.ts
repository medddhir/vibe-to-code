import {
  LESSON_CONTENT_SCHEMA_VERSION,
  type LessonContentDefinition,
} from "@/data/lesson-schema";

export const firstHtmlDocumentLesson = {
  schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  lessonSlug: "first-html-document",
  lessonVersion: 1,
  objective: "Assemble and explain a complete first HTML document containing a doctype, root element, head, title, body, heading, and paragraph.",
  prerequisites: [
    "Can create and save a plain text file with the `.html` extension.",
    "Can use browser evidence without assuming a temporary DevTools edit changed the file.",
  ],
  learningOutcomes: [
    "Explain the roles of the doctype and `<html>` root element.",
    "Separate document metadata in `<head>` from visible content in `<body>`.",
    "Use `<title>`, `<h1>`, and `<p>` for their correct beginner-level purposes.",
    "Recognize a complete, correctly nested first HTML document.",
  ],
  misconception: "Any collection of tags is a complete HTML document, and the `<title>` is the large heading shown inside the page.",
  guidedSteps: [
    {
      id: "start-doctype-root",
      title: "Start with the document frame",
      eyebrow: "Build",
      blocks: [
        {
          type: "explanation",
          heading: "Declare HTML, then open the root",
          body: [
            "`<!doctype html>` belongs at the top and tells the browser to use the modern HTML document mode. It is a declaration, not a visible page element.",
            "The `<html>` element is the root that contains the document's `<head>` and `<body>`. Closing it at the end makes the nesting easy to read.",
          ],
        },
        {
          type: "example",
          title: "The outer frame",
          code: "<!doctype html>\n<html lang=\"en\">\n  <!-- head and body go here -->\n</html>",
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "separate-head-body",
      title: "Separate head and body",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "Metadata and visible content have different homes",
          body: [
            "The `<head>` contains information about the document, including its `<title>`. That title commonly appears in the browser tab and bookmarks.",
            "The `<body>` contains the content displayed in the page, such as headings and paragraphs.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "identify-head-body" },
      ],
      requiredActivityIds: ["identify-head-body"],
    },
    {
      id: "set-document-title",
      title: "Set a useful document title",
      eyebrow: "Build",
      blocks: [
        {
          type: "explanation",
          heading: "The title identifies the document outside its body",
          body: [
            "Place one concise `<title>` inside `<head>`. It should distinguish the page when several tabs or bookmarks are open.",
            "A title does not replace the visible main heading. The page still needs an `<h1>` in its body.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "add-heading-paragraph",
      title: "Add visible structure",
      eyebrow: "Build",
      blocks: [
        {
          type: "explanation",
          heading: "Mark up meaning, not just lines",
          body: [
            "Use `<h1>` for the page's main heading and `<p>` for a paragraph. Opening and closing tags surround their content and must be nested in the body.",
            "This lesson focuses on document structure only. CSS styling and JavaScript behavior come later.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "assemble-html-document",
      title: "Assemble the complete document",
      eyebrow: "Verify",
      blocks: [
        {
          type: "example",
          title: "A complete first document",
          code: "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\">\n    <title>My first page</title>\n  </head>\n  <body>\n    <h1>Hello, web</h1>\n    <p>I built a complete HTML document.</p>\n  </body>\n</html>",
        },
        { type: "ordering-checkpoint", activityId: "order-html-structure" },
      ],
      requiredActivityIds: ["order-html-structure"],
    },
    {
      id: "recap-valid-document",
      title: "Check and transfer the structure",
      eyebrow: "Transfer",
      blocks: [
        { type: "single-answer-checkpoint", activityId: "diagnose-html-document" },
        {
          type: "recap",
          heading: "A small document still has a complete structure",
          points: [
            "The doctype selects modern HTML behavior.",
            "`<html>` wraps the head and body.",
            "`<head>` contains the tab title and other metadata; `<body>` contains visible page content.",
            "`<h1>` and `<p>` describe a main heading and paragraph.",
          ],
        },
        {
          type: "transfer-challenge",
          heading: "Draft a second valid document",
          prompt: "Write a complete `index.html` for a page called ‘My learning log’ with one visible heading and one paragraph. Explain each structural line.",
          successCriteria: [
            "Starts with `<!doctype html>` and contains one root `<html>` element.",
            "Places `<title>` inside `<head>`.",
            "Places `<h1>` and `<p>` inside `<body>`.",
            "Uses correctly nested opening and closing tags without adding CSS or JavaScript.",
          ],
        },
      ],
      requiredActivityIds: ["diagnose-html-document"],
    },
  ],
  activities: [
    {
      type: "single-answer",
      id: "identify-head-body",
      title: "Place document information",
      question: "Which placement is correct?",
      options: [
        { id: "title-head-h1-body", label: "Put `<title>` in `<head>` and the visible `<h1>` in `<body>`.", feedback: "Correct. The title identifies the document in browser UI, while the heading is visible page content." },
        { id: "all-head", label: "Put both `<title>` and `<h1>` in `<head>`.", feedback: "The visible heading belongs in `<body>`; `<head>` is for document metadata." },
        { id: "title-body", label: "Put `<title>` in `<body>` and omit `<h1>`.", feedback: "The document title belongs in `<head>`, and it does not replace the visible main heading." },
        { id: "body-head", label: "Put `<body>` inside `<head>`.", feedback: "`<head>` and `<body>` are sibling sections inside `<html>`, not nested inside one another." },
      ],
      correctOptionId: "title-head-h1-body",
      successMessage: "You separated metadata from visible content.",
      hint: "Ask what appears in the browser tab and what appears inside the page.",
    },
    {
      type: "ordering",
      id: "order-html-structure",
      title: "Order the document sections",
      prompt: "Arrange the structural stages from the top of the file to the end.",
      items: [
        { id: "close-root", label: "Close `</html>` after all document content." },
        { id: "doctype", label: "Declare `<!doctype html>`." },
        { id: "body", label: "Add `<body>` with `<h1>` and `<p>`." },
        { id: "open-root", label: "Open the `<html>` root element." },
        { id: "head", label: "Add `<head>` containing `<title>`." },
      ],
      correctOrder: ["doctype", "open-root", "head", "body", "close-root"],
      successMessage: "Correct. The declaration comes first, then the root contains head before body.",
      errorMessage: "Start with the doctype. Both head and body must be inside the opened root before `</html>` closes it.",
    },
    {
      type: "single-answer",
      id: "diagnose-html-document",
      title: "Find the structural misconception",
      question: "A file has `<title>Travel notes</title><h1>Travel notes</h1><p>Day one.</p>` and nothing else. What is the best improvement?",
      options: [
        { id: "add-document-frame", label: "Add the doctype and `<html>`, place `<title>` in `<head>`, and place `<h1>` and `<p>` in `<body>`.", feedback: "Correct. This creates a complete document and gives each piece its proper structural location." },
        { id: "add-css", label: "Add CSS first; styling makes the document complete.", feedback: "CSS changes presentation, not the missing HTML document structure." },
        { id: "remove-title", label: "Remove `<title>` because `<h1>` already does the same job.", feedback: "The tab title and visible main heading have related but distinct roles; a complete page benefits from both." },
        { id: "rename-js", label: "Rename the file to `.js` so the browser can run it.", feedback: "This is HTML structure and belongs in an `.html` document, not a JavaScript file." },
      ],
      correctOptionId: "add-document-frame",
      successMessage: "You repaired the document structure without jumping ahead to styling or scripting.",
      hint: "Check the outer declaration, root, metadata section, and visible-content section.",
    },
  ],
  completionRule: {
    type: "all-steps-and-required-activities",
    requiredActivityIds: ["identify-head-body", "order-html-structure", "diagnose-html-document"],
  },
  sources: [
    { title: "Basic HTML syntax — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax" },
    { title: "The HTML document element — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/html" },
    { title: "The document title element — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/title" },
    { title: "Headings and paragraphs — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Headings_and_paragraphs" },
  ],
  sourceVerifiedAt: "2026-08-17",
} as const satisfies LessonContentDefinition;
