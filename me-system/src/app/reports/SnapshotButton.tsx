"use client";

import { useState } from "react";

export function SnapshotButton() {
  const [done, setDone] = useState("");
  return (
    <>
      <button type="button" className="btn" onClick={() => setDone(new Date().toLocaleString("en-GB"))}>
        Generate 2026 report draft
      </button>
      {done && (
        <p role="status" className="small" style={{ flexBasis: "100%", margin: 0 }}>
          Draft created {done} (simulated). It stays empty until reporting year 2026 submissions are approved; publishing freezes it.
        </p>
      )}
    </>
  );
}
