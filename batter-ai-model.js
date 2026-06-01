/**
 * batter-ai-model.js  v1.0
 *
 * 打者預期模型：模擬打者對下一球球種的預測、信念更新、與 timing/選球的互動。
 * 所有函式均為純函式，不讀寫 game 狀態。
 *
 * 流程：
 *   1. 打席開始 → initializeExpectation(pitcherArsenal, batterStats)
 *   2. 每球前   → predictNextPitch(expectation, atBatContext, countInfo)
 *   3. 每球後   → updateAfterPitch(expectation, thrownPitch, countInfo)
 *
 * 產出的 BatterExpectation 會被傳入 pitch-engine.js BatterJudgmentModule.decide()
 * 作為第 4 參數（可選），微調 pCorrectRead 與 timingMod。
 */
(function (global) {
  "use strict";

  var PitchEngine = global.PitchEngine;
  var GAME_PARAMS = global.GAME_PARAMS;

  // ── 工具 ──────────────────────────────────────────────
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Number(v) || 0)); }

  function getChannels() {
    return (GAME_PARAMS && GAME_PARAMS.pitcherChannels) || {};
  }

  /** 中文球種名 → 球種碼 */
  function toPitchCode(name) {
    return (PitchEngine && PitchEngine.classifyPitchTypeCode)
      ? PitchEngine.classifyPitchTypeCode(name) : String(name || '');
  }

  /** 球種碼 → 速度群組 */
  function toSpeedGroup(code) {
    var fastCodes = { FF: true, SI: true, FC: true };
    return fastCodes[code] ? 'fast' : 'slow';
  }

  // ── 球數情境 → 打者對球種的預測偏移 ──────────────
  //   正值 = 打者預測該球種機率上升
  var COUNT_GUESS_BIAS = {
    '0-0': { FF: 0.10 },                          // 第一球通常速球
    '0-1': { FF: 0.05 },
    '0-2': { SL: 0.12, CU: 0.08, FS: 0.06 },     // 投手想解決 → breaking
    '1-0': { FF: 0.08 },
    '1-1': {},
    '1-2': { SL: 0.08, CU: 0.05 },
    '2-0': { FF: 0.15 },                          // 打者球數 → 必投速球
    '2-1': { FF: 0.08 },
    '2-2': { SL: 0.06, CU: 0.04 },
    '3-0': { FF: 0.20 },                          // 絕對速球
    '3-1': { FF: 0.15 },
    '3-2': { FF: 0.10 }
  };

  // ────────────────────────────────────────────────────
  // 初始化打者預期
  //   用投手 arsenal 的使用率作為初始 prior
  // ────────────────────────────────────────────────────
  function initializeExpectation(pitcherArsenal) {
    var probs = {};
    var totalPitches = 0;

    if (Array.isArray(pitcherArsenal) && pitcherArsenal.length > 0) {
      for (var i = 0; i < pitcherArsenal.length; i++) {
        var p = pitcherArsenal[i];
        var code = toPitchCode(p.name || p);
        if (!code) continue;
        // 使用率：有真實資料用 usageRate，否則均分
        var usage = (typeof p.usageRate === 'number') ? p.usageRate : (1 / pitcherArsenal.length);
        probs[code] = usage;
        totalPitches++;
      }
    }

    // Fallback：至少要有一些球種
    if (totalPitches === 0) {
      probs = { FF: 0.45, SL: 0.20, CU: 0.12, CH: 0.10, SI: 0.08, FC: 0.05 };
    }

    // Normalize
    var sum = 0;
    var keys = Object.keys(probs);
    for (var k = 0; k < keys.length; k++) { sum += probs[keys[k]]; }
    if (sum > 0) { for (var k2 = 0; k2 < keys.length; k2++) { probs[keys[k2]] /= sum; } }

    return {
      pitchTypeProbabilities: probs,
      guessedPitchType: null,
      guessConfidence: 0,
      expectedSpeedGroup: null,
      timingState: {
        lastSpeedKmh: null,
        speedDifferential: 0,
        eyeLevel: null
      }
    };
  }

  // ────────────────────────────────────────────────────
  // 每球前：預測下一球球種
  //   1. 從 prior 出發
  //   2. 疊加球數情境偏移
  //   3. 若有前球序列 → Markov 調整
  //   4. 產出 guess（最高機率球種 + 信心度）
  // ────────────────────────────────────────────────────
  function predictNextPitch(expectation, atBatContext, countInfo) {
    if (!expectation) return expectation;
    var ch = getChannels();
    var probs = {};
    var baseProbs = expectation.pitchTypeProbabilities || {};
    var keys = Object.keys(baseProbs);
    for (var i = 0; i < keys.length; i++) { probs[keys[i]] = baseProbs[keys[i]]; }
    if (keys.length === 0) return expectation;

    // 1. 球數情境偏移
    var countKey = (countInfo.balls || 0) + '-' + (countInfo.strikes || 0);
    var bias = COUNT_GUESS_BIAS[countKey] || {};
    var biasKeys = Object.keys(bias);
    for (var b = 0; b < biasKeys.length; b++) {
      var code = biasKeys[b];
      if (probs[code] !== undefined) {
        probs[code] = clamp(probs[code] + bias[code], 0.02, 0.85);
      }
    }

    // 2. 前球 Markov 調整（打者學習：連丟同球種 → 預測下一球會變）
    var ctx = atBatContext || {};
    var pitchHistory = ctx.pitchHistory || [];
    if (pitchHistory.length >= 2) {
      var lastCode = pitchHistory[pitchHistory.length - 1].ptCode;
      var prevCode = pitchHistory[pitchHistory.length - 2].ptCode;
      // 連兩球同球種 → 降低對該球種的預測（打者預測投手會變）
      if (lastCode && lastCode === prevCode && probs[lastCode] !== undefined) {
        probs[lastCode] = clamp(probs[lastCode] - 0.08, 0.02, 0.85);
      }
      // 兩球不同 → 對「未出現」的球種略升（打者預測投手會秀新球路）
      if (lastCode && prevCode && lastCode !== prevCode) {
        for (var k = 0; k < keys.length; k++) {
          if (keys[k] !== lastCode && keys[k] !== prevCode && probs[keys[k]] !== undefined) {
            probs[keys[k]] = clamp(probs[keys[k]] + 0.04, 0.02, 0.85);
          }
        }
      }
    }

    // 3. Normalize
    var sum = 0;
    for (var k2 = 0; k2 < keys.length; k2++) { sum += (probs[keys[k2]] || 0); }
    if (sum > 0) { for (var k3 = 0; k3 < keys.length; k3++) { probs[keys[k3]] = (probs[keys[k3]] || 0) / sum; } }

    // 4. 找出最佳猜測
    var bestCode = null, bestProb = 0;
    for (var k4 = 0; k4 < keys.length; k4++) {
      if (probs[keys[k4]] > bestProb) { bestProb = probs[keys[k4]]; bestCode = keys[k4]; }
    }

    expectation.pitchTypeProbabilities = probs;
    expectation.guessedPitchType = bestCode;
    expectation.guessConfidence = clamp(bestProb, 0, 1);
    expectation.expectedSpeedGroup = bestCode ? toSpeedGroup(bestCode) : null;

    return expectation;
  }

  // ────────────────────────────────────────────────────
  // 每球後：貝氏更新信念
  //   實際看到的球種 → 更新 prior（學習率控制）
  // ────────────────────────────────────────────────────
  function updateAfterPitch(expectation, thrownPitchName, actualSpeedKmh, finalY) {
    if (!expectation) return expectation;
    var ch = getChannels();
    var rate = ch.batterLearningRate || 0.15;

    var actualCode = toPitchCode(thrownPitchName);
    var probs = expectation.pitchTypeProbabilities || {};
    var keys = Object.keys(probs);

    if (actualCode && keys.length > 0) {
      // Bayesian update: P(pitch|seen) = (1-rate) * P(pitch) + rate * indicator(pitch==seen)
      for (var i = 0; i < keys.length; i++) {
        var isMatch = (keys[i] === actualCode) ? 1 : 0;
        probs[keys[i]] = probs[keys[i]] * (1 - rate) + isMatch * rate;
      }
      // Normalize
      var sum = 0;
      for (var k = 0; k < keys.length; k++) { sum += probs[keys[k]]; }
      if (sum > 0) { for (var k2 = 0; k2 < keys.length; k2++) { probs[k2] /= sum; } }

      var guessedCorrectly = (expectation.guessedPitchType === actualCode);
      expectation.lastGuessCorrect = guessedCorrectly;
    }

    // 更新 timing state
    var ts = expectation.timingState;
    if (typeof actualSpeedKmh === 'number' && ts.lastSpeedKmh !== null) {
      ts.speedDifferential = Math.abs(actualSpeedKmh - ts.lastSpeedKmh);
    }
    ts.lastSpeedKmh = (typeof actualSpeedKmh === 'number') ? actualSpeedKmh : ts.lastSpeedKmh;
    ts.eyeLevel = (typeof finalY === 'number') ? finalY : ts.eyeLevel;

    return expectation;
  }

  // ────────────────────────────────────────────────────
  // 計算打者預期對 swing 決策的微調
  //   由 pitch-engine.js BatterJudgmentModule 呼叫
  //   回傳 { pCorrectReadDelta, timingContactDelta, eyeDelta }
  // ────────────────────────────────────────────────────
  function computeExpectationMod(expectation, actualPitchName, actualSpeedKmh, pitchPosition) {
    if (!expectation || !expectation.guessedPitchType) {
      return { pCorrectReadDelta: 0, timingContactDelta: 0, eyeDelta: 0 };
    }
    var ch = getChannels();
    var mod = { pCorrectReadDelta: 0, timingContactDelta: 0, eyeDelta: 0 };

    // 1. 猜對/猜錯球種 → pCorrectRead 微調
    var actualCode = toPitchCode(actualPitchName);
    var guessedCorrect = (expectation.guessedPitchType === actualCode) && actualCode !== null;
    var confidence = expectation.guessConfidence || 0;
    if (guessedCorrect) {
      mod.pCorrectReadDelta = 0.02 * confidence;  // 信心越高，猜對加分越多
    } else if (actualCode) {
      mod.pCorrectReadDelta = -0.02 * confidence; // 猜錯扣分
    }
    mod.pCorrectReadDelta = clamp(mod.pCorrectReadDelta, -0.03, 0.03);

    // 2. 預期 vs 實際速度 → timing contact 微調
    var ts = expectation.timingState || {};
    if (ts.speedDifferential > (ch.speedContrastThreshold || 8)) {
      mod.timingContactDelta = -3;
    }
    if (expectation.expectedSpeedGroup && actualCode) {
      var actualSpeedGroup = toSpeedGroup(actualCode);
      if (actualSpeedGroup && expectation.expectedSpeedGroup !== actualSpeedGroup) {
        mod.timingContactDelta -= 2;  // 速度群組猜錯 → 額外 timing 懲罰
      }
    }
    mod.timingContactDelta = clamp(mod.timingContactDelta, -5, 0);

    // 3. 眼位變化 → eye 微降
    if (ts.eyeLevel !== null && pitchPosition && typeof pitchPosition.y === 'number') {
      var eyeChange = Math.abs(pitchPosition.y - ts.eyeLevel);
      if (eyeChange > (ch.eyeLevelChangeThreshold || 15)) {
        mod.eyeDelta = -2;
      }
    }

    return mod;
  }

  // ────────────────────────────────────────────────────
  // 公開 API
  // ────────────────────────────────────────────────────
  var BatterAIModel = {
    initializeExpectation: initializeExpectation,
    predictNextPitch: predictNextPitch,
    updateAfterPitch: updateAfterPitch,
    computeExpectationMod: computeExpectationMod,
    COUNT_GUESS_BIAS: COUNT_GUESS_BIAS
  };

  global.BatterAIModel = BatterAIModel;

})(typeof window !== 'undefined' ? window : globalThis);
