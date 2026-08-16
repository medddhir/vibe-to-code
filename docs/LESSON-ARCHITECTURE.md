# Lesson architecture

The lesson system has two deliberately separate data layers.

`LessonCatalogEntry` is publication and routing metadata. The catalog records a
stable position-based `catalogId`, slug state, route, lesson version, estimated
duration, render mode, access boundary, navigation relationship, and progress
IDs. Published lookups always filter by `publicationState`; planned and draft
entries cannot become routable through the registry.

Publication comes only from the immutable `LESSON_PUBLICATION_RECORD`. The
progress manifest is a compatibility contract for already-published progress
IDs and versions, not publication authority. Adding a progress row cannot add a
route, access, navigation, or published state.

`LessonContentDefinition` is the serializable input for future data-driven
lessons. It contains the learning objective, prerequisites, outcomes,
misconception, guided steps, activities, completion rule, sources, and source
verification date. Its trusted block union contains only explanation, callout,
example, single-answer checkpoint, ordering checkpoint, recap, and transfer
challenge blocks. It cannot hold JSX, HTML, scripts, executable strings,
component names, iframes, or network instructions.

`getGuidedStepsForLessonDefinition` converts stable step and required-activity
IDs into the existing guided-flow gate format. The final step also carries the
completion rule's required activities, so completion cannot be recorded until
every required deterministic activity has passed.

## Current compatibility rule

The 14 published Developer Foundations lessons remain `legacy-bespoke`. Their
catalog metadata is joined from the existing curriculum outline and the
unchanged 14-entry progress manifest. The registry supplies published ordering
to the existing Foundation compatibility exports, but the page modules and
their content, components, auth guards, navigation UI, progress versions, step
IDs, activity IDs, and storage behavior remain unchanged.

The catalog also marks the 188 lessons that already have curriculum outlines as
planned and unroutable. The Web Development and SQL courses currently declare
only aggregate lesson counts, so the architecture does not invent 160 titles,
slugs, or educational claims for them. The curriculum remains the source of the
six-course total of 362 lessons.

Planned outline slugs are position-based placeholders with
`slugState: "provisional"`; they are not permanent identifiers and must not be
linked, routed, or added to progress contracts. A human-approved permanent slug
is required before draft or publication. In particular, Lesson 15 has only a
provisional catalog identity in this PR.

## Publication workflow

Before a future data-driven lesson is routed, its catalog and content definition
must both pass the pure validators. Publication also requires a separate review
of authentication, sitemap visibility, navigation, progress-manifest/version
changes, storage migration, server allowlists, and database compatibility.
Lesson 15 therefore cannot be published by changing `publicationState` alone.
It still requires a separate reviewed PR covering:

- final content and verified sources;
- permanent slug approval;
- Foundation journey and navigation expansion;
- course progress order expansion;
- progress manifest and version strategy;
- API and SQL allowlists;
- an append-only Supabase migration;
- authentication, sitemap, and deployment review.
