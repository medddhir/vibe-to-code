import {
  LESSON_CONTENT_SCHEMA_VERSION,
  type LessonContentDefinition,
} from "@/data/lesson-schema";

export const cssSelectorsColourSpacingCascadeLesson = {
  schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  lessonSlug: "css-selectors-colour-spacing-cascade",
  lessonVersion: 1,
  objective: "Read and write small reusable CSS rules, then predict how selectors, specificity, inheritance, and source order choose the applied colour or spacing value.",
  prerequisites: [
    "Can build a complete HTML document.",
    "Can choose meaningful HTML elements and classes.",
  ],
  learningOutcomes: [
    "Identify the selector and property-value declarations in a CSS rule.",
    "Use type and class selectors for focused, reusable styling.",
    "Apply colour and spacing values with valid properties and units.",
    "Predict a simple conflict using inheritance, specificity, and source order.",
  ],
  misconception: "CSS applies whichever rule looks closest on screen, and adding a later rule always overrides every earlier rule.",
  guidedSteps: [
    {
      id: "read-css-rule",
      title: "Read a CSS rule",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "Selector first, declarations inside",
          body: [
            "A CSS rule starts with a selector that identifies elements. Inside braces, each declaration pairs a property with a value.",
            "In `.card { color: navy; padding: 1rem; }`, `.card` is the selector, while `color: navy` and `padding: 1rem` are declarations.",
          ],
        },
        {
          type: "example",
          title: "A reusable rule",
          code: ".card {\n  color: navy;\n  padding: 1rem;\n  border: 1px solid steelblue;\n}",
        },
        { type: "single-answer-checkpoint", activityId: "identify-rule-parts" },
      ],
      requiredActivityIds: ["identify-rule-parts"],
    },
    {
      id: "target-with-selectors",
      title: "Target with selectors",
      eyebrow: "Build",
      blocks: [
        {
          type: "explanation",
          heading: "Choose a selector that matches the intended set",
          body: [
            "A type selector such as `p` matches every paragraph. A class selector such as `.notice` matches elements whose `class` includes `notice`.",
            "Classes make a rule reusable across several elements without giving each element a unique ID. Prefer a selector that is only as specific as the task needs.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "choose-selector" },
      ],
      requiredActivityIds: ["choose-selector"],
    },
    {
      id: "set-colour-spacing",
      title: "Set colour and spacing",
      eyebrow: "Build",
      blocks: [
        {
          type: "explanation",
          heading: "Properties describe one presentation decision",
          body: [
            "`color` sets foreground text colour and `background-color` sets the background. Always preserve readable contrast; colour must not be the only way important meaning is communicated.",
            "`padding` creates space inside an element's edge, while `margin` creates space outside. Length values often need a unit such as `px` or `rem`, except when zero is used.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "reuse-class-rules",
      title: "Reuse a class rule",
      eyebrow: "Change",
      blocks: [
        {
          type: "explanation",
          heading: "One class can style a repeated pattern",
          body: [
            "Applying the same `.card` class to several meaningful HTML elements lets one rule provide consistent colour, padding, and border choices.",
            "The class describes a reusable styling hook; it does not erase the underlying HTML meaning of an article, link, or button.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "resolve-cascade",
      title: "Resolve a simple conflict",
      eyebrow: "Verify",
      blocks: [
        {
          type: "explanation",
          heading: "Inheritance, specificity, then source order",
          body: [
            "Some properties, including `color`, normally inherit from a parent when the element has no winning declaration of its own. Other properties do not inherit by default.",
            "When competing declarations target the same property, a more specific selector can beat a less specific selector. If competing rules have equal precedence and specificity, the later declaration wins.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "resolve-style-conflict" },
      ],
      requiredActivityIds: ["resolve-style-conflict"],
    },
    {
      id: "recap-predictable-styles",
      title: "Carry predictable styling forward",
      eyebrow: "Transfer",
      blocks: [
        {
          type: "recap",
          heading: "Make small rules you can explain",
          points: [
            "Selectors choose elements; declarations pair properties with values.",
            "Type selectors are broad, while classes are reusable and more specific.",
            "Colour and spacing are separate properties with valid values and units.",
            "Inheritance supplies some parent values; specificity and source order resolve simple conflicts.",
          ],
        },
        {
          type: "transfer-challenge",
          heading: "Explain a card rule",
          prompt: "Write a `.profile-card` rule with readable text and background colours, padding, margin, and a border. Explain each declaration and predict what happens if a later type selector sets another text colour.",
          successCriteria: [
            "Uses a class selector and valid property-value declarations.",
            "Distinguishes inner padding from outer margin.",
            "Includes a border and readable colour choices without relying on colour for meaning.",
            "Explains that the class selector is more specific than a type selector in the simple conflict.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
  ],
  activities: [
    {
      type: "single-answer",
      id: "identify-rule-parts",
      title: "Identify selector and declaration",
      question: "In `.note { color: purple; }`, which statement is correct?",
      options: [
        { id: "correct-parts", label: "`.note` is the selector; `color: purple` is a declaration.", feedback: "Correct. The selector chooses elements and the declaration assigns a value to a property." },
        { id: "reversed", label: "`color` is the selector and `.note` is the value.", feedback: "`color` is a property. The class selector appears before the declaration block." },
        { id: "html-rule", label: "The whole line is an HTML element.", feedback: "This is CSS syntax. HTML elements use tags such as `<p>` or `<button>`." },
        { id: "path-query", label: "`.note` is a URL path and `purple` is a query.", feedback: "The punctuation is part of CSS selector and declaration syntax, not URL syntax." },
      ],
      correctOptionId: "correct-parts",
      successMessage: "You separated selection from the presentation decision.",
      hint: "The part before `{` chooses; the property-value pair inside declares.",
    },
    {
      type: "single-answer",
      id: "choose-selector",
      title: "Choose a reusable selector",
      question: "Three different elements should share the same notice styling, while other elements of those types should not. Which selector fits best?",
      options: [
        { id: "class-selector", label: "Add `class=\"notice\"` to those elements and use `.notice`.", feedback: "Correct. A class is a reusable styling hook for the selected set." },
        { id: "all-elements", label: "Use `*` so every element receives notice styling.", feedback: "The universal selector is far broader than the intended three elements." },
        { id: "type-only", label: "Use one type selector even though the elements have different types.", feedback: "One type selector cannot identify a mixed set without also targeting other elements of that type." },
        { id: "duplicate-id", label: "Give all three elements the same ID.", feedback: "An ID should identify one element. A class is designed for a reusable group." },
      ],
      correctOptionId: "class-selector",
      successMessage: "You chose a reusable selector with the intended scope.",
      hint: "Choose the mechanism designed to be shared by several elements.",
    },
    {
      type: "single-answer",
      id: "resolve-style-conflict",
      title: "Resolve one cascade conflict",
      question: "CSS contains `p { color: blue; }` followed by `.warning { color: red; }`. What colour applies to `<p class=\"warning\">` in this simple case?",
      options: [
        { id: "red-specific", label: "Red, because the class selector is more specific than the type selector.", feedback: "Correct. Both rules target the paragraph, and the class selector has greater specificity." },
        { id: "blue-first", label: "Blue, because the browser always keeps the first matching rule.", feedback: "The browser resolves competing declarations through the cascade; it does not always keep the first." },
        { id: "both", label: "Both colours display at the same time.", feedback: "A single `color` property needs one winning computed value for the element." },
        { id: "none", label: "Neither applies because classes cancel type selectors.", feedback: "Both selectors match. Specificity determines that the class declaration wins." },
      ],
      correctOptionId: "red-specific",
      successMessage: "You used specificity to predict the applied declaration.",
      hint: "Compare the selector weights before considering their order.",
    },
  ],
  completionRule: {
    type: "all-steps-and-required-activities",
    requiredActivityIds: ["identify-rule-parts", "choose-selector", "resolve-style-conflict"],
  },
  sources: [
    { title: "CSS syntax — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Syntax/Introduction" },
    { title: "CSS selectors — MDN", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Selectors" },
    { title: "CSS values and units — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Values_and_units" },
    { title: "Handling CSS conflicts — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts" },
  ],
  sourceVerifiedAt: "2026-08-17",
} as const satisfies LessonContentDefinition;
