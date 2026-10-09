const CACHE_KEY = "saferoute.route-cache.v1";
export function readRouteCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return parsed && Array.isArray(parsed.routes) ? parsed : null;
  } catch {
    return null;
  }
}
export function writeRouteCache(routes, metadata = {}) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      routes,
      source: "cached",
      retrievedAt: new Date().toISOString(),
      metadata
    }));
    return true;
  } catch {
    return false;
  }
}
export function cacheAgeLabel(timestamp) {
  if (!timestamp) return "timestamp unavailable";
  const age = Math.max(0, Date.now() - new Date(timestamp).getTime());
  const minutes = Math.floor(age / 60000);
  return minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)} hr ago`;
}