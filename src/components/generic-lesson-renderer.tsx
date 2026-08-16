"use client";

import { useEffect, useRef, useState } from "react";

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

export function getLessonBlockRendererKind(block: { type: string }) {
  if (!isSupportedLessonBlockType(block.type)) {
    throw new Error(`Unsupported lesson block type: ${block.type}`);
  }
  return block.type;
}

export function getOrderingCheckpointDisplayOrder(
  activity: OrderingActivity,
  currentOrder: readonly string[],
  completed: boolean,
) {
  return completed ? [...activity.correctOrder] : [...currentOrder];
}

export function getOrderingCheckpointDisplayState(
  activity: OrderingActivity,
  currentOrder: readonly string[],
  feedback: string,
  announcement: string,
  completed: boolean,
) {
  return completed
    ? {
      order: [...activity.correctOrder],
      feedback: activity.successMessage,
      announcement: activity.successMessage,
    }
    : { order: [...currentOrder], feedback, announcement };
}

function OrderingCheckpoint({ activity }: { activity: OrderingActivity }) {
  const { completePractice, practiceCompletedIds, recordFailedAttempt } =
    useLessonProgress();
  const [order, setOrder] = useState(() => activity.items.map((item) => item.id));
  const [feedback, setFeedback] = useState("");
  const [announcement, setAnnouncement] = useState({ sequence: 0, message: "" });
  const [focusTarget, setFocusTarget] = useState<{
    itemId: string;
    direction: -1 | 1;
    sequence: number;
  } | null>(null);
  const movementControls = useRef(new Map<string, HTMLButtonElement>());
  const completed = practiceCompletedIds.includes(activity.id);
  const displayState = getOrderingCheckpointDisplayState(
    activity,
    order,
    feedback,
    announcement.message,
    completed,
  );

  useEffect(() => {
    if (!focusTarget) return;
    const preferred = movementControls.current.get(
      `${focusTarget.itemId}:${focusTarget.direction}`,
    );
    const fallback = movementControls.current.get(
      `${focusTarget.itemId}:${focusTarget.direction === -1 ? 1 : -1}`,
    );
    const target = preferred && !preferred.disabled ? preferred : fallback;
    if (target && !target.disabled) target.focus();
  }, [focusTarget, order]);

  function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (completed || destination < 0 || destination >= order.length) return;
    const movingId = order[index];
    const item = activity.items.find((candidate) => candidate.id === movingId);
    setOrder((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
    setFocusTarget((current) => ({
      itemId: movingId,
      direction,
      sequence: (current?.sequence ?? 0) + 1,
    }));
    setAnnouncement((current) => ({
      sequence: current.sequence + 1,
      message: `Moved ${item?.label ?? "item"} to position ${destination + 1} of ${order.length}.`,
    }));
    setFeedback("");
  }

  function checkOrder() {
    if (order.every((id, index) => id === activity.correctOrder[index])) {
      completePractice(activity.id);
      setFeedback(activity.successMessage);
      setAnnouncement((current) => ({
        sequence: current.sequence + 1,
        message: activity.successMessage,
      }));
      return;
    }
    recordFailedAttempt(activity.id);
    setFeedback(activity.errorMessage);
    setAnnouncement((current) => ({
      sequence: current.sequence + 1,
      message: `Incorrect sequence. ${activity.errorMessage}`,
    }));
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
      <ol className="ordering-checkpoint-list" aria-label="Current sequence">
        {displayState.order.map((id, index) => {
          const item = activity.items.find((candidate) => candidate.id === id);
          return (
            <li key={id}>
              <span>{item?.label}</span>
              <span className="ordering-checkpoint-controls">
                <button
                  ref={(node) => {
                    if (node) movementControls.current.set(`${id}:-1`, node);
                    else movementControls.current.delete(`${id}:-1`);
                  }}
                  className="button button-secondary"
                  type="button"
                  disabled={completed || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move ${item?.label} earlier`}
                >
                  Move up
                </button>
                <button
                  ref={(node) => {
                    if (node) movementControls.current.set(`${id}:1`, node);
                    else movementControls.current.delete(`${id}:1`);
                  }}
                  className="button button-secondary"
                  type="button"
                  disabled={completed || index === displayState.order.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move ${item?.label} later`}
                >
                  Move down
                </button>
              </span>
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
      {displayState.feedback ? (
        <p className="choice-feedback">
          {displayState.feedback}
        </p>
      ) : null}
      <p
        className="lesson-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span key={`${announcement.sequence}:${completed}`}>{displayState.announcement}</span>
      </p>
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
  stepId,
}: {
  definition: LessonContentDefinition;
  stepId?: string;
}) {
  const steps = stepId
    ? definition.guidedSteps.filter((step) => step.id === stepId)
    : definition.guidedSteps;

  return steps.map((step) => {
    const isFirstStep = step.id === definition.guidedSteps[0]?.id;
    const isFinalStep = step.id === definition.guidedSteps.at(-1)?.id;
    return (
      <section
        id={step.id}
        className="lesson-section guided-topic mission-topic"
        key={step.id}
        aria-labelledby={`${step.id}-heading`}
      >
        <p className="eyebrow">{step.eyebrow}</p>
        <h2 id={`${step.id}-heading`}>{step.title}</h2>
        {isFirstStep ? (
          <aside
            className="lesson-ready-note lesson-contract"
            aria-labelledby={`${step.id}-objective-heading`}
          >
            <h3 id={`${step.id}-objective-heading`}>Lesson objective</h3>
            <p>{definition.objective}</p>
            <h4>Before you begin</h4>
            <ul>{definition.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
            <h4>By the end, you can</h4>
            <ul>{definition.learningOutcomes.map((item) => <li key={item}>{item}</li>)}</ul>
            <p><strong>Misconception to correct:</strong> {definition.misconception}</p>
          </aside>
        ) : null}
        {step.blocks.map((block, index) =>
          renderBlock(block, definition.activities, `${step.id}-${index}`),
        )}
        {isFinalStep ? (
          <footer
            className="lesson-ready-note lesson-sources"
            aria-labelledby={`${step.id}-sources-heading`}
          >
            <h3 id={`${step.id}-sources-heading`}>Sources</h3>
            <p>Verified {definition.sourceVerifiedAt}.</p>
            <ul>
              {definition.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} rel="noreferrer">{source.title}</a>
                </li>
              ))}
            </ul>
          </footer>
        ) : null}
      </section>
    );
  });
}
