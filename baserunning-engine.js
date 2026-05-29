(function (global) {
  "use strict";

  function normalizeOutcome(outcome) {
    const text = String(outcome || "");
    const lower = text.toLowerCase();
    if (lower === "error" || text.includes("失誤")) return "error";
    if (lower === "walk" || text.includes("四壞") || text.includes("保送")) return "walk";
    if (lower === "single" || text.includes("一壘安打")) return "single";
    if (lower === "double" || text.includes("二壘安打")) return "double";
    if (lower === "triple" || text.includes("三壘安打")) return "triple";
    if (lower === "home_run" || lower === "home run" || text.includes("全壘打")) return "home_run";
    return "none";
  }

  function clamp(value, min, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
  }

  function round(value, digits = 2) {
    const m = 10 ** digits;
    return Math.round(value * m) / m;
  }

  function makeMovement(runnerId, runner, fromBase, toBase, extra = {}) {
    return {
      runnerId,
      runner,
      fromBase,
      toBase,
      scored: toBase === "home",
      ...extra
    };
  }

  function ability(player, key, fallback = 70) {
    const fromAbilities = Number(player?.abilities?.[key]);
    if (Number.isFinite(fromAbilities)) return fromAbilities;
    const fromPhysical = Number(player?.physical?.[key]);
    return Number.isFinite(fromPhysical) ? fromPhysical : fallback;
  }

  function runnerAggression(player) {
    const speed = ability(player, "speed", 70);
    const fallback = 50 + (speed - 70) * 0.35;
    return clamp(ability(player, "aggression", fallback), 5, 99);
  }

  function baserunningStyleBias(player) {
    const style = String(player?.baserunningStyle || player?.runningStyle || "").toLowerCase();
    if (style.includes("aggressive") || style.includes("激進")) return 0.08;
    if (style.includes("conservative") || style.includes("保守")) return -0.08;
    return 0;
  }

  function decideExtraBase(input) {
    const runner = input.runner;
    const speed = ability(runner, "speed", 70);
    const aggression = runnerAggression(runner);
    const advanceBonus = Number.isFinite(Number(input.advanceBonus)) ? Number(input.advanceBonus) : 0;
    const chance = clamp(
      input.baseChance
      + advanceBonus
      + (speed - 70) / 220
      + (aggression - 50) / 260
      + baserunningStyleBias(runner),
      0.06,
      0.94
    );
    const roll = input.rng();
    const action = roll < chance ? "send" : "hold";
    return {
      runnerId: input.runnerId,
      fromBase: input.fromBase,
      targetBase: input.targetBase,
      holdBase: input.holdBase,
      action,
      chance: round(chance, 3),
      roll: round(roll, 3),
      runnerSpeed: speed,
      aggression: round(aggression, 1),
      reason: input.reason || "coach_decision"
    };
  }

  function runnerTravelSec(fromBase, toBase, runner) {
    if (fromBase === toBase) return 0;
    const baseOrder = { home: 0, "1B": 1, "2B": 2, "3B": 3 };
    const fromIndex = baseOrder[fromBase] ?? 0;
    const toIndex = baseOrder[toBase] ?? 1;
    const baseSteps = toBase === "home"
      ? Math.max(1, 4 - fromIndex)
      : Math.max(1, toIndex - fromIndex);
    const speed = ability(runner, "speed", 70);
    const acceleration = Math.max(0, baseSteps - 1) * 0.12;
    const speedMps = Math.max(5.45, Math.min(8.35, 6.35 + (speed - 70) / 35 + acceleration));
    return Math.round(((27.4 * baseSteps) / speedMps) * 100) / 100;
  }

  function removeRunnerAt(result, runnerId, base) {
    const next = result.runners.slice(0, 3);
    const baseIndex = { "1B": 0, "2B": 1, "3B": 2 }[base];
    if (Number.isInteger(baseIndex)) {
      next[baseIndex] = null;
    }
    if (base === "home") {
      result.runs = Math.max(0, (result.runs || 0) - 1);
    }
    result.runners = next;
    result.movements = (result.movements || []).map(move => (
      move.runnerId === runnerId && move.toBase === base
        ? { ...move, out: true, scored: false }
        : move
    ));
    if (!Array.isArray(result.outsOnBases)) result.outsOnBases = [];
    return result;
  }

  function resolveAdvance(input = {}) {
    const outcomeType = normalizeOutcome(input.outcome);
    const runners = Array.isArray(input.runners) ? input.runners.slice(0, 3) : [null, null, null];
    while (runners.length < 3) runners.push(null);

    const next = runners.slice(0, 3);
    const hitter = input.hitter || null;
    const random = typeof input.rng === "function" ? input.rng : Math.random;
    const advanceBonus = Number.isFinite(Number(input.advanceBonus)) ? Number(input.advanceBonus) : 0;
    const movements = [];
    const decisions = [];
    let runs = 0;

    if (outcomeType === "walk") {
      if (runners[0] && runners[1] && runners[2]) runs++;
      if (runners[0] && runners[1] && runners[2]) movements.push(makeMovement("R3", runners[2], "3B", "home", { decision: { action: "forced", reason: "bases_loaded_walk" } }));
      if (runners[0] && runners[1]) {
        next[2] = runners[1];
        movements.push(makeMovement("R2", runners[1], "2B", "3B", { decision: { action: "forced", reason: "walk_force" } }));
      }
      if (runners[0]) {
        next[1] = runners[0];
        movements.push(makeMovement("R1", runners[0], "1B", "2B", { decision: { action: "forced", reason: "walk_force" } }));
      }
      next[0] = hitter;
      movements.push(makeMovement("batter", hitter, "home", "1B", { decision: { action: "batter_runner", reason: "walk" } }));
    } else if (outcomeType === "error") {
      next[0] = hitter;
      next[1] = runners[0] || null;
      next[2] = runners[1] || null;
      if (runners[2]) runs++;
      movements.push(makeMovement("batter", hitter, "home", "1B", { decision: { action: "batter_runner", reason: "error" } }));
      if (runners[0]) movements.push(makeMovement("R1", runners[0], "1B", "2B", { decision: { action: "forced", reason: "error_advancement" } }));
      if (runners[1]) movements.push(makeMovement("R2", runners[1], "2B", "3B", { decision: { action: "forced", reason: "error_advancement" } }));
      if (runners[2]) movements.push(makeMovement("R3", runners[2], "3B", "home", { decision: { action: "forced", reason: "error_advancement" } }));
    } else if (outcomeType === "single") {
      const r2Decision = runners[1] ? decideExtraBase({
        runnerId: "R2",
        runner: runners[1],
        fromBase: "2B",
        targetBase: "home",
        holdBase: "3B",
        baseChance: 0.38,
        advanceBonus,
        rng: random,
        reason: "single_from_second"
      }) : null;
      if (r2Decision) decisions.push(r2Decision);
      const extra = r2Decision?.action === "send";
      next[0] = hitter;
      next[1] = runners[0] || null;
      next[2] = runners[1] && !extra ? runners[1] : null;
      if (runners[2]) runs++;
      if (runners[1] && extra) runs++;
      movements.push(makeMovement("batter", hitter, "home", "1B", { decision: { action: "batter_runner", reason: "single" } }));
      if (runners[0]) movements.push(makeMovement("R1", runners[0], "1B", "2B", { decision: { action: "forced", reason: "single_base_to_base" } }));
      if (runners[1]) movements.push(makeMovement("R2", runners[1], "2B", extra ? "home" : "3B", { decision: r2Decision }));
      if (runners[2]) movements.push(makeMovement("R3", runners[2], "3B", "home", { decision: { action: "score", reason: "single_from_third" } }));
    } else if (outcomeType === "double") {
      const r1Decision = runners[0] ? decideExtraBase({
        runnerId: "R1",
        runner: runners[0],
        fromBase: "1B",
        targetBase: "home",
        holdBase: "3B",
        baseChance: 0.45,
        advanceBonus,
        rng: random,
        reason: "double_from_first"
      }) : null;
      if (r1Decision) decisions.push(r1Decision);
      const extra = r1Decision?.action === "send";
      if (runners[2]) runs++;
      if (runners[1]) runs++;
      if (runners[0] && extra) runs++;
      next[0] = null;
      next[1] = hitter;
      next[2] = runners[0] && !extra ? runners[0] : null;
      movements.push(makeMovement("batter", hitter, "home", "2B", { decision: { action: "batter_runner", reason: "double" } }));
      if (runners[0]) movements.push(makeMovement("R1", runners[0], "1B", extra ? "home" : "3B", { decision: r1Decision }));
      if (runners[1]) movements.push(makeMovement("R2", runners[1], "2B", "home", { decision: { action: "score", reason: "double_from_second" } }));
      if (runners[2]) movements.push(makeMovement("R3", runners[2], "3B", "home", { decision: { action: "score", reason: "double_from_third" } }));
    } else if (outcomeType === "triple") {
      runs += runners.filter(Boolean).length;
      next[0] = null;
      next[1] = null;
      next[2] = hitter;
      movements.push(makeMovement("batter", hitter, "home", "3B", { decision: { action: "batter_runner", reason: "triple" } }));
      if (runners[0]) movements.push(makeMovement("R1", runners[0], "1B", "home", { decision: { action: "score", reason: "triple_clears_bases" } }));
      if (runners[1]) movements.push(makeMovement("R2", runners[1], "2B", "home", { decision: { action: "score", reason: "triple_clears_bases" } }));
      if (runners[2]) movements.push(makeMovement("R3", runners[2], "3B", "home", { decision: { action: "score", reason: "triple_clears_bases" } }));
    } else if (outcomeType === "home_run") {
      runs += 1 + runners.filter(Boolean).length;
      next[0] = null;
      next[1] = null;
      next[2] = null;
      movements.push(makeMovement("batter", hitter, "home", "home", { decision: { action: "score", reason: "home_run" } }));
      if (runners[0]) movements.push(makeMovement("R1", runners[0], "1B", "home", { decision: { action: "score", reason: "home_run" } }));
      if (runners[1]) movements.push(makeMovement("R2", runners[1], "2B", "home", { decision: { action: "score", reason: "home_run" } }));
      if (runners[2]) movements.push(makeMovement("R3", runners[2], "3B", "home", { decision: { action: "score", reason: "home_run" } }));
    }

    return {
      outcomeType,
      runners: next,
      runs,
      movements,
      decisions,
      outsOnBases: [],
      isHit: ["single", "double", "triple", "home_run"].includes(outcomeType)
    };
  }

  global.BaserunningEngine = {
    normalizeOutcome,
    runnerTravelSec,
    removeRunnerAt,
    resolveAdvance
  };
})(typeof window !== "undefined" ? window : globalThis);
