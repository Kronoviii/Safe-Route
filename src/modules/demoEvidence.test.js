import test from "node:test";
import assert from "node:assert/strict";
import { attachSimulatedEvidence } from "./demoEvidence.js";

test("simulated evidence is explicitly marked and does not mutate route geometry", () => {
  const route = { id: "live-0", coordinates: [[26.9, 75.7], [26.91, 75.71]], distanceM: 900, durationMin: 12 };
  const result = attachSimulatedEvidence(route, 0);
  assert.equal(result.demoEvidence, true);
  assert.equal(result.evidenceSource, "Simulated demonstration data");
  assert.equal(result.coverage.lighting, 82);
  assert.equal(result.coverage.road, 91);
  assert.equal(result.coverage.activity, 74);
  assert.deepEqual(result.coordinates, route.coordinates);
  assert.match(result.note, /hypothetical demo values/i);
});
