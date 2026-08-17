import {
  LESSON_CONTENT_SCHEMA_VERSION,
  type LessonContentDefinition,
} from "@/data/lesson-schema";

export const requestsResponsesHttpHttpsLesson = {
  schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  lessonSlug: "requests-responses-http-https",
  lessonVersion: 1,
  objective: "Explain a browser request and server response, distinguish beginner-level GET and POST purposes, read status-code families, and state what HTTPS protects in transit.",
  prerequisites: [
    "Can trace a browser-to-server journey.",
    "Can identify the hostname and path in a URL.",
  ],
  learningOutcomes: [
    "Describe HTTP as a client-server request-and-response protocol.",
    "Distinguish GET for retrieving a representation from POST for submitting data for processing.",
    "Use status-code families to classify an outcome without treating every failure alike.",
    "Explain that HTTPS protects HTTP communication in transit and does not guarantee that a site is trustworthy.",
  ],
  misconception: "Every page load is one identical message, every error means the server is broken, and a padlock proves the site itself is honest.",
  guidedSteps: [
    {
      id: "name-client-server-message",
      title: "Name the two messages",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "The client asks; the server answers",
          body: [
            "HTTP is a protocol for exchanging messages between a client and a server. A browser commonly acts as the client.",
            "The message sent by the client is a request. The server's answer is a response. A page can require several request-response exchanges for HTML, images, styles, and other resources.",
          ],
        },
        { type: "ordering-checkpoint", activityId: "order-request-response" },
      ],
      requiredActivityIds: ["order-request-response"],
    },
    {
      id: "distinguish-get-post",
      title: "Distinguish GET and POST",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "Methods describe the request's purpose",
          body: [
            "GET requests a representation of a resource and should retrieve data without asking for a state change.",
            "POST submits data to a resource, often asking the server to process it and possibly change state. This is a beginner-level purpose distinction, not a promise about how every application is designed.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "classify-request-method" },
      ],
      requiredActivityIds: ["classify-request-method"],
    },
    {
      id: "read-status-families",
      title: "Read status families",
      eyebrow: "Inspect",
      blocks: [
        {
          type: "explanation",
          heading: "The first digit gives a useful category",
          body: [
            "HTTP response status codes are grouped into five families: 1xx informational, 2xx successful, 3xx redirection, 4xx client-side request problems, and 5xx server-side problems.",
            "For example, 200 is a success, 404 means the requested resource was not found, and 500 means the server encountered an error. The exact code provides more detail than the family alone.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "interpret-status-family" },
      ],
      requiredActivityIds: ["interpret-status-family"],
    },
    {
      id: "compare-http-https",
      title: "Compare HTTP and HTTPS",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "HTTPS protects the connection",
          body: [
            "HTTPS is HTTP carried over a connection protected by TLS. It encrypts data in transit and helps the browser authenticate the server named by the certificate.",
            "HTTPS does not prove that every claim on a site is true or that downloading an unknown file is safe. It protects the communication channel, not every decision made by the site's owner or visitor.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "diagnose-response-evidence",
      title: "Diagnose from response evidence",
      eyebrow: "Verify",
      blocks: [
        {
          type: "explanation",
          heading: "Classify before guessing",
          body: [
            "Start with the method, URL, and response status. A 404 and a 500 are different evidence, even if both pages look disappointing.",
            "Do not conclude that a code file is wrong until the request and response evidence supports that claim.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "recap-http-journey",
      title: "Carry the HTTP model forward",
      eyebrow: "Transfer",
      blocks: [
        {
          type: "recap",
          heading: "Read the exchange in order",
          points: [
            "The client sends a request and the server returns a response.",
            "GET retrieves; POST submits data for processing.",
            "Status families separate information, success, redirection, client-request problems, and server problems.",
            "HTTPS protects HTTP data in transit but is not a general trust badge.",
          ],
        },
        {
          type: "transfer-challenge",
          heading: "Explain one form submission",
          prompt: "Describe a simple newsletter form journey from button press to visible confirmation using request, method, response, status family, and HTTPS.",
          successCriteria: [
            "Names the browser as client and the destination as server.",
            "Uses POST for submitted form data and does not claim every POST must succeed.",
            "Uses a 2xx response as successful evidence and distinguishes 4xx from 5xx.",
            "States that HTTPS protects the messages while travelling.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
  ],
  activities: [
    {
      type: "ordering",
      id: "order-request-response",
      title: "Order one HTTP exchange",
      prompt: "Arrange one simplified exchange from action to result.",
      items: [
        { id: "browser-uses-response", label: "The browser uses the response to update what the visitor sees." },
        { id: "server-responds", label: "The server returns an HTTP response with a status and optional body." },
        { id: "browser-requests", label: "The browser sends an HTTP request for a resource." },
        { id: "server-handles", label: "The server receives and handles the request." },
      ],
      correctOrder: ["browser-requests", "server-handles", "server-responds", "browser-uses-response"],
      successMessage: "Correct. A response follows a handled request, and the browser can then use the result.",
      errorMessage: "The server cannot respond before receiving the request, and the browser cannot use a response before the server sends it.",
    },
    {
      type: "single-answer",
      id: "classify-request-method",
      title: "Choose GET or POST",
      question: "Which pairing best matches the beginner-level purpose of GET and POST?",
      options: [
        { id: "get-read-post-submit", label: "GET retrieves a page; POST submits completed form data for processing.", feedback: "Correct. GET is for retrieval, while POST submits data to be processed and may cause a change." },
        { id: "get-delete-post-read", label: "GET deletes a resource; POST only reads it.", feedback: "This reverses the core purposes. GET should retrieve, while POST submits data for processing." },
        { id: "same-method", label: "GET and POST are two spellings for an identical request.", feedback: "Methods carry different semantics, so servers and tools can distinguish retrieval from submission." },
        { id: "status-method", label: "GET means success; POST means failure.", feedback: "GET and POST are request methods, not response outcomes. Status codes describe outcomes." },
      ],
      correctOptionId: "get-read-post-submit",
      successMessage: "You matched the methods to retrieval and submission.",
      hint: "Ask whether the client is retrieving a representation or submitting data for processing.",
    },
    {
      type: "single-answer",
      id: "interpret-status-family",
      title: "Interpret the response family",
      question: "A request returns status 503. What is the strongest beginner-level conclusion?",
      options: [
        { id: "server-family", label: "It is a 5xx server-error response; inspect server availability before blaming the visitor's typing.", feedback: "Correct. 503 belongs to the server-error family and commonly reports temporary unavailability." },
        { id: "success-family", label: "It is a 2xx success because the last digit is 3.", feedback: "Status families use the first digit. A code beginning with 5 is a server-error response." },
        { id: "not-found", label: "It always means the path was typed incorrectly.", feedback: "A missing resource is commonly 404 in the 4xx family. 503 instead reports server-side unavailability." },
        { id: "https-proof", label: "It proves HTTPS encryption failed.", feedback: "The status describes the HTTP response outcome, not whether the TLS-protected connection itself failed." },
      ],
      correctOptionId: "server-family",
      successMessage: "You used the first digit to identify the response family.",
      hint: "Group the response by its first digit before interpreting the exact code.",
    },
  ],
  completionRule: {
    type: "all-steps-and-required-activities",
    requiredActivityIds: ["order-request-response", "classify-request-method", "interpret-status-family"],
  },
  sources: [
    { title: "Overview of HTTP — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview" },
    { title: "HTTP request methods — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods" },
    { title: "HTTP response status codes — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status" },
    { title: "Transport Layer Security — MDN Security", url: "https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Transport_Layer_Security" },
  ],
  sourceVerifiedAt: "2026-08-17",
} as const satisfies LessonContentDefinition;
