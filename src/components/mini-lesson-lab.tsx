"use client";

import { useState } from "react";

const spacingOptions = [
  { value: "compact", label: "12px", note: "Compact" },
  { value: "balanced", label: "20px", note: "Balanced" },
  { value: "spacious", label: "32px", note: "Spacious" },
] as const;

type Spacing = (typeof spacingOptions)[number]["value"];

export function MiniLessonLab() {
  const [spacing, setSpacing] = useState<Spacing>("balanced");
  const selected = spacingOptions.find((option) => option.value === spacing) ?? spacingOptions[1];

  return (
    <div className="mini-lab" aria-labelledby="mini-lab-title">
      <div className="mini-lab-toolbar">
        <div>
          <span>Guided lab</span>
          <strong id="mini-lab-title">Change one line. See exactly what moves.</strong>
        </div>
        <span className="mini-lab-progress">01 / 03</span>
      </div>

      <div className="mini-lab-grid">
        <div className="mini-lab-code">
          <div className="mini-lab-filebar">
            <span aria-hidden="true">CSS</span>
            <strong>button.css</strong>
            <small>saved</small>
          </div>

          <div className="mini-lab-codebody" aria-label="CSS code example">
            <p><span>1</span><code>.action &#123;</code></p>
            <p className="is-active"><span>2</span><code>padding: <strong>{selected.label}</strong> 24px;</code></p>
            <p><span>3</span><code>border-radius: 8px;</code></p>
            <p><span>4</span><code>&#125;</code></p>
          </div>

          <fieldset className="mini-lab-controls">
            <legend>Choose the button&apos;s vertical padding</legend>
            <div>
              {spacingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={spacing === option.value ? "is-selected" : undefined}
                  aria-pressed={spacing === option.value}
                  onClick={() => setSpacing(option.value)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.note}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mini-lab-result" data-spacing={spacing}>
          <div className="mini-lab-resultbar">
            <span>Preview</span>
            <small>localhost:3000</small>
          </div>
          <div className="mini-lab-canvas">
            <article>
              <span>Release 01</span>
              <h3>Your first verified change.</h3>
              <p>The code and the interface now tell the same story.</p>
              <button type="button">Ship the build</button>
            </article>
          </div>
          <p className="mini-lab-verdict" aria-live="polite">
            <span aria-hidden="true">✓</span> Change verified: {selected.note.toLowerCase()} spacing
          </p>
        </div>
      </div>
    </div>
  );
}
