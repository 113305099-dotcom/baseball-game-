(function (global) {
  "use strict";

  const MODEL_VERSION = "1.1";
  const GRAVITY_MPS2 = 9.81;

  const DEFAULT_SURFACE_PHYSICS = {
    label: "standard grass",
    restitution: 0.72,
    dirtFrictionMps2: 5.25,
    grassFrictionMps2: 3.65,
    rollSpeedScale: 1,
    bounceRandomness: 0.03,
    airDrag: 0.03
  };

  function clamp(value, min, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
  }

  function round(value, digits = 1) {
    const m = 10 ** digits;
    return Math.round(value * m) / m;
  }

  function kmhToMps(kmh) {
    return Number(kmh) / 3.6;
  }

  function mphToMps(mph) {
    return Number(mph) * 0.44704;
  }

  function mpsToMph(mps) {
    return Number(mps) / 0.44704;
  }

  function wallDistance(stadium, sprayDeg) {
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

  function surfacePhysicsFor(stadium, options = {}) {
    const key = surfaceKeyFor(stadium);
    const registry = options.registry || global.FIELD_SURFACE_PHYSICS || {};
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
    if (launchDeg < 10) return "ground";
    if (launchDeg < 25) return "liner";
    if (launchDeg < 40) return "fly";
    return "popup";
  }

  function solveDecelTime(distanceM, startSpeedMps, decelMps2) {
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

  function pointAtDistance(sprayDeg, distanceM) {
    const sprayRad = sprayDeg * Math.PI / 180;
    return {
      x: round(Math.sin(sprayRad) * distanceM, 1),
      y: round(Math.cos(sprayRad) * distanceM, 1)
    };
  }

  function buildGroundProfile(evMps, launchDeg, surfacePhysics = DEFAULT_SURFACE_PHYSICS) {
    const surface = { ...DEFAULT_SURFACE_PHYSICS, ...surfacePhysics };
    const launchRad = Math.max(0, launchDeg) * Math.PI / 180;
    const horizontalMps = Math.max(8, evMps * Math.cos(launchRad) * 0.94);
    const verticalMps = Math.max(0, evMps * Math.sin(launchRad));
    const firstBounceTimeSec = verticalMps > 0.35 ? clamp((2 * verticalMps / GRAVITY_MPS2) * 0.86, 0, 0.85) : 0;
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
    const profile = ballInfo.groundProfile || ballInfo;
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

  function sampleGroundTrajectory(sprayDeg, groundProfile, finalDistanceM) {
    const samples = [];
    const totalTime = Math.max(groundProfile.stopTimeSec, 0.1);
    for (let i = 0; i <= 12; i++) {
      const timeSec = totalTime * (i / 12);
      let lo = 0;
      let hi = finalDistanceM;
      for (let guard = 0; guard < 16; guard++) {
        const mid = (lo + hi) / 2;
        const state = groundStateAtDistance(groundProfile, mid);
        if ((state?.timeSec || 0) < timeSec) lo = mid;
        else hi = mid;
      }
      const distanceM = clamp((lo + hi) / 2, 0, finalDistanceM);
      const state = groundStateAtDistance(groundProfile, distanceM) || {};
      const point = pointAtDistance(sprayDeg, distanceM);
      samples.push({
        t: round(timeSec, 2),
        x: point.x,
        y: point.y,
        z: 0,
        speedMps: round(state.speedMps || 0, 2),
        phase: state.phase || "stopped"
      });
    }
    return samples;
  }

  function sampleAirTrajectory(sprayDeg, distanceM, hangTimeSec, verticalSpeedMps, gravityScale = 0.86) {
    const samples = [];
    const safeHang = Math.max(hangTimeSec, 0.1);
    for (let i = 0; i <= 16; i++) {
      const t = safeHang * (i / 16);
      const progress = clamp(t / safeHang, 0, 1);
      const point = pointAtDistance(sprayDeg, distanceM * progress);
      const z = Math.max(0, (verticalSpeedMps * t - 0.5 * GRAVITY_MPS2 * t * t) * gravityScale);
      samples.push({
        t: round(t, 2),
        x: point.x,
        y: point.y,
        z: round(z, 2)
      });
    }
    return samples;
  }

  function calcBattedBall(input = {}) {
    const evKmh = Number(input.evKmh);
    const evMph = Number.isFinite(input.evMph) ? Number(input.evMph) : evKmh / 1.609344;
    const launchDeg = Number(input.launchAngleDeg);
    const rawSprayDeg = Number(input.sprayAngleDeg);
    const allowPhysicalFoul = Boolean(input.allowPhysicalFoul);
    const sprayDeg = allowPhysicalFoul ? rawSprayDeg : clamp(rawSprayDeg, -44, 44);
    const stadium = input.stadium || null;
    const surfacePhysics = surfacePhysicsFor(stadium, { registry: input.surfaceRegistry });

    const evMps = Number.isFinite(input.evMps) ? Number(input.evMps) : mphToMps(evMph);
    const launchRad = launchDeg * Math.PI / 180;
    const ballType = classifyBallType(launchDeg);

    let distM;
    let hangTimeSec;
    let groundProfile = null;
    let flightProfile = null;
    let trajectorySamples = [];

    if (ballType === "ground") {
      groundProfile = buildGroundProfile(evMps, launchDeg, surfacePhysics);
      const groundShape = clamp((launchDeg + 16) / 26, 0.72, 1.08);
      distM = clamp(groundProfile.stopDistanceM * groundShape, 12, 105);
      const stateAtEnd = groundStateAtDistance(groundProfile, distM);
      hangTimeSec = clamp(stateAtEnd?.timeSec || groundProfile.stopTimeSec, 0.35, 5.8);
      trajectorySamples = sampleGroundTrajectory(sprayDeg, groundProfile, distM);
    } else {
      const horizontalMps = Math.max(0, evMps * Math.cos(launchRad));
      const verticalMps = Math.max(0, evMps * Math.sin(launchRad));
      const vacuumDistanceM = (evMps * evMps * Math.sin(2 * Math.max(0, launchRad))) / GRAVITY_MPS2;
      const dragCarryScale = clamp(0.65 - (surfacePhysics.airDrag - 0.03) * 1.4, 0.56, 0.72);
      const windCarryScale = stadium ? clamp(1 + (Number(stadium.windHelp) || 0) * 0.04, 0.96, 1.06) : 1;
      const altitudeScale = stadium ? (1 + (Number(stadium.altitude) || 0) / 10000) : 1;
      const parkCarryScale = stadium ? (Number(stadium.hrFactor) || 1) : 1;
      distM = vacuumDistanceM * dragCarryScale * windCarryScale * altitudeScale * parkCarryScale;
      hangTimeSec = clamp((2 * verticalMps / GRAVITY_MPS2) * 1.0, ballType === "liner" ? 0.65 : 1.2, 6.8);
      flightProfile = {
        horizontalMps: round(horizontalMps, 2),
        verticalMps: round(verticalMps, 2),
        vacuumDistanceM: round(vacuumDistanceM, 1),
        dragCarryScale: round(dragCarryScale, 3),
        windCarryScale: round(windCarryScale, 3),
        altitudeScale: round(altitudeScale, 3),
        parkCarryScale: round(parkCarryScale, 3),
        apexM: round((verticalMps * verticalMps) / (2 * GRAVITY_MPS2), 1),
        airDrag: surfacePhysics.airDrag
      };
      trajectorySamples = sampleAirTrajectory(sprayDeg, distM, hangTimeSec, verticalMps);
    }

    const wallDist = wallDistance(stadium, sprayDeg);
    let trajectoryHeightAtWall = Infinity;
    if (ballType !== "ground" && ballType !== "popup" && wallDist > 0) {
      const horizontalSpeed = evMps * Math.cos(launchRad);
      const verticalSpeed = evMps * Math.sin(launchRad);
      if (horizontalSpeed > 0) {
        const wallTime = wallDist / horizontalSpeed;
        trajectoryHeightAtWall = (verticalSpeed * wallTime - 0.5 * GRAVITY_MPS2 * wallTime * wallTime) * 0.85;
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
      physicsModelVersion: MODEL_VERSION,
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
      trajectorySamples,
      ballType,
      direction: directionLabel(ballType, sprayDeg),
      isFoul,
      isHR,
      isBarrel,
      hitNet
    };
  }

  global.BaseballPhysicsEngine = {
    MODEL_VERSION,
    DEFAULT_SURFACE_PHYSICS,
    clamp,
    round,
    kmhToMps,
    mphToMps,
    mpsToMph,
    wallDistance,
    surfaceKeyFor,
    surfacePhysicsFor,
    directionLabel,
    classifyBallType,
    solveDecelTime,
    pointAtDistance,
    buildGroundProfile,
    groundStateAtDistance,
    calcBattedBall
  };
})(typeof window !== "undefined" ? window : globalThis);
