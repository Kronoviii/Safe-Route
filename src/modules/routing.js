/**
 * Routing adapter boundary.
 * ORS expects a server-side proxy for production because API keys must not be exposed in browser bundles.
 * For hackathon local use, set VITE_ORS_API_KEY in .env.local; this is acceptable only for a throwaway demo key.
 */
const ORS_ENDPOINT = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";

export async function fetchWalkingRoutes({ start, end, apiKey, signal }) {
  if (!apiKey) throw new Error("No OpenRouteService API key configured.");
  const response = await fetch(ORS_ENDPOINT, {
    method: "POST",
    signal,
    headers: { "Authorization": apiKey, "Content-Type": "application/json", "Accept": "application/geo+json" },
    body: JSON.stringify({
      coordinates: [[start.lng, start.lat], [end.lng, end.lat]],
      alternative_routes: { target_count: 3, share_factor: 0.6, weight_factor: 1.4 }
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Routing service returned ${response.status}. ${detail.slice(0, 160)}`);
  }
  const geojson = await response.json();
  const features = geojson.features || [];
  if (!features.length) throw new Error("The routing service returned no walking routes.");
  return features.map((feature, index) => {
    const summary = feature.properties?.summary || {};
    const coords = feature.geometry?.coordinates || [];
    return {
      id: `live-${index}`,
      name: index === 0 ? "Fastest available route" : `Alternative ${index}`,
      color: ["#60a5fa", "#34d399", "#fbbf24"][index % 3],
      distanceM: Math.round(summary.distance || 0),
      durationMin: Math.max(1, Math.round((summary.duration || 0) / 60)),
      coordinates: coords.map(([lng, lat]) => [lat, lng]),
      // Routing APIs do not provide lighting/footfall evidence; never fabricate it.
      coverage: { lighting: 0, road: 0, activity: 0 },
      factors: { lighting: "Unknown", road: "Not assessed", activity: "Unknown" },
      note: "Live route geometry and duration; safety evidence has not yet been attached."
    };
  });
}

export async function geocodeOne(query, signal) {
  // Public Nominatim usage has a strict usage policy. Do not build autocomplete or high-volume requests on it.
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, { signal, headers: { "Accept": "application/json" } });
  if (!response.ok) throw new Error(`Geocoding failed (${response.status}).`);
  const results = await response.json();
  if (!results.length) throw new Error(`No location found for "${query}".`);
  return { lat: Number(results[0].lat), lng: Number(results[0].lon), label: results[0].display_name };
}

export function routeFromCache(cache, startLabel, endLabel) {
  // Cache must be a previously fetched response with source and retrieval timestamp.
  return { ...cache, source: "cached", startLabel, endLabel };
}