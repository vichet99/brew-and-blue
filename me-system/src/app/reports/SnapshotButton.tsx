"use client";

import { useState } from "react";

export function SnapshotButton() {
  const [done, setDone] = useState<string>("");
  return (
    <>
      <button
        type="button"
        className="btn"
        onClick={() => setDone(new Date().toLocaleString("en-GB"))}
      >
        Generate 2026-Q3 snapshot
      </button>
      {done && (
        <p role="status" className="small" style={{ flexBasis: "100%", margin: 0 }}>
          Draft snapshot created {done} (simulated). Stale and unapproved observations are excluded; publishing freezes it.
        </p>
      )}
    </>
  );
}
