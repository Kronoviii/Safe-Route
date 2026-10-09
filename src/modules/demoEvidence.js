/**
 * SIMULATED DEMO EVIDENCE ONLY.
 * These values are fictional UI fixtures for demonstrating SafeRoute's workflow.
 * They are not measurements of real streets and must never be presented as real observations.
 */
const DEMO_PROFILES = [
  { lighting: 82, road: 91, activity: 74 },
  { lighting: 74, road: 86, activity: 63 },
  { lighting: 61, road: 94, activity: 78 }
];

export function attachSimulatedEvidence(route, index = 0) {
  const profile = DEMO_PROFILES[index % DEMO_PROFILES.length];
  return {
    ...route,
    coverage: { ...profile },
    factors: {
      lighting: "Simulated lighting-tag coverage",
      road: "Simulated mapped-road coverage",
      activity: "Simulated pedestrian-activity proxy"
    },
    demoEvidence: true,
    evidenceSource: "Simulated demonstration data",
    note: `${route.note || "Route details from routing service."} Evidence indicators are hypothetical demo values, not observations of this street.`
  };
}
