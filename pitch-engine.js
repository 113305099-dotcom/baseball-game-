/**
 * pitch-engine.js  v1.0
 *
 * 將 resolveAtBatWithContext() 的核心物理邏輯拆成四個可獨立測試的子模組。
 * 依規則書 §17（投打對決 v4.0）與實作進度 §16.3 第一優先項目設計。
 *
 * 模組結構：
 *   PitchPhysicsModule    — 投球位置生成（§17.4、§17.5）
 *   BatterJudgmentModule  — 打者判斷與出棒決策（§17.6）
 *   ContactResolutionModule — Contact 分數與揮空/界外/進場分流（§17.8、§17.9）
 *   InPlayOutputModule    — 進場球輸出欄位計算（§17.11）
 *
 * 使用方式（在 game.js 的 resolveAtBatWithContext 中）：
 *   // 1. 生成投球位置
 *   const pitchState = PitchPhysicsModule.generate(pitcherStats, pitchConfig);
 *   // 2. 打者決策
 *   const swingDecision = BatterJudgmentModule.decide(batterStats, pitchState, battingConfig);
 *   // 3. 若出棒，計算 contact 結果
 *   const contactResult = ContactResolutionModule.resolve(batterStats, pitchState, swingDecision, battingConfig);
 *   // 4. 若進場，計算初始擊球資料
 *   const inPlayContext = InPlayOutputModule.compute(batterStats, contactResult, pitchState);
 *
 * 所有模組的函式均為純函式（pure function），不直接讀寫 game 物件，
 * 確保可以在 Node.js / 瀏覽器 console 中直接單元測試。
 * 與 game 物件的互動（日誌、球數推進、跑者移動）依然保留在 game.js 的薄封裝層。
 */
(function (global) {
  "use strict";

  // ─────────────────────────────────────────────
  // 共用數學工具（不依賴任何 game 狀態）
  // ─────────────────────────────────────────────

  const MathUtils = {
    clamp(value, min, max) {
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
    },

    randomBetween(min, max) {
      if (min === max) return min;
      const lo = Math.min(min, max);
      const hi = Math.max(min, max);
      return lo + Math.random() * (hi - lo);
    },

    gaussianRandom(mean = 0, std = 1) {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    },

    /** 加權隨機選取 */
    pickWeighted(items) {
      if (!Array.isArray(items) || !items.length) return null;
      const total = items.reduce((s, i) => s + Math.max(0, Number(i.weight) || 0), 0);
      if (total <= 0) return items[Math.floor(Math.random() * items.length)]?.value ?? null;
      let roll = Math.random() * total;
      for (const item of items) {
        roll -= Math.max(0, Number(item.weight) || 0);
        if (roll <= 0) return item.value;
      }
      return items[items.length - 1]?.value ?? null;
    }
  };

  // ─────────────────────────────────────────────
  // §17.2 固定常數
  // ─────────────────────────────────────────────

  const GEOMETRY = {
    gridHalf: 67.5,      // 9x9 接球區半徑 (cm)
    strikeHalf: 22.5,    // 好球帶半徑 (cm)
    cellSizeCm: 15,      // 每格寬高 (cm)
    ballRadiusCm: 3.6,   // 棒球半徑 (cm)
    pitcherAimSize: 5,   // 投手可瞄準的格子邊長
    strikeBandSize: 3    // 好球帶格子邊長
  };

  const GRADE_MOVE_SCALE = { S: 1.15, A: 1.08, B: 1.03, C: 1.00, D: 0.94, E: 0.88 };
  const EFFORT_MOVE_SCALE = { full: 1.05, normal: 1.0, easy: 0.94 };
  const FAST_PITCH_TOKENS = ['四縫', '二縫', '卡特', '切球', '伸卡', '速叉', '快速指叉'];

  const STRATEGY_PROFILES = {
    standard:  { label: '標準',      radiusDelta: 0,   contactMod: 0,   powerMod: 0,   eyeMod: 0,   chaseBonus: 0,     whiffDelta: 0,     foulDelta: 0,    inPlayDelta: 0    },
    power:     { label: '強力揮擊',  radiusDelta: -6,  contactMod: -8,  powerMod: 10,  eyeMod: -6,  chaseBonus: -0.01, whiffDelta: 0.03,  foulDelta: -0.02, inPlayDelta: -0.01 },
    tightZone: { label: '縮小好球帶',radiusDelta: -8,  contactMod: 3,   powerMod: 8,   eyeMod: 3,   chaseBonus: -0.05, whiffDelta: 0.01,  foulDelta: -0.02, inPlayDelta: 0.01 },
    protect:   { label: '保護好球帶',radiusDelta: 10,  contactMod: 8,   powerMod: -8,  eyeMod: 2,   chaseBonus: 0.12,  whiffDelta: -0.04, foulDelta: 0.07,  inPlayDelta: -0.03 },
    patient:   { label: '耐心選球',  radiusDelta: -10, contactMod: -2,  powerMod: -4,  eyeMod: 8,   chaseBonus: -0.08, whiffDelta: -0.02, foulDelta: 0.01,  inPlayDelta: 0.01 },
    aggressive:{ label: '積極攻擊',  radiusDelta: 8,   contactMod: -3,  powerMod: 4,   eyeMod: -5,  chaseBonus: 0.15,  whiffDelta: 0.03,  foulDelta: -0.05, inPlayDelta: 0.02 }
  };

  // ─────────────────────────────────────────────
  // 投球共用輔助（純函式）
  // ─────────────────────────────────────────────

  function getGridCenter(index, size) {
    const safeIndex = (Number.isInteger(index) && index >= 0 && index < size * size)
      ? index
      : Math.floor((size * size) / 2);
    const row = Math.floor(safeIndex / size);
    const col = safeIndex % size;
    const pivot = (size - 1) / 2;
    return {
      x: (col - pivot) * GEOMETRY.cellSizeCm,
      y: (pivot - row) * GEOMETRY.cellSizeCm
    };
  }

  function classifyStuffGrade(stuffScore) {
    const s = MathUtils.clamp(stuffScore, 0, 100);
    if (s >= 93) return 'S';
    if (s >= 85) return 'A';
    if (s >= 75) return 'B';
    if (s >= 65) return 'C';
    if (s >= 55) return 'D';
    return 'E';
  }

  function classifyPitchSpeedGroup(pitchName) {
    const name = String(pitchName || '');
    return FAST_PITCH_TOKENS.some(t => name.includes(t)) ? 'fast' : 'slow';
  }

  function normalizeEffortKey(value) {
    if (value === 'full' || value === 'normal' || value === 'easy') return value;
    if (value === '全力') return 'full';
    if (value === '輕鬆') return 'easy';
    return 'normal';
  }

  // ─────────────────────────────────────────────
  // §1  PitchPhysicsModule
  //     投球位置生成（§17.4、§17.5）
  // ─────────────────────────────────────────────

  /**
   * PitchPhysicsModule.generate(pitcherStats, pitchConfig) → PitchState
   *
   * @param {Object} pitcherStats  投手有效能力值
   *   { control, velocity, breaking, stuffScore, fatigue, pitchTypes, throws }
   * @param {Object} pitchConfig   這球的投球設定
   *   { aimCellIndex(0-24), effortKey, pitchType(name/object) }
   * @returns {PitchState}
   *   { originalTarget, postMiss, finalPosition,
   *     isWildPitch, isStrike,
   *     moveX, moveY, movementMag, movementScale,
   *     stuffScore, stuffGrade, speedKmh,
   *     missOffset }
   */
  const PitchPhysicsModule = {
    generate(pitcherStats, pitchConfig) {
      const ctrl        = MathUtils.clamp(pitcherStats.control ?? 70, 0, 100);
      const stuffScore  = MathUtils.clamp(pitcherStats.stuffScore ?? 50, 0, 100);
      const stuffGrade  = classifyStuffGrade(stuffScore);
      const fatigue     = MathUtils.clamp(pitcherStats.fatigue ?? 0, 0, 100);
      const effortKey   = normalizeEffortKey(pitchConfig.effortKey ?? 'normal');
      const aimIndex    = pitchConfig.aimCellIndex ?? 12; // 預設瞄準 5x5 中心

      // 1. 計算原始位置（5x5 格子中心）
      const originalTarget = getGridCenter(aimIndex, GEOMETRY.pitcherAimSize);

      // 2. 控球隨機偏差（截斷高斯，§17.4）
      const missOffset = this._sampleMissOffset(ctrl);
      const postMiss = {
        x: originalTarget.x + missOffset.dx,
        y: originalTarget.y + missOffset.dy
      };

      // 3. 球路變化量縮放係數
      const gradeScale   = GRADE_MOVE_SCALE[stuffGrade] ?? 1;
      const effortScale  = EFFORT_MOVE_SCALE[effortKey] ?? 1;
      const fatigueScale = MathUtils.clamp(1 - fatigue * 0.004, 0.78, 1);
      const movementScale = gradeScale * effortScale * fatigueScale;

      // 4. 從球種資料取變化量範圍，計算最終位置
      const moveRange = this._getPitchMovementRange(pitcherStats, pitchConfig.pitchType);
      const moveX = MathUtils.randomBetween(moveRange.xMin, moveRange.xMax) * movementScale;
      const moveY = MathUtils.randomBetween(moveRange.yMin, moveRange.yMax) * movementScale;
      const finalPosition = {
        x: postMiss.x + moveX,
        y: postMiss.y + moveY
      };

      // 5. 暴投判定（§17.5）
      const isWildPitch = Math.abs(finalPosition.x) > GEOMETRY.gridHalf
                       || Math.abs(finalPosition.y) > GEOMETRY.gridHalf;

      // 6. 好球判定（球半徑擦邊，§17.5）
      const dx = Math.max(Math.abs(finalPosition.x) - GEOMETRY.strikeHalf, 0);
      const dy = Math.max(Math.abs(finalPosition.y) - GEOMETRY.strikeHalf, 0);
      const isStrike = (dx * dx + dy * dy) <= (GEOMETRY.ballRadiusCm * GEOMETRY.ballRadiusCm);

      // 7. 球速估算
      const speedKmh = this._estimateSpeedKmh(pitcherStats, pitchConfig.pitchType);

      return {
        originalTarget,
        postMiss,
        finalPosition,
        isWildPitch,
        isStrike,
        moveX,
        moveY,
        movementMag: Math.hypot(moveX, moveY),
        movementScale,
        missOffset,
        stuffScore,
        stuffGrade,
        speedKmh,
        effortKey,
        aimCellIndex: aimIndex
      };
    },

    // ── 內部輔助 ──────────────────────────────

    /** §17.4 截斷高斯控球偏差 */
    _sampleMissOffset(controlScore) {
      const ctrl       = MathUtils.clamp(controlScore, 0, 100);
      const missRadius = MathUtils.clamp(36 - ctrl * 0.34, 3, 28);
      const sigma      = missRadius / 2.2;
      let dx = 0, dy = 0, guard = 0;
      do {
        dx = MathUtils.gaussianRandom(0, sigma);
        dy = MathUtils.gaussianRandom(0, sigma);
        guard++;
      } while ((dx * dx + dy * dy) > (missRadius * missRadius) && guard < 30);
      return { dx, dy, missRadius, sigma };
    },

    /** 依球種名稱推算縱橫向變化量範圍（公分） */
    _getPitchMovementRange(pitcherStats, pitch) {
      // 若球種已提供明確範圍，直接使用
      if (Number.isFinite(pitch?.moveXMin) && Number.isFinite(pitch?.moveXMax)
        && Number.isFinite(pitch?.moveYMin) && Number.isFinite(pitch?.moveYMax)) {
        return {
          xMin: Number(pitch.moveXMin),
          xMax: Number(pitch.moveXMax),
          yMin: Number(pitch.moveYMin),
          yMax: Number(pitch.moveYMax)
        };
      }
      const movement = MathUtils.clamp(pitch?.movement ?? pitcherStats.breaking ?? 70, 0, 100);
      const spread   = MathUtils.clamp((movement - 45) * 0.45, 2, 24);
      const name     = String(pitch?.name || '');
      const hand     = pitcherStats.throws === 'L' ? -1 : 1;

      if (name.includes('曲'))              return { xMin: 0.18*spread*hand, xMax: 0.45*spread*hand, yMin: -0.95*spread, yMax: -0.62*spread };
      if (name.includes('滑') || name.includes('橫掃')) return { xMin: -0.95*spread*hand, xMax: -0.48*spread*hand, yMin: -0.3*spread,  yMax: 0.05*spread };
      if (name.includes('指叉') || name.includes('速叉')) return { xMin: -0.15*spread,      xMax: 0.15*spread,      yMin: -0.88*spread, yMax: -0.5*spread  };
      if (name.includes('變速'))            return { xMin: -0.2*spread,       xMax: 0.2*spread,       yMin: -0.45*spread, yMax: -0.1*spread  };
      if (name.includes('伸卡') || name.includes('二縫')) return { xMin: 0.38*spread*hand,  xMax: 0.72*spread*hand, yMin: -0.62*spread, yMax: -0.28*spread };
      if (name.includes('卡特') || name.includes('切球')) return { xMin: -0.45*spread*hand, xMax: -0.15*spread*hand,yMin: -0.25*spread, yMax: 0.05*spread  };
      // 直球系預設（四縫線）
      return { xMin: -0.12*spread, xMax: 0.12*spread, yMin: -0.15*spread, yMax: 0.1*spread };
    },

    _estimateSpeedKmh(pitcherStats, pitch) {
      const base = Number.isFinite(pitch?.speed) ? pitch.speed : (pitcherStats.velocity ?? 75);
      return MathUtils.clamp(112 + base * 0.6 + MathUtils.gaussianRandom(0, 1.8), 100, 170);
    }
  };

  // ─────────────────────────────────────────────
  // §2  BatterJudgmentModule
  //     打者判斷與出棒決策（§17.6、§17.7）
  // ─────────────────────────────────────────────

  /**
   * BatterJudgmentModule.decide(batterStats, pitchState, battingConfig) → SwingDecision
   *
   * @param {Object} batterStats   打者有效能力值（已套用 trait/strategy/condition 修正）
   *   { eye, contact, power, bats }
   * @param {PitchState} pitchState  來自 PitchPhysicsModule.generate()
   * @param {Object} battingConfig   打者本球設定
   *   { strategyKey, targetZoneIndex(0-8), velocityLock('fast'|'slow'|'none'), pitchSpeedGroup, strikes }
   * @returns {SwingDecision}
   *   { swings, perceivedStrike, pCorrectRead, chaseProb,
   *     timingMod, effectiveSwingRadius,
   *     targetZoneCenter, targetDist, edgePenalty }
   */
  const BatterJudgmentModule = {
    decide(batterStats, pitchState, battingConfig) {
      const { originalTarget, movementMag } = pitchState;
      const strategyKey   = battingConfig.strategyKey ?? 'standard';
      const strategy      = STRATEGY_PROFILES[strategyKey] ?? STRATEGY_PROFILES.standard;
      const strikes       = MathUtils.clamp(battingConfig.strikes ?? 0, 0, 2);
      const velocityLock  = battingConfig.velocityLock ?? 'none';
      const pitchSpeedGroup = battingConfig.pitchSpeedGroup ?? 'fast';

      // 球速鎖定修正（§17.7）
      const timingMod = this._resolveTimingMod(velocityLock, pitchSpeedGroup);

      // 打者有效 eye（已含 timingMod 與 strategyEyeBonus）
      const effectiveEye = MathUtils.clamp(
        (batterStats.eye ?? 70) + timingMod.eye + strategy.eyeMod,
        0, 100
      );

      // 目標格中心（3x3 好球帶格子）
      const targetZoneCenter = getGridCenter(battingConfig.targetZoneIndex ?? 4, GEOMETRY.strikeBandSize);

      // 核心距離量
      const centerDist  = Math.hypot(originalTarget.x, originalTarget.y);
      const targetDist  = Math.hypot(originalTarget.x - targetZoneCenter.x, originalTarget.y - targetZoneCenter.y);
      const edgePenalty = MathUtils.clamp((centerDist - 18) / 35, 0, 0.22);

      // 正確判斷機率（§17.6）
      const pCorrectRead = MathUtils.clamp(
        0.50
        + (effectiveEye - 50) / 120
        - movementMag / 170
        - edgePenalty,
        0.15, 0.92
      );

      // 打者「感知」好壞球
      const originalInStrike = Math.abs(originalTarget.x) <= GEOMETRY.strikeHalf
                            && Math.abs(originalTarget.y) <= GEOMETRY.strikeHalf;
      const perceivedStrike = originalInStrike
        ? Math.random() < pCorrectRead
        : Math.random() < (1 - pCorrectRead);

      // 有效出棒半徑（§17.6 策略出棒區）
      const effectiveSwingRadius = 24 + strategy.radiusDelta;

      // 追打率（壞球出棒）
      let chaseProb = MathUtils.clamp(
        0.22 + strategy.chaseBonus - effectiveEye / 180 + movementMag / 220,
        0.03, 0.55
      );
      if (strikes === 2 && strategyKey === 'protect') {
        chaseProb = MathUtils.clamp(chaseProb + 0.06, 0.03, 0.62);
      }

      // 出棒決策（§17.6）
      let swings = false;
      if (perceivedStrike) {
        if (targetDist <= effectiveSwingRadius) {
          swings = true;
        } else if (['tightZone', 'patient', 'power'].includes(strategyKey)) {
          swings = false;
        } else {
          swings = Math.random() < MathUtils.clamp(0.58 + strategy.chaseBonus - effectiveEye / 260, 0.08, 0.68);
        }
      } else if (strategyKey === 'protect' || strategyKey === 'aggressive') {
        swings = Math.random() < chaseProb;
      }

      return {
        swings,
        perceivedStrike,
        pCorrectRead,
        chaseProb,
        timingMod,
        effectiveSwingRadius,
        targetZoneCenter,
        targetDist,
        edgePenalty,
        strategy
      };
    },

    /** §17.7 球速鎖定修正 */
    _resolveTimingMod(lockMode, pitchSpeedGroup) {
      if (lockMode === 'none') return { contact: 0, power: 0, eye: 0, matched: null };
      const matched = lockMode === pitchSpeedGroup;
      return matched
        ? { contact: 8, power: 4, eye: 0, matched: true }
        : { contact: -14, power: -8, eye: -3, matched: false };
    }
  };

  // ─────────────────────────────────────────────
  // §3  ContactResolutionModule
  //     Contact 分數與揮空/界外/進場分流（§17.8、§17.9）
  // ─────────────────────────────────────────────

  /**
   * ContactResolutionModule.resolve(batterStats, pitchState, swingDecision, battingConfig) → ContactResult
   *
   * @param {Object} batterStats   { contact, power, eye } 有效能力（含 trait/timing/condition）
   * @param {PitchState} pitchState
   * @param {SwingDecision} swingDecision
   * @param {Object} battingConfig  { strategyKey, strikes, hotZoneMod }
   *   hotZoneMod: { contact:0, power:0 }（由外部 resolveHotZoneMods 計算後傳入）
   * @returns {ContactResult}
   *   { finalContactScore, contactQuality, pitchStuffPenalty, effectivePower,
   *     whiffProb, foulProb, inPlayProb,
   *     roll, outcome ('swing_miss'|'foul'|'foul_with_two_strikes'|'in_play'),
   *     newStrikes }
   */
  const ContactResolutionModule = {
    resolve(batterStats, pitchState, swingDecision, battingConfig) {
      const { finalPosition, stuffScore, movementMag } = pitchState;
      const { timingMod, targetZoneCenter, strategy } = swingDecision;
      const strategyKey  = battingConfig.strategyKey ?? 'standard';
      const strikes      = MathUtils.clamp(battingConfig.strikes ?? 0, 0, 2);
      const providedHotZone = battingConfig.hotZoneMod ?? { contact: 0, power: 0 };
      const derivedHotZone = this._resolveHotZoneMod(batterStats, finalPosition);
      const hasProvidedHotZone = Number(providedHotZone.contact) || Number(providedHotZone.power);
      const hotZoneMod = hasProvidedHotZone ? providedHotZone : derivedHotZone;

      // §17.8 pitchStuffPenalty
      const pitchStuffPenalty = MathUtils.clamp((stuffScore - 50) / 2.4, -8, 22);

      // targetContactMod：最終位置距打者目標格的距離
      const targetDistanceCm = Math.hypot(
        finalPosition.x - targetZoneCenter.x,
        finalPosition.y - targetZoneCenter.y
      );
      const targetContactMod = MathUtils.clamp(12 - targetDistanceCm / 3, -12, 12);

      // situationalContactMod（預設 0，可由外部傳入兩好球保護等修正）
      const situationalContactMod = battingConfig.situationalContactMod ?? 0;

      // finalContactScore（§17.8）
      const finalContactScore = MathUtils.clamp(
        (batterStats.contact ?? 70)
        + hotZoneMod.contact
        + targetContactMod
        + timingMod.contact
        + strategy.contactMod
        - pitchStuffPenalty
        + situationalContactMod,
        0, 100
      );

      const contactQuality = MathUtils.clamp((finalContactScore - 45) / 50, 0, 1);

      // §17.9 三路機率
      let whiffProb  = MathUtils.clamp(0.48 - contactQuality * 0.34 + pitchStuffPenalty / 160, 0.08, 0.65) + strategy.whiffDelta;
      let inPlayProb = MathUtils.clamp(0.18 + contactQuality * 0.46, 0.10, 0.72) + strategy.inPlayDelta;
      let foulProb   = (1 - whiffProb - inPlayProb) + strategy.foulDelta;

      // 兩好球修正
      if (strikes === 2) {
        whiffProb  = MathUtils.clamp(whiffProb  - 0.04, 0.05, 0.62);
        foulProb   = MathUtils.clamp(foulProb   + 0.06, 0.18, 0.78);
        inPlayProb = MathUtils.clamp(1 - whiffProb - foulProb, 0.08, 0.70);
      }

      // 正規化（確保三路相加 = 1）
      ({ whiffProb, foulProb, inPlayProb } = this._normalizeProbabilities(whiffProb, foulProb, inPlayProb));

      // 抽樣
      const roll = Math.random();
      let outcome;
      let newStrikes = strikes;

      if (roll < whiffProb) {
        newStrikes = Math.min(strikes + 1, 3);
        outcome = 'swing_miss';
      } else if (roll < whiffProb + foulProb) {
        if (strikes < 2) newStrikes = strikes + 1;
        outcome = (newStrikes >= 2) ? 'foul_with_two_strikes' : 'foul';
      } else {
        outcome = 'in_play';
      }

      // effectivePower（§17.11 用）
      const effectivePower = MathUtils.clamp(
        (batterStats.power ?? 70)
        + hotZoneMod.power
        + timingMod.power
        + strategy.powerMod
        - pitchStuffPenalty * 0.35,
        0, 100
      );

      return {
        finalContactScore,
        contactQuality,
        pitchStuffPenalty,
        effectivePower,
        whiffProb,
        foulProb,
        inPlayProb,
        roll,
        outcome,
        newStrikes,
        hotZoneMod,
        targetDistanceCm
      };
    },

    _normalizeProbabilities(whiffProb, foulProb, inPlayProb) {
      const sw = Math.max(0, whiffProb);
      const sf = Math.max(0, foulProb);
      const si = Math.max(0, inPlayProb);
      const total = sw + sf + si;
      if (total <= 0) return { whiffProb: 0.34, foulProb: 0.33, inPlayProb: 0.33 };
      return { whiffProb: sw / total, foulProb: sf / total, inPlayProb: si / total };
    },

    _resolveHotZoneMod(batterStats, finalPosition) {
      const heatMap = batterStats?.advancedStats?.heatMap;
      if (!heatMap || typeof heatMap !== 'object') {
        return { contact: 0, power: 0, eye: 0 };
      }
      const col = MathUtils.clamp(Math.floor((MathUtils.clamp(finalPosition.x, -22.49, 22.49) + 22.5) / 15), 0, 2);
      const row = MathUtils.clamp(Math.floor((22.5 - MathUtils.clamp(finalPosition.y, -22.49, 22.49)) / 15), 0, 2);
      const cell = heatMap[`${row},${col}`] || heatMap[`${row}-${col}`] || {};
      return {
        contact: MathUtils.clamp(cell.contactMod ?? 0, -8, 8),
        power: MathUtils.clamp(cell.powerMod ?? 0, -6, 10),
        eye: MathUtils.clamp(cell.eyeMod ?? 0, -4, 4)
      };
    }
  };

  // ─────────────────────────────────────────────
  // §4  InPlayOutputModule
  //     進場球輸出欄位計算（§17.11）
  // ─────────────────────────────────────────────

  /**
   * InPlayOutputModule.compute(batterStats, contactResult, pitchState) → InPlayContext
   *
   * @param {Object} batterStats   { power, bats, advancedStats }
   * @param {ContactResult} contactResult  來自 ContactResolutionModule.resolve()
   * @param {PitchState} pitchState
   * @returns {InPlayContext}
   *   { evKmh, launchAngleDeg, sprayAngleDeg,
   *     contactPointQuality, battedBallTypeHint,
   *     finalPositionAtPlate, pitchContext }
   */
  const InPlayOutputModule = {
    compute(batterStats, contactResult, pitchState) {
      const { effectivePower, finalContactScore, contactQuality } = contactResult;
      const { finalPosition, stuffScore, speedKmh, effortKey } = pitchState;

      // EV（§17.11）
      const evKmh = MathUtils.clamp(
        92
        + effectivePower * 0.62
        + (finalContactScore - 50) * 0.28
        + MathUtils.gaussianRandom(0, 6),
        40, 190
      );

      // 擊球型態與角度
      const battedBallTypeHint = this._sampleBattedBallType(batterStats);
      const angles = this._generateAngles(batterStats, finalPosition, battedBallTypeHint, contactQuality);

      return {
        evKmh: Math.round(evKmh * 10) / 10,
        launchAngleDeg: Math.round(angles.launch * 10) / 10,
        sprayAngleDeg: Math.round(angles.spray * 10) / 10,
        contactPointQuality: Math.round(contactQuality * 1000) / 1000,
        battedBallTypeHint,
        finalPositionAtPlate: { ...finalPosition },
        pitchContext: {
          stuffScore: Math.round(stuffScore),
          speedKmh: Math.round(speedKmh),
          effortLevel: effortKey
        }
      };
    },

    /** 依打者統計分布抽樣擊球型態 */
    _sampleBattedBallType(batterStats) {
      const stats = batterStats?.advancedStats ?? {};
      const gb    = Number(stats.gbRate);
      const ld    = Number(stats.ldRate);
      const fb    = Number(stats.fbRate);
      const popup = Number(stats.popupRate ?? stats.puRate);
      const hasRealMix = [gb, ld, fb, popup].every(v => Number.isFinite(v) && v >= 0);
      const mix = hasRealMix
        ? { ground: gb, liner: ld, fly: fb, popup }
        : { ground: 0.42, liner: 0.22, fly: 0.30, popup: 0.06 };
      return MathUtils.pickWeighted([
        { value: 'ground', weight: mix.ground },
        { value: 'liner',  weight: mix.liner  },
        { value: 'fly',    weight: mix.fly    },
        { value: 'popup',  weight: mix.popup  }
      ]) || 'ground';
    },

    /** 依擊球型態範圍與打者仰角偏好計算 launchAngle 與 sprayAngle */
    _generateAngles(batterStats, finalPosition, ballTypeHint, contactQuality) {
      const typeRanges = {
        ground: [-15, 9],
        liner:  [10, 24],
        fly:    [25, 39],
        popup:  [40, 60]
      };
      const [laMin, laMax] = typeRanges[ballTypeHint] || typeRanges.ground;
      const baseLaunch = MathUtils.randomBetween(laMin, laMax);
      const avgLaunch  = Number(batterStats?.advancedStats?.avgLaunchAngle);
      const launch = Number.isFinite(avgLaunch)
        ? MathUtils.clamp(baseLaunch * 0.7 + avgLaunch * 0.3, -20, 65)
        : MathUtils.clamp(baseLaunch + (contactQuality - 0.5) * 4, -20, 65);

      const pullBias = batterStats?.bats === 'L' ? 6 : batterStats?.bats === 'R' ? -6 : 0;
      const spray = MathUtils.clamp(
        MathUtils.gaussianRandom(pullBias + finalPosition.x * 0.25, 14),
        -55, 55
      );
      return { launch, spray };
    }
  };

  // ─────────────────────────────────────────────
  // §5  PitchEngineOrchestrator
  //     統一入口：單球完整流程（純物理層，不含 game 狀態副作用）
  // ─────────────────────────────────────────────

  /**
   * PitchEngineOrchestrator.resolveSinglePitch(input) → SinglePitchResult
   *
   * 整合四個子模組，執行一球的完整投打判斷並回傳結構化結果。
   * 不做任何 game 狀態寫入，呼叫方（resolveAtBatWithContext）自行處理副作用。
   *
   * @param {Object} input
   *   pitcherStats  { control, velocity, breaking, stuffScore, fatigue, pitchTypes, throws }
   *   pitchConfig   { aimCellIndex, effortKey, pitchType }
   *   batterStats   { contact, power, eye, bats, advancedStats }
   *   battingConfig { strategyKey, targetZoneIndex, velocityLock, pitchSpeedGroup, strikes,
   *                   hotZoneMod, situationalContactMod }
   *
   * @returns {SinglePitchResult}
   *   pitch, swing, contact (null 若未出棒), inPlay (null 若未進場),
   *   summary { outcome, isWildPitch, isStrike, swings, newStrikes, newBalls }
   */
  const PitchEngineOrchestrator = {
    resolveSinglePitch(input) {
      const { pitcherStats, pitchConfig, batterStats, battingConfig } = input;
      const balls   = MathUtils.clamp(battingConfig.balls ?? 0, 0, 3);
      const strikes = MathUtils.clamp(battingConfig.strikes ?? 0, 0, 2);

      // 1. 投球位置生成
      const pitch = PitchPhysicsModule.generate(pitcherStats, pitchConfig);

      // 2. 打者判斷（注入 pitchSpeedGroup）
      const pitchSpeedGroup = classifyPitchSpeedGroup(
        pitchConfig.pitchType?.name || pitchConfig.pitchTypeName || ''
      );
      const swing = BatterJudgmentModule.decide(batterStats, pitch, {
        ...battingConfig,
        pitchSpeedGroup,
        strikes
      });

      // 3. 不出棒 → 單純球數推進
      if (!swing.swings) {
        let newBalls   = balls;
        let newStrikes = strikes;
        let outcome;

        if (pitch.isWildPitch) {
          newBalls += 1;
          outcome = 'wild_pitch_ball';
        } else if (pitch.isStrike) {
          newStrikes = Math.min(strikes + 1, 3);
          outcome = 'called_strike';
        } else {
          newBalls += 1;
          outcome = 'ball';
        }

        // 保送 / 三振
        if (newBalls >= 4) outcome = 'walk';
        else if (newStrikes >= 3) outcome = 'strikeout';

        return {
          pitch,
          swing,
          contact: null,
          inPlay: null,
          summary: {
            outcome,
            isWildPitch: pitch.isWildPitch,
            isStrike: pitch.isStrike,
            swings: false,
            newStrikes,
            newBalls
          }
        };
      }

      // 4. 出棒 → Contact 分流
      const contact = ContactResolutionModule.resolve(
        batterStats, pitch, swing,
        { ...battingConfig, strikes }
      );

      // 5. 保送 / 三振判定（contact 結果可能帶入新 strikes）
      let finalOutcome = contact.outcome;
      const newBalls   = balls;
      let newStrikes   = contact.newStrikes;

      if (newStrikes >= 3 && (finalOutcome === 'swing_miss' || finalOutcome === 'foul_with_two_strikes')) {
        finalOutcome = 'strikeout';
      }

      // 6. 進場球輸出
      let inPlay = null;
      if (contact.outcome === 'in_play') {
        inPlay = InPlayOutputModule.compute(batterStats, contact, pitch);
        finalOutcome = 'in_play';
      }

      return {
        pitch,
        swing,
        contact,
        inPlay,
        summary: {
          outcome: finalOutcome,
          isWildPitch: pitch.isWildPitch,
          isStrike: pitch.isStrike,
          swings: true,
          newStrikes,
          newBalls
        }
      };
    }
  };

  // ─────────────────────────────────────────────
  // §6  公開 API
  // ─────────────────────────────────────────────

  global.PitchEngine = {
    /** 子模組，供進階使用與單元測試 */
    Physics:     PitchPhysicsModule,
    Judgment:    BatterJudgmentModule,
    Contact:     ContactResolutionModule,
    InPlay:      InPlayOutputModule,

    /** 常數與對應表 */
    GEOMETRY,
    STRATEGY_PROFILES,
    GRADE_MOVE_SCALE,
    EFFORT_MOVE_SCALE,

    /** 統一入口：一球完整物理流程 */
    resolveSinglePitch: PitchEngineOrchestrator.resolveSinglePitch.bind(PitchEngineOrchestrator),

    /** 共用數學工具（供 game.js 使用，避免重複定義） */
    MathUtils,

    /** 輔助：將球種名稱分類為快/慢 */
    classifyPitchSpeedGroup,

    /** 輔助：格子中心座標 */
    getGridCenter: (index, size) => getGridCenter(index, size)
  };

  // 向後相容：舊版 game.js 仍可透過 window.PitchPhysicsModule 等名稱訪問
  global.PitchPhysicsModule     = PitchPhysicsModule;
  global.BatterJudgmentModule   = BatterJudgmentModule;
  global.ContactResolutionModule = ContactResolutionModule;
  global.InPlayOutputModule     = InPlayOutputModule;

})(typeof window !== "undefined" ? window : globalThis);
