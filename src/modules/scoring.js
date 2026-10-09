/**
 * Explainable evidence assessment, NOT a personal-safety prediction.
 * Unknown data never counts as favorable evidence.
 */

export const DEFAULT_WEIGHTS = {
  lighting: 45,
  activity: 25,
  road: 30
};

export const MIN_COVERAGE = 70;

export function normalizeWeights(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce(
    (sum, [, value]) => sum + Math.max(0, Number(value) || 0),
    0
  );

  if (!total) {
    return Object.fromEntries(
      entries.map(([key]) => [key, 100 / entries.length])
    );
  }

  return Object.fromEntries(
    entries.map(([key, value]) => [
      key,
      (Math.max(0, Number(value) || 0) / total) * 100
    ])
  );
}

export function assessRoute(route, weights = DEFAULT_WEIGHTS, hazards = []) {
  if (!route || typeof route !== "object") {
    throw new Error("Cannot assess route: route data is missing or invalid.");
  }

  const normalized = normalizeWeights(weights);

  // Keep demo factor coverage separate from live OSM evidence.
  const coverage = { ...(route.coverage || {}) };
  const osm = route.osmEvidence;

  if (osm) {
    // This describes mapped-road proximity only, not safety.
    coverage.road = Number(osm.mappedRoadCoveragePct) || 0;

    // Lighting coverage means the proportion of samples with an
    // explicit lit=yes OR lit=no tag, not the proportion of lit roads.
    coverage.lighting = Number(osm.lighting?.knownLightingPct) || 0;

    // No credible pedestrian activity source is connected yet.
    coverage.activity = 0;
  }

  const available = [];

  for (const factor of ["lighting", "activity", "road"]) {
    const pct = Number(coverage[factor]);

    if (Number.isFinite(pct) && pct > 0) {
      available.push({
        factor,
        weight: normalized[factor],
        coverage: Math.min(100, Math.max(0, pct))
      });
    }
  }

  const availableWeight = available.reduce(
    (sum, item) => sum + item.weight,
    0
  );

  // Weighted coverage of the factors for which coverage is reported.
  // This is not a route-length-weighted GIS measurement.
  const evidenceCoverage = availableWeight
    ? available.reduce(
        (sum, item) => sum + item.weight * item.coverage,
        0
      ) / availableWeight
    : 0;

  const nearbyHazards = hazards.filter((hazard) =>
    route.coordinates?.some(([lat, lng]) =>
      Math.hypot(
        (lat - hazard.lat) * 111,
        (lng - hazard.lng) * 95
      ) < 0.35
    )
  );

  const eligible = evidenceCoverage >= MIN_COVERAGE;

  return {
    ...route,
    coverage,
    factorCoverage: coverage,
    evidenceCoverage: Math.round(evidenceCoverage),
    eligible,
    nearbyHazards,

    // Never create a safety score from evidence coverage.
    evidenceScore: null,

    evidenceSummary: osm
      ? "Approximate OpenStreetMap coverage; not a validated safety assessment."
      : "Street evidence unavailable or not attached."
  };
}

export function rankRoutes(routes, weights, hazards) {
  return routes
    .filter((route) => route && typeof route === "object")
    .map((route) => assessRoute(route, weights, hazards))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) {
        return a.eligible ? -1 : 1;
      }

      return a.durationMin - b.durationMin;
    });
}