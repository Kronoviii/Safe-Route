import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Activity, AlertTriangle, ArrowUpRight, Clock3, Compass, Database, MapPin, Moon, Route as RouteIcon, ShieldCheck, SlidersHorizontal, Zap } from "lucide-react";
import { demoRoutes, initialHazards } from "./modules/demoData.js";
import { attachSimulatedEvidence } from "./modules/demoEvidence.js";
import { DEFAULT_WEIGHTS, MIN_COVERAGE, rankRoutes } from "./modules/scoring.js";
import { fetchWalkingRoutes, geocodeOne } from "./modules/routing.js";
import { readRouteCache, writeRouteCache, cacheAgeLabel } from "./modules/cache.js";

const startDefault = { lat: 26.9124, lng: 75.7873, label: "Jaipur demo start" };
const endDefault = { lat: 26.9180, lng: 75.7972, label: "Jaipur demo destination" };
const pinIcon = L.divIcon({ className: "hazard-marker", html: "!", iconSize: [28, 28], iconAnchor: [14, 14] });

function FitBounds({ routes }) {
  const map = useMap();
  useEffect(() => {
    const points = routes.flatMap(r => r.coordinates || []);
    if (points.length) map.fitBounds(points, { padding: [36, 36], maxZoom: 16 });
  }, [map, routes]);
  return null;
}

function Metric({ icon: Icon, label, value, hint }) {
  return <div className="metric"><div className="metric-icon"><Icon size={16}/></div><div><div className="metric-label">{label}</div><div className="metric-value">{value}</div>{hint && <div className="metric-hint">{hint}</div>}</div></div>;
}

export default function App() {
  const [routes, setRoutes] = useState(demoRoutes);
  const [source, setSource] = useState("demo");
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const [selected, setSelected] = useState("lit");
  const [startText, setStartText] = useState("MI Road, Jaipur");
  const [endText, setEndText] = useState("Hawa Mahal, Jaipur");
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [hazards, setHazards] = useState(initialHazards);
  const [time, setTime] = useState("23:00");
  const [status, setStatus] = useState("Demo mode: route fixtures are illustrative, not verified safety observations.");
  const [busy, setBusy] = useState(false);
  const [liveStart, setLiveStart] = useState(null);
  const [liveEnd, setLiveEnd] = useState(null);
  const [showWeights, setShowWeights] = useState(false);
  const [addHazardMode, setAddHazardMode] = useState(false);

  const scored = useMemo(() => rankRoutes(routes, weights, hazards), [routes, weights, hazards]);
  const chosen = scored.find(r => r.id === selected) || scored[0];
  const apiKey = import.meta.env.VITE_ORS_API_KEY;

  useEffect(() => {
    const cached = readRouteCache();
    if (cached && source === "demo") {
      // Don't silently replace explicit demo fixtures with older data; cache is used only after live failure.
      setCacheTimestamp(cached.retrievedAt || null);
    }
  }, [source]);

  async function useLiveRouting() {
  setBusy(true);
  setStatus("Looking up locations and requesting walking routes…");

  const controller = new AbortController();

  try {
    if (!apiKey) {
      throw new Error(
        "No OpenRouteService key configured; showing cached or demo routes."
      );
    }

    const start = await geocodeOne(
      `${startText}, Jaipur, India`,
      controller.signal
    );

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const end = await geocodeOne(
      `${endText}, Jaipur, India`,
      controller.signal
    );

    setLiveStart(start);
    setLiveEnd(end);

    const live = await fetchWalkingRoutes({
      start,
      end,
      apiKey,
      signal: controller.signal
    });


setStatus("Walking routes found. Applying clearly labeled simulated evidence for the demo…");

    // Demo-only fictional indicators make the assessment UI demonstrable.
    // They are not fetched from OSM and are not observations of these streets.
    const assessedRoutes = live.map((route, index) =>
      attachSimulatedEvidence(route, index)
    );

    setRoutes(assessedRoutes);
    setSource("live");
    setSelected(assessedRoutes[0]?.id);

    const saved = writeRouteCache(assessedRoutes, {
      start,
      end,
      startText,
      endText
    });

    setCacheTimestamp(saved ? new Date().toISOString() : null);

    setStatus(
      `Live routing succeeded: ${assessedRoutes.length} route(s). ` +
      "Evidence indicators are simulated demonstration data, not real street observations."
    );
  } catch (error) {
    const cached = readRouteCache();

    if (cached?.routes?.length) {
      setRoutes(cached.routes);
      setSource("cached");
      setCacheTimestamp(cached.retrievedAt || null);
      setSelected(cached.routes[0].id);
      setStatus(
        `Live routing failed; showing saved routes. ${error.message}`
      );
    } else {
      setRoutes(demoRoutes);
      setSource("demo");
      setStatus(
        `Live routing unavailable; showing demo routes. ${error.message}`
      );
    }
  } finally {
    setBusy(false);
  }
}

  function addHazard(event) {
    if (!addHazardMode) return;
    const { lat, lng } = event.latlng;
    const hazard = {
      id: `user-${Date.now()}`, type: "User-added hazard", lat, lng,
      createdAt: new Date().toLocaleString(), status: "Unverified user report", demo: false
    };
    setHazards(previous => [...previous, hazard]);
    setAddHazardMode(false);
    setStatus("Hazard added as an unverified report. Nearby route assessments updated; no automatic reroute is claimed.");
  }

  function changeWeight(key, value) {
    setWeights(previous => ({ ...previous, [key]: Number(value) }));
  }

  const fastest = [...scored].sort((a, b) => a.durationMin - b.durationMin)[0];
  const eligibleCount = scored.filter(r => r.eligible).length;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><ShieldCheck size={22}/></div><div><div className="brand-name">SafeRoute</div><div className="brand-sub">NIGHT WALKING, BETTER INFORMED</div></div></div>
        <div className="side-label">YOUR JOURNEY</div>
        <label className="field-label" htmlFor="start">Starting point</label>
        <div className="location-input"><span className="dot start-dot"/><input id="start" value={startText} onChange={e => setStartText(e.target.value)} /></div>
        <label className="field-label" htmlFor="end">Destination</label>
        <div className="location-input"><span className="dot end-dot"/><input id="end" value={endText} onChange={e => setEndText(e.target.value)} /></div>
        <button className="primary-btn" onClick={useLiveRouting} disabled={busy}>
          <Compass size={17}/>{busy ? "Finding routes…" : "Find walking routes"}<ArrowUpRight size={16}/>
        </button>
        <div className="field-note">Live mode needs an OpenRouteService key in <code>.env.local</code>. Demo mode works without one.</div>

        <div className="section-divider"/>
        <div className="section-heading"><span>DEPARTURE TIME</span><Moon size={15}/></div>
        <select value={time} onChange={e => { setTime(e.target.value); setStatus(`Departure preference set to ${e.target.value}. Time-specific real-world activity data is not connected in this prototype.`); }}>
          <option value="20:00">8:00 PM</option><option value="23:00">11:00 PM</option><option value="01:00">1:00 AM</option>
        </select>
        <p className="field-note">Departure time is a demo preference only; simulated activity values are not time-specific observations.</p>

        <div className="section-divider"/>
        <button className="section-heading section-button" onClick={() => setShowWeights(!showWeights)}><span>ROUTE PREFERENCES</span><SlidersHorizontal size={16}/></button>
        {showWeights && <div className="weights-panel">
          {Object.entries(weights).map(([key, value]) => <label className="weight-row" key={key}><span>{key === "activity" ? "Activity proxy" : key[0].toUpperCase() + key.slice(1)} <b>{value}%</b></span><input type="range" min="0" max="100" step="5" value={value} onChange={e => changeWeight(key, e.target.value)}/></label>)}
          <p className="field-note">Weights affect simulated demonstration indicators only; they do not establish real-world safety.</p>
        </div>}

        <div className="section-divider"/>
        <div className="section-heading"><span>CROWDGUARD</span><Activity size={15}/></div>
        <p className="field-note">Add a pin on the map to report an observed concern. Reports are unverified unless explicitly reviewed.</p>
        <button className={`secondary-btn ${addHazardMode ? "active" : ""}`} onClick={() => setAddHazardMode(!addHazardMode)}><MapPin size={16}/>{addHazardMode ? "Click map to place pin" : "Add a hazard pin"}</button>
        <div className="hazard-count">{hazards.length} report(s) shown <span>• demo data included</span></div>

        <div className="sidebar-footer"><span className={`status-dot ${source}`}/><div><b>{source === "live" ? "LIVE ROUTES" : source === "cached" ? "CACHED ROUTES" : "DEMO MODE"}</b><small>{source === "cached" ? `Saved ${cacheAgeLabel(cacheTimestamp)}` : source === "live" ? "Routing API response" : "Illustrative route fixtures"}</small></div></div>
      </aside>

      <section className="main-panel">
        <header className="topbar"><div><div className="eyebrow">URBAN SAFETY · SMART CITY</div><h1>Choose your route with <span>more context.</span></h1><p>Compare routes using travel time, distance, and clearly labeled simulated demo indicators.</p></div><div className="topbar-chip"><span className={`status-dot ${source}`}/>{source === "live" ? "Live routing" : source === "cached" ? "Cached response" : "Prototype data"}</div></header>
        <div className="notice"><AlertTriangle size={17}/><span><b>SIMULATED DEMO DATA.</b> Evidence percentages and factor indicators are fictional UI examples, not verified observations about these streets. SafeRoute does not guarantee safety.</span></div>
        <div className="workspace">
          <section className="map-card">
            <div className="map-toolbar"><div><MapPin size={15}/><span>{source === "live" && liveStart ? "Live Jaipur route" : "Jaipur route preview"}</span></div><span className="map-legend"><i className="legend-blue"/> Fastest baseline <i className="legend-green"/> Other route</span></div>
            <MapContainer center={[26.915, 75.792]} zoom={15} scrollWheelZoom className="leaflet-map" whenReady={() => {}}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
              <FitBounds routes={scored}/>
              {scored.map(route => <Polyline key={route.id} positions={route.coordinates} pathOptions={{ color: route.id === chosen?.id ? route.color : "#64748b", weight: route.id === chosen?.id ? 6 : 3, opacity: route.id === chosen?.id ? 0.95 : 0.42 }} eventHandlers={{ click: () => setSelected(route.id) }}/>)}
              {hazards.map(h => <Marker key={h.id} position={[h.lat, h.lng]} icon={pinIcon}><Popup><b>{h.type}</b><br/>{h.status}<br/>{h.createdAt}</Popup></Marker>)}
              <MapClickHandler enabled={addHazardMode} onClick={addHazard}/>
            </MapContainer>
            <div className="map-caption"><span><i className="legend-hazard"/> Hazard report</span><span>Map tiles require an internet connection.</span></div>
          </section>
          <aside className="route-list">
            <div className="route-list-head"><div><div className="eyebrow">ROUTE OPTIONS</div><h2>Compare your paths</h2></div><span className="route-count">{scored.length}</span></div>
            <div className="baseline-note"><Zap size={15}/><span>Fastest baseline: <b>{fastest?.durationMin ?? "—"} min</b></span></div>
            {scored.map((route, index) => <button key={route.id} className={`route-card ${selected === route.id ? "selected" : ""}`} onClick={() => setSelected(route.id)}>
              <div className="route-card-top"><span className="route-line" style={{ background: route.color }}/><span className="route-name">{route.name}</span><span className="fastest-tag">SIMULATED</span>{route.id === fastest?.id && <span className="fastest-tag">FASTEST</span>}</div>
              <div className="route-metrics"><b>{route.durationMin} <small>min</small></b><span>{(route.distanceM / 1000).toFixed(2)} km</span></div>
              <div className="coverage-row"><span>Demo evidence coverage</span><b>{route.evidenceCoverage}%</b></div>
              <div className="coverage-bar"><div style={{ width: `${route.evidenceCoverage}%` }}/></div>
              <div className={`route-status ${route.eligible ? "eligible" : "limited"}`}>{route.eligible ? "Demo threshold met" : "Demo evidence limited"}</div>
              {route.nearbyHazards.length > 0 && <div className="hazard-warning"><AlertTriangle size={13}/> {route.nearbyHazards.length} nearby report(s) — review details</div>}
              <div className="route-note">{route.note}</div>


            </button>)}
            <div className="coverage-footnote"><Database size={14}/><span>{eligibleCount} of {scored.length} routes meet the illustrative {MIN_COVERAGE}% demo threshold. All factor values are simulated, not real observations.</span></div>
          </aside>
        </div>

        {chosen && <section className="detail-panel">
          <div className="detail-heading"><div><div className="eyebrow">SELECTED ROUTE</div><h2>{chosen.name}</h2></div><span className={`pill ${chosen.eligible ? "pill-good" : "pill-warn"}`}>{chosen.eligible ? "Demo threshold met" : "Demo evidence limited"}</span></div>
          <div className="detail-grid">
            <Metric icon={Clock3} label="Estimated walk" value={`${chosen.durationMin} min`} hint="Routing estimate"/>
            <Metric icon={RouteIcon} label="Distance" value={`${(chosen.distanceM / 1000).toFixed(2)} km`} hint="Route geometry"/>
<Metric
  icon={Database}
  label="Demo evidence coverage"
  value={`${chosen.evidenceCoverage}%`}
  hint="Simulated value — not real data"
/>
            <Metric icon={Activity} label="Reported hazards nearby" value={chosen.nearbyHazards.length} hint="Reports may be unverified"/>
          </div>
          <div className="factor-grid">
            {Object.entries(chosen.factorCoverage).map(([factor, value]) => <div className="factor" key={factor}><div className="factor-top"><span>{factor === "activity" ? "Activity proxy" : factor[0].toUpperCase() + factor.slice(1)}</span><b>{value > 0 ? `${value}% coverage` : "Unknown"}</b></div><div className="factor-bar"><div style={{ width: `${value}%` }}/></div><small>{chosen.factors[factor] || "No evidence attached"}</small></div>)}
          </div>
          <div className="disclaimer">SIMULATED DEMO: coverage, lighting, road, and activity indicators are fictional examples used to demonstrate the interface. Live routing provides actual route geometry, distance, and duration only. These indicators are not verified street observations or a safety prediction.</div>
        </section>}
        <div className="status-line" role="status" aria-live="polite">{status}</div>
        <footer>SAFEROUTE · HACKATHON PROTOTYPE <span>Built around transparency, not false certainty.</span></footer>
      </section>
    </main>
  );
}

function MapClickHandler({ enabled, onClick }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    map.on("click", onClick);
    map.getContainer().style.cursor = "crosshair";
    return () => {
      map.off("click", onClick);
      map.getContainer().style.cursor = "";
    };
  }, [enabled, map, onClick]);
  return null;
}