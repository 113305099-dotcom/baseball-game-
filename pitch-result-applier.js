(function (global) {
  "use strict";

  function log(game, message) {
    if (message && typeof game?.addToLog === "function") game.addToLog(message);
  }

  function call(fn, ...args) {
    if (typeof fn === "function") return fn(...args);
    return null;
  }

  function setCount(game, summary) {
    game.balls = summary.newBalls;
    game.strikes = summary.newStrikes;
  }

  function finishAsWalk(context) {
    const { game, battingTeam, batter, pitcher, i18n, shadowClone, finalizePitch } = context;
    game.advanceRunners(i18n.walk, battingTeam, batter);
    game.addCommentary(i18n.walk, batter, shadowClone);
    game.resetCount();
    if (battingTeam === "player") call(context.awardPlayerXP, batter, 8, "batting", game);
    if (battingTeam === "opponent") call(context.awardPlayerXP, pitcher, 3, "pitching", game);
    return finalizePitch(i18n.walk, true, true);
  }

  function finishAsStrikeout(context) {
    const { game, battingTeam, batter, pitcher, i18n, shadowClone, finalizePitch } = context;
    game.recordOut();
    game.resetCount();
    const comment = call(context.pickCommentary, "strikeout", batter, pitcher);
    log(game, comment);
    game.addCommentary(i18n.strikeout, batter, shadowClone);
    if (battingTeam === "opponent") call(context.awardPlayerXP, pitcher, 12, "pitching", game);
    return finalizePitch(i18n.strikeout, true, true);
  }

  function applyNoSwing(context) {
    const { game, summary, pitch, battingTeam, finalizePitch } = context;
    setCount(game, summary);

    if (pitch.isWildPitch) {
      const runs = call(context.applyWildPitchAdvance, game, battingTeam) || 0;
      log(game, `投球偏離形成暴投，跑者推進${runs > 0 ? `並回來 ${runs} 分` : ""}。B${game.balls}-S${game.strikes}`);
    } else if (pitch.isStrike) {
      log(game, `打者未揮棒，判定好球。B${game.balls}-S${game.strikes}`);
    } else {
      log(game, `打者未揮棒，判定壞球。B${game.balls}-S${game.strikes}`);
    }

    if (summary.outcome === "walk") return finishAsWalk(context);
    if (summary.outcome === "strikeout") return finishAsStrikeout(context);
    return finalizePitch(pitch.isWildPitch ? "wild_pitch_ball" : (pitch.isStrike ? "called_strike" : "ball"));
  }

  function applySwingMiss(context) {
    const { game, summary, finalizePitch } = context;
    setCount(game, summary);
    log(game, `揮棒落空。B${game.balls}-S${game.strikes}`);
    if (summary.outcome === "strikeout") return finishAsStrikeout(context);
    return finalizePitch("swing_miss");
  }

  function applyFoul(context) {
    const { game, summary, contactResult, finalizePitch } = context;
    setCount(game, summary);
    log(game, game.strikes >= 2
      ? `界外球，兩好球後好球數不增加。B${game.balls}-S${game.strikes}`
      : `界外球。B${game.balls}-S${game.strikes}`);
    return finalizePitch(contactResult.outcome);
  }

  function apply(context) {
    const swings = Boolean(context.summary?.swings);
    const contactOutcome = context.contactResult?.outcome;

    if (!swings) return { handled: true, outcome: applyNoSwing(context) };
    if (contactOutcome === "swing_miss") return { handled: true, outcome: applySwingMiss(context) };
    if (contactOutcome === "foul" || contactOutcome === "foul_with_two_strikes") {
      return { handled: true, outcome: applyFoul(context) };
    }
    return { handled: false, outcome: null };
  }

  global.PitchResultApplier = { apply };
})(typeof window !== "undefined" ? window : globalThis);
