import {
  LESSON_CONTENT_SCHEMA_VERSION,
  type LessonContentDefinition,
} from "@/data/lesson-schema";

export const urlsDomainsDnsPathsQueriesLesson = {
  schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  lessonSlug: "urls-domains-dns-paths-queries",
  lessonVersion: 1,
  objective: "Read a complete URL part by part and explain, at a beginner level, how DNS helps a browser find the address associated with a hostname.",
  prerequisites: [
    "Can distinguish the Internet, Web, browser, and server.",
    "Can follow a short sequence from browser to server.",
  ],
  learningOutcomes: [
    "Identify a URL's scheme, hostname, optional port, path, query, and fragment.",
    "Explain why a domain name is only one part of a complete URL.",
    "Describe DNS conceptually as resolving a hostname to an address used to reach a server.",
    "Predict which URL part changes when a page, option, or in-page location changes.",
  ],
  misconception: "A domain name and a complete URL are interchangeable, and every character after the domain names another server.",
  guidedSteps: [
    {
      id: "read-complete-url",
      title: "Read one complete URL",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "A URL identifies a resource",
          body: [
            "A URL is an address for a resource. Its parts tell the browser how to connect, which host to contact, and which resource or location is wanted.",
            "In `https://learn.example.org:443/guides/web?mode=beginner#dns`, `https` is the scheme, `learn.example.org` is the hostname, `443` is an explicit port, `/guides/web` is the path, `mode=beginner` is the query, and `dns` is the fragment.",
          ],
        },
        {
          type: "example",
          title: "A labelled URL",
          code: "https://learn.example.org:443/guides/web?mode=beginner#dns\n|scheme| |--- hostname ---|port|-- path --|--- query ---|fragment|",
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "separate-host-and-dns",
      title: "Separate the hostname from DNS",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "People use names; networks use addresses",
          body: [
            "The hostname is the name in the URL, such as `learn.example.org`. A domain can contain labels separated by dots; the hostname identifies the host the browser wants to reach.",
            "DNS is the naming system that resolves that hostname to an address. This is a conceptual lookup: DNS does not choose the page path, send a form, or decide an HTTP status code.",
          ],
        },
        { type: "ordering-checkpoint", activityId: "order-name-resolution" },
      ],
      requiredActivityIds: ["order-name-resolution"],
    },
    {
      id: "follow-path",
      title: "Follow the path",
      eyebrow: "Inspect",
      blocks: [
        {
          type: "explanation",
          heading: "The path narrows the requested location",
          body: [
            "After the hostname and optional port, the path identifies a location or resource within that site. `/guides/web` and `/guides/css` can point to different resources on the same host.",
            "A port is optional in a written URL. When present, it follows the hostname after a colon and identifies the network service endpoint; common schemes usually have a default port when none is written.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "identify-url-parts" },
      ],
      requiredActivityIds: ["identify-url-parts"],
    },
    {
      id: "decode-query-fragment",
      title: "Decode query and fragment",
      eyebrow: "Inspect",
      blocks: [
        {
          type: "explanation",
          heading: "Query and fragment add different detail",
          body: [
            "A query begins with `?` and commonly supplies key-value information such as `?mode=beginner&theme=dark`. Its meaning is defined by the site.",
            "A fragment begins with `#` and points to a location within the resource, such as a heading. The browser handles normal fragment navigation without sending the fragment as part of an HTTP request.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "label-url-parts",
      title: "Predict the changing part",
      eyebrow: "Verify",
      blocks: [
        {
          type: "explanation",
          heading: "Change only what the task requires",
          body: ["Use the purpose of each component to identify the smallest relevant change."],
        },
        { type: "single-answer-checkpoint", activityId: "choose-url-change" },
      ],
      requiredActivityIds: ["choose-url-change"],
    },
    {
      id: "recap-url-model",
      title: "Carry the URL model forward",
      eyebrow: "Transfer",
      blocks: [
        {
          type: "recap",
          heading: "One address, several jobs",
          points: [
            "The scheme describes how the resource is accessed.",
            "The hostname names the host, and DNS resolves that name to an address.",
            "An optional port identifies a service endpoint; the path identifies a resource location.",
            "The query supplies site-defined options, while the fragment identifies an in-resource location.",
          ],
        },
        {
          type: "transfer-challenge",
          heading: "Label an unfamiliar URL",
          prompt: "Write a safe example URL for a recipe page with a `servings=4` query and an `ingredients` fragment, then label every component you used.",
          successCriteria: [
            "Uses an HTTPS scheme and a clearly fictional example domain.",
            "Places the page location in the path.",
            "Places `servings=4` after `?` and `ingredients` after `#`.",
            "Explains that DNS resolves the hostname, not the whole URL.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
  ],
  activities: [
    {
      type: "ordering",
      id: "order-name-resolution",
      title: "Trace a conceptual DNS lookup",
      prompt: "Put the beginner-level name-resolution stages in order.",
      items: [
        { id: "use-address", label: "The browser can use the returned address to reach the host." },
        { id: "read-hostname", label: "The browser reads the hostname from the URL." },
        { id: "resolve-name", label: "DNS resolution looks up an address for that hostname." },
      ],
      correctOrder: ["read-hostname", "resolve-name", "use-address"],
      successMessage: "Correct. The hostname is read, resolved to an address, and then used to reach the host.",
      errorMessage: "DNS cannot resolve a name before the browser identifies the hostname, and the address cannot be used before resolution returns it.",
    },
    {
      type: "single-answer",
      id: "identify-url-parts",
      title: "Identify hostname and path",
      question: "In `https://docs.example.org:8443/start/install?os=linux#step-2`, which pair is the hostname and path?",
      options: [
        { id: "host-path-correct", label: "`docs.example.org` and `/start/install`", feedback: "Correct. The hostname follows the scheme; the path begins after the optional `:8443` port." },
        { id: "scheme-host", label: "`https` and `docs.example.org`", feedback: "`https` is the scheme, so this pair does not identify the hostname and path." },
        { id: "port-query", label: "`8443` and `os=linux`", feedback: "`8443` is the explicit port and `os=linux` is the query, not the hostname and path." },
        { id: "full-host", label: "`docs.example.org:8443/start/install` and `step-2`", feedback: "This combines hostname, port, and path; `step-2` is the fragment." },
      ],
      correctOptionId: "host-path-correct",
      successMessage: "You separated the host name from the resource path.",
      hint: "Start after `://`; stop the hostname before the port colon, then find the slash-led path.",
    },
    {
      type: "single-answer",
      id: "choose-url-change",
      title: "Choose the smallest URL change",
      question: "You want the same page and options, but you want the browser to jump from `#overview` to the `#examples` heading. What should change?",
      options: [
        { id: "fragment-only", label: "Change only the fragment to `#examples`.", feedback: "Correct. The fragment identifies a location within the same resource." },
        { id: "hostname", label: "Replace the hostname.", feedback: "The hostname identifies the host. Changing it may contact a different site, which is much larger than an in-page jump." },
        { id: "dns", label: "Edit the DNS address in the URL.", feedback: "A normal URL contains the hostname, not a DNS lookup result that must be edited for in-page navigation." },
        { id: "query", label: "Replace the query with `?examples`.", feedback: "A query supplies site-defined options. The `#` fragment is the component for an in-resource location." },
      ],
      correctOptionId: "fragment-only",
      successMessage: "You changed the component that owns in-page location.",
      hint: "Look for the component introduced by `#`.",
    },
  ],
  completionRule: {
    type: "all-steps-and-required-activities",
    requiredActivityIds: ["order-name-resolution", "identify-url-parts", "choose-url-change"],
  },
  sources: [
    { title: "What is a URL? — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL" },
    { title: "URL — MDN Web API Reference", url: "https://developer.mozilla.org/en-US/docs/Web/API/URL" },
    { title: "Domain name — MDN Glossary", url: "https://developer.mozilla.org/en-US/docs/Glossary/Domain_name" },
    { title: "DNS — MDN Glossary", url: "https://developer.mozilla.org/en-US/docs/Glossary/DNS" },
  ],
  sourceVerifiedAt: "2026-08-17",
} as const satisfies LessonContentDefinition;
