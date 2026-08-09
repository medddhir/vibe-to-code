"use client";

import { useId } from "react";

export type RequestResponsePayload = Record<string, unknown>;

function prettyJson(value: RequestResponsePayload) {
  return JSON.stringify(value, null, 2);
}

export type RequestResponseInspectorProps = {
  requestLabel: string;
  method: string;
  endpoint: string;
  status?: number;
  response?: RequestResponsePayload;
};

export function RequestResponseInspector({
  requestLabel,
  method,
  endpoint,
  status,
  response,
}: RequestResponseInspectorProps) {
  const requestId = useId();

  return (
    <section className="request-response-inspector" aria-labelledby={`${requestId}-title`}>
      <div className="rr-header">
        <p className="eyebrow">Request + response trace</p>
        <strong id={`${requestId}-title`}>{requestLabel}</strong>
      </div>

      <div className="rr-grid">
        <article className="rr-card rr-request">
          <h4>Request</h4>
          <code>
            {method} {endpoint}
          </code>
          <small>Payload prepared by the frontend controls.</small>
        </article>

        <article className={`rr-card rr-response ${status ? "has-status" : ""}`}>
          <h4>Backend response</h4>
          <strong>{status ? `${status}` : "Not sent yet"}</strong>
          {status ? (
            <pre>{prettyJson(response ?? { message: "No payload" })}</pre>
          ) : (
            <small>Run the journey to send a request.</small>
          )}
        </article>
      </div>
    </section>
  );
}
