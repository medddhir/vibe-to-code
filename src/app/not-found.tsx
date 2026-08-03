import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="not-found section">
      <div className="shell narrow-shell">
        <p className="eyebrow">404 · Page not found</p>
        <h1>This lesson is not on the board yet.</h1>
        <p>The curriculum is still growing. Return to the course catalogue and pick an available path.</p>
        <Link className="button button-primary" href="/learn">
          Browse courses
        </Link>
      </div>
    </main>
  );
}
