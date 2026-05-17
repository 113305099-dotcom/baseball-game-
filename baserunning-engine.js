(function (global) {
  "use strict";

  function normalizeOutcome(outcome) {
    const text = String(outcome || "");
    const lower = text.toLowerCase();
    if (lower === "error" || text.includes("失誤")) return "error";
    if (text === "Walk" || text.includes("四壞") || text.includes("保送")) return "walk";
    if (text === "Single" || text.includes("一壘安打")) return "single";
    if (text === "Double" || text.includes("二壘安打")) return "double";
    if (text === "Triple" || text.includes("三壘安打")) return "triple";
    if (text === "Home Run" || text.includes("全壘打")) return "home_run";
    return "none";
  }

  function resolveAdvance(input = {}) {
    const outcomeType = normalizeOutcome(input.outcome);
    const runners = Array.isArray(input.runners) ? input.runners.slice(0, 3) : [null, null, null];
    while (runners.length < 3) runners.push(null);

    const next = runners.slice(0, 3);
    const hitter = input.hitter || null;
    const random = typeof input.rng === "function" ? input.rng : Math.random;
    const advanceBonus = Number.isFinite(Number(input.advanceBonus)) ? Number(input.advanceBonus) : 0;
    let runs = 0;

    if (outcomeType === "walk") {
      if (runners[0] && runners[1] && runners[2]) runs++;
      if (runners[0] && runners[1]) next[2] = runners[1];
      if (runners[0]) next[1] = runners[0];
      next[0] = hitter;
    } else if (outcomeType === "error") {
      next[0] = hitter;
      next[1] = runners[0] || null;
      next[2] = runners[1] || null;
      if (runners[2]) runs++;
    } else if (outcomeType === "single") {
      const extra = random() < (0.38 + advanceBonus);
      next[0] = hitter;
      next[1] = runners[0] || null;
      next[2] = runners[1] && !extra ? runners[1] : null;
      if (runners[2]) runs++;
      if (runners[1] && extra) runs++;
    } else if (outcomeType === "double") {
      const extra = random() < (0.45 + advanceBonus);
      if (runners[2]) runs++;
      if (runners[1]) runs++;
      if (runners[0] && extra) runs++;
      next[0] = null;
      next[1] = hitter;
      next[2] = runners[0] && !extra ? runners[0] : null;
    } else if (outcomeType === "triple") {
      runs += runners.filter(Boolean).length;
      next[0] = null;
      next[1] = null;
      next[2] = hitter;
    } else if (outcomeType === "home_run") {
      runs += 1 + runners.filter(Boolean).length;
      next[0] = null;
      next[1] = null;
      next[2] = null;
    }

    return {
      outcomeType,
      runners: next,
      runs,
      isHit: ["single", "double", "triple", "home_run"].includes(outcomeType)
    };
  }

  global.BaserunningEngine = {
    normalizeOutcome,
    resolveAdvance
  };
})(typeof window !== "undefined" ? window : globalThis);
