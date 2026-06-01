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
  // 投手通道係數（投打對決修正書 §16 投手 9 通道對稱化）
  //   引擎內建預設值＝校準來源（sim-tester.html 不載入 game-params.js）；
  //   若 game-params.js 已載入並定義 GAME_PARAMS.pitcherChannels，則覆寫之。
  //   ⚠️ 兩處數值必須保持一致。
  // ─────────────────────────────────────────────
  const PITCHER_CHANNELS = Object.assign({
    // ── Wave A/B/C（已落地）──
    stuffMulCoef:     0.008,  // Wave A：plateDiscipline 混合對投手 stuffScore 動態化（stuff 70 → ×1.0）
    // Wave B 真正的 control→BB9 通道（§16.14）：壞球率（aim 投出好球帶外的權重）隨控球變、樞紐 control=70。
    //   取代失敗的 missOffset 路線（§16 通道 2，已證實保送非由投球落點決定）。
    ctrlBallRateCoef: 0.012,  // control 70→×1.0、40→×1.36、100→×0.64（弱控投更多壞球→保送↑）
    // Wave B-2 velocity 通道（§16.14 通道 1）：球速直接扣 contact（不靠 stuff、不靠 velocityLock）。
    //   樞紐 velocity=70（平均投手 0 penalty、不位移聯盟 AVG），有別於 §16 原設計的 speedKmh 樞紐 142。
    velContactCoef:   0.18,   // velocity 90→contact -3.6、50→+3.6、100→-5.4（clamp -10~+4）
    // Wave C-1 breaking 通道（§16.15）已試並退回：breaking 與 stuff 共線，R² 不升、只墊高 K 率。
    // Wave C-2 crisis 通道（只在 game.js 真實對局生效、sim 量不到）
    crisisCtrlCoef:  0.20,
    crisisBreakCoef: 0.10,
    crisisVelCoef:   0.05,

    // ── Phase 0 新參數（配球意圖 + 打者預期 + 差異化追打）──
    // 所有新參數預設 0 = 不啟用。sequencingEnabled=1 才啟用全部。
    sequencingEnabled: 0,  // 總開關（sim-tester 用此預設=0，瀏覽器 game-params.js 覆寫為 1）

    // Phase 1：配球意圖（CountIntentSelector → PitchIntentBuilder → SequenceEnhancer）
    putaway_breakPreferred:     0.65,  // putaway 意圖（0-2/1-2）偏好 breaking ball 權重
    putaway_fastballUpChance:   0.25,  // putaway 意圖用高速球瞄上緣機率（眼位+速差）
    mustStrike_fastballOnly:    0.90,  // must_strike 意圖（3-0/3-1）只用速球系的機率
    getAhead_fastballPreferred: 0.60,  // get_ahead 意圖（0-0）偏好速球權重
    weaknessExploitWeight:      0.20,  // 打者弱點（pitchTypeMatchup）對球種選擇影響
    sequenceEyeLevelBonus:      0.10,  // 眼位變化（高低交替）加分
    sequenceSpeedContrastBonus: 0.10,  // 速差（快慢交替）加分
    sequenceTunnelingBonus:     0.08,  // 同 aim zone 不同球種（tunneling）加分
    usageRepeatPenalty:         0.40,  // 連續同球種遞減懲罰

    // Phase 2：打者預期模型
    batterGuessBaseAccuracy: 0.30,  // 打者猜球種基礎正確率
    batterLearningRate:      0.15,  // 每次投球後更新信念速率
    speedContrastThreshold:  8,     // 速差對 timing 干擾閾值（km/h）
    eyeLevelChangeThreshold: 15,    // 眼位變化對 depth perception 干擾（cm）

    // Phase 3：差異化追打/揮空（已啟用）
    lateBreakChaseBonus:  0.12,  // late-breaking（aim in→final out）額外追打率
    wasteChasePenalty:    0.08,  // waste pitch（全程壞球）追打率降低
    backdoorChaseBonus:   0.03,  // backdoor（aim out→final in）額外追打率
    deceptionWhiffBoost:  0.04,  // deception（late break+難辨識）揮空率加成

    // Wave F：per-pitch 擊球品質抑制（命中抑制通道）
    //   不同於 Wave B 的 velContactPenalty（扣 contact → 影響 whiff/in-play 分流），
    //   Wave F 扣 effectivePower → 影響進場球的 EV/品質 → 降低被安打率。
    //   用 per-pitch 資料（非能力值）：球速、尾勁、欺騙性、進壘點。
    waveF_speedQualityCoef:     0.06,  // (speedKmh-140)*0.06 → 155kmh≈EV扣0.9, 140以下不扣
    waveF_lateBreakQualityCoef: 4.0,   // lateBreakFactor*4 → SL(0.70)=2.8, FF(0.10)=0.4
    waveF_deceptionQualityCoef: 3.0,   // deceptionWindow*3 → CH(0.65)=2.0, FF(0.15)=0.5
    waveF_locationQualityCoef:  0.12,  // (dist-15)*0.12 → 邊角30cm=1.8, 紅中10cm=0
  }, (global.GAME_PARAMS && global.GAME_PARAMS.pitcherChannels) || {});

  /**
   * 控球 → 壞球率乘數（§16.14 Wave B control 通道，單一來源）。
   * 樞紐 control=70 回傳 1.0，保住聯盟平均 BB9 不塌陷；弱控 >1（壞球↑）、強控 <1。
   * game.js resolvePitchAimCell 與 sim-tester resolvePitchAimCellGameLike 都呼叫本函式。
   */
  function controlBallRateMul(control) {
    const c = Number(control);
    const ctrl = Number.isFinite(c) ? Math.max(0, Math.min(100, c)) : 70;
    const mul = 1 - (ctrl - 70) * PITCHER_CHANNELS.ctrlBallRateCoef;
    return Math.max(0.40, Math.min(1.60, mul));
  }

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
  // v4.1 3B：四段出力（藍 easy / 綠 normal / 黃 full / 紅 max）。
  // ⚠️ normal 一律維持 1.0 / 0，確保打者 sim baseline（effortKey:'normal'）不受影響。
  const EFFORT_MOVE_SCALE = { easy: 0.94, normal: 1.0, full: 1.05, max: 1.10 };
  // 速度倍率：套到 _estimateSpeedKmh（越紅球速越快）。
  const EFFORT_VELO_SCALE = { easy: 0.97, normal: 1.0, full: 1.04, max: 1.08 };
  // 失控強度：只在高出力檔（黃小、紅大），normal/easy = 0 不失控。
  const EFFORT_WILD_FACTOR = { easy: 0, normal: 0, full: 0.4, max: 1.0 };
  const FAST_PITCH_TOKENS = ['四縫', '二縫', '卡特', '切球', '伸卡', '速叉', '快速指叉'];

  // 球種速度係數（v3.26）：velocity 能力值 → maxSpeed → 各球種實際球速 = maxSpeed × ratio
  const PITCH_SPEED_RATIO = {
    '四縫線': 1.00,
    '二縫線': 0.96,
    '卡特球': 0.91,
    '切球':   0.91,
    '伸卡球': 0.96,
    '滑球':   0.84,
    '變速球': 0.83,
    '指叉':   0.85,
    '快速指叉':0.85,
    '曲球':   0.77
  };

  // Phase 3：球種欺騙屬性（lateBreakFactor = 變化集中在飛行後段的比例）
  const PITCH_LATE_BREAK = {
    '四縫線': 0.10, '二縫線': 0.25, '卡特球': 0.35, '切球': 0.35,
    '伸卡球': 0.25, '滑球': 0.70, '變速球': 0.30, '指叉': 0.85,
    '快速指叉': 0.80, '曲球': 0.40
  };
  // Phase 3：球種辨識難度（deceptionWindow = 打者多難早期辨識此球種）
  const PITCH_DECEPTION_WINDOW = {
    '四縫線': 0.15, '二縫線': 0.25, '卡特球': 0.30, '切球': 0.30,
    '伸卡球': 0.25, '滑球': 0.50, '變速球': 0.65, '指叉': 0.60,
    '快速指叉': 0.55, '曲球': 0.45
  };

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
    if (value === 'full' || value === 'normal' || value === 'easy' || value === 'max') return value;
    if (value === '全力') return 'full';
    if (value === '輕鬆') return 'easy';
    if (value === '爆發' || value === '全開') return 'max';
    return 'normal';
  }

  /** 中文球種名稱 → FF/SI/FC/SL/CU/CH/FS（回傳 null 表示未知） */
  function classifyPitchTypeCode(pitchName) {
    const n = String(pitchName || '');
    if (n.includes('四縫') || n.includes('直球') || n.includes('速球')) return 'FF';
    if (n.includes('伸卡') || n.includes('二縫'))                        return 'SI';
    if (n.includes('卡特') || n.includes('切球'))                        return 'FC';
    if (n.includes('滑球') || n.includes('橫掃'))                        return 'SL';
    if (n.includes('曲'))                                                 return 'CU';
    if (n.includes('變速'))                                               return 'CH';
    if (n.includes('指叉') || n.includes('速叉') || n.includes('叉球'))  return 'FS';
    return null;
  }

  /** 最終位置 → core / edge / chase / invalid（以好球帶半徑 22.5 cm 為基準） */
  function classifyPlateZone(pos) {
    const d = Math.max(Math.abs(pos.x), Math.abs(pos.y));
    if (d <= 11.25) return 'core';    // 好球帶內半
    if (d <= 22.5)  return 'edge';    // 好球帶外緣
    if (d <= 33.75) return 'chase';   // 好球帶外 0.5 倍寬（追打區）
    return 'invalid';                 // 遠離好球帶
  }

  /**
   * Phase 3：球路軌跡分類
   *   比較飛行中期（50% movement）與最終位置的 zone，判斷球路型態。
   *   回傳 'late_break' | 'waste' | 'backdoor' | 'strike' | 'hittable_strike'
   */
  function classifyPitchTrajectory(midPoint, finalPosition) {
    const midZone = classifyPlateZone(midPoint);
    const finalZone = classifyPlateZone(finalPosition);

    const midInStrike = (midZone === 'core' || midZone === 'edge');
    const finalInStrike = (finalZone === 'core' || finalZone === 'edge');
    const finalIsChase = (finalZone === 'chase' || finalZone === 'invalid');

    if (midInStrike && finalIsChase) return 'late_break';       // aim-in, break-out → 引誘球
    if (!midInStrike && finalIsChase) return 'waste';           // 全程壞球 → waste pitch
    if (!midInStrike && finalInStrike) return 'backdoor';       // aim-out, break-in → backdoor
    if (finalZone === 'core') return 'hittable_strike';         // 全程紅中 → 打者最愛
    if (finalInStrike) return 'strike';                         // 好球（非紅中）
    return 'other';                                              // 罕見邊界狀況
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

      // 1. 計算原始位置（v3.25.3：aimPosition 優先，否則用 5x5 格中心）
      const originalTarget = (pitchConfig.aimPosition
          && Number.isFinite(pitchConfig.aimPosition.x)
          && Number.isFinite(pitchConfig.aimPosition.y))
        ? { x: pitchConfig.aimPosition.x, y: pitchConfig.aimPosition.y }
        : getGridCenter(aimIndex, GEOMETRY.pitcherAimSize);

      // 2. 控球隨機偏差（截斷高斯，§17.4）
      const missOffset = this._sampleMissOffset(ctrl);

      // 2b. v4.1 3B：高出力失控（只在 full/max；控球越差、越紅越易失控）
      //     normal/easy → wildFactor 0 → 完全不觸發，打者 sim baseline 不受影響。
      const wildFactor = EFFORT_WILD_FACTOR[effortKey] ?? 0;
      let wildOffset = { dx: 0, dy: 0 };
      let isControlLapse = false;
      let wildChance = 0;
      if (wildFactor > 0) {
        // ctrl 50 → 高機率；ctrl 90 → 低機率。乘以該檔強度。
        wildChance = MathUtils.clamp((0.05 + (80 - ctrl) * 0.007) * wildFactor, 0, 0.5);
        if (MathUtils.randomBetween(0, 1) < wildChance) {
          isControlLapse = true;
          const mag = MathUtils.randomBetween(11, 27) * wildFactor;  // 大幅偏移（暴投級）
          const ang = MathUtils.randomBetween(0, Math.PI * 2);
          wildOffset = { dx: Math.cos(ang) * mag, dy: Math.sin(ang) * mag };
        }
      }
      const postMiss = {
        x: originalTarget.x + missOffset.dx + wildOffset.dx,
        y: originalTarget.y + missOffset.dy + wildOffset.dy
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

      // 7. 球速估算（v4.1 3B：套四段出力速度倍率，normal=1.0 不動 baseline）
      const speedKmh = this._estimateSpeedKmh(pitcherStats, pitchConfig.pitchType, effortKey);

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
        pitcherVelocity: Number.isFinite(pitcherStats?.velocity) ? pitcherStats.velocity : 70,  // §16.14 B-2 velocity 通道用
        effortKey,
        isControlLapse,   // v4.1 3B：本球是否高出力失控（暴投級偏移）
        wildChance,       // 當下失控機率（debug/UI 用）
        aimCellIndex: aimIndex,
        // Phase 3：球種欺騙屬性
        deceptionAttributes: (() => {
          const pName = (typeof pitchConfig.pitchType === 'string')
            ? pitchConfig.pitchType
            : (pitchConfig.pitchType?.name || pitchConfig.pitchTypeName || '');
          return {
            lateBreakFactor: PITCH_LATE_BREAK[pName] ?? 0.30,
            deceptionWindow: PITCH_DECEPTION_WINDOW[pName] ?? 0.30,
            trajectoryMidPoint: {
              x: postMiss.x + moveX * 0.5,
              y: postMiss.y + moveY * 0.5
            }
          };
        })()
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

    _estimateSpeedKmh(pitcherStats, pitch, effortKey = 'normal') {
      const velocity = Number.isFinite(pitcherStats?.velocity) ? pitcherStats.velocity : 75;
      const maxSpeed = 112 + velocity * 0.6;
      const ratio = (pitch && pitch.name && PITCH_SPEED_RATIO[pitch.name]) || 1.0;
      const effortMul = EFFORT_VELO_SCALE[effortKey] ?? 1;  // v4.1 3B（normal=1.0）
      return MathUtils.clamp(maxSpeed * ratio * effortMul + MathUtils.gaussianRandom(0, 1.5), 95, 175);
    }
  };

  // ─────────────────────────────────────────────
  // §2  BatterJudgmentModule
  //     打者判斷與出棒決策（§17.6、§17.7）
  // ─────────────────────────────────────────────

  /**
   * BatterJudgmentModule.decide(batterStats, pitchState, battingConfig, batterExpectation?) → SwingDecision
   *
   * @param {Object} batterStats   打者有效能力值（已套用 trait/strategy/condition 修正）
   *   { eye, contact, power, bats }
   * @param {PitchState} pitchState  來自 PitchPhysicsModule.generate()
   * @param {Object} battingConfig   打者本球設定
   *   { strategyKey, targetZoneIndex(0-8), velocityLock('fast'|'slow'|'none'), pitchSpeedGroup, strikes }
   * @param {Object} [batterExpectation]  Phase 2 打者預期模型狀態（可選，null=無模型）
   *   { guessedPitchType, guessConfidence, expectedSpeedGroup, lastGuessCorrect, timingState }
   * @returns {SwingDecision}
   *   { swings, perceivedStrike, pCorrectRead, chaseProb,
   *     timingMod, effectiveSwingRadius,
   *     targetZoneCenter, targetDist, edgePenalty }
   */
  const BatterJudgmentModule = {
    decide(batterStats, pitchState, battingConfig, batterExpectation) {
      const { originalTarget, finalPosition, movementMag } = pitchState;
      const strategyKey   = battingConfig.strategyKey ?? 'standard';
      const strategy      = STRATEGY_PROFILES[strategyKey] ?? STRATEGY_PROFILES.standard;
      const strikes       = MathUtils.clamp(battingConfig.strikes ?? 0, 0, 2);
      const balls         = MathUtils.clamp(battingConfig.balls   ?? 0, 0, 3);
      const velocityLock  = battingConfig.velocityLock ?? 'none';
      const pitchSpeedGroup = battingConfig.pitchSpeedGroup ?? 'fast';

      // 球速鎖定修正（§17.7）+ timing 歷史資料修正
      const timingMod = this._resolveTimingMod(velocityLock, pitchSpeedGroup, batterStats?.advancedStats?.timing);

      // 打者有效 eye（已含 timingMod 與 strategyEyeBonus）
      const effectiveEye = MathUtils.clamp(
        (batterStats.eye ?? 70) + timingMod.eye + strategy.eyeMod,
        0, 100
      );

      // 目標格中心（3x3 好球帶格子）
      const targetZoneCenter = getGridCenter(battingConfig.targetZoneIndex ?? 4, GEOMETRY.strikeBandSize);
      const judgmentPosition = finalPosition || originalTarget;

      // 核心距離量
      const centerDist  = Math.hypot(judgmentPosition.x, judgmentPosition.y);
      const targetDist  = Math.hypot(judgmentPosition.x - targetZoneCenter.x, judgmentPosition.y - targetZoneCenter.y);
      const edgePenalty = MathUtils.clamp((centerDist - 18) / 35, 0, 0.22);

      // 正確判斷機率（§17.6）— v1.4 提升：baseline 0.62→0.66、斜率 /140→/130
      // 理由：站著被叫好球比例過高（每球 21.5%），K% 多出來主因
      const pCorrectRead = MathUtils.clamp(
        0.66
        + (effectiveEye - 50) / 130
        - movementMag / 230
        - edgePenalty * 0.65,
        0.18, 0.94
      );

      // Phase 2：打者預期模型微調（batterExpectation 非 null 時才生效）
      let expectationMod = { pCorrectReadDelta: 0, timingContactDelta: 0, eyeDelta: 0 };
      if (batterExpectation && batterExpectation.guessedPitchType) {
        // 使用 BatterAIModel 計算微調值
        if (typeof global.BatterAIModel !== 'undefined' && global.BatterAIModel.computeExpectationMod) {
          expectationMod = global.BatterAIModel.computeExpectationMod(
            batterExpectation,
            battingConfig.pitchTypeCode || '',
            pitchState.speedKmh,
            pitchState.finalPosition
          );
        }
      }
      const adjustedPCorrectRead = MathUtils.clamp(
        pCorrectRead + expectationMod.pCorrectReadDelta,
        0.15, 0.96
      );
      // timingMod 疊加打者預期的速度對比懲罰
      if (expectationMod.timingContactDelta !== 0) {
        timingMod.contact = MathUtils.clamp(
          (timingMod.contact || 0) + expectationMod.timingContactDelta,
          -21, 12
        );
      }

      // 打者「感知」好壞球
      const actualInStrike = Math.abs(judgmentPosition.x) <= GEOMETRY.strikeHalf
                          && Math.abs(judgmentPosition.y) <= GEOMETRY.strikeHalf;
      const perceivedStrike = actualInStrike
        ? Math.random() < adjustedPCorrectRead
        : Math.random() < (1 - adjustedPCorrectRead);

      // 有效出棒半徑（§17.6 策略出棒區）
      const twoStrikeStandard = strategyKey === 'standard' && strikes === 2;
      const standardZoneCoverage = strategyKey === 'standard' && actualInStrike ? 14 : 0;
      const twoStrikeCoverage = twoStrikeStandard ? (actualInStrike ? 10 : 2) : 0;
      const effectiveSwingRadius = 24 + strategy.radiusDelta + standardZoneCoverage + twoStrikeCoverage;

      // 追打率（壞球出棒）— v1.2 重校：以 P50 eye=82 為樞紐，配合 CPBL 真實 discipline 分布（70-95）
      let chaseProb = MathUtils.clamp(
        0.13
        - (effectiveEye - 82) * 0.011
        + movementMag / 280
        + strategy.chaseBonus,
        0.04, 0.42
      );
      if (strikes === 2 && strategyKey === 'protect') {
        chaseProb = MathUtils.clamp(chaseProb + 0.08, 0.04, 0.55);
      } else if (twoStrikeStandard) {
        chaseProb = MathUtils.clamp(chaseProb + 0.05, 0.04, 0.55);
      }
      // swingByCount：依球數情境歷史攻擊率微調追打傾向
      const swingCountData = batterStats?.advancedStats?.swingByCount?.[`${balls}-${strikes}`];
      if (swingCountData && Number.isFinite(Number(swingCountData.swingRate))) {
        chaseProb = MathUtils.clamp(chaseProb + (Number(swingCountData.swingRate) - 0.47) * 0.30, 0.04, 0.55);
      }

      // Phase 3：球路軌跡差異化追打率
      //   late_break（aim-in→break-out）＝打者啟動揮棒後球跑掉 → 追打率高
      //   waste（全程壞球）＝打者早期辨識 → 追打率低
      //   backdoor（aim-out→break-in）＝看起來像壞球但最後拐進好球帶 → 中等
      const da = pitchState.deceptionAttributes;
      if (da && da.trajectoryMidPoint) {
        const trajType = classifyPitchTrajectory(da.trajectoryMidPoint, judgmentPosition);
        const ch = PITCHER_CHANNELS;
        if (trajType === 'late_break') {
          chaseProb += da.lateBreakFactor * (ch.lateBreakChaseBonus || 0.12);
          chaseProb += da.deceptionWindow * 0.04;
        } else if (trajType === 'waste') {
          chaseProb -= (ch.wasteChasePenalty || 0.08);
        } else if (trajType === 'backdoor') {
          chaseProb += (ch.backdoorChaseBonus || 0.03);
        }
        chaseProb = MathUtils.clamp(chaseProb, 0.02, 0.58);
      }

      // 出棒決策（§17.6）— v1.3 重寫：感知好球也機率性出棒（不再 hard true）
      // 距 target 越近 → 越會揮；兩好球 → 多揮；精眼 → 略保守
      let swings = false;
      if (perceivedStrike) {
        if (targetDist <= effectiveSwingRadius) {
          const distRatio = MathUtils.clamp(targetDist / Math.max(effectiveSwingRadius, 1), 0, 1);
          const zoneSwingProb = MathUtils.clamp(
            0.88
            - distRatio * 0.40
            + strategy.chaseBonus * 0.3
            + (strikes === 2 ? 0.12 : 0)
            - (effectiveEye - 82) / 250,
            0.30, 0.95
          );
          swings = Math.random() < zoneSwingProb;
        } else if (['tightZone', 'patient', 'power'].includes(strategyKey)) {
          swings = false;
        } else {
          // v1.4：misread chase（感知好球但遠離 target zone）改為低機率出棒
          // 舊公式 0.58 - eye/260 在 eye=80 算出 0.27，導致 chase rate 卡在 35%
          swings = Math.random() < MathUtils.clamp(0.42 + strategy.chaseBonus * 0.5 - effectiveEye / 300, 0.05, 0.55);
        }
      } else {
        // 感知為壞球 — 所有策略都套用 chaseProb（patient/tightZone 透過 chaseBonus 自動降低）
        swings = Math.random() < chaseProb;
      }
      if (!swings && twoStrikeStandard && actualInStrike) {
        swings = Math.random() < 0.70;
      }

      return {
        swings,
        perceivedStrike,
        pCorrectRead: adjustedPCorrectRead,
        chaseProb,
        timingMod,
        effectiveSwingRadius,
        targetZoneCenter,
        targetDist,
        edgePenalty,
        strategy
      };
    },

    /** §17.7 球速鎖定修正 + timing 歷史資料修正 */
    _resolveTimingMod(lockMode, pitchSpeedGroup, timingData) {
      if (lockMode === 'none') return { contact: 0, power: 0, eye: 0, matched: null };
      const matched     = lockMode === pitchSpeedGroup;
      const baseContact = matched ? 8 : -14;
      const basePower   = matched ? 4 : -8;
      const baseEye     = matched ? 0 : -3;
      // badPct = latePct + earlyPct；基準值 0.50，每偏移 0.10 調整 ±1.2 分
      let timingAdj = 0;
      if (timingData) {
        const lpKey  = pitchSpeedGroup === 'fast' ? 'fastLatePct'  : 'slowLatePct';
        const epKey  = pitchSpeedGroup === 'fast' ? 'fastEarlyPct' : 'slowEarlyPct';
        const badPct = (Number(timingData[lpKey]) || 0) + (Number(timingData[epKey]) || 0);
        timingAdj = -(badPct - 0.50) * 12;
      }
      return {
        contact: MathUtils.clamp(baseContact + timingAdj, -18, 12),
        power:   basePower,
        eye:     baseEye,
        matched
      };
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
      const { finalPosition, stuffScore, movementMag, pitcherVelocity } = pitchState;
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

      // §16.14 Wave B-2 velocity 通道（通道 1）：球速直接扣 contact（不靠 stuff、不靠 velocityLock）。
      //   樞紐 velocity=70 → 0；快速球派壓 contact↑whiff↑K9↑、慢速派反向。對打者均勻、相對排序不變。
      const velForContact = Number.isFinite(pitcherVelocity) ? pitcherVelocity : 70;
      const velContactPenalty = MathUtils.clamp((velForContact - 70) * PITCHER_CHANNELS.velContactCoef, -10, 4);

      // finalContactScore（§17.8）
      const finalContactScore = MathUtils.clamp(
        (batterStats.contact ?? 70)
        + hotZoneMod.contact
        + targetContactMod
        + timingMod.contact
        + strategy.contactMod
        - pitchStuffPenalty
        - velContactPenalty
        + situationalContactMod,
        0, 100
      );

      const contactQuality = MathUtils.clamp((finalContactScore - 45) / 50, 0, 1);

      // §17.9 三路機率 — v1.4 退一半校：baseline 0.27（介於 0.23 與 0.32），stuff 影響 /250（介於 /300 與 /180）
      let whiffProb  = MathUtils.clamp(0.27 - contactQuality * 0.20 + pitchStuffPenalty / 250, 0.03, 0.45) + strategy.whiffDelta;
      let inPlayProb = MathUtils.clamp(0.18 + contactQuality * 0.46, 0.10, 0.72) + strategy.inPlayDelta;

      // Phase 3：球路欺騙揮空加成（late break + 難辨識球種 → 打者更難擊中）
      if (pitchState.deceptionAttributes) {
        const da = pitchState.deceptionAttributes;
        const deceptionBoost = da.lateBreakFactor * (PITCHER_CHANNELS.deceptionWhiffBoost || 0.04)
                             + da.deceptionWindow * 0.03;
        whiffProb += deceptionBoost;
      }

      let foulProb   = (1 - whiffProb - inPlayProb) + strategy.foulDelta;

      // plateDiscipline 四區歷史比率混合（30%，需 ≥20 球樣本）
      const plateZone = classifyPlateZone(finalPosition);
      const pdZone = batterStats?.advancedStats?.plateDiscipline?.[plateZone];
      if (pdZone && (pdZone.pitches ?? 0) >= 20
          && Number.isFinite(Number(pdZone.whiffRate)) && Number.isFinite(Number(pdZone.inPlayRate))) {
        const pdW = Number(pdZone.whiffRate);
        const pdI = Number(pdZone.inPlayRate);
        // §16 通道 4 配套（Wave A）：對投手 stuffScore 動態化，避免投手強弱訊號被打者 PA 平均攤稀。
        //   強投（stuff>70）放大 whiffRate 預期、縮小 inPlayRate 預期；弱投反向。
        const stuffMul = 1 + (stuffScore - 70) * PITCHER_CHANNELS.stuffMulCoef;
        const pdW_adj  = MathUtils.clamp(pdW * stuffMul,                0.01, 0.95);
        const pdI_adj  = MathUtils.clamp(pdI / Math.max(0.5, stuffMul), 0.01, 0.95);
        const pdF_adj  = Math.max(0, 1 - pdW_adj - pdI_adj);
        whiffProb  = whiffProb  * 0.70 + pdW_adj * 0.30;
        inPlayProb = inPlayProb * 0.70 + pdI_adj * 0.30;
        foulProb   = foulProb   * 0.70 + pdF_adj * 0.30;
      }

      // pitchTypeMatchup 球種歷史比率混合（25%，需 ≥15 球樣本）
      const ptCode  = battingConfig.pitchTypeCode;
      const ptMatch = ptCode ? batterStats?.advancedStats?.pitchTypeMatchup?.[ptCode] : null;
      if (ptMatch && (ptMatch.seen ?? 0) >= 15
          && Number.isFinite(Number(ptMatch.whiffRate)) && Number.isFinite(Number(ptMatch.inPlayRate))) {
        const ptW = Number(ptMatch.whiffRate);
        const ptI = Number(ptMatch.inPlayRate);
        const ptF = Math.max(0, 1 - ptW - ptI);
        whiffProb  = whiffProb  * 0.75 + ptW * 0.25;
        inPlayProb = inPlayProb * 0.75 + ptI * 0.25;
        foulProb   = foulProb   * 0.75 + ptF * 0.25;
      }

      // 兩好球修正 — v1.4 微緩和：whiff -0.13（介於 -0.08 與 -0.16），foul +0.08
      if (strikes === 2) {
        whiffProb  = MathUtils.clamp(whiffProb  - 0.13, 0.02, 0.45);
        foulProb   = MathUtils.clamp(foulProb   + 0.08, 0.18, 0.78);
        inPlayProb = MathUtils.clamp(1 - whiffProb - foulProb, 0.08, 0.70);
      }

      // §16.15 Wave C-1 breaking 通道（通道 3）已試並退回：breaking 與 stuff 共線，加揮空不分強弱
      //   （R² 持平）只墊高 K 率（mean K9 7.38→7.74 過頭）。詳見修正書 §16.15。

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
      let effectivePower = MathUtils.clamp(
        (batterStats.power ?? 70)
        + hotZoneMod.power
        + timingMod.power
        + strategy.powerMod
        - pitchStuffPenalty * 0.35,
        0, 100
      );

      // Wave F：per-pitch 擊球品質抑制（命中抑制通道）
      if (pitchState.deceptionAttributes && pitchState.finalPosition) {
        const ch = PITCHER_CHANNELS;
        const da = pitchState.deceptionAttributes;
        const { speedKmh, finalPosition } = pitchState;

        const speedQualityPenalty = (ch.waveF_speedQualityCoef || 0) !== 0
          ? MathUtils.clamp((speedKmh - 140) * (ch.waveF_speedQualityCoef || 0), -4, 4) : 0;
        const lateBreakQualityPenalty = (ch.waveF_lateBreakQualityCoef || 0) !== 0
          ? (da.lateBreakFactor || 0) * (ch.waveF_lateBreakQualityCoef || 0) : 0;
        const deceptionQualityPenalty = (ch.waveF_deceptionQualityCoef || 0) !== 0
          ? (da.deceptionWindow || 0) * (ch.waveF_deceptionQualityCoef || 0) : 0;
        const centerDist = Math.hypot(finalPosition.x, finalPosition.y);
        const locationQualityPenalty = (ch.waveF_locationQualityCoef || 0) !== 0
          ? MathUtils.clamp((centerDist - 15) * (ch.waveF_locationQualityCoef || 0), 0, 8) : 0;

        effectivePower -= (speedQualityPenalty + lateBreakQualityPenalty +
                           deceptionQualityPenalty + locationQualityPenalty);
        effectivePower = MathUtils.clamp(effectivePower, 0, 100);
      }

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

      // 擊球型態與角度（先算，因為 v1.5「深」改動後 EV 與仰角耦合）
      const battedBallTypeHint = this._sampleBattedBallType(batterStats);
      const angles = this._generateAngles(batterStats, finalPosition, battedBallTypeHint, contactQuality);

      // EV（§17.11 → v1.5「深」改動：擊球品質驅動的分布，取代舊「power 平均 + N(0,6)」點估計）
      //   失真診斷（檢討書 §B/C、修正書 §13）：真實 in-play EV 是有寬度、含偏度的分布且與仰角耦合，
      //   舊公式把它壓成「平均 ± 6」的點，導致魔鷹每球都吃 barrel EV ~153（> HR 閾值）→ HR 2x，
      //   林泓弦缺弱擊球團塊 → BABIP 高估。五原則修正：
      //   1. ceilingEv = power 驅動的「咬死潛力」（≈ core.avgEV，保留升級成長性）
      //   2. anchorMean = ceiling − 擊不準稅，靠攏真實 ballQuality.avgEV（魔鷹 153→~146，落到 HR 閾值下）
      //   3. 寬度由真實 (maxEV − avgEV) 決定（σ ≈ spread×0.34 ≈ 12-15，取代假的 σ=6）
      //   4. 右偏：上尾長（barrel 罕見，HR 只從尾巴出）、下尾緊（弱擊球團塊）
      //   5. 仰角耦合（均值≈0 的重分配）：LA 接近 14° 加成、偏離越大扣越多 → 修「每個飛球都吃 barrel EV」
      const bq = batterStats?.advancedStats?.ballQuality || {};
      const ceilingEv = 92 + effectivePower * 0.68 + (finalContactScore - 50) * 0.28;
      const realAvg = Number.isFinite(bq.avgEV) ? bq.avgEV : ceilingEv - 7;
      const realMax = Number.isFinite(bq.maxEV) ? bq.maxEV : realAvg + 36;
      const spread = MathUtils.clamp(realMax - realAvg, 18, 45);
      // anchor：以 power ceiling 為基準（升級時上移）並靠攏真實 in-play 平均
      const anchorMean = 0.55 * (ceilingEv - 7) + 0.45 * realAvg;
      // 右偏寬度：上尾較寬（barrel 尾巴）、下尾較緊（弱擊球團塊）
      const z = MathUtils.gaussianRandom(0, 1);
      const evNoise = z >= 0 ? z * spread * 0.42 : z * spread * 0.30;
      // 仰角耦合（均值≈0 的重分配）：LA 偏離 14° 越多扣越多，扣回各球種平均 shave 使整體均值不偏移
      const laShave = MathUtils.clamp(Math.abs(angles.launch - 14) * 0.42, 0, 16);
      const laAdj = -(laShave - 6);
      const evKmh = MathUtils.clamp(anchorMean + evNoise + laAdj, 40, 190);

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
   *   battingConfig { strategyKey, targetZoneIndex, velocityLock, pitchSpeedGroup, strikes, balls,
   *                   hotZoneMod, situationalContactMod }
   *   （pitchTypeCode 由內部 classifyPitchTypeCode 自動計算，無需外部傳入）
   *
   * @returns {SinglePitchResult}
   *   pitch, swing, contact (null 若未出棒), inPlay (null 若未進場),
   *   summary { outcome, isWildPitch, isStrike, swings, newStrikes, newBalls }
   */
  const PitchEngineOrchestrator = {
    resolveSinglePitch(input) {
      const { pitcherStats, pitchConfig, batterStats, battingConfig, batterExpectation } = input;
      const balls   = MathUtils.clamp(battingConfig.balls ?? 0, 0, 3);
      const strikes = MathUtils.clamp(battingConfig.strikes ?? 0, 0, 2);

      // 1. 投球位置生成
      const pitch = PitchPhysicsModule.generate(pitcherStats, pitchConfig);

      // 2. 打者判斷（注入 pitchSpeedGroup / pitchTypeCode）
      const pitchSpeedGroup = classifyPitchSpeedGroup(
        pitchConfig.pitchType?.name || pitchConfig.pitchTypeName || ''
      );
      const pitchTypeCode = classifyPitchTypeCode(
        pitchConfig.pitchType?.name || pitchConfig.pitchTypeName || ''
      );
      const swing = BatterJudgmentModule.decide(batterStats, pitch, {
        ...battingConfig,
        pitchSpeedGroup,
        strikes,
        balls,
        pitchTypeCode
      }, batterExpectation || null);

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
        { ...battingConfig, strikes, pitchTypeCode }
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

    /** 輔助：中文球種名稱 → FF/SI/FC/SL/CU/CH/FS */
    classifyPitchTypeCode,

    /** 輔助：最終位置 → core/edge/chase/invalid */
    classifyPlateZone,

    /** §16.14 Wave B：控球 → 壞球率乘數（單一來源，aim 函式用） */
    controlBallRateMul,
    PITCHER_CHANNELS,

    /** 輔助：格子中心座標 */
    getGridCenter: (index, size) => getGridCenter(index, size),

    /** 球種速度係數（v3.26）：各球種相對於極速的比例 */
    PITCH_SPEED_RATIO,

    /** Phase 3：球種欺騙屬性 */
    PITCH_LATE_BREAK,
    PITCH_DECEPTION_WINDOW,
    classifyPitchTrajectory,

    /** 坑：PITCHER_CHANNELS 參考（供外部工具讀取當前參數） */
    PITCHER_CHANNELS: PITCHER_CHANNELS
  };

  // 向後相容：舊版 game.js 仍可透過 window.PitchPhysicsModule 等名稱訪問
  global.PitchPhysicsModule     = PitchPhysicsModule;
  global.BatterJudgmentModule   = BatterJudgmentModule;
  global.ContactResolutionModule = ContactResolutionModule;
  global.InPlayOutputModule     = InPlayOutputModule;

})(typeof window !== "undefined" ? window : globalThis);
