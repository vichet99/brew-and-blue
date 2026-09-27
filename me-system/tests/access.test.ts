import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAccount, stateLabel, toAnswerColumns, type AccessRow } from "../src/lib/access.ts";

const base: AccessRow = {
  user_id: "u1", full_name: "Secretariat lead", email: "lead@example.org", workspace_id: "w1",
  workspace_name: "Cashew", ministry_code: "moc", ministry_short: "MoC", role: null, scope_ministry_code: null,
};

test("no rows means no workspace access", () => {
  assert.equal(buildAccount([]), null);
});

test("admin and reviewer: the interface uses admin", () => {
  const a = buildAccount([{ ...base, role: "reviewer" }, { ...base, role: "admin" }])!;
  assert.deepEqual(a.roles, ["admin", "reviewer"]);
  assert.equal(a.role, "admin");
  assert.equal(a.ministry, "moc");
});

test("focal point reports for the ministry in the grant", () => {
  const a = buildAccount([{ ...base, ministry_code: "maff", ministry_short: "MAFF", role: "focal", scope_ministry_code: "maff" }])!;
  assert.equal(a.role, "focal");
  assert.equal(a.ministry, "maff");
});

test("member without a role has no interface role", () => {
  const a = buildAccount([base])!;
  assert.deepEqual(a.roles, []);
  assert.equal(a.role, null);
});

test("state labels match the demo's status tags", () => {
  assert.equal(stateLabel("in_review"), "In review");
  assert.equal(stateLabel("approved"), "Approved");
  assert.equal(stateLabel(null), "—");
});

test("form values map to answer columns", () => {
  assert.deepEqual(toAnswerColumns("count_to_target", "6"), { value_number: 6, value_choice: null });
  assert.deepEqual(toAnswerColumns("milestone", "completed"), { value_number: null, value_choice: "completed" });
  assert.deepEqual(toAnswerColumns("percent_complete", " "), { value_number: null, value_choice: null });
});
