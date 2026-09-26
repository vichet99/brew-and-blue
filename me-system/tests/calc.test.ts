// Worked calculation examples from specification section 6.3 and
// playbook section 23.2. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  achievement,
  baselineProgress,
  latestSnapshot,
  pooledPercentage,
  weightedMean,
} from "../src/lib/calc.ts";

const value = (r: ReturnType<typeof achievement>) => {
  assert.ok(r.ok, r.ok ? "" : r.reason);
  return r.value;
};

test("target 100, approved count 80 -> 80 % of target", () => {
  assert.equal(value(achievement(80, 100)), 80);
});

test("pools 30/50 and 20/100 into 50/150, not the mean of 60 % and 20 %", () => {
  const r = pooledPercentage([
    { numerator: 30, denominator: 50 },
    { numerator: 20, denominator: 100 },
  ]);
  assert.equal(value(r).toFixed(2), "33.33");
});

test("cumulative 40 in Q1 and 70 in Q2 -> 70, not 110", () => {
  const r = latestSnapshot([
    { periodEnd: "2026-03-31", value: 40 },
    { periodEnd: "2026-06-30", value: 70 },
  ]);
  assert.equal(value(r), 70);
});

test("equal-date snapshots without priority are not resolved arbitrarily", () => {
  const r = latestSnapshot([
    { periodEnd: "2026-06-30", value: 70 },
    { periodEnd: "2026-06-30", value: 72 },
  ]);
  assert.equal(r.ok, false);
});

test("zero denominator is not calculable", () => {
  assert.equal(pooledPercentage([{ numerator: 0, denominator: 0 }]).ok, false);
});

test("missing numerator is not treated as zero", () => {
  assert.equal(pooledPercentage([{ numerator: null, denominator: 10 }]).ok, false);
});

test("absent or zero target -> achievement unavailable", () => {
  assert.equal(achievement(50, null).ok, false);
  assert.equal(achievement(50, 0).ok, false);
});

test("unknown count is not reported, zero count is a measured value", () => {
  assert.equal(achievement(null, 100).ok, false);
  assert.equal(value(achievement(0, 100)), 0);
});

test("baseline 100 days, target 60, actual 80 -> 50 % of intended reduction", () => {
  assert.equal(value(baselineProgress(100, 60, 80, "decrease")), 50);
});

test("progress beyond target is not clipped", () => {
  assert.equal(value(baselineProgress(100, 60, 40, "decrease")), 150);
  assert.equal(value(baselineProgress(10, 20, 5, "increase")), -50);
});

test("weighted mean of 5 and 9 with weights 10 and 30 -> 8", () => {
  assert.equal(value(weightedMean([{ value: 5, weight: 10 }, { value: 9, weight: 30 }])), 8);
});
