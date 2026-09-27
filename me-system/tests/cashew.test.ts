// Checks the Cashew example against the owner's workbooks. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  actionCounts,
  actionIndicators,
  actions,
  getActionIndicator,
  getOutcomeIndicator,
  koboPercentage,
  ministries,
  ministryCompletion,
  outcomeIndicators,
  outcomeTrend,
  statusFor,
} from "../src/lib/cashew.ts";

test("coverage matches the workbook: 17 ministries, 44 actions, 108 indicators, 13 outcome indicators", () => {
  assert.equal(ministries.length, 17);
  assert.equal(actions.length, 44);
  assert.equal(actionIndicators.length, 108);
  assert.equal(outcomeIndicators.length, 13);
});

test("2025 action status reproduces DASHBOARD_OUTPUT: 11 fully, 27 largely, 6 limited, 66% completion", () => {
  const c = actionCounts(actions, 2025);
  assert.deepEqual([c.fully, c.largely, c.limited], [11, 27, 6]);
  assert.equal(Math.round(c.completion!), 66);
});

test("thresholds tighten by year: 70% is largely achieved in 2025 but limited in 2027", () => {
  assert.equal(statusFor(70, 2025), "Largely Achieved");
  assert.equal(statusFor(70, 2026), "Largely Achieved");
  assert.equal(statusFor(70, 2027), "Limited Progress");
  assert.equal(statusFor(1457, 2025), "Fully Achieved");
  assert.equal(statusFor(null, 2025), null);
});

test("ministry completion matches 06_MINISTRY_SUMMARY for MAFF (81.3%) and MRD (36%)", () => {
  assert.equal(ministryCompletion("maff").completion!.toFixed(1), "81.3");
  assert.equal(Math.round(ministryCompletion("mrd").completion!), 36);
});

test("Kobo percentage mirrors the XLSForm calculations", () => {
  assert.equal(koboPercentage(getActionIndicator("Indicator_001")!, 7), 100); // 7 of 7
  assert.equal(koboPercentage(getActionIndicator("Indicator_002")!, 4), 57); // round(4/7*100)
  assert.equal(koboPercentage(getActionIndicator("Indicator_004")!, "in_progress"), 50); // milestone
  assert.equal(koboPercentage(getActionIndicator("Indicator_103")!, 6), 50); // 3 days target / 6 days
  assert.equal(koboPercentage(getActionIndicator("Indicator_015")!, 140), 100); // percent complete capped
  assert.equal(koboPercentage(getActionIndicator("Indicator_001")!, ""), null);
});

test("outcome trend is direction-aware against the 2022 baseline", () => {
  assert.equal(outcomeTrend(getOutcomeIndicator("P2")!, 2025).trend, "Improving"); // 508,283 -> 964,700 t
  assert.equal(outcomeTrend(getOutcomeIndicator("M1")!, 2025).trend, "Improving"); // lower share is better
  assert.equal(outcomeTrend(getOutcomeIndicator("M3")!, 2025).trend, "Declining");
  assert.equal(outcomeTrend(getOutcomeIndicator("Q1")!, 2025).trend, "No data"); // no 2022 baseline
});
