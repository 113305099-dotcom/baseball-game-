(function (global) {
  "use strict";

  const POSITIONS = {
    P:  { x: 0,   y: 18 },
    C:  { x: 0,   y: -2 },
    "1B": { x: 30,  y: 30 },
    "2B": { x: 18,  y: 48 },
    "3B": { x: -30, y: 30 },
    SS: { x: -18, y: 48 },
    LF: { x: -58, y: 86 },
    CF: { x: 0,   y: 102 },
    RF: { x: 58,  y: 86 }
  };

  const BASE_POINTS = {
    home: { x: 0, y: 0 },
    "1B": { x: 27.4, y: 27.4 },
    "2B": { x: 0, y: 54.8 },
    "3B": { x: -27.4, y: 27.4 }
  };

  const ERROR_LABELS = {
    throw: "暴傳失誤",
    field: "漏接失誤",
    mental: "判斷失誤"
  };

  function clamp(value, min, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
  }

  function round(value, digits = 1) {
    const m = 10 ** digits;
    return Math.round(value * m) / m;
  }

  function rng(input) {
    return typeof input === "function" ? input : Math.random;
  }

  function ability(player, key, fallback = 70) {
    const fromAbilities = Number(player?.abilities?.[key]);
    if (Number.isFinite(fromAbilities)) return fromAbilities;
    const fromPhysical = Number(player?.physical?.[key]);
    return Number.isFinite(fromPhysical) ? fromPhysical : fallback;
  }

  function wallDistance(stadium, sprayDeg) {
    if (!stadium) return 100;
    const t = (clamp(sprayDeg, -45, 45) + 45) / 90;
    if (t < 0.5) return stadium.LF + (stadium.CF - stadium.LF) * (t * 2);
    return stadium.CF + (stadium.RF - stadium.CF) * ((t - 0.5) * 2);
  }

  function directionLabel(ballType, sprayDeg) {
    if (ballType === "ground") {
      if (sprayDeg < -20) return "三壘方向";
      if (sprayDeg < -5) return "游擊方向";
      if (sprayDeg < 8) return "投手前方";
      if (sprayDeg < 20) return "二壘方向";
      return "一壘方向";
    }
    if (sprayDeg < -25) return "左外野方向";
    if (sprayDeg < -8) return "左中外野方向";
    if (sprayDeg < 8) return "中外野方向";
    if (sprayDeg < 25) return "右中外野方向";
    return "右外野方向";
  }

  function classifyBallType(launchDeg) {
    if (launchDeg < 10) return "ground";
    if (launchDeg < 25) return "liner";
    if (launchDeg < 40) return "fly";
    return "popup";
  }

  function calcBattedBall(input) {
    const evKmh = Number(input.evKmh);
    const evMph = Number.isFinite(input.evMph) ? input.evMph : evKmh / 1.609344;
    const launchDeg = Number(input.launchAngleDeg);
    const rawSprayDeg = Number(input.sprayAngleDeg);
    const allowPhysicalFoul = Boolean(input.allowPhysicalFoul);
    const sprayDeg = allowPhysicalFoul ? rawSprayDeg : clamp(rawSprayDeg, -44, 44);
    const stadium = input.stadium || null;

    const evMps = evMph * 0.44704;
    const launchRad = launchDeg * Math.PI / 180;
    const gravity = 9.81;
    const ballType = classifyBallType(launchDeg);

    let distM;
    if (ballType === "ground") {
      const groundShape = clamp((launchDeg + 16) / 26, 0.35, 1.15);
      distM = clamp(evMps * 1.45 * groundShape, 12, 72);
    } else {
      distM = (evMps * evMps * Math.sin(2 * Math.max(0, launchRad))) / gravity;
      distM *= 0.65;
      if (stadium) distM *= (1 + (stadium.altitude || 0) / 10000);
    }
    if (stadium) distM *= (stadium.hrFactor || 1);

    const wallDist = wallDistance(stadium, sprayDeg);
    let hangTimeSec;
    if (ballType === "ground") {
      hangTimeSec = clamp(distM / Math.max(17, evMps * 0.72), 0.35, 1.7);
    } else {
      const verticalSpeed = Math.max(0, evMps * Math.sin(launchRad));
      hangTimeSec = clamp((2 * verticalSpeed / gravity) * 0.86, ballType === "liner" ? 0.65 : 1.2, 6.8);
    }

    let trajectoryHeightAtWall = Infinity;
    if (ballType !== "ground" && ballType !== "popup" && wallDist > 0) {
      const horizontalSpeed = evMps * Math.cos(launchRad);
      const verticalSpeed = evMps * Math.sin(launchRad);
      if (horizontalSpeed > 0) {
        const wallTime = wallDist / horizontalSpeed;
        trajectoryHeightAtWall = (verticalSpeed * wallTime - 0.5 * gravity * wallTime * wallTime) * 0.85;
      }
    }

    const fenceHeight = (stadium && stadium.fenceHeight) || 3;
    const isFoul = allowPhysicalFoul && Math.abs(rawSprayDeg) > 45;
    const isHR = !isFoul && ballType !== "ground" && ballType !== "popup"
      && distM >= wallDist && trajectoryHeightAtWall > fenceHeight;
    const hitNet = !isFoul && ballType !== "ground" && ballType !== "popup"
      && distM >= wallDist && trajectoryHeightAtWall <= fenceHeight;
    const isBarrel = evMph >= 98
      && launchDeg >= 26 - Math.floor((evMph - 98) * 1.5)
      && launchDeg <= 30 + Math.floor((evMph - 98) * 1.5);

    const sprayRad = sprayDeg * Math.PI / 180;
    const landingPoint = {
      x: Math.sin(sprayRad) * distM,
      y: Math.cos(sprayRad) * distM
    };

    return {
      ev_mph: evMph,
      evKmh,
      la_deg: launchDeg,
      sa_deg: sprayDeg,
      raw_sa_deg: rawSprayDeg,
      dist_m: Math.round(distM),
      preciseDistM: distM,
      wallDist: Math.round(wallDist),
      preciseWallDistM: wallDist,
      fenceHeight,
      trajectoryHeightAtWall: round(trajectoryHeightAtWall, 1),
      hangTimeSec: round(hangTimeSec, 2),
      landingPoint: { x: round(landingPoint.x, 1), y: round(landingPoint.y, 1) },
      ballType,
      direction: directionLabel(ballType, sprayDeg),
      isFoul,
      isHR,
      isBarrel,
      hitNet
    };
  }

  function defenseEntries(defense) {
    const assignments = defense?.assignments || {};
    return Object.entries(assignments)
      .map(([position, entry]) => ({
        position,
        player: entry?.player || entry,
        playerIndex: entry?.playerIndex,
        start: entry?.start || POSITIONS[position] || { x: 0, y: 55 }
      }))
      .filter(entry => entry.player && entry.position !== "DH");
  }

  function candidatePositions(ballInfo) {
    if (ballInfo.ballType === "ground") return ["P", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];
    if (ballInfo.ballType === "popup") return ["C", "P", "1B", "2B", "3B", "SS"];
    if (ballInfo.preciseDistM < 62) return ["P", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];
    return ["LF", "CF", "RF"];
  }

  function playPointFor(entry, ballInfo) {
    const landing = ballInfo.landingPoint;
    if (ballInfo.ballType !== "ground") return landing;
    const targetY = clamp(entry.start.y, 14, Math.max(18, landing.y));
    const ratio = landing.y > 0 ? clamp(targetY / landing.y, 0.25, 1) : 1;
    return {
      x: landing.x * ratio,
      y: landing.y * ratio
    };
  }

  function arrivalTimeFor(point, ballInfo) {
    if (ballInfo.ballType === "ground") {
      const evMps = ballInfo.ev_mph * 0.44704;
      return clamp(point.y / Math.max(16, evMps * 0.7), 0.28, 2.2);
    }
    if (ballInfo.ballType === "liner") {
      return clamp(ballInfo.hangTimeSec * 0.75, 0.55, 2.6);
    }
    return ballInfo.hangTimeSec;
  }

  function evaluateCandidate(entry, ballInfo) {
    const fielding = ability(entry.player, "fielding", 70);
    const speed = ability(entry.player, "speed", ability(entry.player, "velocity", 70));
    const arm = ability(entry.player, "arm", ability(entry.player, "velocity", 70));
    const penalty = typeof entry.player.getPositionPenalty === "function"
      ? entry.player.getPositionPenalty(entry.position)
      : 0;
    const point = playPointFor(entry, ballInfo);
    const routeDistanceM = Math.hypot(point.x - entry.start.x, point.y - entry.start.y);
    const arrivalSec = arrivalTimeFor(point, ballInfo);
    const reactionSec = clamp(0.7 - fielding / 230 - speed / 280 + penalty / 80, 0.18, 0.78);
    const speedMps = clamp(4.7 + speed / 42 + fielding / 180, 4.8, 8.3);
    const rangeMarginM = speedMps * Math.max(0, arrivalSec - reactionSec) - routeDistanceM;
    const reachChance = clamp(0.08 + (rangeMarginM + 3.5) / 10, 0.02, 0.98);
    let difficulty = 0.04;
    if (ballInfo.isBarrel) difficulty += 0.08;
    if (ballInfo.ballType === "liner") difficulty += 0.1;
    if (ballInfo.ballType === "ground" && ballInfo.ev_mph > 94) difficulty += 0.05;
    if (Math.abs(ballInfo.sa_deg) > 35) difficulty += 0.04;
    const handleChance = clamp(0.985 + (fielding - 75) / 720 - penalty / 280 - difficulty, 0.78, 0.998);
    const successScore = reachChance * handleChance;
    return {
      ...entry,
      playPoint: { x: round(point.x, 1), y: round(point.y, 1) },
      routeDistanceM: round(routeDistanceM, 1),
      arrivalSec: round(arrivalSec, 2),
      reactionSec: round(reactionSec, 2),
      rangeMarginM: round(rangeMarginM, 1),
      reachChance: round(reachChance, 3),
      handleChance: round(handleChance, 3),
      successScore: round(successScore, 3),
      arm
    };
  }

  function chooseFielder(ballInfo, defense) {
    if (ballInfo.isHR || ballInfo.isFoul) return { selected: null, candidates: [] };
    const allowed = new Set(candidatePositions(ballInfo));
    const candidates = defenseEntries(defense)
      .filter(entry => allowed.has(entry.position))
      .map(entry => evaluateCandidate(entry, ballInfo))
      .sort((a, b) =>
        (b.successScore - a.successScore)
        || (b.rangeMarginM - a.rangeMarginM)
        || (a.routeDistanceM - b.routeDistanceM)
      );
    return { selected: candidates[0] || null, candidates };
  }

  function rollFielding(selected, ballInfo, random) {
    if (!selected) return { success: false, error: null, reason: "no_fielder" };
    const reachRoll = random();
    if (reachRoll > selected.reachChance) {
      const routineEnough = selected.reachChance > 0.72 && selected.rangeMarginM > -1;
      return {
        success: false,
        error: routineEnough ? "field" : null,
        reason: "out_of_range",
        reachRoll: round(reachRoll, 3)
      };
    }
    const handleRoll = random();
    if (handleRoll <= selected.handleChance) {
      return { success: true, error: null, reason: "clean", handleRoll: round(handleRoll, 3) };
    }
    const throwErrChance = clamp(0.42 - (selected.arm - 70) / 250, 0.12, 0.58);
    const fieldErrChance = clamp(0.38 - (ability(selected.player, "fielding", 70) - 70) / 250, 0.12, 0.58);
    const errorRoll = random();
    let error = "mental";
    if (errorRoll < throwErrChance) error = "throw";
    else if (errorRoll < throwErrChance + fieldErrChance) error = "field";
    return { success: false, error, reason: "mishandled", handleRoll: round(handleRoll, 3) };
  }

  function classifyHit(ballInfo, battedBallTypeHint, random) {
    if (ballInfo.preciseDistM >= ballInfo.preciseWallDistM * 0.92) {
      return ballInfo.isBarrel && random() < 0.3 ? "triple" : "double";
    }
    if (ballInfo.preciseDistM >= ballInfo.preciseWallDistM * 0.65 || battedBallTypeHint === "liner") {
      return "double";
    }
    return "single";
  }

  function doublePlayChance(selected, ballInfo, batter) {
    const fielding = ability(selected?.player, "fielding", 70);
    const arm = ability(selected?.player, "arm", ability(selected?.player, "velocity", 70));
    const batterSpeed = ability(batter, "speed", 70);
    return clamp(0.42 + (ballInfo.ev_mph - 90) / 200 + (fielding - 70) / 250 + (arm - 70) / 250 - (batterSpeed - 70) / 200, 0.15, 0.7);
  }

  function isHandledAtFielder(result) {
    return ["ground_out", "double_play", "popup_out", "fly_out", "error"].includes(result?.code);
  }

  function runnerTravelSec(fromBase, toBase, runner) {
    const baseOrder = { home: 0, "1B": 1, "2B": 2, "3B": 3 };
    const fromIndex = baseOrder[fromBase] ?? 0;
    const toIndex = baseOrder[toBase] ?? 1;
    const baseSteps = toBase === "home"
      ? Math.max(1, 4 - fromIndex)
      : Math.max(1, toIndex - fromIndex);
    const speed = ability(runner, "speed", 70);
    const speedMps = clamp(6.35 + (speed - 70) / 35, 5.6, 8.0);
    return round((27.4 * baseSteps) / speedMps, 2);
  }

  function throwTravelSec(fromPoint, toBase, selected) {
    const to = BASE_POINTS[toBase] || BASE_POINTS["1B"];
    const arm = ability(selected?.player, "arm", ability(selected?.player, "velocity", 70));
    const throwMps = clamp(24 + (arm - 70) / 2.9, 18, 34);
    return round(Math.hypot(to.x - fromPoint.x, to.y - fromPoint.y) / throwMps, 2);
  }

  function pushRunnerEvents(events, startAt, runnerId, runner, fromBase, toBase, options = {}) {
    const travelSec = runnerTravelSec(fromBase, toBase, runner);
    events.push({
      at: round(startAt, 2),
      type: "runner_start",
      runner: runnerId,
      fromBase,
      toBase,
      point: BASE_POINTS[fromBase],
      targetPoint: BASE_POINTS[toBase]
    });
    if (options.arrives === false) return;
    events.push({
      at: round(startAt + travelSec, 2),
      type: "runner_arrives",
      runner: runnerId,
      base: toBase,
      point: BASE_POINTS[toBase]
    });
  }

  function addBatterRunnerEvents(events, result, batter) {
    if (["foul", "home_run", "fly_out", "popup_out", "net_out"].includes(result?.code)) return;
    const hitTarget = result?.hitType === "triple" ? "3B" : result?.hitType === "double" ? "2B" : "1B";
    const toBase = result?.code === "double_play" || result?.code === "ground_out" || result?.code === "error"
      ? "1B"
      : hitTarget;
    const arrives = !["double_play", "ground_out"].includes(result?.code);
    pushRunnerEvents(events, 0.12, "batter", batter, "home", toBase, { arrives });
  }

  function addForceRunnerEvents(events, result, runners) {
    if (result?.code === "double_play" && runners?.[0]) {
      pushRunnerEvents(events, 0.08, "R1", runners[0], "1B", "2B", { arrives: false });
    }
    if (result?.code === "error") {
      if (runners?.[0]) pushRunnerEvents(events, 0.08, "R1", runners[0], "1B", "2B");
      if (runners?.[1]) pushRunnerEvents(events, 0.08, "R2", runners[1], "2B", "3B");
      if (runners?.[2]) pushRunnerEvents(events, 0.08, "R3", runners[2], "3B", "home");
    }
  }

  function relayFielderFor(selectedPosition) {
    if (selectedPosition === "SS") return "2B";
    if (selectedPosition === "2B") return "SS";
    if (selectedPosition === "1B") return "SS";
    return "2B";
  }

  function pushThrowEvents(events, startAt, from, toBase, fromPoint, selected, extra = {}) {
    const arrivesAt = round(startAt + throwTravelSec(fromPoint, toBase, selected), 2);
    events.push({
      at: round(startAt, 2),
      type: "throw_start",
      from,
      toBase,
      point: fromPoint,
      targetPoint: BASE_POINTS[toBase],
      ...extra
    });
    events.push({
      at: arrivesAt,
      type: "throw_arrives",
      from,
      toBase,
      point: BASE_POINTS[toBase],
      ...extra
    });
    return arrivesAt;
  }

  function pushRunnerOut(events, at, runner, base, reason) {
    events.push({
      at: round(at, 2),
      type: "runner_out",
      runner,
      base,
      point: BASE_POINTS[base],
      reason
    });
  }

  function addThrowEvents(events, ballArrivalAt, fielding, result) {
    const selected = fielding.selected;
    if (!selected?.playPoint) return;
    if (!["ground_out", "double_play"].includes(result?.code)) return;
    if (result.code === "ground_out") {
      const throwStart = round(ballArrivalAt + 0.12, 2);
      const throwArrives = pushThrowEvents(events, throwStart, selected.position, "1B", selected.playPoint, selected);
      pushRunnerOut(events, throwArrives, "batter", "1B", "force");
      return;
    }

    const forceThrowStart = round(ballArrivalAt + 0.08, 2);
    const forceThrowArrives = pushThrowEvents(events, forceThrowStart, selected.position, "2B", selected.playPoint, selected, { sequence: "force" });
    pushRunnerOut(events, forceThrowArrives, "R1", "2B", "force");

    const relayFielder = relayFielderFor(selected.position);
    const relayThrowStart = round(forceThrowArrives + 0.28, 2);
    const relayThrowArrives = pushThrowEvents(events, relayThrowStart, relayFielder, "1B", BASE_POINTS["2B"], selected, { sequence: "relay" });
    pushRunnerOut(events, relayThrowArrives, "batter", "1B", "relay");
  }

  function buildVisualTimeline(ballInfo, fielding, result, context = {}) {
    const selected = fielding.selected;
    const handled = isHandledAtFielder(result) && selected?.playPoint;
    const ballArrivalPoint = handled ? selected.playPoint : ballInfo.landingPoint;
    const ballArrivalAt = handled ? selected.arrivalSec : ballInfo.hangTimeSec;
    const events = [
      { at: 0, type: "contact", point: { x: 0, y: 0 } },
      { at: ballArrivalAt, type: "ball_arrives", point: ballArrivalPoint }
    ];
    if (selected) {
      events.push({
        at: selected.arrivalSec,
        type: "fielder_arrives",
        fielder: selected.position,
        point: selected.playPoint
      });
    }
    addBatterRunnerEvents(events, result, context.batter);
    addForceRunnerEvents(events, result, context.runners || []);
    addThrowEvents(events, ballArrivalAt, fielding, result);
    const finishAt = Math.max(...events.map(event => Number(event.at) || 0));
    events.push({ at: round(finishAt, 2), type: result.code });
    events.sort((a, b) => (a.at || 0) - (b.at || 0));
    return { durationSec: round(Math.max(finishAt, ballArrivalAt, selected?.arrivalSec || 0), 2), events };
  }

  function resolveInPlay(input) {
    const random = rng(input.rng);
    const ballInfo = calcBattedBall({
      evKmh: input.inPlay?.evKmh,
      launchAngleDeg: input.inPlay?.launchAngleDeg,
      sprayAngleDeg: input.inPlay?.sprayAngleDeg,
      stadium: input.stadium,
      allowPhysicalFoul: input.allowPhysicalFoul
    });
    const battedBallTypeHint = input.inPlay?.battedBallTypeHint || ballInfo.ballType;
    const runners = Array.isArray(input.runners) ? input.runners : [null, null, null];
    const outs = Number.isFinite(input.outs) ? input.outs : 0;
    const timelineContext = { runners, batter: input.batter };

    if (ballInfo.isFoul) {
      const result = { code: "foul" };
      return { ballInfo, fielding: { selected: null, candidates: [], result: null }, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, { selected: null }, result, timelineContext) };
    }
    if (ballInfo.isHR) {
      const result = { code: "home_run" };
      return { ballInfo, fielding: { selected: null, candidates: [], result: null }, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, { selected: null }, result, timelineContext) };
    }
    if (ballInfo.hitNet) {
      const code = random() < 0.7 ? "net_out" : "net_double";
      const result = { code, hitType: code === "net_double" ? "double" : null };
      return { ballInfo, fielding: { selected: null, candidates: [], result: null }, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, { selected: null }, result, timelineContext) };
    }

    const fielding = chooseFielder(ballInfo, input.defense);
    const fieldingResult = rollFielding(fielding.selected, ballInfo, random);
    fielding.result = fieldingResult;

    if (!fieldingResult.success && fieldingResult.error) {
      const result = { code: "error", error: fieldingResult.error, hitType: "single" };
      return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
    }

    if (ballInfo.ballType === "ground") {
      if (fieldingResult.success) {
        const canDoublePlay = Boolean(runners[0]) && outs < 2;
        const dpChance = canDoublePlay ? doublePlayChance(fielding.selected, ballInfo, input.batter) : 0;
        if (canDoublePlay && random() < dpChance) {
          const result = { code: "double_play", outCount: 2, doublePlayChance: round(dpChance, 3) };
          return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
        }
        const result = { code: "ground_out", outCount: 1 };
        return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
      }
      const result = { code: "hit", hitType: "single" };
      return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
    }

    if (battedBallTypeHint === "popup") {
      const result = fieldingResult.success
        ? { code: "popup_out", outCount: 1 }
        : { code: "hit", hitType: "single" };
      return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
    }

    if (fieldingResult.success && ballInfo.preciseDistM < ballInfo.preciseWallDistM * 0.85) {
      const result = { code: "fly_out", outCount: 1 };
      return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
    }

    const hitType = classifyHit(ballInfo, battedBallTypeHint, random);
    const result = { code: "hit", hitType };
    return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
  }

  global.FieldingEngine = {
    POSITIONS,
    BASE_POINTS,
    ERROR_LABELS,
    calcBattedBall,
    resolveInPlay
  };
})(typeof window !== "undefined" ? window : globalThis);
