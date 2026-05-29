(function (global) {
  "use strict";

  const STORAGE_KEY = "nccuBaseballDebugPanel";
  let panel = null;
  let timer = null;

  function isEnabled() {
    try {
      const params = new URLSearchParams(global.location?.search || "");
      return params.get("debug") === "1" || global.localStorage?.getItem(STORAGE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function valueText(value, fallback = "-") {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
    return String(value);
  }

  function eventSummary(events = []) {
    return events.map(event => `${event.type}@${valueText(event.at)}`).join(" | ") || "-";
  }

  function candidateSummary(candidates = []) {
    return candidates.slice(0, 4).map(candidate => {
      return `${candidate.position}:${valueText(candidate.successScore)} r${valueText(candidate.routeDistanceM)} m${valueText(candidate.rangeMarginM)}`;
    }).join(" | ") || "-";
  }

  function throwSummary(events = []) {
    return events
      .filter(event => event.type === "throw_start")
      .map(event => {
        const sequence = event.sequence ? `/${event.sequence}` : "";
        const target = event.toFielder || event.toBase;
        return `${valueText(event.at)} ${event.from}->${target}${sequence}`;
      })
      .join(" | ") || "-";
  }

  function runnerOutSummary(events = []) {
    return events
      .filter(event => event.type === "runner_out")
      .map(event => `${valueText(event.at)} ${event.runner}@${event.base}`)
      .join(" | ") || "-";
  }

  function fielderRouteSummary(events = []) {
    return events
      .filter(event => event.type === "fielder_start")
      .map(event => {
        const role = event.role ? `/${event.role}` : "";
        const outcome = event.outcome ? `/${event.outcome}` : "";
        return `${event.fielder}${role}${outcome}->${valueText(event.arrivesAt)}`;
      })
      .join(" | ") || "-";
  }

  function runnerDecisionSummary(decisions = []) {
    return decisions
      .filter(decision => decision.action === "send" || decision.action === "hold")
      .map(decision => `${decision.runnerId}:${decision.action}->${decision.targetBase} p${valueText(decision.chance)}`)
      .join(" | ") || "-";
  }

  function slideSummary(events = []) {
    return events
      .filter(event => event.type === "runner_slide")
      .map(event => `${valueText(event.at)} ${event.runner}@${event.base}/${event.slide || "slide"}`)
      .join(" | ") || "-";
  }

  function snapshot(game = global.game) {
    const pitch = game?.lastPitchContext || {};
    const ip = game?.lastInPlayContext || {};
    const selected = ip.fielding?.selected || null;
    const primaryAttempt = ip.fielding?.primaryAttempt || null;
    const events = ip.visualTimeline?.events || [];
    return {
      pitch: {
        outcome: pitch.pitchOutcome || null,
        zone: pitch.zone ?? null,
        didSwing: Boolean(pitch.didSwing),
        contact: pitch.finalContactScore ?? null
      },
      inPlay: {
        code: ip.playResult?.code || null,
        hitType: ip.playResult?.hitType || null,
        fielder: selected ? selected.position : null,
        fielderName: selected?.player?.name || null,
        primaryAttempt: primaryAttempt ? primaryAttempt.position : null,
        ballType: ip.ballInfo?.ballType || null,
        distanceM: ip.ballInfo?.dist_m ?? null,
        surface: ip.ballInfo?.surface || null,
        ground: ip.ballInfo?.groundProfile || null,
        flight: ip.ballInfo?.flightProfile || null,
        throwDecision: ip.playResult?.throwDecision || null,
        runnerDecisions: ip.playResult?.advanceResult?.decisions || [],
        slides: events.filter(event => event.type === "runner_slide"),
        fielderRoutes: events.filter(event => event.type === "fielder_start"),
        candidates: (ip.fielding?.candidates || []).slice(0, 6).map(candidate => ({
          position: candidate.position,
          score: candidate.successScore,
          routeM: candidate.routeDistanceM,
          marginM: candidate.rangeMarginM,
          arrivalSec: candidate.arrivalSec,
          ballSpeedKmh: candidate.ballArrivalSpeedKmh ?? null
        })),
        events
      }
    };
  }

  function render(game) {
    if (!panel || !game) return;
    const pitch = game.lastPitchContext || {};
    const ip = game.lastInPlayContext || {};
    const selected = ip.fielding?.selected || null;
    const primaryAttempt = ip.fielding?.primaryAttempt || null;
    const events = ip.visualTimeline?.events || [];
    const rows = [
      ["Pitch", valueText(pitch.pitchOutcome)],
      ["Zone", valueText(pitch.zone)],
      ["Swing", pitch.didSwing ? "yes" : "no"],
      ["Contact", valueText(pitch.finalContactScore)],
      ["InPlay", valueText(ip.playResult?.code)],
      ["Hit", valueText(ip.playResult?.hitType)],
      ["Fielder", selected ? `${selected.position} ${selected.player?.name || ""}`.trim() : "-"],
      ["Attempt", primaryAttempt ? `${primaryAttempt.position} ${valueText(primaryAttempt.ballArrivalSpeedKmh)}km/h` : "-"],
      ["Ball", ip.ballInfo ? `${ip.ballInfo.ballType || "-"} ${valueText(ip.ballInfo.dist_m)}m` : "-"],
      ["Surface", ip.ballInfo?.surface ? `${ip.ballInfo.surface.key} drag ${valueText(ip.ballInfo.surface.airDrag)}` : "-"],
      ["Candidates", candidateSummary(ip.fielding?.candidates)],
      ["Routes", fielderRouteSummary(events)],
      ["Throws", throwSummary(events)],
      ["ThrowDecision", ip.playResult?.throwDecision ? `${ip.playResult.throwDecision.targetRunner}->${ip.playResult.throwDecision.targetBase} ${ip.playResult.throwDecision.outcome} m${valueText(ip.playResult.throwDecision.marginSec)}` : "-"],
      ["RunnerAI", runnerDecisionSummary(ip.playResult?.advanceResult?.decisions)],
      ["Slides", slideSummary(events)],
      ["RunnerOut", runnerOutSummary(events)],
      ["Timeline", eventSummary(events)]
    ];
    panel.innerHTML = `
      <div class="debug-title">Engine Debug</div>
      ${rows.map(([label, value]) => `<div class="debug-row"><b>${label}</b><span>${value}</span></div>`).join("")}
      <div class="debug-hint">Ctrl+Shift+D toggle</div>
    `;
  }

  function ensurePanel() {
    if (panel || typeof document === "undefined") return panel;
    panel = document.createElement("aside");
    panel.id = "engine-debug-panel";
    panel.style.cssText = [
      "position:fixed",
      "right:12px",
      "bottom:12px",
      "z-index:99999",
      "width:min(420px,calc(100vw - 24px))",
      "max-height:45vh",
      "overflow:auto",
      "padding:10px 12px",
      "border:1px solid rgba(148,163,184,.45)",
      "background:rgba(8,13,26,.92)",
      "color:#dbeafe",
      "font:12px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace",
      "box-shadow:0 10px 28px rgba(0,0,0,.35)",
      "pointer-events:auto"
    ].join(";");
    const style = document.createElement("style");
    style.textContent = `
      #engine-debug-panel .debug-title{font-weight:700;color:#fbbf24;margin-bottom:6px}
      #engine-debug-panel .debug-row{display:grid;grid-template-columns:72px 1fr;gap:8px;border-top:1px solid rgba(148,163,184,.16);padding:3px 0}
      #engine-debug-panel .debug-row b{color:#93c5fd;font-weight:600}
      #engine-debug-panel .debug-row span{word-break:break-word}
      #engine-debug-panel .debug-hint{margin-top:6px;color:#94a3b8}
    `;
    document.head.appendChild(style);
    document.body.appendChild(panel);
    return panel;
  }

  function enable() {
    try { global.localStorage?.setItem(STORAGE_KEY, "1"); } catch (_) {}
    ensurePanel();
    if (timer) global.clearInterval(timer);
    timer = global.setInterval(() => render(global.game), 250);
    render(global.game);
  }

  function disable() {
    try { global.localStorage?.removeItem(STORAGE_KEY); } catch (_) {}
    if (timer) global.clearInterval(timer);
    timer = null;
    if (panel) panel.remove();
    panel = null;
  }

  function toggle() {
    if (panel) disable();
    else enable();
  }

  function boot() {
    document.addEventListener("keydown", event => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        toggle();
      }
    });
    if (isEnabled()) enable();
  }

  global.GameDebugPanel = { enable, disable, toggle, render, snapshot };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
