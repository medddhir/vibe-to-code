# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are complete beginners and founders who use AI to build software but do not yet understand the code, tools, or systems the AI produces. They need a guided path that removes jargon, prevents random tutorial hopping, and lets them practise safely in the browser.

## Product Purpose

Vibe to Code teaches people to understand, change, debug, verify, and safely ship code. Success means a learner can explain what their code does, make a deliberate change, inspect the result, and continue through a clear curriculum without guessing what to do next.

## Positioning

The product starts from the reality of AI-assisted building and turns generated code into a structured learning loop: understand the mental model, inspect a real example, make a change, break or debug it, and verify the outcome.

## Operating Context

Learners use the site in a desktop or mobile browser. Published Foundation lessons include browser-only simulations and gated checkpoints. Anonymous progress is currently saved on the learner's device. The public site is deployed from `main` to `vibe-to-code.tech`; redesign and feature work is validated from `develop` on `staging.vibe-to-code.tech` before production promotion.

## Capabilities and Constraints

- Developer Foundations currently publishes Level 0 and Level 1 as a sequential 14-lesson path.
- Lessons preserve learner attempts, hints, checkpoint state, and completion state locally.
- Existing Level 1 progress must survive curriculum and progress-schema changes.
- Lesson content, simulations, gates, and progress logic must remain functional through the redesign.
- The next action must be obvious after every checkpoint, lesson, and level.
- Google signup and server-synced progress are the next product milestone. The public learning path remains usable in guest mode, and account work must merge rather than erase existing local progress.
- The project is a Next.js App Router application deployed on Vercel and maintained in one GitHub repository.

## Brand Commitments

- Product name: Vibe to Code.
- Primary voice: plain, direct, encouraging, and never patronising.
- The experience should feel futuristic, confident, premium, and suitable for serious learners.
- It must not feel childish, heavily gamified, or like a generic neon AI product.
- The approved identity uses the folded-ribbon cursor symbol (direction 03) and the structured monoline wordmark (direction 02) in light and dark variants.
- The approved logo film is a supporting brand moment, never a blocking startup screen.

## Evidence on Hand

- Published lesson copy, practice simulators, curriculum maps, and progress tests in this repository.
- No testimonials, learner counts, completion-rate claims, or commercial proof are currently available and none should be invented.

## Product Principles

1. Always show the next useful action.
2. Prove ideas through interaction, not unsupported claims.
3. Preserve beginner confidence without hiding technical truth.
4. Make progress legible across checkpoints, lessons, and levels.
5. Keep public learning accessible, fast, and usable without an account.

## Accessibility & Inclusion

The interface must support keyboard navigation, clear focus states, reduced motion, semantic structure, readable 16–18px learning text, and touch targets of at least 48px where practical. Mobile layouts must preserve the learning sequence without overlap or tiny controls.
