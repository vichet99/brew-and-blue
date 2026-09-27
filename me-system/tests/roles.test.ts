// Pilot role rules. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { can, canDecide, canOpen, canSeeSubmission, ROLES } from "../src/lib/roles.ts";

test("four pilot roles", () => {
  assert.deepEqual(ROLES.map((r) => r.id), ["admin", "reviewer", "focal", "viewer"]);
});

test("the administrator is also the M&E manager and may review", () => {
  assert.ok(can("admin", "manage_setup"));
  assert.ok(can("admin", "publish_reports"));
  assert.ok(can("admin", "review"));
});

test("nobody approves their own entry, including an administrator", () => {
  assert.equal(canDecide("admin", true).ok, false);
  assert.equal(canDecide("reviewer", true).ok, false);
  assert.equal(canDecide("admin", false).ok, true);
  assert.equal(canDecide("focal", false).ok, false);
  assert.equal(canDecide("viewer", false).ok, false);
});

test("the Committee sees policy totals and ministry detail, approved figures only", () => {
  assert.ok(can("viewer", "view_dashboards"));
  assert.ok(canOpen("viewer", "/programmes/maff"));
  assert.ok(canOpen("viewer", "/reports/actions"));
  assert.equal(can("viewer", "view_drafts"), false);
  assert.equal(can("viewer", "view_evidence"), false);
  assert.equal(canOpen("viewer", "/submissions"), false);
  assert.equal(canOpen("viewer", "/reviews/RY2025-MAFF"), false);
});

test("a focal point sees only their own ministry's submissions", () => {
  assert.ok(canSeeSubmission("focal", "maff", "maff"));
  assert.equal(canSeeSubmission("focal", "maff", "moc"), false);
  assert.ok(canSeeSubmission("reviewer", null, "moc"));
  assert.equal(canOpen("focal", "/reviews"), false); // review queue
  assert.ok(canOpen("focal", "/reviews/RY2025-MAFF")); // own submission detail, checked per ministry
  assert.ok(canOpen("focal", "/collect/cashew-indicator-report"));
});

test("setup and administration pages are for the administrator", () => {
  assert.ok(canOpen("admin", "/admin"));
  for (const r of ["reviewer", "focal", "viewer"] as const) {
    assert.equal(canOpen(r, "/admin"), false);
    assert.equal(canOpen(r, "/forms/processor-survey"), false);
  }
  assert.ok(canOpen("reviewer", "/forms/cashew-indicator-report"));
});
