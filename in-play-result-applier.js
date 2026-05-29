(function (global) {
  "use strict";

  const DEFAULT_ERROR_LABELS = {
    throw: "傳球失誤",
    field: "接球失誤",
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

  function playerName(player, fallback = "打者") {
    return player?.name || fallback;
  }

  function baseLabel(base) {
    if (base === "home") return "本壘";
    if (base === "1B") return "一壘";
    if (base === "2B") return "二壘";
    if (base === "3B") return "三壘";
    return base || "-";
  }

  function hitBaseLabel(hitType) {
    if (hitType === "triple") return "三壘";
    if (hitType === "double") return "二壘";
    return "一壘";
  }

  function directionText(ballInfo) {
    const spray = Number(ballInfo?.sa_deg) || 0;
    const outfield = ballInfo?.ballType !== "ground";
    if (spray < -24) return outfield ? "左外野方向" : "三壘線方向";
    if (spray < -8) return "三游間";
    if (spray <= 8) return "中間方向";
    if (spray <= 24) return "一二壘間";
    return outfield ? "右外野方向" : "一壘線方向";
  }

  function contactText(ballInfo, evKmh) {
    const speed = Number(evKmh) || Number(ballInfo?.evKmh) || 0;
    if (ballInfo?.ballType === "ground") return speed >= 145 ? "強勁滾地球" : "滾地球";
    if (ballInfo?.ballType === "liner") return speed >= 145 ? "強勁平飛球" : "平飛球";
    if (ballInfo?.ballType === "popup") return "小飛球";
    return "高飛球";
  }

  function fieldingPhrase(fielding, playResult) {
    const selected = fielding?.selected;
    const primary = fielding?.primaryAttempt;
    if (!selected) return "";
    if (primary && primary.position !== selected.position) {
      return `${primary.position}第一時間撲了一下沒攔到，球穿出去後由${selected.position}處理。`;
    }
    if (playResult?.code === "hit" && selected.position) {
      return `球落到${selected.position}前方，守備員只能把球收回。`;
    }
    return `${selected.position}移動到位處理這球。`;
  }

  function addBattedBallLog(context) {
    const { game, batter, ballInfo, fielding, evKmh, playResult } = context;
    const sentence = `${playerName(batter)}把球打向${directionText(ballInfo)}，是一顆${contactText(ballInfo, evKmh)}！${fieldingPhrase(fielding, playResult)}`;
    log(game, sentence);
  }

  function addThrowDecisionLog(context) {
    const decision = context.playResult?.throwDecision;
    if (!decision) return;
    const plan = decision.plan || {};
    const from = plan.segments?.[0]?.from || context.fielding?.selected?.position || "外野";
    const route = plan.type === "relay" && plan.cutoff?.position
      ? `${from}經${plan.cutoff.position}轉傳${baseLabel(decision.targetBase)}`
      : `${from}直傳${baseLabel(decision.targetBase)}`;
    const outcome = decision.outcome === "out" ? "傳得及，跑者出局。" : "差了一點，跑者安全。";
    log(context.game, `${route}，${outcome}`);
  }

  function hitResultLog(context) {
    return `${playerName(context.batter)}安全上到${hitBaseLabel(context.playResult?.hitType)}。`;
  }

  function flyOutAdvanceLog(context) {
    const advance = context.playResult?.advanceResult;
    const outsOnBases = advance?.outsOnBases || [];
    const movements = advance?.movements || [];
    const decisions = advance?.decisions || [];
    const scored = movements.find(movement => movement.toBase === "home" && !movement.out);
    const advanced = movements.find(movement => movement.toBase === "3B" && !movement.out);
    const thrownOut = outsOnBases[0] || null;
    const held = decisions.find(decision => decision.action === "hold");
    if (thrownOut?.runnerId === "R3") {
      return "三壘跑者起跑搶本壘，但還是在本壘前遭到觸殺。";
    }
    if (thrownOut?.runnerId === "R2") {
      return "二壘跑者嘗試搶上三壘，但補傳來得及。";
    }
    if (scored && advanced) {
      return "三壘跑者順利回本壘，二壘跑者也趁傳上到三壘。";
    }
    if (scored) {
      return "三壘跑者抓準時機回本壘得分。";
    }
    if (advanced) {
      return "二壘跑者抓到外野深遠飛球，安全推進到三壘。";
    }
    if (held?.runnerId === "R3") {
      return held.reason === "shallow_air_out"
        ? "飛球深度不足，三壘指導員示意跑者留在三壘。"
        : "三壘跑者觀察補傳後選擇不搶本壘。";
    }
    if (held?.runnerId === "R2") {
      return held.reason === "third_base_occupied"
        ? "三壘仍有跑者，二壘跑者留在原壘。"
        : "二壘跑者判斷風險偏高，沒有嘗試 tag-up。";
    }
    return "";
  }

  function runnerDecisionLabel(runnerId) {
    return { R1: "一壘跑者", R2: "二壘跑者", R3: "三壘跑者", batter: "打者跑者" }[runnerId] || "跑者";
  }

  function runnerDecisionLog(context) {
    const decisions = context.playResult?.advanceResult?.decisions || [];
    const notable = decisions.find(decision => decision.action === "send" || decision.action === "hold");
    if (!notable) return "";
    if (notable.action === "send") {
      return `壘指導員放行，${runnerDecisionLabel(notable.runnerId)}挑戰${baseLabel(notable.targetBase)}。`;
    }
    return `壘指導員擋下，${runnerDecisionLabel(notable.runnerId)}停在${baseLabel(notable.holdBase || notable.fromBase)}。`;
  }

  function award(context, player, amount, category) {
    call(context.awardPlayerXP, player, amount, category, context.game);
  }

  function addCommentary(context, outcome) {
    context.game.addCommentary(outcome, context.batter, context.shadowClone);
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
        ? `界外球，兩好球後球數維持 ${game.balls}-${game.strikes}。`
        : `界外球，球數來到 ${game.balls}-${game.strikes}。`);
      return finalizePitch(game.strikes >= 2 ? "foul_with_two_strikes" : "foul");
    }

    if (playResult.code === "home_run") {
      const key = game.isHighLeverage?.() ? "hrClutch" : "hr";
      log(game, call(context.pickCommentary, key, batter) || `${playerName(batter)}把球送出全壘打牆！`);
      game.advanceRunners(i18n.homeRun, battingTeam, batter, playResult.advanceResult);
      addCommentary(context, i18n.homeRun);
      game.resetCount();
      call(context.triggerShakeEffect);
      award(context, batter, 50, "batting");
      return finalizePitch(i18n.homeRun, true, true);
    }

    if (playResult.code === "net_out" || playResult.code === "net_double") {
      log(game, `這球打到牆面附近，高度約 ${fixed(ballInfo?.trajectoryHeightAtWall, 1)} 公尺。`);
      if (playResult.code === "net_out") {
        game.recordOut();
        game.resetCount();
        log(game, `${playerName(batter)}這球被守下來，形成飛球出局。`);
        addCommentary(context, i18n.flyOut);
        return finalizePitch(i18n.flyOut, true, true);
      }
      game.advanceRunners(i18n.double, battingTeam, batter, playResult.advanceResult);
      game.resetCount();
      log(game, `${playerName(batter)}靠著牆邊球站上二壘。`);
      addCommentary(context, i18n.double);
      award(context, batter, 22, "batting");
      return finalizePitch(i18n.double, true, true);
    }

    if (playResult.code === "error") {
      if (battingTeam === "opponent") game.playerErrors = (game.playerErrors || 0) + 1;
      else game.opponentErrors = (game.opponentErrors || 0) + 1;
      const fielderPlayer = fielding?.selected?.player;
      log(game, call(context.pickCommentary, "error", batter, fielderPlayer, playResult.error)
        || `${fielding?.selected?.position || "守備員"}處理不乾淨，${playerName(batter)}靠失誤上壘。`);
      game.advanceRunners("error", battingTeam, batter, playResult.advanceResult);
      game.resetCount();
      const label = getErrorLabel(context, playResult.error);
      return finalizePitch(`失誤上壘 (${label})`, true, true);
    }

    if (playResult.code === "double_play") {
      runners[0] = null;
      game.recordOut();
      if (game.outs < 3) game.recordOut();
      game.resetCount();
      log(game, `內野快速轉傳，${playerName(batter)}打成雙殺。`);
      addCommentary(context, i18n.groundOut);
      return finalizePitch("雙殺", true, true);
    }

    if (playResult.code === "ground_out") {
      game.recordOut();
      game.resetCount();
      log(game, call(context.pickCommentary, "groundOut", batter)
        || `${playerName(batter)}擊成滾地球出局。`);
      addCommentary(context, i18n.groundOut);
      return finalizePitch(i18n.groundOut, true, true);
    }

    if (playResult.code === "popup_out") {
      game.recordOut();
      game.resetCount();
      log(game, call(context.pickCommentary, "popup", batter)
        || `${playerName(batter)}打成內野小飛球出局。`);
      addCommentary(context, i18n.flyOut);
      return finalizePitch(i18n.flyOut, true, true);
    }

    if (playResult.code === "fly_out") {
      if (playResult.advanceResult) {
        game.advanceRunners("tag_up", battingTeam, batter, playResult.advanceResult);
      }
      addThrowDecisionLog(context);
      game.recordOut();
      game.resetCount();
      log(game, call(context.pickCommentary, "flyOut", batter)
        || `${playerName(batter)}這球被外野手接殺。`);
      const advanceText = flyOutAdvanceLog(context);
      if (advanceText) log(game, advanceText);
      addCommentary(context, i18n.flyOut);
      return finalizePitch(i18n.flyOut, true, true);
    }

    const resolvedHit = hitLabel(context, playResult.hitType);
    game.advanceRunners(resolvedHit, battingTeam, batter, playResult.advanceResult);
    addThrowDecisionLog(context);
    const decisionText = runnerDecisionLog(context);
    if (decisionText) log(game, decisionText);
    log(game, hitResultLog(context));
    addCommentary(context, resolvedHit);
    game.resetCount();
    award(context, batter, resolvedHit === i18n.triple ? 30 : resolvedHit === i18n.double ? 22 : 12, "batting");
    return finalizePitch(resolvedHit, true, true);
  }

  global.InPlayResultApplier = { apply };
})(typeof window !== "undefined" ? window : globalThis);
