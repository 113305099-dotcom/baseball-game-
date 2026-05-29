// rewards-system.js — v3.23：賽後獎勵生成器（資金、教練證、球員卡）
// 由 SeasonManager.endMatch() 在判定勝負後呼叫，輸出資料給報紙頭版。
(function (global) {
  "use strict";

  const PARAMS = () => global.GAME_PARAMS || {};

  function rand() { return Math.random(); }

  // 計算本場 MVP 候選（從上場過、有貢獻者中挑）
  function pickMVP(game, result) {
    const players = game?.roster?.players || [];
    const playerStats = game?.playerBatterStats || {};
    let best = null;
    let bestScore = -Infinity;
    const inMajor = players.filter(p => p.level === 'major');
    for (const p of inMajor) {
      const ps = playerStats[p.name] || {};
      const isPitcher = p === game.pitcher;
      let score = 0;
      if (isPitcher) {
        score += (ps.k || 0) * 1.5;
        score -= (ps.bb || 0) * 0.5;
        score -= (ps.er || 0) * 1.2;
        score += result === 'Win' ? 2 : 0;
      } else {
        score += (ps.h || 0) * 1.0;
        score += (ps.hr || 0) * 3.0;
        score += (ps.rbi || 0) * 1.0;
        score += (ps.r || 0) * 0.6;
      }
      if (score > bestScore) {
        bestScore = score;
        best = { player: p, isPitcher, stats: ps };
      }
    }
    if (!best) return null;
    const p = best.player;
    const ps = best.stats;
    const line = best.isPitcher
      ? `${ps.ip || 0} IP・${ps.k || 0} K・${ps.bb || 0} BB`
      : `${ps.ab || 0} AB ${ps.h || 0} H${ps.hr ? `・${ps.hr} HR` : ''}${ps.rbi ? `・${ps.rbi} RBI` : ''}`;
    return { name: p.name, traits: p.traits || [], line, playerIndex: game.roster.players.indexOf(p) };
  }

  function computeMoney(result, ctx) {
    const cfg = PARAMS().rewards?.money || {};
    let total = result === 'Win' ? (cfg.win || 900) : result === 'Loss' ? (cfg.loss || 280) : (cfg.tie || 480);
    if (ctx.mvp) total += cfg.mvpBonus || 0;
    if (ctx.blowout) total += cfg.blowoutBonus || 0;
    total += (ctx.playerHits || 0) * (cfg.perHit || 0);
    total += (ctx.playerHR || 0) * (cfg.perHR || 0);
    return total;
  }

  function computeCoachCerts(result, ctx) {
    const cfg = PARAMS().rewards?.coachCert || {};
    let chance = result === 'Win' ? (cfg.winBaseChance || 0.5)
               : result === 'Loss' ? (cfg.lossBaseChance || 0.15)
               : (cfg.tieBaseChance || 0.3);
    if (ctx.mvp) chance += cfg.bonusPerMvpEvent || 0;
    if (ctx.shutout) chance += cfg.shutoutBonus || 0;
    chance = Math.min(1, chance);
    let count = 0;
    if (rand() < chance) count = 1;
    if (count && rand() < (cfg.secondCertChance || 0.18)) count = 2;
    return count;
  }

  function computePlayerCards(result, game, ctx) {
    const cfg = PARAMS().rewards?.playerCard || {};
    const base = result === 'Win' ? (cfg.winBaseChance || 0.3) : (cfg.lossBaseChance || 0.06);
    const cards = [];
    if (rand() >= base) return cards;
    // 依貢獻挑選一位球員當作卡片掉落對象
    const players = game?.roster?.players || [];
    const stats = game?.playerBatterStats || {};
    const weighted = [];
    for (const p of players) {
      if (p.level !== 'major') continue;
      const ps = stats[p.name] || {};
      let w = 1;
      w += (ps.h || 0) * (cfg.favorPlayerWithHitsWeight || 3);
      w += (ps.hr || 0) * (cfg.favorPlayerWithHRWeight || 6);
      if (p === game.pitcher && result === 'Win') w += cfg.favorWinningPitcherWeight || 4;
      weighted.push({ p, w });
    }
    if (!weighted.length) return cards;
    const totalW = weighted.reduce((s, x) => s + x.w, 0);
    let r = rand() * totalW;
    for (const x of weighted) {
      r -= x.w;
      if (r <= 0) {
        cards.push({ name: x.p.name, playerIndex: players.indexOf(x.p) });
        break;
      }
    }
    return cards;
  }

  // 套用獎勵到 game：扣加資金、加教練證、發放球員卡 (cardCards++)
  function applyRewards(game, rewards) {
    if (!game || !rewards) return;
    if (rewards.money) game.currency += rewards.money;
    if (rewards.coachCerts) game.coachCerts = (game.coachCerts || 0) + rewards.coachCerts;
    if (rewards.playerCards?.length && typeof global.PlayerGrowth?.addCardCopy === 'function') {
      for (const c of rewards.playerCards) {
        const p = game.roster.players[c.playerIndex];
        if (p) global.PlayerGrowth.addCardCopy(p, 1);
      }
    }
  }

  function generateRewards(game, result, summary = {}) {
    const playerScore = game?.playerScore || 0;
    const opponentScore = game?.opponentScore || 0;
    const diff = playerScore - opponentScore;
    const mvp = pickMVP(game, result);
    const ctx = {
      mvp: !!mvp,
      blowout: result === 'Win' && diff >= 5,
      shutout: result === 'Win' && opponentScore === 0,
      playerHits: summary.playerHits || game?.playerHits || 0,
      playerHR: summary.playerHR || (game?.matchStats?.playerHR || 0)
    };
    const rewards = {
      money: computeMoney(result, ctx),
      coachCerts: computeCoachCerts(result, ctx),
      playerCards: computePlayerCards(result, game, ctx),
      heat: summary.heat || 0,
      mvp
    };
    return rewards;
  }

  global.RewardsSystem = { generateRewards, applyRewards, pickMVP };
})(typeof window !== 'undefined' ? window : globalThis);
