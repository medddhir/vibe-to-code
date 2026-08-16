import {
  LESSON_CONTENT_SCHEMA_VERSION,
  type LessonContentDefinition,
} from "@/data/lesson-schema";

export const internetWebBrowserServerLesson = {
  schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  lessonSlug: "internet-web-browser-server",
  lessonVersion: 1,
  objective:
    "Distinguish the Internet, the Web, a browser/client, a search engine, and a web server, then trace one deliberately simplified browser-to-server-and-back journey.",
  prerequisites: [
    "Completed Developer Foundations Level 1.",
    "Can distinguish a visible interface from the systems behind it.",
    "Can follow and rearrange a short ordered process.",
  ],
  learningOutcomes: [
    "Explain that the Internet is the underlying network while the Web is one service using it.",
    "Identify a browser as client software, a search engine as a Web service, and a web server as the responding role.",
    "Arrange a simplified request-and-response journey correctly.",
    "Use the layered model to interpret a basic connection problem without treating every failure as identical.",
  ],
  misconception:
    "Chrome, Google Search, the Internet, the Web, and a server are interchangeable names for the same thing.",
  guidedSteps: [
    {
      id: "separate-internet-and-web",
      title: "Separate the layers",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "The Internet and the Web are different layers",
          body: [
            "The Internet is a worldwide network of connected networks that carries data.",
            "The Web is one service using the Internet to make linked pages and resources available.",
            "A lost Internet connection prevents normal Web access, but that does not make the Internet and Web identical.",
          ],
        },
        {
          type: "callout",
          tone: "note",
          heading: "The Web is one Internet service",
          body: "Email and other services can also use the Internet. The Web is an important use of the Internet, not another name for all of it.",
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "name-browser-search-and-server",
      title: "Name the actors",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "Browser, search engine, and server have different jobs",
          body: [
            "A browser such as Chrome, Firefox, Safari, Edge, or Opera retrieves and displays Web resources. In this journey it acts as the client.",
            "A search engine such as Google Search or DuckDuckGo is a Web service that helps find pages. It is used through a browser; it is not the browser.",
            "A web server can mean server software, its computer, or both together. It receives requests and returns Web resources.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "classify-web-roles" },
      ],
      requiredActivityIds: ["classify-web-roles"],
    },
    {
      id: "trace-page-journey",
      title: "Trace one page journey",
      eyebrow: "Inspect",
      blocks: [
        {
          type: "explanation",
          heading: "Follow the request out and the response back",
          body: [
            "The browser asks for a Web resource.",
            "The Internet carries the request toward a server.",
            "The server prepares a response.",
            "The Internet carries the response back.",
            "The browser uses the result to display the page.",
          ],
        },
        {
          type: "example",
          title: "A deliberately simplified page journey",
          code: "Browser ── request ──> Internet ──> Server\nBrowser <─ response ─ Internet <── Server",
        },
        {
          type: "explanation",
          heading: "The same journey in words",
          body: [
            "First, the browser sends a request. The Internet carries it to a server. The server prepares a response, the Internet carries that response back, and the browser displays the returned result.",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          heading: "This is a zoomed-out model",
          body: "This model is intentionally zoomed out. It does not yet explain how an address identifies the server, what protocol formats the messages, or why a response succeeds or fails. Those are covered in the next lessons.",
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "rebuild-page-journey",
      title: "Rebuild the journey",
      eyebrow: "Change",
      blocks: [
        {
          type: "explanation",
          heading: "Put cause before effect",
          body: ["Arrange the stages into causal order."],
        },
        { type: "ordering-checkpoint", activityId: "order-page-journey" },
      ],
      requiredActivityIds: ["order-page-journey"],
    },
    {
      id: "diagnose-connection-layer",
      title: "Diagnose the layer",
      eyebrow: "Verify",
      blocks: [
        {
          type: "explanation",
          heading: "Use the evidence you actually have",
          body: [
            "A browser opening successfully proves only that the browser software can run.",
            "A local browser page working does not prove the device can reach the Internet.",
            "Use the available evidence to choose the most likely layer without claiming more certainty than the evidence supports.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "identify-missing-layer" },
      ],
      requiredActivityIds: ["identify-missing-layer"],
    },
    {
      id: "explain-complete-model",
      title: "Explain the complete model",
      eyebrow: "Verify",
      blocks: [
        {
          type: "recap",
          heading: "Keep each layer in its own role",
          points: [
            "The Internet carries data between networks.",
            "The Web provides linked pages and resources over that network.",
            "A browser is client software, not the Internet or a search engine.",
            "A server receives a request and returns a response.",
          ],
        },
        {
          type: "transfer-challenge",
          heading: "Explain it without a tool",
          prompt: "Without opening DevTools or searching, say or write what likely happened after you opened `vibe-to-code.tech`. Include one arrow chain and one sentence.",
          successCriteria: [
            "Starts with the browser/client.",
            "Shows a request travelling over the Internet to a server.",
            "Shows a response returning to the browser.",
            "Ends with the browser displaying the result.",
            "States that the Web uses the Internet rather than calling them synonyms.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
  ],
  activities: [
    {
      type: "single-answer",
      id: "classify-web-roles",
      title: "Separate the four roles",
      question: "Which statement correctly separates the four roles?",
      options: [
        {
          id: "browser-search-service",
          label: "Chrome is browser software; Google Search is a search engine on the Web; both rely on the Internet to reach Web resources.",
          feedback: "Correct. The browser is client software, the search engine is a Web service, and Internet connectivity carries their communication.",
        },
        {
          id: "chrome-is-internet",
          label: "Chrome is the Internet, while Google Search is the Web.",
          feedback: "Chrome is browser software, not the Internet. Google Search is one service on the Web, not the whole Web.",
        },
        {
          id: "search-is-browser",
          label: "Google Search is a browser, while Chrome is a server.",
          feedback: "Google Search is a Web service used through a browser. Chrome acts as the client in this journey, not the server.",
        },
        {
          id: "same-names",
          label: "The Internet and the Web are two names for the same system.",
          feedback: "The Internet is the underlying network; the Web is one service that uses it.",
        },
      ],
      correctOptionId: "browser-search-service",
      successMessage: "You separated the browser, search service, Web, and Internet roles.",
      hint: "Ask which thing is installed software, which helps find pages, and which carries communication.",
    },
    {
      type: "ordering",
      id: "order-page-journey",
      title: "Put the page journey in order",
      prompt: "Move the stages until the request travels out and the response returns.",
      items: [
        { id: "server-prepares", label: "The server receives the request and prepares a response." },
        { id: "browser-displays", label: "The browser uses the returned result to display the page." },
        { id: "browser-requests", label: "The browser asks for a Web resource." },
        { id: "internet-carries-request", label: "The Internet carries the request toward the server." },
        { id: "internet-carries-response", label: "The Internet carries the response back." },
      ],
      correctOrder: [
        "browser-requests",
        "internet-carries-request",
        "server-prepares",
        "internet-carries-response",
        "browser-displays",
      ],
      successMessage: "Correct. You followed the browser request outward and the server response back.",
      errorMessage: "Begin with the requester: the browser must ask before the server can respond. Then follow the message outward and back.",
    },
    {
      type: "single-answer",
      id: "identify-missing-layer",
      title: "Choose the strongest supported conclusion",
      question: "Chrome opens and can show its Settings page, but the device reports ‘No internet connection’ and no websites load in any browser. What is the strongest conclusion?",
      options: [
        {
          id: "internet-unavailable",
          label: "The browser is running, but the device’s Internet connection is unavailable.",
          feedback: "Correct. Local browser software works, while the evidence points to unavailable Internet connectivity.",
        },
        {
          id: "web-erased",
          label: "The Web has been erased from Chrome.",
          feedback: "The Web is not stored inside Chrome. The browser needs network connectivity to retrieve remote Web resources.",
        },
        {
          id: "chrome-is-server",
          label: "Chrome is the server and has stopped serving pages.",
          feedback: "Chrome is acting as client software here. Opening its local Settings page does not make it a web server.",
        },
        {
          id: "all-servers-failed",
          label: "Every website’s server must have failed simultaneously.",
          feedback: "The shared evidence is the device’s missing Internet connection; it does not justify claiming that every server failed.",
        },
      ],
      correctOptionId: "internet-unavailable",
      successMessage: "You used local and network evidence without treating every failure as the same.",
      hint: "Separate what works locally on the device from what requires communication with another machine.",
    },
  ],
  completionRule: {
    type: "all-steps-and-required-activities",
    requiredActivityIds: [
      "classify-web-roles",
      "order-page-journey",
      "identify-missing-layer",
    ],
  },
  sources: [
    { title: "Internet — MDN Glossary", url: "https://developer.mozilla.org/en-US/docs/Glossary/Internet" },
    { title: "World Wide Web — MDN Glossary", url: "https://developer.mozilla.org/en-US/docs/Glossary/World_Wide_Web" },
    { title: "Browser — MDN Glossary", url: "https://developer.mozilla.org/en-US/docs/Glossary/Browser" },
    { title: "What is a web server? — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server" },
    { title: "How the web works — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works" },
  ],
  sourceVerifiedAt: "2026-08-16",
} as const satisfies LessonContentDefinition;
