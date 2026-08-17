import {
  LESSON_CONTENT_SCHEMA_VERSION,
  type LessonContentDefinition,
} from "@/data/lesson-schema";

export const meaningfulHtmlTextLinksImagesControlsLesson = {
  schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  lessonSlug: "meaningful-html-text-links-images-controls",
  lessonVersion: 1,
  objective: "Choose HTML elements for the meaning and behavior of text, links, images, buttons, labels, and basic form controls.",
  prerequisites: [
    "Can assemble a complete HTML document.",
    "Can place headings and paragraphs inside the document body.",
  ],
  learningOutcomes: [
    "Use headings and paragraphs to communicate content structure.",
    "Choose links for navigation and buttons for actions.",
    "Provide useful image alternative text when an image conveys meaning.",
    "Associate a visible label with a form control.",
  ],
  misconception: "If two elements can be made to look alike, they are interchangeable and have the same meaning or accessibility behavior.",
  guidedSteps: [
    {
      id: "choose-semantic-text",
      title: "Choose elements by meaning",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "HTML communicates structure",
          body: [
            "A heading introduces a section; a paragraph holds prose. Their default appearance can be changed later, but their meaning should already match the content.",
            "Use heading levels to describe the document's hierarchy rather than choosing a level only because its default text size looks convenient.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "choose-semantic-element" },
      ],
      requiredActivityIds: ["choose-semantic-element"],
    },
    {
      id: "make-real-link",
      title: "Use links for destinations",
      eyebrow: "Build",
      blocks: [
        {
          type: "explanation",
          heading: "A link takes the visitor somewhere",
          body: [
            "An `<a>` element with an `href` creates a link to another page, file, email address, or location. Its text should describe the destination more clearly than ‘click here’.",
            "Use a button when the visitor triggers an action on the current interface. Visual styling does not change this distinction.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "describe-image",
      title: "Give images a text alternative",
      eyebrow: "Build",
      blocks: [
        {
          type: "explanation",
          heading: "Alternative text carries purpose",
          body: [
            "An `<img>` uses `src` for the image resource and `alt` for a text alternative. When the image conveys information, the alternative should communicate the relevant purpose or content.",
            "A purely decorative image commonly uses an empty `alt` value so assistive technology can ignore it. Do not put essential meaning only inside pixels.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "choose-button-or-link",
      title: "Choose button or link",
      eyebrow: "Verify",
      blocks: [
        {
          type: "explanation",
          heading: "Destination versus action",
          body: ["Choose the native element whose behavior matches the visitor's goal before adding appearance."],
        },
        { type: "single-answer-checkpoint", activityId: "match-control-purpose" },
      ],
      requiredActivityIds: ["match-control-purpose"],
    },
    {
      id: "label-form-control",
      title: "Label a form control",
      eyebrow: "Build",
      blocks: [
        {
          type: "explanation",
          heading: "A visible label names the expected input",
          body: [
            "A `<label>` can be associated with an `<input>` by matching the label's `for` value to the input's `id`. The visible label helps everyone understand what to enter.",
            "The association also lets many users activate or focus the control by selecting its label. A placeholder is not a reliable replacement for a persistent label.",
          ],
        },
        {
          type: "example",
          title: "A labelled email control",
          code: "<label for=\"email\">Email address</label>\n<input id=\"email\" name=\"email\" type=\"email\">",
        },
        { type: "single-answer-checkpoint", activityId: "order-labeled-control" },
      ],
      requiredActivityIds: ["order-labeled-control"],
    },
    {
      id: "recap-semantic-page",
      title: "Carry meaning into every element",
      eyebrow: "Transfer",
      blocks: [
        {
          type: "recap",
          heading: "Meaning comes before appearance",
          points: [
            "Headings and paragraphs describe text structure.",
            "Links navigate; buttons trigger actions.",
            "Image alternative text communicates relevant meaning when pixels cannot be perceived.",
            "Visible labels identify controls and should be programmatically associated with them.",
          ],
        },
        {
          type: "transfer-challenge",
          heading: "Plan an accessible profile card",
          prompt: "Write the HTML outline for a profile card containing a heading, paragraph, meaningful image, profile link, follow button, and labelled email control.",
          successCriteria: [
            "Uses heading and paragraph elements for text structure.",
            "Uses a link for the profile destination and a button for the follow action.",
            "Provides purposeful image alternative text.",
            "Associates the visible email label and input with matching `for` and `id` values.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
  ],
  activities: [
    {
      type: "single-answer",
      id: "choose-semantic-element",
      title: "Choose text structure",
      question: "A page has a main title followed by two sentences of explanation. Which markup best communicates that structure?",
      options: [
        { id: "heading-paragraph", label: "An `<h1>` for the title and a `<p>` for the explanation.", feedback: "Correct. The elements express a main heading followed by prose." },
        { id: "two-buttons", label: "Two `<button>` elements because their text can be styled.", feedback: "Buttons represent actions, so using them for static title and prose gives the content the wrong behavior and meaning." },
        { id: "image-text", label: "Put all text into one image.", feedback: "Text embedded only in an image is less adaptable and can hide essential meaning from people who cannot perceive the image." },
        { id: "empty-divs", label: "Use empty `<div>` elements and rely on colour alone.", feedback: "Empty containers do not communicate the title or explanation, and colour alone does not provide text structure." },
      ],
      correctOptionId: "heading-paragraph",
      successMessage: "You chose elements that describe the content instead of merely changing appearance.",
      hint: "Ask what kind of content each piece is: a heading, prose, destination, or action.",
    },
    {
      type: "single-answer",
      id: "match-control-purpose",
      title: "Match control to purpose",
      question: "Which pair uses native semantics correctly?",
      options: [
        { id: "link-button-correct", label: "Use a link for ‘Read the guide’ and a button for ‘Save changes’.", feedback: "Correct. Reading the guide navigates to a destination; saving triggers an interface action." },
        { id: "button-navigation", label: "Use a button for every navigation destination because buttons can be clicked.", feedback: "Clickability alone is not enough. Links expose navigation semantics and expected browser behavior." },
        { id: "link-action", label: "Use a link with no destination for ‘Save changes’.", feedback: "Saving is an action. A link without a real destination does not provide the correct native behavior." },
        { id: "styled-div", label: "Use a styled `<div>` for both and ignore keyboard behavior.", feedback: "A generic div does not automatically provide link or button semantics, focus, and keyboard activation." },
      ],
      correctOptionId: "link-button-correct",
      successMessage: "You matched destination and action to their native elements.",
      hint: "A link goes somewhere; a button does something.",
    },
    {
      type: "single-answer",
      id: "order-labeled-control",
      title: "Associate a visible label",
      question: "Which markup creates a visible label that is programmatically associated with the email input?",
      options: [
        { id: "matching-for-id", label: "`<label for=\"email\">Email</label><input id=\"email\" type=\"email\">`", feedback: "Correct. The label's `for` value matches the input's `id`; choosing the wording or input type first is not what creates the association." },
        { id: "different-values", label: "`<label for=\"contact\">Email</label><input id=\"email\" type=\"email\">`", feedback: "The visible wording is useful, but `contact` does not match `email`, so this label is not associated with that input." },
        { id: "placeholder-only", label: "`<input id=\"email\" type=\"email\" placeholder=\"Email\">`", feedback: "A placeholder can disappear as someone types and does not replace a persistent, programmatically associated label." },
        { id: "name-only", label: "`<label>Email</label><input name=\"email\" type=\"email\">`", feedback: "Placing separate elements next to each other does not associate them here; use matching `for` and `id` values or nest the control inside the label." },
      ],
      correctOptionId: "matching-for-id",
      successMessage: "You identified the matching `for` and `id` association without imposing an unnecessary authoring order.",
      hint: "Compare the label's `for` value with the input's `id`.",
    },
  ],
  completionRule: {
    type: "all-steps-and-required-activities",
    requiredActivityIds: ["choose-semantic-element", "match-control-purpose", "order-labeled-control"],
  },
  sources: [
    { title: "Headings and paragraphs — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Headings_and_paragraphs" },
    { title: "Creating links — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links" },
    { title: "Images in HTML — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/HTML_images" },
    { title: "HTML forms and buttons — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Basic_native_form_controls" },
    { title: "The label element — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label" },
  ],
  sourceVerifiedAt: "2026-08-17",
} as const satisfies LessonContentDefinition;
