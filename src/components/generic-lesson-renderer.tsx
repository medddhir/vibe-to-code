"use client";

import { useState } from "react";

import { ChoiceCheckpoint } from "@/components/choice-checkpoint";
import { CodeWindow } from "@/components/code-window";
import { useLessonProgress } from "@/components/guided-lesson-flow";
import {
  isSupportedLessonBlockType,
  type LessonActivity,
  type LessonContentDefinition,
  type OrderingActivity,
  type TrustedLessonBlock,
} from "@/data/lesson-schema";

export function getGuidedStepsForLessonDefinition(
  definition: LessonContentDefinition,
) {
  const completionActivityIds = definition.completionRule.requiredActivityIds;
  return definition.guidedSteps.map((step, index) => {
    const requiredActivityIds = index === definition.guidedSteps.length - 1
      ? [...new Set([...step.requiredActivityIds, ...completionActivityIds])]
      : [...step.requiredActivityIds];
    return {
      id: step.id,
      title: step.title,
      eyebrow: step.eyebrow,
      requiresPractice: requiredActivityIds.length > 0,
      requiredActivityIds,
    };
  });
}

export function getLessonBlockRendererKind(block: { type: string }) {
  if (!isSupportedLessonBlockType(block.type)) {
    throw new Error(`Unsupported lesson block type: ${block.type}`);
  }
  return block.type;
}

function OrderingCheckpoint({ activity }: { activity: OrderingActivity }) {
  const { completePractice, practiceCompletedIds, recordFailedAttempt } =
    useLessonProgress();
  const [order, setOrder] = useState(() => activity.items.map((item) => item.id));
  const [feedback, setFeedback] = useState("");
  const completed = practiceCompletedIds.includes(activity.id);

  function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (completed || destination < 0 || destination >= order.length) return;
    setOrder((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
    setFeedback("");
  }

  function checkOrder() {
    if (order.every((id, index) => id === activity.correctOrder[index])) {
      completePractice(activity.id);
      setFeedback(activity.successMessage);
      return;
    }
    recordFailedAttempt(activity.id);
    setFeedback(activity.errorMessage);
  }

  return (
    <section className="choice-checkpoint" aria-labelledby={`${activity.id}-title`}>
      <div className="choice-checkpoint-heading">
        <div>
          <p className="eyebrow">Sequence checkpoint</p>
          <h3 id={`${activity.id}-title`}>{activity.title}</h3>
        </div>
      </div>
      <p>{activity.prompt}</p>
      <ol aria-label="Current sequence">
        {order.map((id, index) => {
          const item = activity.items.find((candidate) => candidate.id === id);
          return (
            <li key={id}>
              <span>{item?.label}</span>
              <button
                className="button button-secondary"
                type="button"
                disabled={completed || index === 0}
                onClick={() => move(index, -1)}
                aria-label={`Move ${item?.label} earlier`}
              >
                Move up
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={completed || index === order.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`Move ${item?.label} later`}
              >
                Move down
              </button>
            </li>
          );
        })}
      </ol>
      <button
        className="button button-primary"
        type="button"
        disabled={completed}
        onClick={checkOrder}
      >
        {completed ? "Checkpoint cleared" : "Check sequence"}
      </button>
      {feedback ? (
        <p className="choice-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}

function activityById(
  activities: readonly LessonActivity[],
  activityId: string,
) {
  const activity = activities.find((candidate) => candidate.id === activityId);
  if (!activity) throw new Error(`Missing lesson activity: ${activityId}`);
  return activity;
}

function renderBlock(
  block: TrustedLessonBlock,
  activities: readonly LessonActivity[],
  key: string,
) {
  getLessonBlockRendererKind(block);
  switch (block.type) {
    case "explanation":
      return (
        <section key={key}>
          <h3>{block.heading}</h3>
          {block.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </section>
      );
    case "callout":
      return (
        <aside key={key} className={`lesson-ready-note lesson-callout-${block.tone}`}>
          <h3>{block.heading}</h3>
          <p>{block.body}</p>
        </aside>
      );
    case "example":
      return <CodeWindow key={key} title={block.title} code={block.code} output={block.output} />;
    case "single-answer-checkpoint": {
      const activity = activityById(activities, block.activityId);
      if (activity.type !== "single-answer") {
        throw new Error(`Activity ${activity.id} is not a single-answer checkpoint`);
      }
      return (
        <ChoiceCheckpoint
          key={key}
          stepId={activity.id}
          title={activity.title}
          question={activity.question}
          options={[...activity.options]}
          correctId={activity.correctOptionId}
          successMessage={activity.successMessage}
          hint={activity.hint}
        />
      );
    }
    case "ordering-checkpoint": {
      const activity = activityById(activities, block.activityId);
      if (activity.type !== "ordering") {
        throw new Error(`Activity ${activity.id} is not an ordering checkpoint`);
      }
      return <OrderingCheckpoint key={key} activity={activity} />;
    }
    case "recap":
      return (
        <section key={key}>
          <h3>{block.heading}</h3>
          <ul>{block.points.map((point, index) => <li key={index}>{point}</li>)}</ul>
        </section>
      );
    case "transfer-challenge":
      return (
        <section key={key}>
          <h3>{block.heading}</h3>
          <p>{block.prompt}</p>
          <h4>Success criteria</h4>
          <ul>{block.successCriteria.map((criterion, index) => <li key={index}>{criterion}</li>)}</ul>
        </section>
      );
  }
}

/** Renders validated, serializable lesson data. Route and access decisions live elsewhere. */
export function GenericLessonContentRenderer({
  definition,
}: {
  definition: LessonContentDefinition;
}) {
  return definition.guidedSteps.map((step) => (
    <section
      id={step.id}
      className="lesson-section guided-topic mission-topic"
      key={step.id}
      aria-labelledby={`${step.id}-heading`}
    >
      <p className="eyebrow">{step.eyebrow}</p>
      <h2 id={`${step.id}-heading`}>{step.title}</h2>
      {step.blocks.map((block, index) =>
        renderBlock(block, definition.activities, `${step.id}-${index}`),
      )}
    </section>
  ));
}
