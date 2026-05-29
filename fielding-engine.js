(function (global) {
  "use strict";

  const POSITIONS = {
    P:  { x: 0,   y: 18 },
    C:  { x: 0,   y: -2 },
    "1B": { x: 30,  y: 30 },
    "2B": { x: 18,  y: 48 },
    "3B": { x: -30, y: 30 },
    SS: { x: -18, y: 48 },
    LF: { x: -50, y: 72 },
    CF: { x: 0,   y: 86 },
    RF: { x: 50,  y: 72 }
  };

  const BASE_POINTS = {
    home: { x: 0, y: 0 },
    "1B": { x: 27.4, y: 27.4 },
    "2B": { x: 0, y: 54.8 },
    "3B": { x: -27.4, y: 27.4 }
  };

  const DEFAULT_SURFACE_PHYSICS = {
    label: "standard grass",
    restitution: 0.72,
    dirtFrictionMps2: 5.25,
    grassFrictionMps2: 3.65,
    rollSpeedScale: 1,
    bounceRandomness: 0.03,
    airDrag: 0.03
  };

  const ERROR_LABELS = {
    throw: "暴傳失誤",
    field: "漏接失誤",
    mental: "判斷失誤"
  };
  const PhysicsEngine = global.BaseballPhysicsEngine || null;

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

  function isInfieldPosition(position) {
    return ["P", "1B", "2B", "3B", "SS"].includes(position);
  }

  function isOutfieldPosition(position) {
    return ["LF", "CF", "RF"].includes(position);
  }

  function wallDistance(stadium, sprayDeg) {
    if (PhysicsEngine?.wallDistance) return PhysicsEngine.wallDistance(stadium, sprayDeg);
    if (!stadium) return 100;
    const t = (clamp(sprayDeg, -45, 45) + 45) / 90;
    if (t < 0.5) return stadium.LF + (stadium.CF - stadium.LF) * (t * 2);
    return stadium.CF + (stadium.RF - stadium.CF) * ((t - 0.5) * 2);
  }

  function surfaceKeyFor(stadium) {
    const explicit = String(stadium?.surfacePhysicsKey || stadium?.surfaceKey || "").trim().toLowerCase();
    if (explicit) return explicit;
    const text = `${stadium?.surface || ""} ${stadium?.name || ""}`.toLowerCase();
    if (!text.trim()) return "default";
    if (text.includes("dome") || text.includes("indoor") || text.includes("室內")) return "dome";
    if (text.includes("artificial") || text.includes("turf") || text.includes("人工")) return "artificial";
    if (text.includes("mixed") || text.includes("dirt") || text.includes("紅土") || text.includes("+")) return "mixed";
    if (text.includes("natural") || text.includes("grass") || text.includes("天然")) return "natural";
    return "default";
  }

  function surfacePhysicsFor(stadium) {
    if (PhysicsEngine?.surfacePhysicsFor) {
      return PhysicsEngine.surfacePhysicsFor(stadium, { registry: global.FIELD_SURFACE_PHYSICS });
    }
    const key = surfaceKeyFor(stadium);
    const registry = global.FIELD_SURFACE_PHYSICS || {};
    const physics = {
      ...DEFAULT_SURFACE_PHYSICS,
      ...(registry.default || {}),
      ...(registry[key] || {}),
      ...(stadium?.surfacePhysics || {})
    };
    return {
      key,
      label: physics.label || key,
      restitution: clamp(physics.restitution, 0.5, 0.9),
      dirtFrictionMps2: clamp(physics.dirtFrictionMps2, 3.2, 8.5),
      grassFrictionMps2: clamp(physics.grassFrictionMps2, 2.4, 7.5),
      rollSpeedScale: clamp(physics.rollSpeedScale, 0.75, 1.25),
      bounceRandomness: clamp(physics.bounceRandomness, 0, 0.12),
      airDrag: clamp(physics.airDrag, 0.018, 0.055)
    };
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
    if (PhysicsEngine?.classifyBallType) return PhysicsEngine.classifyBallType(launchDeg);
    if (launchDeg < 10) return "ground";
    if (launchDeg < 25) return "liner";
    if (launchDeg < 40) return "fly";
    return "popup";
  }

  function solveDecelTime(distanceM, startSpeedMps, decelMps2) {
    if (PhysicsEngine?.solveDecelTime) return PhysicsEngine.solveDecelTime(distanceM, startSpeedMps, decelMps2);
    if (distanceM <= 0) return { timeSec: 0, endSpeedMps: startSpeedMps, reached: true };
    const stopDistanceM = (startSpeedMps * startSpeedMps) / (2 * decelMps2);
    if (distanceM >= stopDistanceM) {
      return { timeSec: startSpeedMps / decelMps2, endSpeedMps: 0, reached: false };
    }
    const endSpeedMps = Math.sqrt(Math.max(0, startSpeedMps * startSpeedMps - 2 * decelMps2 * distanceM));
    return {
      timeSec: (startSpeedMps - endSpeedMps) / decelMps2,
      endSpeedMps,
      reached: true
    };
  }

  function buildGroundProfile(evMps, launchDeg, surfacePhysics = DEFAULT_SURFACE_PHYSICS) {
    if (PhysicsEngine?.buildGroundProfile) return PhysicsEngine.buildGroundProfile(evMps, launchDeg, surfacePhysics);
    const surface = { ...DEFAULT_SURFACE_PHYSICS, ...surfacePhysics };
    const launchRad = Math.max(0, launchDeg) * Math.PI / 180;
    const horizontalMps = Math.max(8, evMps * Math.cos(launchRad) * 0.94);
    const verticalMps = Math.max(0, evMps * Math.sin(launchRad));
    const firstBounceTimeSec = verticalMps > 0.35 ? clamp((2 * verticalMps / 9.81) * 0.86, 0, 0.85) : 0;
    const airDragLoss = clamp(1 - firstBounceTimeSec * surface.airDrag * 1.8, 0.88, 1);
    const firstBounceDistanceM = round(horizontalMps * firstBounceTimeSec * airDragLoss, 2);
    const restitution = clamp(surface.restitution - Math.max(0, launchDeg) * 0.012, 0.52, 0.86);
    const rollStartSpeedMps = clamp(horizontalMps * restitution * surface.rollSpeedScale, 5, 38);
    const dirtFrictionMps2 = surface.dirtFrictionMps2;
    const grassFrictionMps2 = surface.grassFrictionMps2;
    const infieldLimitM = 58;
    const dirtDistanceM = Math.max(0, infieldLimitM - firstBounceDistanceM);
    const dirt = solveDecelTime(dirtDistanceM, rollStartSpeedMps, dirtFrictionMps2);
    let rollDistanceM;
    let rollTimeSec;
    if (dirt.reached) {
      const grassDistanceM = (dirt.endSpeedMps * dirt.endSpeedMps) / (2 * grassFrictionMps2);
      rollDistanceM = dirtDistanceM + grassDistanceM;
      rollTimeSec = dirt.timeSec + (dirt.endSpeedMps / grassFrictionMps2);
    } else {
      rollDistanceM = (rollStartSpeedMps * rollStartSpeedMps) / (2 * dirtFrictionMps2);
      rollTimeSec = rollStartSpeedMps / dirtFrictionMps2;
    }
    return {
      surfaceKey: surface.key || "default",
      surfaceLabel: surface.label || "standard grass",
      horizontalMps: round(horizontalMps, 2),
      airDrag: surface.airDrag,
      firstBounceTimeSec: round(firstBounceTimeSec, 2),
      firstBounceDistanceM,
      restitution: round(restitution, 3),
      rollStartSpeedMps: round(rollStartSpeedMps, 2),
      dirtFrictionMps2,
      grassFrictionMps2,
      rollSpeedScale: surface.rollSpeedScale,
      bounceRandomness: surface.bounceRandomness,
      infieldLimitM,
      stopDistanceM: round(firstBounceDistanceM + rollDistanceM, 2),
      stopTimeSec: round(firstBounceTimeSec + rollTimeSec, 2)
    };
  }

  function groundStateAtDistance(ballInfo, distanceM) {
    if (PhysicsEngine?.groundStateAtDistance) return PhysicsEngine.groundStateAtDistance(ballInfo, distanceM);
    const profile = ballInfo.groundProfile;
    if (!profile) return null;
    const distance = Math.max(0, distanceM);
    if (distance <= profile.firstBounceDistanceM) {
      const timeSec = profile.horizontalMps > 0 ? distance / profile.horizontalMps : 0;
      const speedMps = profile.horizontalMps * clamp(1 - timeSec * (profile.airDrag || 0.03) * 1.8, 0.84, 1);
      return { timeSec, speedMps, reached: true, phase: "air" };
    }
    const rollDistance = distance - profile.firstBounceDistanceM;
    const dirtDistance = Math.max(0, profile.infieldLimitM - profile.firstBounceDistanceM);
    if (rollDistance <= dirtDistance) {
      const dirt = solveDecelTime(rollDistance, profile.rollStartSpeedMps, profile.dirtFrictionMps2);
      return {
        timeSec: profile.firstBounceTimeSec + dirt.timeSec,
        speedMps: dirt.endSpeedMps,
        reached: dirt.reached,
        phase: "dirt"
      };
    }
    const dirt = solveDecelTime(dirtDistance, profile.rollStartSpeedMps, profile.dirtFrictionMps2);
    if (!dirt.reached) {
      return {
        timeSec: profile.firstBounceTimeSec + dirt.timeSec,
        speedMps: 0,
        reached: false,
        phase: "stopped"
      };
    }
    const grass = solveDecelTime(rollDistance - dirtDistance, dirt.endSpeedMps, profile.grassFrictionMps2);
    return {
      timeSec: profile.firstBounceTimeSec + dirt.timeSec + grass.timeSec,
      speedMps: grass.endSpeedMps,
      reached: grass.reached,
      phase: grass.reached ? "grass" : "stopped"
    };
  }

  function pointAtDistance(sprayDeg, distanceM) {
    if (PhysicsEngine?.pointAtDistance) return PhysicsEngine.pointAtDistance(sprayDeg, distanceM);
    const sprayRad = sprayDeg * Math.PI / 180;
    return {
      x: round(Math.sin(sprayRad) * distanceM, 1),
      y: round(Math.cos(sprayRad) * distanceM, 1)
    };
  }

  function calcBattedBall(input) {
    if (PhysicsEngine?.calcBattedBall) {
      return PhysicsEngine.calcBattedBall({
        ...input,
        surfaceRegistry: global.FIELD_SURFACE_PHYSICS
      });
    }
    const evKmh = Number(input.evKmh);
    const evMph = Number.isFinite(input.evMph) ? input.evMph : evKmh / 1.609344;
    const launchDeg = Number(input.launchAngleDeg);
    const rawSprayDeg = Number(input.sprayAngleDeg);
    const allowPhysicalFoul = Boolean(input.allowPhysicalFoul);
    const sprayDeg = allowPhysicalFoul ? rawSprayDeg : clamp(rawSprayDeg, -44, 44);
    const stadium = input.stadium || null;
    const surfacePhysics = surfacePhysicsFor(stadium);

    const evMps = evMph * 0.44704;
    const launchRad = launchDeg * Math.PI / 180;
    const gravity = 9.81;
    const ballType = classifyBallType(launchDeg);

    let distM;
    let groundProfile = null;
    let flightProfile = null;
    if (ballType === "ground") {
      groundProfile = buildGroundProfile(evMps, launchDeg, surfacePhysics);
      const groundShape = clamp((launchDeg + 16) / 26, 0.72, 1.08);
      distM = clamp(groundProfile.stopDistanceM * groundShape, 12, 105);
    } else {
      const horizontalMps = Math.max(0, evMps * Math.cos(launchRad));
      const verticalMps = Math.max(0, evMps * Math.sin(launchRad));
      const vacuumDistanceM = (evMps * evMps * Math.sin(2 * Math.max(0, launchRad))) / gravity;
      const dragCarryScale = clamp(0.65 - (surfacePhysics.airDrag - 0.03) * 1.4, 0.56, 0.72);
      const windCarryScale = stadium ? clamp(1 + (Number(stadium.windHelp) || 0) * 0.04, 0.96, 1.06) : 1;
      flightProfile = {
        horizontalMps: round(horizontalMps, 2),
        verticalMps: round(verticalMps, 2),
        vacuumDistanceM: round(vacuumDistanceM, 1),
        dragCarryScale: round(dragCarryScale, 3),
        windCarryScale: round(windCarryScale, 3),
        apexM: round((verticalMps * verticalMps) / (2 * gravity), 1),
        airDrag: surfacePhysics.airDrag
      };
      distM = vacuumDistanceM * dragCarryScale * windCarryScale;
      if (stadium) distM *= (1 + (stadium.altitude || 0) / 10000);
    }
    if (stadium && ballType !== "ground") distM *= (stadium.hrFactor || 1);

    const wallDist = wallDistance(stadium, sprayDeg);
    let hangTimeSec;
    if (ballType === "ground") {
      const stateAtEnd = groundStateAtDistance({ groundProfile }, distM);
      hangTimeSec = clamp(stateAtEnd?.timeSec || groundProfile.stopTimeSec, 0.35, 5.8);
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

    const landingPoint = pointAtDistance(sprayDeg, distM);
    const firstBouncePoint = groundProfile
      ? pointAtDistance(sprayDeg, groundProfile.firstBounceDistanceM)
      : null;

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
      landingPoint,
      firstBouncePoint,
      surface: {
        key: surfacePhysics.key,
        label: surfacePhysics.label,
        restitution: surfacePhysics.restitution,
        dirtFrictionMps2: surfacePhysics.dirtFrictionMps2,
        grassFrictionMps2: surfacePhysics.grassFrictionMps2,
        rollSpeedScale: surfacePhysics.rollSpeedScale,
        airDrag: surfacePhysics.airDrag
      },
      groundProfile,
      flightProfile,
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
    if (ballInfo.ballType === "popup") {
      return ballInfo.preciseDistM < 38
        ? ["C", "P", "1B", "2B", "3B", "SS"]
        : ["C", "P", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];
    }
    if (ballInfo.preciseDistM < 62) return ["P", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];
    return ["LF", "CF", "RF"];
  }

  function playPointFor(entry, ballInfo) {
    const landing = ballInfo.landingPoint;
    if (ballInfo.ballType !== "ground") return landing;
    const landingDistanceM = Math.hypot(landing.x, landing.y);
    if (isOutfieldPosition(entry.position)) {
      // v3.22 fix：外野手一律在外野接球（修正穿越內野時守備員跑進內野的動畫 bug）
      const infieldLimit = ballInfo.groundProfile?.infieldLimitM || 52;
      const outfieldPickupM = Math.max(infieldLimit, 52) + 8;
      const pickupDistanceM = clamp(Math.max(landingDistanceM, outfieldPickupM), outfieldPickupM, 115);
      return pointAtDistance(ballInfo.sa_deg, pickupDistanceM);
    }
    const targetY = clamp(entry.start.y, 14, Math.max(18, landing.y));
    const ratio = landing.y > 0 ? clamp(targetY / landing.y, 0.25, 1) : 1;
    return {
      x: landing.x * ratio,
      y: landing.y * ratio
    };
  }

  function arrivalTimeFor(point, ballInfo) {
    if (ballInfo.ballType === "ground") {
      const pathDistanceM = Math.hypot(point.x, point.y);
      const state = groundStateAtDistance(ballInfo, pathDistanceM);
      return clamp(state?.timeSec || ballInfo.hangTimeSec, 0.2, 5.8);
    }
    if (ballInfo.ballType === "liner") {
      // 時間制（v1.5.1）：平飛球攔截時間改用「水平飛行時間」= 水平距離 / 水平球速，
      // 取代真空式 hangTime。distM 已含 drag 衰減、hangTime 卻是真空 2·v/g，會高估守備員可用時間
      // （平飛只到 ~57m 卻給 2.2s）。平飛球又低又快、可攔截窗口短，硬擊球水平球速更快 → 窗口更短
      // → 更多穿越安打，EV→BABIP 透過「時間」自然分化（取代機率懲罰 hack）。
      // LINER_FIELD_TIME_SCALE：純水平飛行時間是「球抵達落點」的理論下限，但守備員會預判/卡位，
      // 有效可用時間略大於此。v1.5.1 純飛行時間（scale=1.0）讓平飛 BABIP 爆走到 .361，
      // 校準係數壓回水位（斜率來自落點位置、與此 scale 無關，故不會破壞 EV→BABIP 分化）。
      const LINER_FIELD_TIME_SCALE = 1.35;
      const hMps = ballInfo.flightProfile?.horizontalMps;
      if (Number.isFinite(hMps) && hMps > 0) {
        return clamp(Math.hypot(point.x, point.y) / hMps * LINER_FIELD_TIME_SCALE, 0.6, 3.0);
      }
      return clamp(ballInfo.hangTimeSec * 0.9, 0.55, 3.2);
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
    const ballState = ballInfo.ballType === "ground"
      ? groundStateAtDistance(ballInfo, Math.hypot(point.x, point.y))
      : null;
    const ballSpeedAtPlayMps = ballState?.speedMps ?? (ballInfo.ev_mph * 0.44704);
    const reactionSec = clamp(0.7 - fielding / 230 - speed / 280 + penalty / 80, 0.18, 0.78);
    const speedMps = clamp(4.7 + speed / 42 + fielding / 180, 4.8, 8.3);
    const rangeMarginM = speedMps * Math.max(0, arrivalSec - reactionSec) - routeDistanceM;
    let reachChance = clamp(0.08 + (rangeMarginM + 3.5) / 10, 0.02, 0.98);
    if (ballInfo.ballType === "fly") {
      const wallRatio = ballInfo.preciseWallDistM > 0 ? ballInfo.preciseDistM / ballInfo.preciseWallDistM : 0.8;
      // v1.3：平滑階梯（舊版 0.22/0.14/0.04 三段跳變，wallRatio 跨 0.78 / 0.9 時 reachChance 突降 0.18，
      // 是 v1.2 後 power 拉高使飛球落點往牆移時 HR 暴增的關鍵之一）。
      // 新公式：wallRatio ≤ 0.7 維持 0.22 baseline，> 0.7 線性遞減到接近牆時 ~0.02。
      const routineAirBonus = wallRatio < 0.70
        ? 0.22
        : clamp(0.22 - (wallRatio - 0.70) * 0.65, 0.02, 0.22);
      let hangAdjust;
      if (ballInfo.hangTimeSec < 3) {
        hangAdjust = -(3 - ballInfo.hangTimeSec) * 0.15;
      } else if (ballInfo.hangTimeSec > 4) {
        hangAdjust = clamp((ballInfo.hangTimeSec - 4) * 0.14, 0, 0.20);
      } else {
        hangAdjust = 0;
      }
      reachChance = clamp(reachChance + routineAirBonus + hangAdjust, 0.04, 0.98);
    }
    let difficulty = 0.04;
    if (ballInfo.isBarrel) difficulty += 0.08;
    if (ballInfo.ballType === "liner") difficulty += 0.1;
    if (ballInfo.ballType === "ground") {
      if (ballSpeedAtPlayMps > 27) difficulty += 0.2;
      else if (ballSpeedAtPlayMps > 22) difficulty += 0.11;
      if (arrivalSec < reactionSec + 0.16) difficulty += 0.24;
      if (entry.position === "P" && ballSpeedAtPlayMps > 24 && arrivalSec < 0.72) difficulty += 0.34;
      if (!ballState?.reached) difficulty += 0.16;
    }
    if (Math.abs(ballInfo.sa_deg) > 35) difficulty += 0.04;
    const minHandle = ballInfo.ballType === "ground" && ballSpeedAtPlayMps > 26 ? 0.22 : 0.68;
    const handleChance = clamp(0.985 + (fielding - 75) / 720 - penalty / 280 - difficulty, minHandle, 0.998);
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
      ballArrivalSpeedKmh: round(ballSpeedAtPlayMps * 3.6, 1),
      ballPathPhase: ballState?.phase || null,
      ballReachedPoint: ballState?.reached !== false,
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
    if (ballInfo.ballType === "ground") {
      const infield = candidates.filter(candidate => isInfieldPosition(candidate.position));
      const outfield = candidates.filter(candidate => isOutfieldPosition(candidate.position));
      const infieldBest = infield[0] || null;
      if (infieldBest && infieldBest.successScore >= 0.08) {
        return { selected: infieldBest, candidates };
      }
      return { selected: outfield[0] || infieldBest || null, candidates };
    }
    return { selected: candidates[0] || null, candidates };
  }

  function chooseGroundBackupFielder(fielding) {
    return (fielding.candidates || [])
      .filter(candidate => isOutfieldPosition(candidate.position))
      .sort((a, b) =>
        (b.successScore - a.successScore)
        || (a.routeDistanceM - b.routeDistanceM)
      )[0] || null;
  }

  function rollFielding(selected, ballInfo, random) {
    if (!selected) return { success: false, error: null, reason: "no_fielder" };
    const reachRoll = random();
    if (reachRoll > selected.reachChance) {
      const hardGrounder = ballInfo.ballType === "ground"
        && (selected.ballArrivalSpeedKmh > 72 || selected.arrivalSec < selected.reactionSec + 0.28);
      const routineEnough = selected.reachChance > 0.72 && selected.rangeMarginM > -1 && !hardGrounder;
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

  function advanceOutcomeFor(result) {
    if (result?.code === "error") return "error";
    if (result?.code === "home_run") return "home_run";
    if (result?.code === "net_double") return "double";
    if (result?.code === "hit") return result.hitType || "single";
    return null;
  }

  function attachAdvanceResult(result, context, random) {
    const outcome = advanceOutcomeFor(result);
    if (!outcome || !global.BaserunningEngine?.resolveAdvance) return result;
    result.advanceResult = global.BaserunningEngine.resolveAdvance({
      outcome,
      runners: context.runners || [],
      hitter: context.batter || null,
      advanceBonus: Number(context.advanceBonus) || 0,
      rng: random
    });
    return result;
  }

  function baseIndexFor(base) {
    return { "1B": 0, "2B": 1, "3B": 2 }[base];
  }

  function emptyAdvanceResult(context) {
    const runners = Array.isArray(context?.runners) ? context.runners.slice(0, 3) : [null, null, null];
    while (runners.length < 3) runners.push(null);
    return {
      outcomeType: "air_out",
      runners,
      runs: 0,
      movements: [],
      decisions: [],
      outsOnBases: [],
      isHit: false
    };
  }

  function applyAdvanceMovement(result, runnerId, runner, fromBase, toBase, startAtSec, extra = {}) {
    const next = result.runners.slice(0, 3);
    const fromIndex = baseIndexFor(fromBase);
    const toIndex = baseIndexFor(toBase);
    if (Number.isInteger(fromIndex)) next[fromIndex] = null;
    if (toBase === "home") result.runs += 1;
    else if (Number.isInteger(toIndex)) next[toIndex] = runner;
    result.runners = next;
    result.movements.push({
      runnerId,
      runner,
      fromBase,
      toBase,
      scored: toBase === "home",
      startAtSec: round(startAtSec, 2),
      ...extra
    });
    return result;
  }

  function recordAdvanceDecision(result, decision) {
    if (!Array.isArray(result.decisions)) result.decisions = [];
    result.decisions.push(decision);
    return decision;
  }

  function airOutDecision(input) {
    const roll = input.rng();
    const action = roll < input.chance ? "send" : "hold";
    return {
      runnerId: input.runnerId,
      fromBase: input.fromBase,
      targetBase: input.targetBase,
      holdBase: input.holdBase,
      action,
      chance: round(input.chance, 3),
      roll: round(roll, 3),
      runnerSpeed: input.runnerSpeed,
      throwArm: input.throwArm,
      depthM: round(input.depthM, 1),
      hangTimeSec: round(input.hangTimeSec, 2),
      reason: input.reason || "air_out_tag_up"
    };
  }

  function slideForClosePlay(movement, marginSec, outcome, runnerArrivalSec, runnerStartAt) {
    if (!["2B", "3B", "home"].includes(movement?.toBase)) return null;
    if (outcome !== "out" && Math.abs(marginSec) > 0.45) return null;
    const runnerSpeed = ability(movement.runner, "speed", 70);
    const type = movement.toBase === "home"
      ? "hook_slide"
      : runnerSpeed >= 78
        ? "head_first"
        : "feet_first";
    return {
      type,
      base: movement.toBase,
      atSec: round(Math.max(runnerStartAt, runnerArrivalSec - 0.18), 2),
      marginSec,
      reason: outcome === "out" ? "tag_play_out" : "close_safe_play"
    };
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
    if (global.BaserunningEngine?.runnerTravelSec) {
      return global.BaserunningEngine.runnerTravelSec(fromBase, toBase, runner);
    }
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

  function effectiveThrowSpeedMps(player, distanceM) {
    const arm = ability(player, "arm", ability(player, "velocity", 70));
    const baseMps = clamp(24 + (arm - 70) / 2.9, 18, 35);
    const longThrowDecay = clamp(1 - Math.max(0, distanceM - 38) * 0.0028, 0.82, 1);
    return baseMps * longThrowDecay;
  }

  function exchangeTimeSec(player, urgency = 0) {
    const fielding = ability(player, "fielding", 70);
    const arm = ability(player, "arm", ability(player, "velocity", 70));
    return round(clamp(0.72 - fielding / 390 - arm / 680 + urgency * 0.06, 0.24, 0.72), 2);
  }

  function throwTravelSecToPoint(fromPoint, toPoint, selected) {
    const arm = ability(selected?.player, "arm", ability(selected?.player, "velocity", 70));
    const distanceM = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
    const throwMps = selected?.player
      ? effectiveThrowSpeedMps(selected.player, distanceM)
      : clamp(24 + (arm - 70) / 2.9, 18, 34);
    return distanceM / throwMps;
  }

  function throwTravelSec(fromPoint, toBase, selected) {
    const to = BASE_POINTS[toBase] || BASE_POINTS["1B"];
    return round(throwTravelSecToPoint(fromPoint, to, selected), 2);
  }

  function pushRunnerEvents(events, startAt, runnerId, runner, fromBase, toBase, options = {}) {
    const travelSec = runnerTravelSec(fromBase, toBase, runner);
    const arriveAt = round(startAt + travelSec, 2);
    events.push({
      at: round(startAt, 2),
      type: "runner_start",
      runner: runnerId,
      fromBase,
      toBase,
      point: BASE_POINTS[fromBase],
      targetPoint: BASE_POINTS[toBase],
      scored: Boolean(options.scored)
    });
    if (options.slide) {
      events.push({
        at: round(Number.isFinite(options.slide.atSec) ? options.slide.atSec : Math.max(startAt, arriveAt - 0.18), 2),
        type: "runner_slide",
        runner: runnerId,
        base: toBase,
        point: BASE_POINTS[toBase],
        slide: options.slide.type || "slide",
        reason: options.slide.reason || "close_play"
      });
    }
    if (options.arrives === false) return;
    events.push({
      at: arriveAt,
      type: "runner_arrives",
      runner: runnerId,
      base: toBase,
      point: BASE_POINTS[toBase],
      scored: Boolean(options.scored)
    });
  }

  function addAdvanceRunnerEvents(events, result) {
    const movements = result?.advanceResult?.movements;
    if (!Array.isArray(movements) || !movements.length) return false;
    movements.forEach(movement => {
      if (!movement?.fromBase || !movement?.toBase) return;
      if (movement.runnerId === "batter" && movement.fromBase === movement.toBase) return;
      const startAt = Number.isFinite(movement.startAtSec)
        ? Number(movement.startAtSec)
        : (movement.runnerId === "batter" ? 0.12 : 0.08);
      pushRunnerEvents(
        events,
        startAt,
        movement.runnerId,
        movement.runner,
        movement.fromBase,
        movement.toBase,
        { scored: movement.scored, arrives: !movement.out, slide: movement.slide }
      );
    });
    return true;
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

  function relayPreference(selectedPosition, position) {
    const preferences = {
      SS: ["2B", "P"],
      "2B": ["SS", "P"],
      "1B": ["SS", "2B", "P", "3B"],
      "3B": ["SS", "2B", "P", "1B"],
      P: ["SS", "2B", "1B", "3B"]
    };
    const list = preferences[selectedPosition] || ["2B", "SS", "1B", "3B", "P"];
    const index = list.indexOf(position);
    return index >= 0 ? list.length - index : 0;
  }

  function relayCandidateFor(fielding) {
    const selectedPosition = fielding.selected?.position;
    const relayBase = BASE_POINTS["2B"];
    const allowedBySelected = {
      SS: new Set(["2B", "P"]),
      "2B": new Set(["SS", "P"]),
      "1B": new Set(["SS", "2B", "P", "3B"]),
      "3B": new Set(["SS", "2B", "P", "1B"]),
      P: new Set(["SS", "2B", "1B", "3B"])
    };
    const allowed = allowedBySelected[selectedPosition] || new Set(["2B", "SS", "P"]);
    const candidates = (fielding.candidates || [])
      .filter(candidate => (
        allowed.has(candidate.position)
        && candidate.position !== selectedPosition
        && candidate.start
      ))
      .map(candidate => {
        const distanceToBag = Math.hypot(relayBase.x - candidate.start.x, relayBase.y - candidate.start.y);
        const fieldingSkill = ability(candidate.player, "fielding", 70);
        const armSkill = ability(candidate.player, "arm", ability(candidate.player, "velocity", 70));
        return {
          ...candidate,
          relayScore: round(
            fieldingSkill * 0.028
            + armSkill * 0.018
            + relayPreference(selectedPosition, candidate.position) * 0.32
            - distanceToBag * 0.08,
            3
          )
        };
      })
      .sort((a, b) =>
        (b.relayScore - a.relayScore)
        || relayPreference(selectedPosition, b.position) - relayPreference(selectedPosition, a.position)
        || a.position.localeCompare(b.position)
      );
    return candidates[0] || { position: selectedPosition === "2B" ? "SS" : "2B", player: null, relayScore: 0 };
  }

  function pushThrowEvents(events, startAt, from, toBase, fromPoint, thrower, extra = {}) {
    const arrivesAt = round(startAt + throwTravelSec(fromPoint, toBase, thrower), 2);
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

  function cutoffPreferences(throwerPosition, targetBase) {
    if (throwerPosition === "LF") {
      if (targetBase === "home") return ["SS", "3B", "2B", "P"];
      if (targetBase === "3B") return ["SS", "3B", "P"];
      return ["SS", "2B", "P"];
    }
    if (throwerPosition === "RF") {
      if (targetBase === "home") return ["2B", "1B", "SS", "P"];
      if (targetBase === "3B") return ["SS", "2B", "3B", "P"];
      return ["2B", "SS", "P"];
    }
    if (targetBase === "home") return ["SS", "2B", "3B", "1B", "P"];
    if (targetBase === "3B") return ["SS", "3B", "2B", "P"];
    return ["2B", "SS", "P"];
  }

  function chooseCutoffFielder(throwerEntry, defense, targetBase, fromPoint) {
    const preferences = cutoffPreferences(throwerEntry?.position, targetBase);
    const allowed = new Set(preferences);
    const targetPoint = BASE_POINTS[targetBase] || BASE_POINTS["2B"];
    const candidates = defenseEntries(defense)
      .filter(entry => allowed.has(entry.position) && entry.position !== throwerEntry?.position)
      .map(entry => {
        const firstLegM = Math.hypot(entry.start.x - fromPoint.x, entry.start.y - fromPoint.y);
        const secondLegM = Math.hypot(targetPoint.x - entry.start.x, targetPoint.y - entry.start.y);
        const prefScore = preferences.length - preferences.indexOf(entry.position);
        const fielding = ability(entry.player, "fielding", 70);
        const arm = ability(entry.player, "arm", ability(entry.player, "velocity", 70));
        return {
          ...entry,
          cutoffScore: round(prefScore * 0.55 + fielding * 0.016 + arm * 0.012 - (firstLegM + secondLegM) * 0.018, 3)
        };
      })
      .sort((a, b) =>
        (b.cutoffScore - a.cutoffScore)
        || preferences.indexOf(a.position) - preferences.indexOf(b.position)
      );
    return candidates[0] || null;
  }

  function throwSegment(from, toBase, fromPoint, targetPoint, startAt, thrower, extra = {}) {
    const travelSec = throwTravelSecToPoint(fromPoint, targetPoint, thrower);
    return {
      from,
      toBase,
      point: fromPoint,
      targetPoint,
      startAt: round(startAt, 2),
      arriveAt: round(startAt + travelSec, 2),
      travelSec: round(travelSec, 2),
      ...extra
    };
  }

  function buildThrowPlan(fromPoint, targetBase, throwerEntry, defense, startAt) {
    const targetPoint = BASE_POINTS[targetBase] || BASE_POINTS["2B"];
    const receiveTagSec = targetBase === "home" ? 0.2 : 0.16;
    const directSegment = throwSegment(throwerEntry.position, targetBase, fromPoint, targetPoint, startAt, throwerEntry, { sequence: "direct" });
    const directPlan = {
      type: "direct",
      targetBase,
      startAt: round(startAt, 2),
      ballArriveAt: directSegment.arriveAt,
      arriveAt: round(directSegment.arriveAt + receiveTagSec, 2),
      segments: [directSegment]
    };

    const directDistanceM = Math.hypot(targetPoint.x - fromPoint.x, targetPoint.y - fromPoint.y);
    const cutoff = chooseCutoffFielder(throwerEntry, defense, targetBase, fromPoint);
    if (!cutoff) return directPlan;

    const first = throwSegment(
      throwerEntry.position,
      `cutoff:${cutoff.position}`,
      fromPoint,
      cutoff.start,
      startAt,
      throwerEntry,
      { sequence: "relay_cutoff", toFielder: cutoff.position }
    );
    const relayStart = first.arriveAt + exchangeTimeSec(cutoff.player, 0.4);
    const second = throwSegment(
      cutoff.position,
      targetBase,
      cutoff.start,
      targetPoint,
      relayStart,
      cutoff,
      { sequence: "relay_throw", relayFrom: cutoff.position }
    );
    const relayPlan = {
      type: "relay",
      targetBase,
      cutoff: { position: cutoff.position, score: cutoff.cutoffScore ?? null },
      startAt: round(startAt, 2),
      ballArriveAt: second.arriveAt,
      arriveAt: round(second.arriveAt + receiveTagSec, 2),
      segments: [first, second]
    };
    const relayAllowance = directDistanceM > 78 ? 0.24 : directDistanceM > 62 ? 0.1 : -0.12;
    return relayPlan.arriveAt <= directPlan.arriveAt + relayAllowance ? relayPlan : directPlan;
  }

  function challengePriority(result, movement) {
    if (!movement || movement.out) return -1;
    if (result?.code === "fly_out") {
      if (movement.toBase === "home") return 100;
      if (movement.toBase === "3B") return 78;
      return -1;
    }
    if (result.hitType === "double" && movement.fromBase === "2B" && movement.toBase === "home") return -1;
    if (movement.toBase === "home") {
      if (movement.fromBase === "3B") return 35;
      if (movement.fromBase === "2B") return 100;
      if (movement.fromBase === "1B") return 92;
      return 52;
    }
    if (movement.toBase === "3B") return movement.runnerId === "batter" ? 62 : 78;
    if (movement.runnerId === "batter" && movement.toBase === "2B") return 58;
    return -1;
  }

  function challengeMovementFor(result) {
    const movements = result?.advanceResult?.movements || [];
    const sorted = movements
      .map(movement => ({ movement, priority: challengePriority(result, movement) }))
      .filter(entry => entry.priority >= 70)
      .sort((a, b) => b.priority - a.priority);
    return sorted[0]?.movement || null;
  }

  function resolveAirOutAdvance(result, fielding, ballInfo, context, random, defense) {
    const selected = fielding?.selected;
    if (result?.code !== "fly_out" || !isOutfieldPosition(selected?.position)) return result;
    const runners = Array.isArray(context?.runners) ? context.runners : [null, null, null];
    const advance = emptyAdvanceResult(context);
    const depthM = Math.hypot(selected.playPoint?.x || 0, selected.playPoint?.y || 0);
    const hangTimeSec = Number(ballInfo?.hangTimeSec) || 0;
    const throwArm = ability(selected.player, "arm", ability(selected.player, "velocity", 70));
    const catchAt = round(Math.max(Number(selected.arrivalSec || 0), hangTimeSec), 2);
    const tagDelaySec = round(clamp(0.18 + Math.max(0, 2.7 - hangTimeSec) * 0.08, 0.16, 0.38), 2);
    const r3 = runners[2];
    const r2 = runners[1];

    if (r3 && depthM >= 68) {
      const speed = ability(r3, "speed", 70);
      const scoreChance = clamp(
        0.18
        + (depthM - 72) / 24
        + (hangTimeSec - 2.6) / 2.4
        + (speed - 70) / 180
        - (throwArm - 70) / 220,
        0.06,
        0.94
      );
      const decision = recordAdvanceDecision(advance, airOutDecision({
        runnerId: "R3",
        runner: r3,
        fromBase: "3B",
        targetBase: "home",
        holdBase: "3B",
        chance: scoreChance,
        rng: random,
        runnerSpeed: speed,
        throwArm,
        depthM,
        hangTimeSec,
        reason: "sacrifice_fly_tag"
      }));
      if (decision.action === "send") {
        applyAdvanceMovement(advance, "R3", r3, "3B", "home", catchAt + tagDelaySec, { decision });
      }
    } else if (r3) {
      recordAdvanceDecision(advance, {
        runnerId: "R3",
        fromBase: "3B",
        targetBase: "home",
        holdBase: "3B",
        action: "hold",
        chance: 0,
        roll: null,
        runnerSpeed: ability(r3, "speed", 70),
        throwArm,
        depthM: round(depthM, 1),
        hangTimeSec: round(hangTimeSec, 2),
        reason: "shallow_air_out"
      });
    }

    const thirdBaseOpen = !advance.runners[2];
    if (r2 && thirdBaseOpen && depthM >= 62) {
      const speed = ability(r2, "speed", 70);
      const advanceChance = clamp(
        0.34
        + (depthM - 66) / 30
        + (hangTimeSec - 2.2) / 2.6
        + (speed - 70) / 220
        - (throwArm - 70) / 300,
        0.12,
        0.95
      );
      const decision = recordAdvanceDecision(advance, airOutDecision({
        runnerId: "R2",
        runner: r2,
        fromBase: "2B",
        targetBase: "3B",
        holdBase: "2B",
        chance: advanceChance,
        rng: random,
        runnerSpeed: speed,
        throwArm,
        depthM,
        hangTimeSec,
        reason: "tag_from_second"
      }));
      if (decision.action === "send") {
        applyAdvanceMovement(advance, "R2", r2, "2B", "3B", catchAt + tagDelaySec + 0.04, { decision });
      }
    } else if (r2) {
      recordAdvanceDecision(advance, {
        runnerId: "R2",
        fromBase: "2B",
        targetBase: "3B",
        holdBase: "2B",
        action: "hold",
        chance: 0,
        roll: null,
        runnerSpeed: ability(r2, "speed", 70),
        throwArm,
        depthM: round(depthM, 1),
        hangTimeSec: round(hangTimeSec, 2),
        reason: thirdBaseOpen ? "shallow_air_out" : "third_base_occupied"
      });
    }

    if (!advance.movements.length && !advance.decisions.length) return result;
    result.advanceResult = advance;
    result.airOutAdvance = {
      catchAtSec: catchAt,
      depthM: round(depthM, 1),
      hangTimeSec: round(hangTimeSec, 2)
    };
    resolveRunnerThrowChallenge(result, fielding, ballInfo, context, random, defense);
    return result;
  }

  function resolveRunnerThrowChallenge(result, fielding, ballInfo, context, random, defense) {
    const selected = fielding?.selected;
    if (!isOutfieldPosition(selected?.position)) return result;
    const movement = challengeMovementFor(result);
    if (!movement) return result;
    const runnerStartAt = Number.isFinite(movement.startAtSec)
      ? Number(movement.startAtSec)
      : (movement.runnerId === "batter" ? 0.12 : 0.08);
    const runnerArrivalSec = round(runnerStartAt + runnerTravelSec(movement.fromBase, movement.toBase, movement.runner), 2);
    const fieldedAt = result.code === "fly_out"
      ? Math.max(Number(selected.arrivalSec || 0), Number(ballInfo.hangTimeSec || 0))
      : ballInfo.ballType === "ground"
      ? Number(selected.arrivalSec || ballInfo.hangTimeSec || 0)
      : Math.max(Number(selected.arrivalSec || 0), Number(ballInfo.hangTimeSec || 0));
    const gatherSec = result.code === "fly_out"
      ? 0.22
      : ballInfo.ballType === "ground"
        ? 0.34
        : ballInfo.ballType === "liner"
          ? 0.46
          : 0.58;
    const urgency = movement.toBase === "home" ? 1 : 0.5;
    const throwStartAt = round(fieldedAt + gatherSec + exchangeTimeSec(selected.player, urgency), 2);
    const throwPlan = buildThrowPlan(selected.playPoint || ballInfo.landingPoint, movement.toBase, selected, defense, throwStartAt);
    const marginSec = round(runnerArrivalSec - throwPlan.arriveAt, 2);
    const runnerSpeed = ability(movement.runner, "speed", 70);
    const throwerArm = ability(selected.player, "arm", ability(selected.player, "velocity", 70));
    const safeChance = clamp(0.52 - marginSec * 1.25 + (runnerSpeed - 70) / 260 - (throwerArm - 70) / 320, 0.08, 0.92);
    let outcome = "safe";
    if (runnerArrivalSec <= throwPlan.arriveAt) outcome = "safe";
    else if (marginSec > 0.22) outcome = "out";
    else if (marginSec >= -0.22) outcome = random() < safeChance ? "safe" : "out";
    const slide = slideForClosePlay(movement, marginSec, outcome, runnerArrivalSec, runnerStartAt);
    if (slide) movement.slide = slide;

    if (outcome === "out" && global.BaserunningEngine?.removeRunnerAt) {
      const outAt = round(Math.max(runnerArrivalSec, throwPlan.arriveAt), 2);
      global.BaserunningEngine.removeRunnerAt(result.advanceResult, movement.runnerId, movement.toBase);
      result.advanceResult.outsOnBases.push({
        runnerId: movement.runnerId,
        runner: movement.runner,
        base: movement.toBase,
        at: outAt,
        reason: "outfield_throw",
        slide,
        throwPlan
      });
    }

    result.throwDecision = {
      targetRunner: movement.runnerId,
      targetBase: movement.toBase,
      runnerArrivalSec,
      ballArrivalSec: throwPlan.arriveAt,
      throwArriveSec: throwPlan.ballArriveAt,
      marginSec,
      safeChance: round(safeChance, 3),
      outcome,
      outAtSec: outcome === "out" ? round(Math.max(runnerArrivalSec, throwPlan.arriveAt), 2) : null,
      slide,
      plan: throwPlan
    };
    return result;
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

    const relayFielder = relayCandidateFor(fielding);
    result.relay = { position: relayFielder.position, score: relayFielder.relayScore ?? null };
    const relayThrowStart = round(forceThrowArrives + 0.28, 2);
    const relayThrowArrives = pushThrowEvents(events, relayThrowStart, relayFielder.position, "1B", BASE_POINTS["2B"], relayFielder, { sequence: "relay" });
    pushRunnerOut(events, relayThrowArrives, "batter", "1B", "relay");
  }

  function addThrowDecisionEvents(events, result) {
    const decision = result?.throwDecision;
    const segments = decision?.plan?.segments || [];
    segments.forEach(segment => {
      events.push({
        at: round(segment.startAt, 2),
        type: "throw_start",
        from: segment.from,
        toBase: segment.toBase,
        toFielder: segment.toFielder || null,
        point: segment.point,
        targetPoint: segment.targetPoint,
        sequence: segment.sequence || decision.plan.type
      });
      events.push({
        at: round(segment.arriveAt, 2),
        type: "throw_arrives",
        from: segment.from,
        toBase: segment.toBase,
        toFielder: segment.toFielder || null,
        point: segment.targetPoint,
        sequence: segment.sequence || decision.plan.type
      });
    });
    (result?.advanceResult?.outsOnBases || []).forEach(out => {
      pushRunnerOut(events, out.at, out.runnerId, out.base, out.reason || "outfield_throw");
    });
  }

  function fielderRouteOutcome(entry, selected, result) {
    if (!entry) return "idle";
    if (selected && entry.position !== selected.position) return "miss";
    if (["ground_out", "double_play", "popup_out", "fly_out", "error"].includes(result?.code)) return "field";
    if (result?.code === "hit") return "chase";
    return "move";
  }

  function addFielderRouteEvents(events, entry, selected, result, role = "selected") {
    if (!entry?.playPoint) return;
    const arrivalAt = round(entry.arrivalSec || 0, 2);
    events.push({
      at: 0,
      type: "fielder_start",
      fielder: entry.position,
      point: entry.start || POSITIONS[entry.position] || null,
      targetPoint: entry.playPoint,
      arrivesAt: arrivalAt,
      role,
      outcome: fielderRouteOutcome(entry, selected, result)
    });
    events.push({
      at: arrivalAt,
      type: "fielder_arrives",
      fielder: entry.position,
      point: entry.playPoint,
      role,
      outcome: fielderRouteOutcome(entry, selected, result)
    });
  }

  function buildVisualTimeline(ballInfo, fielding, result, context = {}) {
    const selected = fielding.selected;
    const handled = isHandledAtFielder(result) && selected?.playPoint;
    const hitHandledByFielder = result?.code === "hit" && selected?.playPoint;
    const ballArrivalPoint = handled || hitHandledByFielder ? selected.playPoint : ballInfo.landingPoint;
    const ballArrivalAt = handled
      ? selected.arrivalSec
      : hitHandledByFielder
        ? (ballInfo.ballType === "ground" ? selected.arrivalSec : Math.max(selected.arrivalSec || 0, ballInfo.hangTimeSec || 0))
        : ballInfo.hangTimeSec;
    const events = [
      { at: 0, type: "contact", point: { x: 0, y: 0 } },
      { at: ballArrivalAt, type: "ball_arrives", point: ballArrivalPoint }
    ];
    if (fielding.primaryAttempt && (!selected || fielding.primaryAttempt.position !== selected.position)) {
      addFielderRouteEvents(events, fielding.primaryAttempt, selected, result, "primary");
    }
    if (selected) {
      addFielderRouteEvents(events, selected, selected, result, "selected");
    }
    const usedAdvanceEvents = addAdvanceRunnerEvents(events, result);
    if (!usedAdvanceEvents) {
      addBatterRunnerEvents(events, result, context.batter);
      addForceRunnerEvents(events, result, context.runners || []);
    }
    addThrowEvents(events, ballArrivalAt, fielding, result);
    addThrowDecisionEvents(events, result);
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
    const timelineContext = { runners, batter: input.batter, advanceBonus: input.advanceBonus };

    if (ballInfo.isFoul) {
      const result = { code: "foul" };
      return { ballInfo, fielding: { selected: null, candidates: [], result: null }, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, { selected: null }, result, timelineContext) };
    }
    if (ballInfo.isHR) {
      const result = attachAdvanceResult({ code: "home_run" }, timelineContext, random);
      return { ballInfo, fielding: { selected: null, candidates: [], result: null }, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, { selected: null }, result, timelineContext) };
    }
    if (ballInfo.hitNet) {
      const code = random() < 0.7 ? "net_out" : "net_double";
      const result = attachAdvanceResult({ code, hitType: code === "net_double" ? "double" : null }, timelineContext, random);
      return { ballInfo, fielding: { selected: null, candidates: [], result: null }, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, { selected: null }, result, timelineContext) };
    }

    const fielding = chooseFielder(ballInfo, input.defense);
    const fieldingResult = rollFielding(fielding.selected, ballInfo, random);
    fielding.result = fieldingResult;

    if (!fieldingResult.success && fieldingResult.error) {
      const result = attachAdvanceResult({ code: "error", error: fieldingResult.error, hitType: "single" }, timelineContext, random);
      return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
    }

    if (ballInfo.ballType === "ground") {
      if (fieldingResult.success && isInfieldPosition(fielding.selected?.position)) {
        const canDoublePlay = Boolean(runners[0]) && outs < 2;
        const dpChance = canDoublePlay ? doublePlayChance(fielding.selected, ballInfo, input.batter) : 0;
        if (canDoublePlay && random() < dpChance) {
          const result = { code: "double_play", outCount: 2, doublePlayChance: round(dpChance, 3) };
          return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
        }
        const result = { code: "ground_out", outCount: 1 };
        return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
      }
      if (!fieldingResult.success && !fieldingResult.error) {
        const backup = chooseGroundBackupFielder(fielding);
        if (backup) {
          fielding.primaryAttempt = fielding.selected || null;
          fielding.selected = backup;
          fielding.result = {
            ...fieldingResult,
            reason: "through_infield",
            backupPosition: backup.position
          };
        }
      }
      const result = attachAdvanceResult({ code: "hit", hitType: "single" }, timelineContext, random);
      resolveRunnerThrowChallenge(result, fielding, ballInfo, timelineContext, random, input.defense);
      return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
    }

    if (battedBallTypeHint === "popup") {
      const result = fieldingResult.success
        ? { code: "popup_out", outCount: 1 }
        : attachAdvanceResult({ code: "hit", hitType: "single" }, timelineContext, random);
      if (result.code === "hit") resolveRunnerThrowChallenge(result, fielding, ballInfo, timelineContext, random, input.defense);
      return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
    }

    if (fieldingResult.success) {
      const result = { code: "fly_out", outCount: 1 };
      resolveAirOutAdvance(result, fielding, ballInfo, timelineContext, random, input.defense);
      return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
    }

    const hitType = classifyHit(ballInfo, battedBallTypeHint, random);
    const result = attachAdvanceResult({ code: "hit", hitType }, timelineContext, random);
    resolveRunnerThrowChallenge(result, fielding, ballInfo, timelineContext, random, input.defense);
    return { ballInfo, fielding, playResult: result, visualTimeline: buildVisualTimeline(ballInfo, fielding, result, timelineContext) };
  }

  global.FieldingEngine = {
    POSITIONS,
    BASE_POINTS,
    ERROR_LABELS,
    calcBattedBall,
    surfacePhysicsFor,
    resolveInPlay
  };
})(typeof window !== "undefined" ? window : globalThis);
