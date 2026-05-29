// logistics-system.js — v3.23：後勤管理系統（取代防護中心）
// 部門結構：
//   - farmTraining：二軍訓練中心
//   - majorTraining：一軍訓練中心（pitcher / batter / fielder 三子部門）
//   - recovery：恢復中心
//   - marketing：行銷部門（events / cheer 兩子部門）
// 每個（子）部門可部署一位教練；教練吃資金 + 教練證升級（費氏序列，最高 9 級）
(function (global) {
  "use strict";

  const PARAMS = () => global.GAME_PARAMS || {};

  // v4.1：教練 SABCD 每級對「2 項對應能力」的加成基數（保守級；S 滿級 Lv9 約 +5）
  const GRADE_BASE = { S: 0.55, A: 0.45, B: 0.35, C: 0.27, D: 0.18 };
  // 一軍三部門 → 加成的對應族群與能力
  const MAJOR_DEPT_PLAN = {
    pitcher: { domain: 'pitching', group: 'pitcher', abilities: ['velocity', 'control'] },
    batter:  { domain: 'batting',  group: 'batter',  abilities: ['contact', 'power'] },
    fielder: { domain: 'fielding', group: 'fielder', abilities: ['fielding', 'arm'] }
  };
  // 教練 domain 與部門 domain 的相符倍率：相符全效、總教練半效、其餘部分生效
  function domainMatchMult(coachDomain, deptDomain) {
    if (coachDomain === deptDomain) return 1.0;
    if (coachDomain === 'head') return 0.5;
    return 0.3;
  }

  // 預設的部門結構（含子部門）
  function createDefaultDepartments() {
    return {
      farmTraining: { name: '二軍訓練中心', assignedCoachId: null, sub: null },
      majorTraining: {
        name: '一軍訓練中心',
        sub: {
          pitcher: { name: '投手部門', assignedCoachId: null },
          batter:  { name: '打擊部門', assignedCoachId: null },
          fielder: { name: '守備部門', assignedCoachId: null }
        }
      },
      recovery: { name: '恢復中心', assignedCoachId: null, sub: null },
      marketing: {
        name: '行銷部門',
        sub: {
          events: { name: '活動部門', assignedCoachId: null },
          cheer:  { name: '啦啦隊部門', assignedCoachId: null }
        }
      }
    };
  }

  class LogisticsCenter {
    constructor(game) {
      this.game = game;
      // 保留 MedicalCenter 的舊欄位以維持相容
      this.protectionBuffs = {};
      // 新部門結構
      this.departments = createDefaultDepartments();
      // 教練個別狀態：{ [coachId]: { level: 1, certInvested: 0, moneyInvested: 0 } }
      this.coachUpgrades = {};
    }

    // 還原 / 補齊：用於 load 後或進入頁面前
    normalize() {
      if (!this.departments) this.departments = createDefaultDepartments();
      const defaults = createDefaultDepartments();
      // 補上缺失節點
      for (const key of Object.keys(defaults)) {
        if (!this.departments[key]) this.departments[key] = defaults[key];
        if (defaults[key].sub) {
          this.departments[key].sub = this.departments[key].sub || {};
          for (const subKey of Object.keys(defaults[key].sub)) {
            if (!this.departments[key].sub[subKey]) {
              this.departments[key].sub[subKey] = defaults[key].sub[subKey];
            }
          }
        }
      }
      if (!this.coachUpgrades) this.coachUpgrades = {};
    }

    // ────────────── 教練升級 ──────────────
    getCoachLevel(coachId) {
      return (this.coachUpgrades[coachId]?.level) || 1;
    }

    // 取得升級到下一級需要的資源
    getCoachUpgradeCost(coachId) {
      const params = PARAMS().coaches || {};
      const lv = this.getCoachLevel(coachId);
      const maxLv = params.maxLevel || 9;
      if (lv >= maxLv) return null;
      const certs = params.certToNextLevel || [];
      const moneys = params.moneyToNextLevel || [];
      const idx = lv - 1;
      return {
        currentLevel: lv,
        nextLevel: lv + 1,
        cert: certs[idx] || 0,
        money: moneys[idx] || 0
      };
    }

    // 嘗試升級教練（需扣資金 + 教練證）
    upgradeCoach(coachId) {
      const cost = this.getCoachUpgradeCost(coachId);
      if (!cost) return { success: false, message: '已達最高等級 (Lv9)。' };
      const game = this.game;
      if (game.currency < cost.money) {
        return { success: false, message: `資金不足，需要 ${cost.money}。` };
      }
      if ((game.coachCerts || 0) < cost.cert) {
        return { success: false, message: `教練證不足，需要 ${cost.cert} 張。` };
      }
      // 扣資源
      game.currency -= cost.money;
      game.coachCerts = (game.coachCerts || 0) - cost.cert;
      // 升等
      const entry = this.coachUpgrades[coachId] || { level: 1, certInvested: 0, moneyInvested: 0 };
      entry.level = cost.nextLevel;
      entry.certInvested += cost.cert;
      entry.moneyInvested += cost.money;
      this.coachUpgrades[coachId] = entry;
      if (typeof this.game.applyCoachAbilityBonuses === 'function') this.game.applyCoachAbilityBonuses();
      return { success: true, message: `教練升級至 Lv${cost.nextLevel}！` };
    }

    // ────────────── 教練部署 ──────────────
    // 將教練分派到某部門（或子部門）
    assignCoach(coachId, deptKey, subKey = null) {
      this.normalize();
      const dept = this.departments[deptKey];
      if (!dept) return { success: false, message: '部門不存在。' };
      // 先把該教練從其他位置移除（每位教練同時只能在一個位置）
      this.unassignCoach(coachId);
      if (subKey) {
        if (!dept.sub?.[subKey]) return { success: false, message: '子部門不存在。' };
        dept.sub[subKey].assignedCoachId = coachId;
      } else {
        if (dept.sub) return { success: false, message: '此部門需指定子部門。' };
        dept.assignedCoachId = coachId;
      }
      if (typeof this.game.applyCoachAbilityBonuses === 'function') this.game.applyCoachAbilityBonuses();
      return { success: true, message: '教練已部署。' };
    }

    unassignCoach(coachId) {
      this.normalize();
      for (const dept of Object.values(this.departments)) {
        if (dept.assignedCoachId === coachId) dept.assignedCoachId = null;
        if (dept.sub) {
          for (const sub of Object.values(dept.sub)) {
            if (sub.assignedCoachId === coachId) sub.assignedCoachId = null;
          }
        }
      }
      if (typeof this.game.applyCoachAbilityBonuses === 'function') this.game.applyCoachAbilityBonuses();
    }

    getCoachAtSlot(deptKey, subKey = null) {
      this.normalize();
      const dept = this.departments[deptKey];
      if (!dept) return null;
      const id = subKey ? dept.sub?.[subKey]?.assignedCoachId : dept.assignedCoachId;
      if (!id) return null;
      // hiredCoaches 是 ID 字串陣列；從 COACHES_POOL 找實際物件
      const hired = (this.game.hiredCoaches || []);
      if (!hired.includes(id)) return null;
      const pool = (typeof window !== 'undefined' && Array.isArray(window.COACHES_POOL))
        ? window.COACHES_POOL
        : [];
      return pool.find(c => c && c.id === id) || { id, name: id, bonus: '' };
    }

    // 給 UI 用：取得所有可分派的教練物件
    getHiredCoachObjects() {
      const hired = (this.game.hiredCoaches || []);
      const pool = (typeof window !== 'undefined' && Array.isArray(window.COACHES_POOL))
        ? window.COACHES_POOL
        : [];
      return hired.map(id => pool.find(c => c && c.id === id) || { id, name: id, bonus: '' });
    }

    // ────────────── 部門效果計算 ──────────────
    // 子部門等級 = (派駐教練等級) or 0
    getDeptCoachLevel(deptKey, subKey = null) {
      const coach = this.getCoachAtSlot(deptKey, subKey);
      if (!coach) return 0;
      return this.getCoachLevel(coach.id || coach.coachId);
    }

    // 二軍訓練：每場給下二軍球員的 XP
    getFarmTrainingXP() {
      const cfg = PARAMS().logistics?.farmTraining || {};
      const coachLv = this.getDeptCoachLevel('farmTraining');
      return (cfg.baseXPPerGame || 0) + coachLv * (cfg.perCoachLevelXP || 0);
    }

    // 一軍訓練：投/打/守 XP 倍率（v4.1：專長不符的教練 XP 倍率打折）
    getMajorTrainingMultiplier(roleKey) {
      const cfg = PARAMS().logistics?.majorTraining?.[roleKey];
      if (!cfg) return 1;
      const coachLv = this.getDeptCoachLevel('majorTraining', roleKey);
      const coach = this.getCoachAtSlot('majorTraining', roleKey);
      const plan = MAJOR_DEPT_PLAN[roleKey];
      const match = (coach && plan) ? domainMatchMult(coach.domain || coach.roleType, plan.domain) : 1;
      return (cfg.baseMultiplier || 1) + coachLv * (cfg.perCoachLevel || 0) * match;
    }

    // v4.1：一軍三部門對「對應族群一軍球員」的能力加成清單（給 game.applyCoachAbilityBonuses 用）
    getMajorAbilityContributions() {
      const out = [];
      for (const roleKey of Object.keys(MAJOR_DEPT_PLAN)) {
        const coach = this.getCoachAtSlot('majorTraining', roleKey);
        if (!coach) continue;
        const plan = MAJOR_DEPT_PLAN[roleKey];
        const grade = coach.grade || 'D';
        const level = this.getCoachLevel(coach.id);
        const match = domainMatchMult(coach.domain || coach.roleType, plan.domain);
        const amount = Math.round((GRADE_BASE[grade] || 0.18) * level * match);
        if (amount <= 0) continue;
        out.push({ group: plan.group, abilities: plan.abilities, amount, coachName: coach.name, grade, match });
      }
      return out;
    }

    // 恢復中心：場間多回的體力
    getExtraRecovery() {
      const cfg = PARAMS().logistics?.recovery || {};
      const coachLv = this.getDeptCoachLevel('recovery');
      return (cfg.baseExtraRecovery || 0) + coachLv * (cfg.perCoachLevelRecovery || 0);
    }

    // 恢復中心：傷病風險降低比例
    getInjuryReductionMultiplier() {
      const cfg = PARAMS().logistics?.recovery || {};
      const coachLv = this.getDeptCoachLevel('recovery');
      const reduction = (cfg.baseInjuryReduction || 0) + coachLv * (cfg.perCoachLevelReduction || 0);
      return Math.max(0, 1 - reduction);
    }

    // 行銷活動：每場觀眾基底
    getMarketingAttendance() {
      const cfg = PARAMS().logistics?.marketing?.events || {};
      const coachLv = this.getDeptCoachLevel('marketing', 'events');
      return (cfg.baseAttendance || 0) + coachLv * (cfg.perCoachLevel || 0);
    }

    // 啦啦隊：主場加成（士氣）
    getCheerHomeBonus() {
      const cfg = PARAMS().logistics?.marketing?.cheer || {};
      const coachLv = this.getDeptCoachLevel('marketing', 'cheer');
      return (cfg.homeBonusMod || 0) + coachLv * (cfg.perCoachLevel || 0);
    }

    // ────────────── 舊版 API 相容（避免破壞 MedicalCenter 呼叫端）──────────────
    healPlayer(playerIndex, cost = 200) {
      if (this.game.currency < cost) return { success: false, message: '資金不足。' };
      const player = this.game.roster.players[playerIndex];
      if (!player) return { success: false, message: '無效的球員' };
      const originalMax = player.maxStamina * 1.2;
      player.maxStamina = Math.min(Math.round(originalMax), 120);
      player.state.stamina = player.maxStamina;
      this.game.currency -= cost;
      return { success: true, message: `${player.name} 已恢復！` };
    }

    protectPlayer(playerIndex, cost = 150) {
      if (this.game.currency < cost) return { success: false, message: '資金不足。' };
      const player = this.game.roster.players[playerIndex];
      if (!player) return { success: false, message: '無效的球員' };
      this.protectionBuffs[playerIndex] = { duration: 3, injuryReduction: 0.5 };
      this.game.currency -= cost;
      return { success: true, message: `${player.name} 受到恢復中心保護 3 場！` };
    }

    updateProtectionStatus() {
      for (const idx in this.protectionBuffs) {
        this.protectionBuffs[idx].duration--;
        if (this.protectionBuffs[idx].duration <= 0) delete this.protectionBuffs[idx];
      }
    }

    getInjuryProbability(playerIndex) {
      const player = this.game.roster.players[playerIndex];
      let prob = player.injuryProbability;
      if (this.protectionBuffs[playerIndex]) prob *= this.protectionBuffs[playerIndex].injuryReduction;
      return prob * this.getInjuryReductionMultiplier();
    }

    getInjuredPlayers() {
      return this.game.roster.players.map((p, i) => ({
        index: i,
        player: p,
        maxStaminaLost: 120 - p.maxStamina,
        injuryRisk: this.getInjuryProbability(i),
        protected: !!this.protectionBuffs[i],
        protectionDuration: this.protectionBuffs[i]?.duration || 0
      })).filter(p => p.maxStaminaLost > 0 || p.injuryRisk > 0.05);
    }

    // ────────────── 場間結算：套用部門效果 ──────────────
    applyBetweenGamesEffects() {
      // 二軍 XP
      const farmXP = this.getFarmTrainingXP();
      if (farmXP > 0 && this.game.roster?.players) {
        this.game.roster.players.forEach(p => {
          if (p.level === 'minor') {
            p.playerXP = (p.playerXP || 0) + farmXP;
            if (typeof global.PlayerGrowth?.checkLevelUp === 'function') {
              global.PlayerGrowth.checkLevelUp(p);
            }
          }
        });
      }
      // 恢復中心 → 體力 +
      const extra = this.getExtraRecovery();
      if (extra > 0 && this.game.roster?.players) {
        this.game.roster.players.forEach(p => {
          p.state.stamina = Math.min((p.state.stamina || 0) + extra, p.maxStamina || 120);
        });
      }
      // 保護倒計時
      this.updateProtectionStatus();
    }

    // ────────────── 序列化（save / load）──────────────
    toJSON() {
      this.normalize();
      return {
        departments: this.departments,
        coachUpgrades: this.coachUpgrades,
        protectionBuffs: this.protectionBuffs
      };
    }

    loadFromJSON(data) {
      if (!data) return;
      if (data.departments) this.departments = data.departments;
      if (data.coachUpgrades) this.coachUpgrades = data.coachUpgrades;
      if (data.protectionBuffs) this.protectionBuffs = data.protectionBuffs;
      this.normalize();
    }
  }

  global.LogisticsCenter = LogisticsCenter;
})(typeof window !== 'undefined' ? window : globalThis);
