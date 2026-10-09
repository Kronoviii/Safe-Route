import test from "node:test";
import assert from "node:assert/strict";
import { assessRoute, normalizeWeights, rankRoutes, MIN_COVERAGE } from "./scoring.js";
import { demoRoutes, initialHazards } from "./demoData.js";

test("weights normalize to 100 and all-zero weights avoid division by zero", () => {
  const normalized = normalizeWeights({ lighting: 2, activity: 1, road: 1 });
  assert.equal(Math.round(Object.values(normalized).reduce((a, b) => a + b, 0)), 100);
  const equal = normalizeWeights({ lighting: 0, activity: 0, road: 0 });
  assert.equal(Math.round(Object.values(equal).reduce((a, b) => a + b, 0)), 100);
});

test("demo routes above and below threshold are clearly separated", () => {
  const assessed = demoRoutes.map(route => assessRoute(route));
  assert.ok(assessed.some(route => route.eligible));
  assert.ok(assessed.some(route => !route.eligible));
  assert.equal(MIN_COVERAGE, 70);
});

test("missing evidence remains unknown and cannot qualify a route", () => {
  const route = { ...demoRoutes[0], coverage: { lighting: 0, activity: 0, road: 0 } };
  const assessed = assessRoute(route);
  assert.equal(assessed.evidenceCoverage, 0);
  assert.equal(assessed.eligible, false);
  assert.equal(assessed.evidenceScore, null);
});

test("rankRoutes puts evidence-eligible routes before insufficient-evidence routes", () => {
  const ranked = rankRoutes(demoRoutes);
  const firstLimited = ranked.findIndex(route => !route.eligible);
  assert.ok(firstLimited >= 0);
  assert.ok(ranked.slice(0, firstLimited).every(route => route.eligible));
});

test("hazards are surfaced separately from coverage", () => {
  const route = demoRoutes[0];
  const assessed = assessRoute(route, undefined, initialHazards);
  assert.ok(assessed.nearbyHazards.length > 0);
  assert.equal(assessed.eligible, assessRoute(route).eligible);
});
