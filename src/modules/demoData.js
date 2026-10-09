// SIMULATED DEMO DATA: routes, coordinates, coverage percentages, factor labels, and hazards are illustrative fixtures, not verified safety observations.
export const demoRoutes = [
  {
    id: "fastest",
    demoEvidence: true,
    name: "Fastest route",
    color: "#60a5fa",
    distanceM: 1280,
    durationMin: 16,
    coordinates: [
      [26.9124, 75.7873], [26.9134, 75.7900], [26.9150, 75.7920],
      [26.9164, 75.7946], [26.9180, 75.7972]
    ],
    coverage: { lighting: 52, road: 88, activity: 46 },
    factors: { lighting: "Partial evidence", road: "Mostly mapped", activity: "Limited proxy" },
    note: "Shortest estimated walk; several lighting attributes are unknown."
  },
  {
    id: "lit",
    demoEvidence: true,
    name: "Lighting evidence route",
    color: "#34d399",
    distanceM: 1510,
    durationMin: 19,
    coordinates: [
      [26.9124, 75.7873], [26.9118, 75.7900], [26.9122, 75.7930],
      [26.9140, 75.7954], [26.9161, 75.7960], [26.9180, 75.7972]
    ],
    coverage: { lighting: 78, road: 84, activity: 55 },
    factors: { lighting: "More mapped evidence", road: "Mostly mapped", activity: "Limited proxy" },
    note: "More lighting information is available, but this does not guarantee better lighting in reality."
  },
  {
    id: "main",
    demoEvidence: true,
    name: "Main-road option",
    color: "#fbbf24",
    distanceM: 1730,
    durationMin: 22,
    coordinates: [
      [26.9124, 75.7873], [26.9142, 75.7886], [26.9160, 75.7905],
      [26.9175, 75.7930], [26.9180, 75.7972]
    ],
    coverage: { lighting: 64, road: 91, activity: 72 },
    factors: { lighting: "Partial evidence", road: "Strong road data", activity: "Amenity-based proxy" },
    note: "Road characteristics are well mapped; nearby amenities are not proof of pedestrian presence."
  }
];

export const initialHazards = [
  {
    id: "demo-hazard-1",
    type: "Broken streetlight",
    lat: 26.9150,
    lng: 75.7920,
    createdAt: "Demo report",
    status: "Demonstration data",
    demo: true
  }
];