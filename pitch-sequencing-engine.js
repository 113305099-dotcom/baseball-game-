/**
 * pitch-sequencing-engine.js  v1.0
 *
 * 投手配球引擎：從「球數意圖」→ 球種＋瞄準位置＋預期最終區域 的三維耦合決策。
 * 所有函式均為純函式（不讀寫 game 狀態），可獨立於 browser/sim 使用。
 *
 * 模組結構：
 *   CountIntentSelector   — 球數 → 意圖（get_ahead / attack / putaway / must_strike）
 *   PitchIntentBuilder    — 意圖＋球種庫＋打者弱點 → { pitchType, aimCellIndex, expectedZone }
 *   SequenceEnhancer      — 序列加成（眼位變化、速差、tunneling、避免重複）
 *
 * 使用方式：
 *   1. const intent = PitchSequencingEngine.selectIntent(balls, strikes, ...);
 *   2. const candidates = PitchSequencingEngine.buildCandidates(intent, pitchTypes, batterMatchup, ...);
 *   3. const scored = PitchSequencingEngine.applySequenceBonus(candidates, atBatContext);
 *   4. const best = PitchSequencingEngine.pickWeighted(scored);
 */
(function (global) {
  "use strict";

  var PitchEngine = global.PitchEngine;
  var GAME_PARAMS = global.GAME_PARAMS;

  // ── 常數 ──────────────────────────────────────────────
  var GEOMETRY = {
    strikeHalf: 22.5,     // 好球帶半徑 cm
    aimGridSize: 5,       // 投手瞄準格 5×5
    aimCellSpacing: 15,   // 格間距 cm
    chaseHalf: 33.75      // chase 區半徑
  };

  // 各球種的 nominal 變化量 mid（移動方向由投手慣用手決定）
  // 格式：{ moveFracX, moveFracY } → moveX = spread * moveFracX * handSign, moveY = spread * moveFracY
  var PITCH_MOVE_PATTERN = {
    '曲':   { fx: 0.315, fy: -0.785 },   // 曲球：微橫向＋大下墜
    '滑':   { fx: -0.715, fy: -0.125 },  // 滑球：大橫向＋微下墜
    '橫掃': { fx: -0.715, fy: -0.125 },  // 橫掃球＝滑球系
    '指叉': { fx: 0,      fy: -0.69 },   // 指叉：純垂直下墜
    '速叉': { fx: 0,      fy: -0.69 },
    '變速': { fx: 0,      fy: -0.275 },  // 變速球：微下墜
    '伸卡': { fx: 0.55,   fy: -0.45 },   // 伸卡：橫向＋下墜（往手套側）
    '二縫': { fx: 0.55,   fy: -0.45 },
    '卡特': { fx: -0.30,  fy: -0.10 },   // 卡特：反向橫移＋微下墜
    '切球': { fx: -0.30,  fy: -0.10 }
  };
  var DEFAULT_MOVE_PATTERN = { fx: 0, fy: -0.05 };  // 四縫線幾乎不變

  // ── 取得 PITCHER_CHANNELS ─────────────────────────────
  function getChannels() {
    return (GAME_PARAMS && GAME_PARAMS.pitcherChannels) || (PitchEngine && PitchEngine.PITCHER_CHANNELS) || {};
  }

  // ── 工具 ──────────────────────────────────────────────
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Number(v) || 0)); }

  /** 5×5 瞄準格中心座標 */
  function getAimCenter(cellIndex) {
    var idx = clamp(Math.round(cellIndex || 12), 0, 24);
    var row = Math.floor(idx / 5);       // 0=頂, 2=中, 4=底
    var col = idx % 5;                   // 0=最左, 2=中, 4=最右
    return {
      x: (col - 2) * GEOMETRY.aimCellSpacing,   // -30..+30
      y: (2 - row) * GEOMETRY.aimCellSpacing    // +30..-30（y 軸上正下負）
    };
  }

  /** 座標 → zone 分類（與 pitch-engine.js classifyPlateZone 一致） */
  function classifyZone(x, y) {
    var d = Math.max(Math.abs(x), Math.abs(y));
    if (d <= 11.25) return 'core';
    if (d <= GEOMETRY.strikeHalf) return 'edge';
    if (d <= GEOMETRY.chaseHalf) return 'chase';
    return 'invalid';
  }

  /** 球種中文名 → 球種分類碼（借用 PitchEngine） */
  function ptCode(name) {
    return (PitchEngine && PitchEngine.classifyPitchTypeCode) ? PitchEngine.classifyPitchTypeCode(name) : null;
  }

  /** 球種 → 速度比率（借用 PitchEngine） */
  function speedRatio(name) {
    var ratios = (PitchEngine && PitchEngine.PITCH_SPEED_RATIO) || {};
    return ratios[name] || 1.0;
  }

  // ────────────────────────────────────────────────────
  // 球種變化量估算（簡化版 getPitchMovementRangeCm）
  //   用 pitch.movement + pitch.name 推估 nominal 位移（不考慮 missOffset 隨機）
  // ────────────────────────────────────────────────────
  function estimateMovementMid(pitch, throws) {
    var name = String(pitch && pitch.name ? pitch.name : '');
    var movement = clamp((pitch && pitch.movement) || 70, 0, 100);
    var spread = clamp((movement - 45) * 0.45, 2, 24);
    var handSign = throws === 'L' ? -1 : 1;

    // 嘗試從預計算範圍取 mid（CPBL 真實資料可能有）
    if (pitch && typeof pitch.moveXMin === 'number' && typeof pitch.moveXMax === 'number') {
      return {
        moveX: (pitch.moveXMin + pitch.moveXMax) / 2,
        moveY: (pitch.moveYMin !== undefined && pitch.moveYMax !== undefined) ? (pitch.moveYMin + pitch.moveYMax) / 2 : 0
      };
    }

    var pattern = null;
    var keys = Object.keys(PITCH_MOVE_PATTERN);
    for (var i = 0; i < keys.length; i++) {
      if (name.indexOf(keys[i]) !== -1) { pattern = PITCH_MOVE_PATTERN[keys[i]]; break; }
    }
    if (!pattern) pattern = DEFAULT_MOVE_PATTERN;

    return {
      moveX: spread * pattern.fx * handSign,
      moveY: spread * pattern.fy
    };
  }

  /** 預估球的最終 zone：aim + nominal movement → zone */
  function estimateExpectedZone(aimCellIndex, pitch, throws) {
    var aim = getAimCenter(aimCellIndex);
    var mv = estimateMovementMid(pitch, throws);
    return classifyZone(aim.x + mv.moveX, aim.y + mv.moveY);
  }

  /** 預估球速 */
  function estimatePitchSpeed(pitch, pitcherVelocity) {
    var vel = clamp(pitcherVelocity || (pitch && pitch.speed) || 70, 0, 100);
    var maxSpeed = 112 + vel * 0.6;
    return maxSpeed * speedRatio(pitch && pitch.name);
  }

  // ────────────────────────────────────────────────────
  // Module 1: CountIntentSelector
  //   球數 → 意圖（design table，不隨機）
  // ────────────────────────────────────────────────────
  function selectIntent(balls, strikes, runnerCount, scoreDiff) {
    var b = clamp(balls, 0, 3);
    var s = clamp(strikes, 0, 2);

    // 0-0：搶第一顆好球
    if (b === 0 && s === 0) return 'get_ahead';

    // 3-0, 3-1：必須好球
    if (b === 3 && s <= 1) return 'must_strike';

    // 3-2：必須好球但有些微空間
    if (b === 3 && s === 2) return 'must_strike_risky';

    // 0-2, 1-2：解決打者（aim in → break out）
    if (s === 2 && b <= 1) return 'putaway';

    // 2-2：保守解決
    if (b === 2 && s === 2) return 'putaway_careful';

    // 0-1, 1-1, 2-0, 2-1：持續攻擊
    return 'attack';
  }

  // ────────────────────────────────────────────────────
  // Module 2: PitchIntentBuilder
  //   意圖＋球種庫 → 候選 (球種, aim) 組合清單
  // ────────────────────────────────────────────────────
  function buildCandidates(intent, pitchTypes, batterMatchup, pitcherVelocity, throws, control) {
    var ch = getChannels();
    var candidates = [];
    var ctrl = (typeof control === 'number') ? clamp(control, 0, 100) : 70;

    // Wave B control→BB9：控球越差，aim 在好球帶外的權重越高
    //   controlBallRateMul = 1 - (ctrl-70)*0.012, clamp 0.40~1.60
    var ctrlBallMul = clamp(1 - (ctrl - 70) * 0.012, 0.40, 1.60);

    // 決定允許的 aim zone 和 final zone
    var aimRules = INTENT_AIM_RULES[intent] || INTENT_AIM_RULES.attack;
    var pitchPrefs = INTENT_PITCH_PREFS[intent] || {};

    // 對每個球種 × 每個 aim cell（5×5），篩選符合意圖的組合
    for (var pi = 0; pi < pitchTypes.length; pi++) {
      var pitch = pitchTypes[pi];
      var ptCode_ = ptCode(pitch.name);
      var matchup = (batterMatchup && ptCode_) ? (batterMatchup[ptCode_] || null) : null;
      var pitchSpeed = estimatePitchSpeed(pitch, pitcherVelocity);

      for (var cellIdx = 0; cellIdx < 25; cellIdx++) {
        var aim = getAimCenter(cellIdx);
        var aimZone = classifyZone(aim.x, aim.y);
        var finalZone = estimateExpectedZone(cellIdx, pitch, throws);

        // 檢查 aim 約束
        if (aimRules.aimAllowed && aimRules.aimAllowed.indexOf(aimZone) === -1) continue;
        // 檢查 final 約束
        if (aimRules.finalAllowed && aimRules.finalAllowed.indexOf(finalZone) === -1) continue;

        // 基礎分數
        var score = 1.0;

        // 球種偏好加權
        if (pitchPrefs.fastPreferred && isFastball(pitch.name)) score *= pitchPrefs.fastPreferred;
        if (pitchPrefs.breakPreferred && isBreaking(pitch.name)) score *= pitchPrefs.breakPreferred;

        // 打者弱點：對該球種 whiffRate 高 → 加分
        if (matchup && typeof matchup.whiffRate === 'number' && matchup.seen >= 15) {
          var weaknessBonus = 1 + (matchup.whiffRate - 0.22) * ch.weaknessExploitWeight;
          score *= clamp(weaknessBonus, 0.5, 2.0);
        }
        // 打者弱點：對該球種 inPlayRate 低 → 加分
        if (matchup && typeof matchup.inPlayRate === 'number' && matchup.seen >= 15) {
          var suppressBonus = 1 + (0.35 - matchup.inPlayRate) * ch.weaknessExploitWeight * 0.6;
          score *= clamp(suppressBonus, 0.5, 2.0);
        }

        // Wave B control→BB9：控球差→好球帶外 aim 加權（模擬不敢投進去）
        if (ctrlBallMul !== 1.0) {
          if (aimZone === 'core')       score *= Math.pow(ctrlBallMul, 2.5);   // 弱控＝更不敢塞紅中
          else if (aimZone === 'edge')  score *= Math.pow(ctrlBallMul, 1.5);   // 弱控＝邊角也偏保守
          else if (aimZone === 'chase' || aimZone === 'invalid') score /= Math.pow(ctrlBallMul, 1.8); // 弱控＝更多壞球
        }

        candidates.push({
          pitch: pitch,
          pitchIndex: pi,
          aimCellIndex: cellIdx,
          aimZone: aimZone,
          expectedFinalZone: finalZone,
          pitchSpeed: pitchSpeed,
          score: score,
          ptCode: ptCode_
        });
      }
    }

    // 若無候選（罕見），放寬約束
    if (candidates.length === 0) {
      return buildCandidates('attack', pitchTypes, batterMatchup, pitcherVelocity, throws);
    }

    return candidates;
  }

  // ────────────────────────────────────────────────────
  // Module 3: SequenceEnhancer
  //   在候選組合上疊加序列加成
  // ────────────────────────────────────────────────────
  function applySequenceBonus(candidates, atBatContext) {
    var ch = getChannels();
    var ctx = atBatContext || {};
    var pitcherSt = ctx.pitcherState || {};
    var lastPitches = pitcherSt.lastPitches || [];
    var usageCount = pitcherSt.usageCount || {};

    var lastPitch = lastPitches.length > 0 ? lastPitches[lastPitches.length - 1] : null;

    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      var seqScore = c.score || 1.0;
      var name = c.pitch && c.pitch.name;

      // 眼位變化：前後兩球 aim 垂直差 > eyeLevelChangeThreshold → 加分
      if (lastPitch && typeof lastPitch.aimY === 'number') {
        var thisAim = getAimCenter(c.aimCellIndex);
        if (Math.abs(thisAim.y - lastPitch.aimY) > ch.eyeLevelChangeThreshold) {
          seqScore *= (1 + ch.sequenceEyeLevelBonus);
        }
      }

      // 速差：前後兩球速度差 > speedContrastThreshold → 加分
      if (lastPitch && typeof lastPitch.speedKmh === 'number') {
        if (Math.abs(c.pitchSpeed - lastPitch.speedKmh) > ch.speedContrastThreshold) {
          seqScore *= (1 + ch.sequenceSpeedContrastBonus);
        }
      }

      // Tunneling：與前球同 aim zone、不同球種 → 加分
      if (lastPitch && lastPitch.ptCode && c.ptCode && lastPitch.ptCode !== c.ptCode) {
        var lastAimZone = lastPitch.aimZone || '';
        if (lastAimZone === c.aimZone) {
          seqScore *= (1 + ch.sequenceTunnelingBonus);
        }
      }

      // 避免重複：連投同球種 → 遞減懲罰
      var consecutiveCount = 0;
      for (var j = lastPitches.length - 1; j >= 0; j--) {
        if (lastPitches[j].ptCode === c.ptCode) consecutiveCount++;
        else break;
      }
      if (consecutiveCount > 0) {
        seqScore *= Math.pow(1 - ch.usageRepeatPenalty, consecutiveCount);
      }

      // 總使用率懲罰（溫和）
      var totalUses = (usageCount[name] || 0);
      if (totalUses > 3) {
        seqScore *= Math.max(0.5, 1 - (totalUses - 3) * 0.04);
      }

      c.score = seqScore;
    }

    return candidates;
  }

  /** 加權隨機選取 */
  function pickWeighted(candidates) {
    if (!candidates || candidates.length === 0) return null;
    var totalWeight = 0;
    for (var i = 0; i < candidates.length; i++) {
      totalWeight += Math.max(0.001, candidates[i].score || 1);
    }
    var roll = Math.random() * totalWeight;
    var cumulative = 0;
    for (var j = 0; j < candidates.length; j++) {
      cumulative += Math.max(0.001, candidates[j].score || 1);
      if (roll <= cumulative) return candidates[j];
    }
    return candidates[candidates.length - 1];
  }

  // ── 意圖 → aim/final 約束表 ────────────────────────
  var INTENT_AIM_RULES = {
    get_ahead:         { aimAllowed: ['core','edge'],       finalAllowed: ['core','edge','chase'] },
    attack:            { aimAllowed: ['core','edge'],       finalAllowed: ['core','edge','chase'] },
    putaway:           { aimAllowed: ['core','edge'],       finalAllowed: ['chase'] },
    putaway_careful:   { aimAllowed: ['core','edge'],       finalAllowed: ['edge','chase'] },
    must_strike:       { aimAllowed: ['core','edge'],       finalAllowed: ['core','edge'] },
    must_strike_risky: { aimAllowed: ['core','edge'],       finalAllowed: ['core','edge'] }
  };

  // ── 意圖 → 球種偏好 ────────────────────────────────
  var INTENT_PITCH_PREFS = {
    get_ahead:         { fastPreferred: 1.6 },
    attack:            {},
    putaway:           { breakPreferred: 2.0 },
    putaway_careful:   { breakPreferred: 1.4 },
    must_strike:       { fastPreferred: 3.0 },
    must_strike_risky: { fastPreferred: 2.0 }
  };

  // ── 球種分類輔助 ────────────────────────────────────
  var FAST_TOKENS = ['四縫','二縫','卡特','切球','伸卡','速叉','快速指叉'];
  var BREAK_TOKENS = ['滑','曲','橫掃','指叉','變速'];

  function isFastball(name) {
    name = String(name || '');
    for (var i = 0; i < FAST_TOKENS.length; i++) { if (name.indexOf(FAST_TOKENS[i]) !== -1) return true; }
    return !isBreaking(name);  // 非 breaking 就是 fastball
  }

  function isBreaking(name) {
    name = String(name || '');
    for (var i = 0; i < BREAK_TOKENS.length; i++) { if (name.indexOf(BREAK_TOKENS[i]) !== -1) return true; }
    return false;
  }

  // ── 批次：意圖 → 最終選出的 PitchIntent ─────────────
  function selectPitchIntent(intent, pitchTypes, batterMatchup, pitcherVelocity, throws, atBatContext, control) {
    var candidates = buildCandidates(intent, pitchTypes, batterMatchup, pitcherVelocity, throws, control);
    candidates = applySequenceBonus(candidates, atBatContext);
    return pickWeighted(candidates);
  }

  // ────────────────────────────────────────────────────
  // 公開 API
  // ────────────────────────────────────────────────────
  var PitchSequencingEngine = {
    // 常數
    GEOMETRY: GEOMETRY,

    // Module 1
    selectIntent: selectIntent,

    // Module 2
    buildCandidates: buildCandidates,
    estimateExpectedZone: estimateExpectedZone,
    estimatePitchSpeed: estimatePitchSpeed,

    // Module 3
    applySequenceBonus: applySequenceBonus,
    pickWeighted: pickWeighted,

    // 批次（最常用）
    selectPitchIntent: selectPitchIntent,

    // 輔助
    classifyZone: classifyZone,
    getAimCenter: getAimCenter,
    INTENT_AIM_RULES: INTENT_AIM_RULES,
    INTENT_PITCH_PREFS: INTENT_PITCH_PREFS,
    isFastball: isFastball,
    isBreaking: isBreaking
  };

  global.PitchSequencingEngine = PitchSequencingEngine;

})(typeof window !== 'undefined' ? window : globalThis);
