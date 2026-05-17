(function (global) {
  "use strict";

  const DEFAULT_ERROR_LABELS = {
    throw: "傳球失誤",
    field: "接捕失誤",
    mental: "判斷失誤"
  };

  function log(game, message) {
    if (message && typeof game?.addToLog === "function") game.addToLog(message);
  }

  function call(fn, ...args) {
    if (typeof fn === "function") return fn(...args);
    return null;
  }

  function fixed(value, digits = 0, fallback = "-") {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(digits) : fallback;
  }

  function getErrorLabel(context, errorType) {
    return context.errorLabels?.[errorType]
      || context.fieldingErrorLabels?.[errorType]
      || DEFAULT_ERROR_LABELS[errorType]
      || "失誤";
  }

  function hitLabel(context, hitType) {
    if (hitType === "triple") return context.i18n.triple;
    if (hitType === "double") return context.i18n.double;
    return context.i18n.single;
  }

  function award(context, player, amount, category) {
    call(context.awardPlayerXP, player, amount, category, context.game);
  }

  function addCommentary(context, outcome) {
    context.game.addCommentary(outcome, context.batter, context.shadowClone);
  }

  function addBattedBallLog(context) {
    const { game, batter, ballInfo, fielding, evKmh, angles } = context;
    const batterName = batter?.name || "打者";
    const exitVelocity = fixed(evKmh);
    const launchAngle = fixed(angles?.launch);
    const distance = fixed(ballInfo?.dist_m);
    log(game, `${batterName} 擊球進場：初速 ${exitVelocity} km/h，仰角 ${launchAngle} 度，預估距離 ${distance} m。`);
    if (ballInfo?.isBarrel) log(game, "完美擊球：Barrel！");
    if (ballInfo?.direction && fielding?.selected) {
      log(game, `${ballInfo.direction}，由 ${fielding.selected.position} 處理。`);
    } else {
      log(game, ballInfo?.direction);
    }
    if (fielding?.selected) {
      const fielderName = fielding.selected.player?.name || fielding.selected.position;
      const fielderLabel = fielderName === fielding.selected.position
        ? fielding.selected.position
        : `${fielding.selected.position} ${fielderName}`;
      const success = Math.round((fielding.selected.successScore || 0) * 100);
      log(game, `守備判定：${fielderLabel}，處理成功率 ${success}%。`);
    }
  }

  function apply(context) {
    const {
      game,
      battingTeam,
      batter,
      i18n,
      fielding,
      playResult,
      ballInfo,
      runners,
      finalizePitch
    } = context;

    addBattedBallLog(context);

    if (playResult.code === "foul") {
      if (game.strikes < 2) game.strikes += 1;
      log(game, game.strikes >= 2
        ? `界外球，兩好球後好球數不增加。B${game.balls}-S${game.strikes}`
        : `界外球。B${game.balls}-S${game.strikes}`);
      return finalizePitch(game.strikes >= 2 ? "foul_with_two_strikes" : "foul");
    }

    if (playResult.code === "home_run") {
      const key = game.isHighLeverage?.() ? "hrClutch" : "hr";
      const comment = call(context.pickCommentary, key, batter);
      log(game, comment);
      game.advanceRunners(i18n.homeRun, battingTeam, batter);
      addCommentary(context, i18n.homeRun);
      game.resetCount();
      call(context.triggerShakeEffect);
      award(context, batter, 50, "batting");
      return finalizePitch(i18n.homeRun, true, true);
    }

    if (playResult.code === "net_out" || playResult.code === "net_double") {
      log(game, `牆面判定：飛球高度 ${fixed(ballInfo?.trajectoryHeightAtWall, 1)} m，牆高 ${fixed(ballInfo?.fenceHeight, 1)} m。`);
      if (playResult.code === "net_out") {
        game.recordOut();
        game.resetCount();
        log(game, `${batter?.name || "打者"} 的長打被牆前接殺。`);
        addCommentary(context, i18n.flyOut);
        return finalizePitch(i18n.flyOut, true, true);
      }
      game.advanceRunners(i18n.double, battingTeam, batter);
      game.resetCount();
      log(game, `${batter?.name || "打者"} 擊出牆面二壘安打。`);
      addCommentary(context, i18n.double);
      award(context, batter, 22, "batting");
      return finalizePitch(i18n.double, true, true);
    }

    if (playResult.code === "error") {
      if (battingTeam === "opponent") game.playerErrors = (game.playerErrors || 0) + 1;
      else game.opponentErrors = (game.opponentErrors || 0) + 1;
      const fielderPlayer = fielding?.selected?.player;
      const comment = call(context.pickCommentary, "error", batter, fielderPlayer, playResult.error);
      log(game, comment);
      game.advanceRunners("error", battingTeam, batter);
      game.resetCount();
      const label = getErrorLabel(context, playResult.error);
      return finalizePitch(`失誤上壘 (${label})`, true, true);
    }

    if (playResult.code === "double_play") {
      runners[0] = null;
      game.recordOut();
      if (game.outs < 3) game.recordOut();
      game.resetCount();
      log(game, `${batter?.name || "打者"} 擊出內野滾地球，形成雙殺。`);
      addCommentary(context, i18n.groundOut);
      return finalizePitch("滾地雙殺", true, true);
    }

    if (playResult.code === "ground_out") {
      game.recordOut();
      game.resetCount();
      const comment = call(context.pickCommentary, "groundOut", batter);
      log(game, comment);
      addCommentary(context, i18n.groundOut);
      return finalizePitch(i18n.groundOut, true, true);
    }

    if (playResult.code === "popup_out") {
      game.recordOut();
      game.resetCount();
      const comment = call(context.pickCommentary, "popup", batter);
      log(game, comment);
      addCommentary(context, i18n.flyOut);
      return finalizePitch(i18n.flyOut, true, true);
    }

    if (playResult.code === "fly_out") {
      game.trySacrificeFly(battingTeam, batter);
      game.recordOut();
      game.resetCount();
      const comment = call(context.pickCommentary, "flyOut", batter);
      log(game, comment);
      addCommentary(context, i18n.flyOut);
      return finalizePitch(i18n.flyOut, true, true);
    }

    const resolvedHit = hitLabel(context, playResult.hitType);
    const commentaryKey = resolvedHit === i18n.triple ? "triple" : resolvedHit === i18n.double ? "double" : "single";
    const comment = call(context.pickCommentary, commentaryKey, batter);
    log(game, comment);
    game.advanceRunners(resolvedHit, battingTeam, batter);
    addCommentary(context, resolvedHit);
    game.resetCount();
    award(context, batter, resolvedHit === i18n.triple ? 30 : resolvedHit === i18n.double ? 22 : 12, "batting");
    return finalizePitch(resolvedHit, true, true);
  }

  global.InPlayResultApplier = { apply };
})(typeof window !== "undefined" ? window : globalThis);
