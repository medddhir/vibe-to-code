import {
  LESSON_CONTENT_SCHEMA_VERSION,
  type LessonContentDefinition,
} from "@/data/lesson-schema";

export const boxModelLayoutResponsiveDesignLesson = {
  schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  lessonSlug: "box-model-layout-responsive-design",
  lessonVersion: 1,
  objective: "Explain the four box-model layers and choose simple normal-flow, flex, grid, width-constraint, and breakpoint decisions that let content adapt to available space.",
  prerequisites: [
    "Can read CSS selectors and declarations.",
    "Can apply colour, padding, margin, and a border with valid values.",
  ],
  learningOutcomes: [
    "Order content, padding, border, and margin from inside to outside.",
    "Explain why normal flow is a safe starting layout.",
    "Choose flexbox for one-dimensional arrangement and grid for row-and-column arrangement at a conceptual level.",
    "Use flexible width constraints and content-driven breakpoints to describe responsive adaptation.",
  ],
  misconception: "Responsive design means shrinking a fixed desktop page, and absolute positioning is the normal tool for every layout.",
  guidedSteps: [
    {
      id: "see-four-box-layers",
      title: "See the four box layers",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "Every visible element participates in a box model",
          body: [
            "The content area holds text or media. Padding surrounds the content inside the edge, the border surrounds the padding, and margin creates space outside the border.",
            "These layers answer different spacing questions. Increasing margin does not create more room between content and its border; padding does.",
          ],
        },
        { type: "ordering-checkpoint", activityId: "order-box-layers" },
      ],
      requiredActivityIds: ["order-box-layers"],
    },
    {
      id: "keep-normal-flow",
      title: "Start in normal flow",
      eyebrow: "Understand",
      blocks: [
        {
          type: "explanation",
          heading: "The browser already has a layout",
          body: [
            "In normal flow, block content generally follows document order and takes available inline space, while inline content flows within lines.",
            "Keeping meaningful document order and normal flow provides a resilient baseline. Positioning everything with fixed coordinates can cause overlap and reading-order problems when content or screen size changes.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "choose-flex-or-grid",
      title: "Choose a layout tool",
      eyebrow: "Build",
      blocks: [
        {
          type: "explanation",
          heading: "Flex and grid solve different shapes",
          body: [
            "Flexbox is designed for arranging items primarily in one dimension: a row or a column. Items can grow, shrink, and wrap when configured to do so.",
            "Grid is designed for rows and columns together. At this stage, choose by layout shape rather than memorizing every property.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "choose-layout-tool" },
      ],
      requiredActivityIds: ["choose-layout-tool"],
    },
    {
      id: "constrain-width",
      title: "Constrain without freezing",
      eyebrow: "Build",
      blocks: [
        {
          type: "explanation",
          heading: "Let content fit smaller spaces",
          body: [
            "A container can use `width: 100%` so it fits available space and `max-width` so it stops becoming uncomfortably wide. `margin-inline: auto` can center a constrained block.",
            "The default `content-box` sizing applies the declared width to content only, then adds left and right padding outside it. With `width: 100%`, that extra padding can overflow the parent. `box-sizing: border-box` includes padding and border inside the declared width.",
            "Padding protects content from touching the viewport edge. Images and long text also need rules that allow them to fit rather than overflow.",
          ],
        },
        {
          type: "example",
          title: "A flexible constrained container",
          code: ".page {\n  box-sizing: border-box;\n  width: 100%;\n  max-width: 70rem;\n  margin-inline: auto;\n  padding: 1rem;\n}",
        },
      ],
      requiredActivityIds: [],
    },
    {
      id: "add-responsive-breakpoint",
      title: "Adapt when content needs it",
      eyebrow: "Verify",
      blocks: [
        {
          type: "explanation",
          heading: "A breakpoint responds to layout evidence",
          body: [
            "Responsive design uses flexible layouts and media queries to adapt when available space changes. A breakpoint should be introduced where the content starts to look cramped or unreadable, not for a guessed list of device brands.",
            "For example, cards can stack in one column by default and switch to a wider multi-column arrangement when enough space is available.",
          ],
        },
        { type: "single-answer-checkpoint", activityId: "predict-responsive-change" },
      ],
      requiredActivityIds: ["predict-responsive-change"],
    },
    {
      id: "recap-adaptive-layout",
      title: "Carry an adaptive layout model forward",
      eyebrow: "Transfer",
      blocks: [
        {
          type: "recap",
          heading: "Build from content outward",
          points: [
            "Content, padding, border, and margin form the box from inside to outside.",
            "Normal flow preserves a useful baseline and document order.",
            "Flexbox handles a row or column; grid handles rows and columns conceptually.",
            "Flexible constraints and content-driven breakpoints let layouts adapt instead of merely shrink.",
          ],
        },
        {
          type: "transfer-challenge",
          heading: "Plan a responsive card list",
          prompt: "Describe a mobile-first card list that is one column in narrow space, stays readable on wide screens, and becomes two columns only when the cards have enough room.",
          successCriteria: [
            "Keeps cards in meaningful source order and normal flow.",
            "Uses padding inside cards and margin or gap between cards for distinct purposes.",
            "Uses a width constraint rather than a fixed desktop width.",
            "Adds a breakpoint based on cramped content and chooses flex or grid with a reason.",
          ],
        },
      ],
      requiredActivityIds: [],
    },
  ],
  activities: [
    {
      type: "ordering",
      id: "order-box-layers",
      title: "Order the box model",
      prompt: "Arrange the layers from the innermost area to the outermost space.",
      items: [
        { id: "margin", label: "Margin: space outside the border." },
        { id: "content", label: "Content: text or media inside the box." },
        { id: "border", label: "Border: the edge surrounding the padding." },
        { id: "padding", label: "Padding: space around content inside the border." },
      ],
      correctOrder: ["content", "padding", "border", "margin"],
      successMessage: "Correct. Content sits inside padding, border, and finally outer margin.",
      errorMessage: "Begin at the content itself. Padding is inside the border, while margin is outside the border.",
    },
    {
      type: "single-answer",
      id: "choose-layout-tool",
      title: "Choose by layout shape",
      question: "A navigation list should arrange items in one row and wrap when space becomes narrow. Which conceptual choice fits best?",
      options: [
        { id: "flex-row", label: "Flexbox, because the main arrangement is one-dimensional and can wrap.", feedback: "Correct. A primary row or column is the shape flexbox is designed to manage." },
        { id: "absolute", label: "Absolute positioning with a fixed coordinate for every link.", feedback: "Fixed coordinates remove items from normal flow and make changing text or space more likely to overlap." },
        { id: "grid-required", label: "Grid is mandatory for every layout containing more than one item.", feedback: "Grid is powerful for rows and columns, but a primarily one-dimensional list is a natural flexbox case." },
        { id: "image-layout", label: "Turn the complete navigation into one image.", feedback: "An image would remove native link behavior and flexible text adaptation rather than solving layout." },
      ],
      correctOptionId: "flex-row",
      successMessage: "You matched the one-dimensional layout to flexbox.",
      hint: "Ask whether the main problem is one axis or rows and columns together.",
    },
    {
      type: "single-answer",
      id: "predict-responsive-change",
      title: "Choose a responsive repair",
      question: "Two fixed-width cards overflow a narrow screen. What is the strongest beginner-friendly repair?",
      options: [
        { id: "flexible-stack", label: "Use flexible card widths, stack by default, and add columns only when the content has enough space.", feedback: "Correct. This preserves readable content and adapts the layout to available space." },
        { id: "smaller-text", label: "Keep the fixed widths and shrink all text until it fits.", feedback: "Shrinking text harms readability and leaves the rigid layout problem unchanged." },
        { id: "hide-overflow", label: "Hide the overflowing content.", feedback: "Clipping hides information rather than adapting the boxes to the available space." },
        { id: "more-absolute", label: "Absolutely position both cards at desktop coordinates.", feedback: "Fixed coordinates are even less able to adapt when the viewport or content changes." },
      ],
      correctOptionId: "flexible-stack",
      successMessage: "You chose adaptation over shrinking or clipping content.",
      hint: "Prefer a layout that works in narrow space before adding a wider arrangement.",
    },
  ],
  completionRule: {
    type: "all-steps-and-required-activities",
    requiredActivityIds: ["order-box-layers", "choose-layout-tool", "predict-responsive-change"],
  },
  sources: [
    { title: "The CSS box model — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model" },
    { title: "box-sizing — MDN CSS Reference", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/box-sizing" },
    { title: "Normal flow — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Introduction#normal_layout_flow" },
    { title: "Flexbox — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox" },
    { title: "CSS grid layout — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids" },
    { title: "Responsive web design — MDN Learn", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design" },
  ],
  sourceVerifiedAt: "2026-08-17",
} as const satisfies LessonContentDefinition;
