// player-growth-system.js — v3.23：球員養成三軌
//   1. 經驗升級（playerXP / playerLevel）：打比賽吃經驗，升級獲得能力點
//   2. 球員卡升級（cardLevel / cardCards）：抽到該球員的卡，可升 cardLevel 直接加屬性
//   3. 碎片品階（playerFragments / playerRank）：用該球員碎片升品階，提升能力上限+潛力
// 這三個系統的「資料欄位」掛在 Player 上；操作走 PlayerGrowth 統一入口。
(function (global) {
  "use strict";

  const PARAMS = () => global.GAME_PARAMS || {};

  // 確保 player 上有三軌資料欄位
  function ensureGrowthFields(player) {
    if (!player) return;
    if (typeof player.playerXP !== 'number') player.playerXP = 0;
    if (typeof player.playerLevel !== 'number') player.playerLevel = 1;
    if (typeof player.cardLevel !== 'number') player.cardLevel = 0;
    if (typeof player.cardCards !== 'number') player.cardCards = 0; // 累積該球員的卡片數
    if (typeof player.playerFragments !== 'number') player.playerFragments = 0;
    if (typeof player.playerRank !== 'number') player.playerRank = 0; // 0=銅
    if (!player.growthLog) player.growthLog = [];
  }

  // ────────────── 經驗升級 ──────────────
  // v3.25：gainXP 支援 category 參數，傳遞給升級時的屬性分配
  function gainXP(player, amount, category = 'all') {
    ensureGrowthFields(player);
    if (!amount) return;
    player.playerXP = Math.max(0, player.playerXP + amount);
    return checkLevelUp(player, category);
  }

  function getXPToNextLevel(player) {
    const cfg = PARAMS().experience || {};
    const fn = cfg.xpToLevelTable || ((lv) => 100 * lv);
    return fn(player.playerLevel || 1);
  }

  function checkLevelUp(player, category = 'all') {
    ensureGrowthFields(player);
    const cfg = PARAMS().experience || {};
    const maxLevel = cfg.maxLevel || 30;
    let leveled = false;
    while (player.playerLevel < maxLevel) {
      const need = getXPToNextLevel(player);
      if (player.playerXP < need) break;
      player.playerXP -= need;
      player.playerLevel += 1;
      applyLevelUpBonus(player, category);
      leveled = true;
    }
    return leveled;
  }

  // v3.25：依 category 給予升級加成（不再隨機）
  //   batting → contact / power / discipline / clutch 各 50% 機率 +1
  //   pitching → velocity / control / breaking / stuff 各 50% 機率 +1
  //   defense  → fielding / arm 各 50% 機率 +1
  //   baserunning → speed +1
  //   all → 取打者或投手主屬性各 50% 機率 +1
  function applyLevelUpBonus(player, category = 'all') {
    const cfg = PARAMS().experience || {};
    const points = cfg.statPointsPerLevel || 2;
    const isPitcher = player.role === 'P' || player.canPitch?.();
    if (!player.abilities) return;

    // 依 category 決定屬性池（與 game.js awardPlayerXP 的舊版邏輯一致）
    let attrs;
    if (category === 'batting')         attrs = ['contact', 'power', 'discipline', 'clutch'];
    else if (category === 'pitching')   attrs = ['velocity', 'control', 'breaking', 'stuff'];
    else if (category === 'defense')    attrs = ['fielding', 'arm'];
    else if (category === 'baserunning') attrs = ['speed'];
    else attrs = isPitcher
      ? (PARAMS().levelUpGrowth?.pitcherAttrs || ['velocity', 'control', 'breaking', 'stuff', 'stamina'])
      : (PARAMS().levelUpGrowth?.batterAttrs  || ['contact', 'power', 'discipline', 'speed', 'fielding']);

    const ceiling = getAbilityCeiling(player);
    // 每升一級每個屬性 50% 機率 +1，但保證至少加 points 點（避免一級什麼都沒加）
    let granted = 0;
    for (const a of attrs) {
      if (typeof player.abilities[a] === 'number' && player.abilities[a] < ceiling && Math.random() < 0.5) {
        player.abilities[a] = Math.min(ceiling, player.abilities[a] + 1);
        granted++;
      }
    }
    // 不足 points 點時，隨機再補
    while (granted < points) {
      const a = attrs[Math.floor(Math.random() * attrs.length)];
      if (typeof player.abilities[a] === 'number' && player.abilities[a] < ceiling) {
        player.abilities[a] = Math.min(ceiling, player.abilities[a] + 1);
        granted++;
      } else {
        break; // 全部到頂
      }
    }
    player.growthLog.push(`Lv${player.playerLevel} ↑ (+${granted} pts, ${category})`);
  }

  // ────────────── 球員卡升級 ──────────────
  function addCardCopy(player, count = 1) {
    ensureGrowthFields(player);
    player.cardCards = (player.cardCards || 0) + count;
  }

  function getCardLevelUpCost(player) {
    const cfg = PARAMS().cardLevel || {};
    const next = (player.cardLevel || 0) + 1;
    if (next > (cfg.maxLevel || 10)) return null;
    const moneys = cfg.costToReachLevel || [];
    return {
      nextLevel: next,
      money: moneys[next] || 0,
      cards: 1 // 每升一級消耗 1 張該球員的卡
    };
  }

  function upgradeCardLevel(player, game) {
    ensureGrowthFields(player);
    const cost = getCardLevelUpCost(player);
    if (!cost) return { success: false, message: '球員卡已達最高等級。' };
    if ((player.cardCards || 0) < cost.cards) return { success: false, message: '此球員的卡片不足。' };
    if (game.currency < cost.money) return { success: false, message: `資金不足，需要 ${cost.money}。` };
    player.cardCards -= cost.cards;
    game.currency -= cost.money;
    player.cardLevel = cost.nextLevel;
    applyCardLevelBonus(player);
    player.growthLog.push(`卡 Lv${cost.nextLevel} ↑`);
    return { success: true, message: `${player.name} 球員卡升到 Lv${cost.nextLevel}！` };
  }

  function applyCardLevelBonus(player) {
    const cfg = PARAMS().cardLevel || {};
    const isPitcher = player.role === 'P' || player.canPitch?.();
    const bonuses = isPitcher
      ? (cfg.pitcherBonusPerLevel || { velocity: 1, control: 1, breaking: 1, stuff: 1, stamina: 2 })
      : (cfg.batterBonusPerLevel || { contact: 1, power: 1, discipline: 1, speed: 1, fielding: 1 });
    if (!player.abilities) return;
    for (const [k, v] of Object.entries(bonuses)) {
      if (typeof player.abilities[k] === 'number') {
        const ceiling = getAbilityCeiling(player);
        player.abilities[k] = Math.min(ceiling, player.abilities[k] + v);
      }
    }
  }

  // ────────────── 碎片品階 ──────────────
  function addFragments(player, count = 1) {
    ensureGrowthFields(player);
    player.playerFragments = (player.playerFragments || 0) + count;
  }

  function getRankUpCost(player) {
    const cfg = PARAMS().rank || {};
    const next = (player.playerRank || 0) + 1;
    if (next > (cfg.maxRank || 7)) return null;
    const table = cfg.fragmentsToNextRank || [];
    return {
      nextRank: next,
      nextRankName: (cfg.names || [])[next] || `Rank ${next}`,
      fragments: table[next] || 0
    };
  }

  function upgradeRank(player) {
    ensureGrowthFields(player);
    const cost = getRankUpCost(player);
    if (!cost) return { success: false, message: '已達最高品階。' };
    if ((player.playerFragments || 0) < cost.fragments) {
      return { success: false, message: `碎片不足，需要 ${cost.fragments} 枚。` };
    }
    player.playerFragments -= cost.fragments;
    player.playerRank = cost.nextRank;
    // 品階提升 → 能力上限與 growthPotential 提升
    const cfg = PARAMS().rank || {};
    if (typeof player.growthPotential === 'number') {
      player.growthPotential = Math.min(150, player.growthPotential + (cfg.growthPotentialPerRank || 10));
    }
    player.growthLog.push(`晉升 ${cost.nextRankName} 階 ↑`);
    // v3.25：品階提升 → 嘗試解鎖對應特質
    const newlyUnlocked = unlockTraitsByRank(player);
    let extraMsg = '';
    if (newlyUnlocked.length) {
      extraMsg = `\n🌟 解鎖特質：${newlyUnlocked.join('、')}`;
    }
    return { success: true, message: `${player.name} 晉升至「${cost.nextRankName}」階！${extraMsg}`, unlockedTraits: newlyUnlocked };
  }

  // v3.25：依 abilities + playerRank 解鎖特質（GAME_PARAMS.traits 表）
  function unlockTraitsByRank(player) {
    const traitTable = PARAMS().traits || [];
    const isPitcher = player.role === 'P' || player.canPitch?.();
    const side = isPitcher ? 'P' : 'B';
    if (!player.traits) player.traits = [];
    if (!player.abilities) return [];
    const unlocked = [];
    for (const t of traitTable) {
      if (t.side !== side && t.side !== 'BP') continue;
      if ((player.playerRank || 0) < (t.minRank || 1)) continue;
      if (player.traits.includes(t.name)) continue;
      // 主要能力檢查
      const abilityVal = t.unlocker === 'any' ? 999 : (player.abilities[t.unlocker] || 0);
      if (abilityVal < (t.min || 0)) continue;
      // 次要能力檢查（複合特質如「絕對王牌」）
      if (t.secondary) {
        const secVal = player.abilities[t.secondary.key] || 0;
        if (secVal < t.secondary.min) continue;
      }
      player.traits.push(t.name);
      player.growthLog.push(`✨ 解鎖特質：${t.name}`);
      unlocked.push(t.name);
    }
    return unlocked;
  }

  function getAbilityCeiling(player) {
    const cfg = PARAMS().rank || {};
    return 95 + (player.playerRank || 0) * (cfg.abilityCeilingPerRank || 5);
  }

  function getRankName(player) {
    const cfg = PARAMS().rank || {};
    return (cfg.names || [])[player.playerRank || 0] || '銅';
  }

  // ────────────── XP 事件入口（在比賽流程的關鍵節點呼叫）──────────────
  function awardXPForMatchEvent(player, eventType, extra = {}) {
    if (!player) return;
    const cfg = PARAMS().experience || {};
    let xp = 0;
    switch (eventType) {
      case 'hit': xp = cfg.xpPerHit || 6; break;
      case 'extraBaseHit': xp = cfg.xpPerExtraBaseHit || 10; break;
      case 'hr': xp = cfg.xpPerHR || 18; break;
      case 'strikeoutPitcher': xp = cfg.xpPerStrikeoutPitcher || 5; break;
      case 'strikeoutBatter': xp = cfg.xpPerStrikeoutBatter || -2; break;
      case 'walkPitcher': xp = cfg.xpPerWalkPitcher || -1; break;
      case 'inningPitched': xp = cfg.xpPerInningPitched || 4; break;
      case 'win': xp = cfg.xpPerWinTeam || 25; break;
      case 'loss': xp = cfg.xpPerLossTeam || 8; break;
      case 'startDefense': xp = cfg.xpPerStartDefense || 3; break;
      default: xp = 0;
    }
    if (!xp) return;
    // 一軍訓練乘數
    const game = global.game;
    if (game?.logisticsCenter) {
      const isPitcher = player.role === 'P';
      const isFielder = !isPitcher && player.position !== 'DH';
      let multiplier = 1;
      if (isPitcher) multiplier = game.logisticsCenter.getMajorTrainingMultiplier('pitcher');
      else if (eventType === 'startDefense') multiplier = game.logisticsCenter.getMajorTrainingMultiplier('fielder');
      else multiplier = game.logisticsCenter.getMajorTrainingMultiplier('batter');
      xp = Math.round(xp * multiplier);
    }
    return gainXP(player, xp, eventType);
  }

  // 公開 API
  global.PlayerGrowth = {
    ensureGrowthFields,
    gainXP,
    getXPToNextLevel,
    checkLevelUp,
    applyLevelUpBonus,
    addCardCopy,
    getCardLevelUpCost,
    upgradeCardLevel,
    applyCardLevelBonus,
    addFragments,
    getRankUpCost,
    upgradeRank,
    unlockTraitsByRank,
    getAbilityCeiling,
    getRankName,
    awardXPForMatchEvent
  };
})(typeof window !== 'undefined' ? window : globalThis);
