// Internationalization Dictionary
const i18n = {
  // UI Labels
  stamina: '體力',
  mana: '魔力',
  inning: '局數',
  score: '分數',
  autoSim: '自動模擬',
  recruit: '招募',
  scoutsPoints: '球探點數',
  // Game Outcomes
  strikeout: '三振出局',
  single: '一壘安打',
  double: '二壘安打',
  triple: '三壘安打',
  homeRun: '全壘打',
  groundOut: '滾地球出局',
  flyOut: '高飛球出局',
  walk: '四壞球',
  // Skills & Cards
  burnLife: '燃燒生命',
  shadowClone: '影分身',
  // Other Messages
  notEnoughMana: '魔力不足！',
  notEnoughCurrency: '球探點數不足！',
  recruited: '招募成功：',
  seasonComplete: '賽季結束。處理賽後成長...',
  seasonEnded: '賽季結束，戰績',
  activatedBurnLife: '啟動了燃燒生命！',
  strike: '好球',
  ball: '壞球',
  opponentScored: '對手得分',
  run: '分',
  runs: '分',
  bottomOf: '下半局',
  inningStart: '--- 第',
  inningEnd: '局 ---',
  startingMatch: '--- 開始比賽',
  autoSimPaused: '自動模擬在關鍵時刻暫停。',
  autoSimOutcome: '自動模擬結果：',
  weatherChanged: '天氣變為',
  magicDeployed: '[魔法] 影分身部署！防守範圍加倍。',
  outcome: '結果：',
  autoSimOutcome: '自動模擬結果：',
  // Traits
  legendaryHitter: '傳奇打者',
  elitePitcher: '精英投手',
  rareSlugger: '稀有強打者',
  clutchHitter: '關鍵時刻打者',
  powerHitter: '力量打者',
  buntSpecialist: '觸擊專家',
  disciplined: '紀律性',
  // Tabs
  game: '遊戲',
  roster: '名單',
  season: '賽季',
  shop: '擴張',
  // Buttons
  normalPitch: '正常投球',
  magicPitch: '魔法投球 (燃燒生命)',
  simOneAtBat: '模擬一次打席',
  toggleWeather: '切換天氣',
  drawPlayer: '抽取球員',
  close: '關閉',
  // Other
  spellbook: '法術書',
  rosterGallery: '名單畫廊',
  seasonDashboard: '賽季儀表板',
  recruitmentCenter: '擴張中心',
  strategicStatus: '戰略狀態',
  opponentLineup: '對手打序',
  upcomingBatters: '即將上場打者',
  bullpenSubstitutions: '牛棚 / 替換',
  currentRecord: '目前戰績',
  upcomingMatch: '下一場比賽',
  matchSummary: '比賽總結',
  // Weather
  sunny: '晴天',
  rainy: '雨天',
  // Half
  top: '上半局',
  bottom: '下半局',
  // Tactic
  normal: '正常',
  // Runner positions
  none: '無',
  first: '一壘',
  second: '二壘',
  third: '三壘',
  // New for expansion
  localTalent: '本地人才',
  internationalStar: '國際巨星'
};

// Medical Center Class
class MedicalCenter {
  constructor(game) {
    this.game = game;
    this.protectionBuffs = {}; // playerIndex -> { duration, injuryReduction }
  }

  healPlayer(playerIndex, cost = 200) {
    if (this.game.currency < cost) {
      return { success: false, message: i18n.notEnoughCurrency };
    }
    const player = this.game.roster.players[playerIndex];
    if (!player) return { success: false, message: '無效的球員' };
    
    // Restore half of lost stamina
    const originalMax = player.maxStamina * 1.2; // Assume original was 20% higher
    player.maxStamina = Math.min(Math.round(originalMax), 120);
    player.state.stamina = player.maxStamina;
    this.game.currency -= cost;
    return { success: true, message: `${player.name} 已恢復！` };
  }

  protectPlayer(playerIndex, cost = 150) {
    if (this.game.currency < cost) {
      return { success: false, message: i18n.notEnoughCurrency };
    }
    const player = this.game.roster.players[playerIndex];
    if (!player) return { success: false, message: '無效的球員' };
    
    this.protectionBuffs[playerIndex] = { duration: 3, injuryReduction: 0.5 };
    this.game.currency -= cost;
    return { success: true, message: `${player.name} 已受保護 3 場比賽！` };
  }

  updateProtectionStatus() {
    for (let idx in this.protectionBuffs) {
      this.protectionBuffs[idx].duration--;
      if (this.protectionBuffs[idx].duration <= 0) {
        delete this.protectionBuffs[idx];
      }
    }
  }

  getInjuryProbability(playerIndex) {
    const player = this.game.roster.players[playerIndex];
    let prob = player.injuryProbability;
    if (this.protectionBuffs[playerIndex]) {
      prob *= this.protectionBuffs[playerIndex].injuryReduction;
    }
    return prob;
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
}

// Commentary Generator Class
class CommentaryGenerator {
  constructor() {
    this.templates = {
      homeRun: {
        powerHitter: ['力量打者的棒子一揮，球飛向了遠方！', '令人目眩的本壘打！力量無可匹敵！', '那是一記真正的巨砲！'],
        default: ['長打出去！球進場外！', '本壘打！這會改變比賽局面！', '飛翔的棒球！絕美的一擊！']
      },
      strikeout: {
        elitePitcher: ['他在角落投球！打者無從招架。', '精準的投球組合！三振出局！', '控球大師的傑作！'],
        default: ['三振！打者揮空了！', '好球三顆！出局！', '投手贏得這次對決！']
      },
      single: {
        clutchHitter: ['關鍵時刻的安打！團隊需要的一擊！', '面對壓力，他選擇了安全上壘！'],
        default: ['安打！球飛向外野！', '一壘安打，打者安全上壘！']
      },
      double: ['二壘安打！打者冒著生命危險衝向二壘！', '深遠的打擊！二壘安打！'],
      triple: ['三壘安打！打者全力奔馳！', '深深的外野飛球！打者趕上三壘！'],
      groundOut: ['地面球被守備隊員處理掉！', '滾地球三振！'],
      flyOut: ['高飛球被守備隊員接住！出局！', '淺外野飛球，被接住了。'],
      walk: ['四壞球保送！打者安全上壘！', '投手控制失手，打者獲得保送！'],
      shadowClone: ['不可思議！影分身做出了超自然的守備！', '魔法守備！雙重身體的威力！']
    };
  }

  generateCommentary(outcome, player, cardActive = false) {
    let template = this.templates[outcome] || {};
    let text = '';

    if (typeof template === 'object' && !Array.isArray(template)) {
      // Has trait-based variations
      const traitKey = this.getTraitKey(player);
      text = template[traitKey] ? this.randomFromArray(template[traitKey]) : this.randomFromArray(template.default || []);
    } else if (Array.isArray(template)) {
      text = this.randomFromArray(template);
    }

    if (cardActive && outcome === 'flyOut') {
      text = this.randomFromArray(this.templates.shadowClone);
    }

    return text;
  }

  getTraitKey(player) {
    if (!player || !player.traits) return 'default';
    if (player.traits.includes(i18n.powerHitter)) return 'powerHitter';
    if (player.traits.includes(i18n.elitePitcher)) return 'elitePitcher';
    if (player.traits.includes(i18n.clutchHitter)) return 'clutchHitter';
    return 'default';
  }

  randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  generateHeadline(playerScore, opponentScore, mvpPlayer) {
    if (playerScore > opponentScore) {
      return `${mvpPlayer.name} 於第七隊勝利中大放異彩！ (${playerScore}-${opponentScore})`;
    } else if (playerScore < opponentScore) {
      return `${mvpPlayer.name} 的表現不足以阻止敗北。 (${playerScore}-${opponentScore})`;
    } else {
      return `戲劇性平局！${mvpPlayer.name} 無法突破僵局。 (${playerScore}-${opponentScore})`;
    }
  }
}

const PLAYER_DATA_VERSION = 2;

function clampInt(value, min = 0, max = 99) {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : min;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

const CPBL_BATTER_STATS_2025 = [
  { name: '吳念庭', team: '台鋼雄鷹', position: 'IF', role: 'B', avg: 0.328, obp: 0.400, slg: 0.407, ops: 0.807, opsPlus: 138, hr: 2, sb: 5, kRate: 11.94, bbRate: 10.88, errors: 4, source: 'CPBL 2025' },
  { name: '林安可', team: '統一7-ELEVEn獅', position: 'OF', role: 'B', avg: 0.318, obp: 0.397, slg: 0.603, ops: 1.000, opsPlus: 192, hr: 23, sb: 4, kRate: 17.33, bbRate: 9.60, errors: 1, source: 'CPBL 2025' },
  { name: '陳晨威', team: '樂天桃猿', position: 'OF', role: 'B', avg: 0.307, obp: 0.366, slg: 0.411, ops: 0.777, opsPlus: 129, hr: 4, sb: 27, kRate: 11.27, bbRate: 8.56, errors: 3, source: 'CPBL 2025' },
  { name: '林泓育', team: '樂天桃猿', position: 'C/DH', role: 'B', avg: 0.307, obp: 0.345, slg: 0.415, ops: 0.760, opsPlus: 124, hr: 9, sb: 0, kRate: 15.35, bbRate: 4.56, errors: 2, source: 'CPBL 2025' },
  { name: '魔鷹', team: '台鋼雄鷹', position: '1B/OF', role: 'B', avg: 0.305, obp: 0.387, slg: 0.589, ops: 0.976, opsPlus: 185, hr: 25, sb: 0, kRate: 15.71, bbRate: 8.90, errors: 10, source: 'CPBL 2025' },
  { name: '李凱威', team: '味全龍', position: 'IF', role: 'B', avg: 0.300, obp: 0.388, slg: 0.338, ops: 0.726, opsPlus: 116, hr: 0, sb: 28, kRate: 9.21, bbRate: 11.13, errors: 8, source: 'CPBL 2025' },
  { name: '朱育賢', team: '味全龍', position: '1B/OF', role: 'B', avg: 0.293, obp: 0.355, slg: 0.476, ops: 0.831, opsPlus: 144, hr: 15, sb: 2, kRate: 22.13, bbRate: 7.47, errors: 7, source: 'CPBL 2025' },
  { name: '許基宏', team: '中信兄弟', position: '1B', role: 'B', avg: 0.292, obp: 0.390, slg: 0.525, ops: 0.915, opsPlus: 168, hr: 19, sb: 0, kRate: 21.22, bbRate: 11.95, errors: 5, source: 'CPBL 2025' },
  { name: '王博玄', team: '台鋼雄鷹', position: 'OF', role: 'B', avg: 0.284, obp: 0.348, slg: 0.351, ops: 0.699, opsPlus: 107, hr: 3, sb: 21, kRate: 14.52, bbRate: 8.38, errors: 11, source: 'CPBL 2025' },
  { name: '郭天信', team: '味全龍', position: 'OF', role: 'B', avg: 0.280, obp: 0.334, slg: 0.351, ops: 0.685, opsPlus: 102, hr: 4, sb: 17, kRate: 8.87, bbRate: 6.19, errors: 6, source: 'CPBL 2025' },
  { name: '林佳緯', team: '統一7-ELEVEn獅', position: 'OF', role: 'B', avg: 0.275, obp: 0.322, slg: 0.408, ops: 0.730, opsPlus: 114, hr: 6, sb: 11, kRate: 15.46, bbRate: 5.62, errors: 5, source: 'CPBL 2025' },
  { name: '吉力吉撈．鞏冠', team: '味全龍', position: 'C', role: 'B', avg: 0.274, obp: 0.337, slg: 0.525, ops: 0.862, opsPlus: 152, hr: 24, sb: 4, kRate: 17.64, bbRate: 6.41, errors: 15, source: 'CPBL 2025' },
  { name: '曾子祐', team: '台鋼雄鷹', position: 'IF', role: 'B', avg: 0.273, obp: 0.319, slg: 0.323, ops: 0.642, opsPlus: 90, hr: 0, sb: 6, kRate: 6.72, bbRate: 6.52, errors: 7, source: 'CPBL 2025' },
  { name: '江坤宇', team: '中信兄弟', position: 'IF', role: 'B', avg: 0.272, obp: 0.357, slg: 0.317, ops: 0.674, opsPlus: 100, hr: 1, sb: 7, kRate: 11.21, bbRate: 7.03, errors: 7, source: 'CPBL 2025' },
  { name: '范國宸', team: '富邦悍將', position: 'IF', role: 'B', avg: 0.275, obp: 0.334, slg: 0.453, ops: 0.787, opsPlus: 125, hr: 13, sb: 1, kRate: 19.84, bbRate: 8.70, errors: 2, source: 'CPBL 2025' },
  { name: '張育成', team: '富邦悍將', position: 'IF', role: 'B', avg: 0.356, obp: 0.435, slg: 0.603, ops: 1.038, opsPlus: 221, hr: 4, sb: 3, kRate: 14.12, bbRate: 11.76, errors: 3, source: 'CPBL 2026 current' }
];

const CPBL_PITCHER_STATS_2025 = [
  { name: '羅戈', team: '中信兄弟', position: 'SP', role: 'P', era: 1.84, whip: 1.04, fip: 2.159, k9: 8.17, kRate: 22.83, bbRate: 5.63, ip: 156, starts: 25, source: 'CPBL 2025' },
  { name: '後勁', team: '台鋼雄鷹', position: 'SP', role: 'P', era: 1.89, whip: 1.14, fip: 2.840, k9: 6.44, kRate: 17.93, bbRate: 6.25, ip: 152, starts: 25, source: 'CPBL 2025' },
  { name: '菲力士', team: '統一7-ELEVEn獅', position: 'SP', role: 'P', era: 1.91, whip: 1.06, fip: 2.809, k9: 6.71, kRate: 18.85, bbRate: 6.75, ip: 127, starts: 21, source: 'CPBL 2025' },
  { name: '威能帝', team: '樂天桃猿', position: 'SP', role: 'P', era: 2.01, whip: 0.91, fip: 2.080, k9: 8.89, kRate: 25.34, bbRate: 4.83, ip: 170, starts: 26, source: 'CPBL 2025' },
  { name: '艾速特', team: '台鋼雄鷹', position: 'SP', role: 'P', era: 2.23, whip: 1.09, fip: 2.856, k9: 7.90, kRate: 21.99, bbRate: 5.32, ip: 141, starts: 25, source: 'CPBL 2025' },
  { name: '魔神龍', team: '樂天桃猿', position: 'SP', role: 'P', era: 2.51, whip: 1.08, fip: 2.934, k9: 5.58, kRate: 15.41, bbRate: 4.87, ip: 158, starts: 25, source: 'CPBL 2025' },
  { name: '鋼龍', team: '味全龍', position: 'SP', role: 'P', era: 2.77, whip: 1.18, fip: 2.874, k9: 7.40, kRate: 19.93, bbRate: 6.64, ip: 146, starts: 24, source: 'CPBL 2025' },
  { name: '魔力藍', team: '富邦悍將', position: 'SP', role: 'P', era: 2.98, whip: 1.25, fip: 3.019, k9: 7.19, kRate: 19.04, bbRate: 7.55, ip: 139, starts: 23, source: 'CPBL 2025' },
  { name: '布雷克', team: '統一7-ELEVEn獅', position: 'SP', role: 'P', era: 4.13, whip: 1.31, fip: 3.030, k9: 6.57, kRate: 17.18, bbRate: 4.63, ip: 122, starts: 21, source: 'CPBL 2025' },
  { name: '林詩翔', team: '台鋼雄鷹', position: 'RP', role: 'P', era: 1.92, whip: 1.10, fip: 3.243, k9: 7.67, kRate: 21.05, bbRate: 8.33, ip: 56, starts: 0, source: 'CPBL 2025' }
];

const INTERNATIONAL_STAR_CANDIDATES = [
  { name: '亞倫・賈吉', englishName: 'Aaron Judge', nickname: '法官', role: 'B', position: 'OF', team: 'MLB', abilities: { contact: 84, power: 99, speed: 64, fielding: 83, arm: 94, discipline: 92, clutch: 90 }, physical: { velocity: 94, power: 99, control: 84, speed: 64 }, traits: [i18n.powerHitter, i18n.disciplined] },
  { name: '大谷翔平', englishName: 'Shohei Ohtani', nickname: '二刀流神獸', role: 'T', position: 'SP/DH', team: 'MLB', abilities: { contact: 86, power: 99, speed: 88, fielding: 72, arm: 98, discipline: 84, clutch: 93, velocity: 99, control: 83, breaking: 94, stamina: 89 }, physical: { velocity: 99, power: 99, control: 86, speed: 88 }, traits: [i18n.legendaryHitter, i18n.elitePitcher] },
  { name: '穆奇・貝茲', englishName: 'Mookie Betts', nickname: '全能保齡球王', role: 'B', position: 'OF/IF', team: 'MLB', abilities: { contact: 88, power: 83, speed: 84, fielding: 95, arm: 87, discipline: 90, clutch: 87 }, physical: { velocity: 87, power: 83, control: 88, speed: 84 }, traits: [i18n.disciplined] },
  { name: '胡安・索托', englishName: 'Juan Soto', nickname: '保送魔王', role: 'B', position: 'OF', team: 'MLB', abilities: { contact: 90, power: 94, speed: 58, fielding: 68, arm: 76, discipline: 99, clutch: 91 }, physical: { velocity: 76, power: 94, control: 90, speed: 58 }, traits: [i18n.powerHitter, i18n.disciplined] },
  { name: '小葛雷諾', englishName: 'Vladimir Guerrero Jr.', nickname: '暴力甜甜圈', role: 'B', position: '1B', team: 'MLB', abilities: { contact: 87, power: 93, speed: 52, fielding: 72, arm: 78, discipline: 80, clutch: 84 }, physical: { velocity: 78, power: 93, control: 87, speed: 52 }, traits: [i18n.powerHitter] },
  { name: '達比修有', englishName: 'Yu Darvish', nickname: '混球博士', role: 'P', position: 'SP', team: 'MLB', abilities: { velocity: 88, control: 87, breaking: 96, stamina: 80, fielding: 77, discipline: 74 }, physical: { velocity: 88, power: 50, control: 87, speed: 60 }, traits: [i18n.elitePitcher] },
  { name: '山本由伸', englishName: 'Yoshinobu Yamamoto', nickname: '山本總舵主', role: 'P', position: 'SP', team: 'MLB', abilities: { velocity: 92, control: 93, breaking: 95, stamina: 88, fielding: 80, discipline: 76 }, physical: { velocity: 92, power: 48, control: 93, speed: 63 }, traits: [i18n.elitePitcher] },
  { name: '佐佐木朗希', englishName: 'Roki Sasaki', nickname: '令和怪物', role: 'P', position: 'SP', team: 'MLB', abilities: { velocity: 99, control: 78, breaking: 92, stamina: 76, fielding: 74, discipline: 70 }, physical: { velocity: 99, power: 45, control: 78, speed: 66 }, traits: [i18n.elitePitcher] },
  { name: '吉田正尚', englishName: 'Masataka Yoshida', nickname: '肌肉吉田', role: 'B', position: 'OF/DH', team: 'MLB', abilities: { contact: 88, power: 78, speed: 58, fielding: 65, arm: 70, discipline: 87, clutch: 85 }, physical: { velocity: 70, power: 78, control: 88, speed: 58 }, traits: [i18n.clutchHitter] }
];

const TRAIT_DESCRIPTIONS = {
  [i18n.legendaryHitter]: '傳奇級打者，關鍵打席更容易打出長打。',
  [i18n.elitePitcher]: '投球能力提升，球速與變化球在打席中加成。',
  [i18n.rareSlugger]: '稀有重砲型球員，長打潛力高。',
  [i18n.clutchHitter]: '關鍵時刻打者，落後或壘上有人時較穩。',
  [i18n.powerHitter]: '力量打者，長打與全壘打機率提升。',
  [i18n.buntSpecialist]: '小球與跑壘型球員，推進與速度價值較高。',
  [i18n.disciplined]: '選球眼佳，較不容易追打壞球，保送率提高。',
  '盜壘好手': '跑壘判斷與速度佳，適合激進跑壘與未來盜壘系統。',
  '大心臟': '得點圈有人時巧打與長打提升。',
  '恐左': '面對左投時巧打與長打下降。',
  '滾地球投手': '壓低對手長打，較容易製造滾地出局。',
  '王牌': '危機處理與球威上升，後段局數更穩。',
  '怪力': '長打與全壘打機率大幅提升。',
  '守備職人': '守備範圍與失誤抑制能力提升。',
  '對左強': '面對左投或左打時表現提升。',
  '選球眼': '選球與壞球判斷提升，較容易取得保送。',
  '低球打': '面對變化球或低角度球路時較容易形成強勁擊球。',
  '玻璃體質': '傷病風險提高，連續出賽需要更謹慎。',
  '控球不穩': '投球容易壞球，保送風險提高。',
  '慢熱': '比賽前段能力較低，後段逐漸回穩。'
};

const TRAIT_TIERS = {
  [i18n.legendaryHitter]: 'gold',
  [i18n.elitePitcher]: 'gold',
  '大心臟': 'gold',
  '王牌': 'gold',
  '怪力': 'gold',
  '守備職人': 'gold',
  [i18n.powerHitter]: 'blue',
  [i18n.disciplined]: 'blue',
  [i18n.buntSpecialist]: 'blue',
  '盜壘好手': 'blue',
  '對左強': 'blue',
  '選球眼': 'blue',
  '低球打': 'blue',
  '恐左': 'red',
  '玻璃體質': 'red',
  '控球不穩': 'red',
  '慢熱': 'red'
};

const CONDITION_EFFECTS = {
  excellent: { label: '絕好調', modifier: 5, injury: -0.01 },
  good: { label: '好調', modifier: 2, injury: -0.005 },
  normal: { label: '普通', modifier: 0, injury: 0 },
  poor: { label: '不調', modifier: -3, injury: 0.01 },
  awful: { label: '絕不調', modifier: -6, injury: 0.025 }
};

const PITCH_TYPE_LIBRARY = [
  '四縫線', '二縫線', '滑球', '曲球', '指叉', '變速球', '卡特球', '伸卡球'
];

const POSITION_LABELS = {
  C: '捕手',
  '1B': '一壘手',
  '2B': '二壘手',
  '3B': '三壘手',
  SS: '游擊手',
  LF: '左外野手',
  CF: '中外野手',
  RF: '右外野手',
  DH: '指定打擊',
  IF: '內野手',
  OF: '外野手',
  UTIL: '工具人'
};

const POSITION_GROUPS = {
  C: 'catcher',
  '1B': 'first',
  '2B': 'middleInfield',
  SS: 'middleInfield',
  '3B': 'hotCorner',
  LF: 'cornerOutfield',
  RF: 'cornerOutfield',
  CF: 'centerField',
  IF: 'infield',
  OF: 'outfield',
  DH: 'dh'
};

function getTraitDescription(trait) {
  return TRAIT_DESCRIPTIONS[trait] || '特殊能力，會在特定比賽情境影響表現。';
}

function getTraitTier(trait) {
  return TRAIT_TIERS[trait] || 'blue';
}

function getConditionLabel(condition) {
  return CONDITION_EFFECTS[condition]?.label || CONDITION_EFFECTS.normal.label;
}

function hashString(text) {
  return Array.from(String(text || '')).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function createPixelPortrait(player, size = 64) {
  const hash = Math.abs(hashString(`${player.name}${player.team}`));
  const teamHue = hash % 360;
  const skin = `hsl(${28 + (hash % 18)}, 62%, 70%)`;
  const jersey = `hsl(${teamHue}, 64%, 42%)`;
  const cap = `hsl(${(teamHue + 28) % 360}, 70%, 34%)`;
  const bg = `hsl(${(teamHue + 180) % 360}, 30%, 16%)`;
  const cells = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let fill = bg;
      if (y === 1 && x >= 2 && x <= 5) fill = cap;
      if (y >= 2 && y <= 4 && x >= 2 && x <= 5) fill = skin;
      if (y >= 5 && x >= 1 && x <= 6) fill = jersey;
      if ((x === 2 || x === 5) && y === 3) fill = '#111827';
      if (y === 4 && x >= 3 && x <= 4) fill = '#7f1d1d';
      cells.push(`<rect x="${x * 8}" y="${y * 8}" width="8" height="8" fill="${fill}"/>`);
    }
  }
  return `<svg class="pixel-portrait" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="${player.name} 像素頭像">${cells.join('')}</svg>`;
}

// StatMapper Class - Converts real stats to game attributes
class StatMapper {
  constructor() {
    this.cpblBatters = CPBL_BATTER_STATS_2025;
    this.cpblPitchers = CPBL_PITCHER_STATS_2025;
    this.cpblTeams = this.buildCpblTeams();
  }

  buildCpblTeams() {
    const teams = {};
    [...this.cpblBatters, ...this.cpblPitchers].forEach(player => {
      if (!teams[player.team]) teams[player.team] = { players: [] };
      teams[player.team].players.push(player);
    });
    return teams;
  }

  scale(value, min, max, inverse = false) {
    const numeric = Number.isFinite(Number(value)) ? Number(value) : min;
    const ratio = Math.max(0, Math.min(1, (numeric - min) / (max - min)));
    return inverse ? 99 - ratio * 49 : 50 + ratio * 49;
  }

  getBatterAbilities(stats) {
    const contact = this.scale(stats.avg, 0.230, 0.330) * 0.75 + this.scale(stats.opsPlus || 100, 80, 190) * 0.25;
    const power = this.scale(stats.slg, 0.300, 0.600) * 0.55 + this.scale(stats.hr, 0, 25) * 0.45;
    const speed = this.scale(stats.sb, 0, 30) * 0.8 + this.positionSpeedBase(stats.position) * 0.2;
    const fielding = this.positionDefenseBase(stats.position) - Math.min(16, (stats.errors || 0) * 1.2);
    const arm = this.positionArmBase(stats.position);
    const discipline = this.scale(stats.bbRate || 7, 3, 12) * 0.55 + this.scale(stats.kRate || 16, 6, 25, true) * 0.45;
    const clutch = this.scale(stats.opsPlus || 100, 80, 190) * 0.7 + this.scale(stats.ops || 0.7, 0.600, 1.000) * 0.3;
    return {
      contact: clampInt(contact),
      power: clampInt(power),
      speed: clampInt(speed),
      fielding: clampInt(fielding),
      arm: clampInt(arm),
      discipline: clampInt(discipline),
      clutch: clampInt(clutch),
      vsLeft: clampInt(contact * 0.55 + discipline * 0.25 + (stats.bats === 'R' ? 12 : stats.bats === 'L' ? -4 : 4)),
      vsRight: clampInt(contact * 0.58 + power * 0.18 + (stats.bats === 'L' ? 10 : stats.bats === 'R' ? 3 : 5)),
      scoringPosition: clampInt(clutch),
      pinchHitter: clampInt(power * 0.4 + discipline * 0.35 + contact * 0.25)
    };
  }

  getPitcherAbilities(stats) {
    const velocity = this.scale(stats.kRate || 18, 12, 26) * 0.55 + this.scale(stats.k9 || 6, 4, 9) * 0.45;
    const control = this.scale(stats.bbRate || 7, 4, 10, true) * 0.45 + this.scale(stats.whip || 1.2, 0.90, 1.45, true) * 0.55;
    const breaking = this.scale(stats.fip || 3.2, 2.0, 4.2, true) * 0.55 + this.scale(stats.era || 3.2, 1.6, 4.4, true) * 0.45;
    const stamina = stats.position === 'RP' ? this.scale(stats.ip || 50, 35, 70) : this.scale(stats.ip || 120, 110, 170);
    const fielding = 72 + Math.max(0, Math.min(10, (stats.starts || 0) / 3));
    return {
      velocity: clampInt(velocity),
      control: clampInt(control),
      breaking: clampInt(breaking),
      stamina: clampInt(stamina),
      fielding: clampInt(fielding),
      discipline: clampInt(control * 0.7 + breaking * 0.3),
      stuff: clampInt(velocity * 0.48 + breaking * 0.36 + control * 0.16),
      vsLeft: clampInt(breaking * 0.45 + control * 0.35 + (stats.throws === 'L' ? 12 : 2)),
      crisis: clampInt(control * 0.4 + breaking * 0.35 + this.scale(stats.whip || 1.2, 0.90, 1.45, true) * 0.25),
      pickoff: clampInt(control * 0.45 + fielding * 0.35 + (stats.starts || 0) * 0.4),
      quickDelivery: clampInt(control * 0.35 + velocity * 0.25 + fielding * 0.4),
      recovery: clampInt((stats.position === 'RP' ? 78 : 62) + this.scale(stats.ip || 80, 40, 170) * 0.18)
    };
  }

  positionSpeedBase(position = '') {
    if (position.includes('OF')) return 82;
    if (position.includes('IF')) return 76;
    if (position.includes('C')) return 58;
    if (position.includes('1B')) return 54;
    return 68;
  }

  positionDefenseBase(position = '') {
    if (position.includes('C')) return 82;
    if (position.includes('IF')) return 80;
    if (position.includes('OF')) return 78;
    if (position.includes('1B')) return 72;
    return 70;
  }

  positionArmBase(position = '') {
    if (position.includes('C')) return 90;
    if (position.includes('OF')) return 84;
    if (position.includes('IF')) return 78;
    if (position.includes('1B')) return 70;
    return 72;
  }

  createPlayerFromStats(stats, options = {}) {
    const isPitcher = stats.role === 'P';
    const abilities = isPitcher ? this.getPitcherAbilities(stats) : this.getBatterAbilities(stats);
    const physical = isPitcher ? {
      velocity: abilities.velocity,
      power: 45,
      control: abilities.control,
      speed: abilities.fielding
    } : {
      velocity: abilities.arm,
      power: abilities.power,
      control: abilities.contact,
      speed: abilities.speed
    };
    const traits = this.inferTraits(stats, abilities);
    return new Player(
      stats.name,
      physical.velocity,
      physical.power,
      physical.control,
      physical.speed,
      options.stamina || (isPitcher ? Math.max(85, abilities.stamina + 15) : 95),
      options.mana || 90,
      0,
      traits,
      options.growthPotential ?? 15,
      options.injuryProbability ?? (isPitcher ? 0.04 : 0.025),
      options.ageDecline ?? 0.01,
      {
        role: stats.role,
        position: stats.position,
        team: stats.team,
        abilities,
        bats: stats.bats,
        throws: stats.throws,
        sourceStats: stats,
        nickname: stats.nickname,
        englishName: stats.englishName
      }
    );
  }

  createInternationalPlayer(candidate) {
    return new Player(
      `${candidate.name}「${candidate.nickname}」`,
      candidate.physical.velocity,
      candidate.physical.power,
      candidate.physical.control,
      candidate.physical.speed,
      candidate.abilities.stamina || 105,
      110,
      0,
      candidate.traits || [],
      0,
      0.12,
      0.06,
      {
        role: candidate.role,
        position: candidate.position,
        team: candidate.team,
        abilities: candidate.abilities,
        bats: candidate.bats,
        throws: candidate.throws,
        nickname: candidate.nickname,
        englishName: candidate.englishName,
        sourceStats: { source: 'International star preset', name: candidate.englishName }
      }
    );
  }

  inferTraits(stats, abilities) {
    const traits = [];
    if (stats.role === 'P') {
      if (abilities.velocity >= 82 || abilities.control >= 82) traits.push(i18n.elitePitcher);
      if (abilities.stuff >= 86 && abilities.crisis >= 82) traits.push('王牌');
      if ((stats.fip || 9) <= 2.9) traits.push('滾地球投手');
      if (abilities.control <= 58 || (stats.bbRate || 0) >= 8.5) traits.push('控球不穩');
    } else {
      if (abilities.power >= 82) traits.push(i18n.powerHitter);
      if (abilities.power >= 90) traits.push('怪力');
      if (abilities.speed >= 82) traits.push(i18n.buntSpecialist);
      if (abilities.discipline >= 82) traits.push(i18n.disciplined);
      if (abilities.discipline >= 86) traits.push('選球眼');
      if (abilities.fielding >= 88) traits.push('守備職人');
      if (abilities.vsLeft >= 82) traits.push('對左強');
      if (abilities.speed >= 84 || (stats.sb || 0) >= 18) traits.push('盜壘好手');
      if (abilities.clutch >= 84) traits.push('大心臟');
      if ((stats.kRate || 0) >= 21 && (stats.bbRate || 0) < 8) traits.push('恐左');
      if (abilities.power >= 78 && abilities.contact >= 76) traits.push('低球打');
    }
    return traits;
  }

  // Convert AVG to power (0-99)
  avgToPower(avg) {
    if (!avg) return 70; // default
    return clampInt((avg - 0.200) * 500, 50, 99); // 0.200 -> 50, 0.300 -> 100, capped at 99
  }

  // Convert ERA to control (lower ERA = higher control)
  eraToControl(era) {
    if (!era) return 70;
    return clampInt(100 - (era - 2.00) * 20, 50, 99); // 2.00 -> 100, 4.00 -> 60
  }

  // Convert WHIP to velocity (lower WHIP = higher velocity)
  whipToVelocity(whip) {
    if (!whip) return 70;
    return clampInt(100 - (whip - 1.00) * 50, 50, 99); // 1.00 -> 100, 1.50 -> 50
  }

  // For batters, speed based on position or random
  getSpeedForPosition(position) {
    if (position === 'OF') return Math.round(80 + Math.random() * 15);
    if (position === 'IF') return Math.round(70 + Math.random() * 15);
    return Math.round(75 + Math.random() * 10);
  }

  // Get rank based on average attribute
  getRank(avgAttr) {
    if (avgAttr >= 95) return 'SS';
    if (avgAttr >= 90) return 'S';
    if (avgAttr >= 80) return 'A';
    if (avgAttr >= 70) return 'B';
    return 'C';
  }

  // Get rank color
  getRankColor(rank) {
    switch (rank) {
      case 'SS': return 'gold'; // or rainbow
      case 'S': return 'gold';
      case 'A': return 'silver';
      case 'B': return 'bronze';
      default: return 'gray';
    }
  }
}

// Player Class
class Player {
  constructor(name, velocity, power, control, speed, stamina, mana, fatigue, traits = [], growthPotential = 0, injuryProbability = 0, ageDecline = 0, meta = {}) {
    this.name = name;
    this.physical = {
      velocity: clampInt(velocity),
      power: clampInt(power),
      control: clampInt(control),
      speed: clampInt(speed)
    };
    this.state = {
      stamina: clampInt(stamina, 0, 120),
      mana: clampInt(mana, 0, 120),
      fatigue: clampInt(fatigue, 0, 100)
    };
    this.maxStamina = clampInt(stamina, 1, 120);
    this.maxMana = clampInt(mana, 1, 120);
    this.traits = traits;
    this.growthPotential = clampInt(growthPotential, 0, 100); // 0-100, how much they can grow
    this.injuryProbability = injuryProbability; // 0-1, chance of injury per match
    this.ageDecline = ageDecline; // 0-1, how much attributes decline per season
    this.xp = 0; // experience points
    this.burnLifeActive = false;
    this.protectionDuration = 0; // Protection buff countdown
    this.role = meta.role || (meta.position === 'P' || meta.position === 'SP' || meta.position === 'RP' ? 'P' : 'B');
    this.position = meta.position || (this.role === 'P' ? 'P' : 'UTIL');
    this.team = meta.team || '第七隊';
    this.nickname = meta.nickname || '';
    this.englishName = meta.englishName || '';
    this.level = meta.level || 'major';
    this.bats = meta.bats || (this.role === 'P' ? 'R' : (Math.random() < 0.34 ? 'L' : 'R'));
    this.throws = meta.throws || (this.role === 'P' || this.role === 'T' ? (Math.random() < 0.28 ? 'L' : 'R') : 'R');
    this.sourceStats = meta.sourceStats || {};
    this.abilities = this.normalizeAbilities(meta.abilities);
    this.condition = meta.condition || 'normal';
    this.pitchTypes = Array.isArray(meta.pitchTypes) ? meta.pitchTypes : this.generatePitchTypes();
  }

  normalizeAbilities(abilities = {}) {
    const defaults = this.role === 'P' ? {
      velocity: this.physical.velocity,
      control: this.physical.control,
      breaking: this.physical.control,
      stamina: this.maxStamina,
      fielding: this.physical.speed,
      discipline: this.physical.control,
      stuff: Math.round((this.physical.velocity + this.physical.control) / 2),
      vsLeft: this.physical.control,
      crisis: this.physical.control,
      pickoff: this.physical.control,
      quickDelivery: this.physical.speed,
      recovery: 70
    } : {
      contact: this.physical.control,
      power: this.physical.power,
      speed: this.physical.speed,
      fielding: Math.round((this.physical.speed + this.physical.velocity) / 2),
      arm: this.physical.velocity,
      discipline: this.physical.control,
      clutch: this.physical.power,
      vsLeft: this.physical.control,
      vsRight: this.physical.control,
      scoringPosition: this.physical.power,
      pinchHitter: Math.round((this.physical.control + this.physical.power) / 2)
    };
    return Object.fromEntries(
      Object.entries({ ...defaults, ...abilities }).map(([key, value]) => [key, clampInt(value)])
    );
  }

  generatePitchTypes() {
    if (!this.canPitch()) return [];
    const velocity = this.abilities.velocity || this.physical.velocity;
    const control = this.abilities.control || this.physical.control;
    const breaking = this.abilities.breaking || control;
    const stuff = this.abilities.stuff || Math.round((velocity + breaking) / 2);
    const arsenal = [
      { name: '四縫線', speed: velocity, movement: 45, control: control, stuff: stuff, slugRisk: 64 }
    ];
    if (control >= 70) arsenal.push({ name: '二縫線', speed: velocity - 3, movement: 62, control: control + 2, stuff: stuff - 1, slugRisk: 54 });
    if (breaking >= 70) arsenal.push({ name: '滑球', speed: velocity - 8, movement: breaking, control: control - 3, stuff: stuff + 2, slugRisk: 48 });
    if (breaking >= 76) arsenal.push({ name: '曲球', speed: velocity - 14, movement: breaking + 4, control: control - 5, stuff: stuff + 1, slugRisk: 44 });
    if (stuff >= 82) arsenal.push({ name: '指叉', speed: velocity - 10, movement: breaking + 6, control: control - 8, stuff: stuff + 5, slugRisk: 38 });
    if (control >= 78) arsenal.push({ name: '變速球', speed: velocity - 16, movement: breaking - 2, control: control + 3, stuff: stuff - 2, slugRisk: 46 });
    if (velocity >= 86) arsenal.push({ name: '卡特球', speed: velocity - 5, movement: breaking - 1, control: control - 1, stuff: stuff + 1, slugRisk: 52 });
    if (control >= 82 && breaking >= 74) arsenal.push({ name: '伸卡球', speed: velocity - 6, movement: breaking + 1, control: control + 1, stuff: stuff, slugRisk: 42 });
    return arsenal.slice(0, 5).map(pitch => ({
      name: pitch.name,
      speed: clampInt(pitch.speed),
      movement: clampInt(pitch.movement),
      control: clampInt(pitch.control),
      stuff: clampInt(pitch.stuff),
      slugRisk: clampInt(pitch.slugRisk)
    }));
  }

  canPitch() {
    return this.role === 'P' || this.role === 'T';
  }

  canBat() {
    return this.role === 'B' || this.role === 'T';
  }

  getPrimaryPositions() {
    if (this.role === 'P') return ['P'];
    return String(this.position || 'UTIL')
      .split('/')
      .map(pos => pos.trim())
      .filter(Boolean);
  }

  getPositionLabel(position = this.position) {
    return String(position || 'UTIL')
      .split('/')
      .map(pos => POSITION_LABELS[pos] || pos)
      .join('/');
  }

  getPositionGroup(position) {
    return POSITION_GROUPS[position] || 'utility';
  }

  getPositionPenalty(assignedPosition) {
    if (!assignedPosition || assignedPosition === 'DH') return 0;
    if (assignedPosition === 'P') return this.canPitch() ? 0 : 30;
    const positions = this.getPrimaryPositions();
    if (positions.includes(assignedPosition)) return 0;
    const assignedGroup = this.getPositionGroup(assignedPosition);
    const groups = positions.map(pos => this.getPositionGroup(pos));
    if (assignedGroup === 'cornerOutfield' && (groups.includes('cornerOutfield') || positions.includes('OF'))) return 3;
    if (assignedGroup === 'centerField' && positions.includes('OF')) return 6;
    if (assignedGroup === 'middleInfield' && (groups.includes('middleInfield') || positions.includes('IF'))) return 4;
    if (assignedGroup === 'hotCorner' && (groups.includes('middleInfield') || positions.includes('IF'))) return 5;
    if (assignedGroup === 'first' && (positions.includes('IF') || groups.includes('hotCorner') || groups.includes('catcher'))) return 6;
    if (assignedGroup === 'catcher' && !groups.includes('catcher')) return 22;
    if (assignedGroup === 'cornerOutfield' && groups.includes('first')) return 10;
    return 16;
  }

  getRoleLabel() {
    if (this.role === 'P') return '投手';
    if (this.role === 'T') return '二刀流';
    return '野手';
  }

  toggleBurnLife() {
    this.burnLifeActive = !this.burnLifeActive;
  }

  restore() {
    this.state.stamina = this.maxStamina;
    this.state.mana = this.maxMana;
    this.state.fatigue = 0;
  }

  getEffectiveVelocity() {
    let vel = this.physical.velocity;
    if (this.burnLifeActive) vel *= 1.15;
    vel *= this.getPitchStaminaMultiplier();
    return clampInt(vel);
  }

  getEffectivePower() {
    let pow = this.physical.power;
    if (this.burnLifeActive) pow *= 1.15;
    if (this.state.stamina < 30) {
      let decay = Math.exp((this.state.stamina - 30) / 10);
      pow *= Math.max(0.1, decay);
    }
    return clampInt(pow);
  }

  getEffectiveControl() {
    let ctrl = this.physical.control;
    ctrl *= this.getPitchStaminaMultiplier();
    return clampInt(ctrl);
  }

  getPitchStaminaMultiplier() {
    const pct = this.maxStamina ? (this.state.stamina / this.maxStamina) * 100 : 0;
    if (pct <= 0) return 0.35;
    if (pct <= 10) return 0.55;
    if (pct <= 30) return 0.75;
    if (pct <= 50) return 0.9;
    return 1;
  }

  getConditionModifier() {
    return CONDITION_EFFECTS[this.condition]?.modifier || 0;
  }

  rollCondition() {
    const roll = Math.random();
    if (roll < 0.10) this.condition = 'excellent';
    else if (roll < 0.28) this.condition = 'good';
    else if (roll < 0.72) this.condition = 'normal';
    else if (roll < 0.90) this.condition = 'poor';
    else this.condition = 'awful';
    return this.condition;
  }

  consumeStamina(amount) {
    let multiplier = this.burnLifeActive ? 3 : 1;
    this.state.stamina -= amount * multiplier;
    this.state.stamina = clampInt(this.state.stamina, 0, this.maxStamina);
  }

  getAverageAttribute() {
    return (this.physical.velocity + this.physical.power + this.physical.control + this.physical.speed) / 4;
  }

  getRank() {
    return game.statMapper.getRank(this.getAverageAttribute());
  }

  getRankColor() {
    return game.statMapper.getRankColor(this.getRank());
  }

  gainXP(amount) {
    this.xp += amount;
    if (this.growthPotential > 0) {
      // Grow attributes based on XP and potential
      const growth = Math.min(amount / 100, this.growthPotential / 100);
      this.physical.velocity = clampInt(this.physical.velocity + growth * 5);
      this.physical.power = clampInt(this.physical.power + growth * 5);
      this.physical.control = clampInt(this.physical.control + growth * 5);
      this.physical.speed = clampInt(this.physical.speed + growth * 5);
      this.abilities = this.normalizeAbilities(this.abilities);
      this.growthPotential = clampInt(this.growthPotential - growth * 10, 0, 100); // reduce potential as they grow
    }
  }

  applyAgeDecline() {
    this.physical.velocity = clampInt(this.physical.velocity * (1 - this.ageDecline));
    this.physical.power = clampInt(this.physical.power * (1 - this.ageDecline));
    this.physical.control = clampInt(this.physical.control * (1 - this.ageDecline));
    this.physical.speed = clampInt(this.physical.speed * (1 - this.ageDecline));
    this.abilities = this.normalizeAbilities(this.abilities);
  }

  checkInjury(medicalCenter = null, playerIndex = null) {
    let effectiveProb = this.injuryProbability;
    effectiveProb += CONDITION_EFFECTS[this.condition]?.injury || 0;
    if (medicalCenter && playerIndex !== null) {
      effectiveProb = medicalCenter.getInjuryProbability(playerIndex);
      effectiveProb += CONDITION_EFFECTS[this.condition]?.injury || 0;
    }
    effectiveProb = Math.max(0, effectiveProb);
    if (Math.random() < effectiveProb) {
      // Injury: reduce stamina temporarily
      this.maxStamina = clampInt(this.maxStamina * 0.8, 1, 120);
      this.state.stamina = Math.min(this.state.stamina, this.maxStamina);
      return true;
    }
    return false;
  }
}

// Card Class
class Card {
  constructor(name, description, cost, effect) {
    this.name = name;
    this.description = description;
    this.cost = cost;
    this.effect = effect; // function(game)
  }
}

// CardManager Class
class CardManager {
  constructor() {
    this.hand = [
      new Card(i18n.shadowClone, "Creates a clone of Shortstop, +50% success on ground/fly outs for one at-bat.", 20, (game) => {
        this.activeEffects.shadowClone = true;
        game.addToLog(i18n.magicDeployed);
      })
    ];
    this.activeEffects = {};
  }

  activateCard(cardIndex) {
    const card = this.hand[cardIndex];
    if (game.pitcher.state.mana >= card.cost) {
      game.pitcher.state.mana -= card.cost;
      card.effect(game);
      game.updateUI();
    } else {
      game.addToLog(i18n.notEnoughMana);
    }
  }

  expireEffects() {
    this.activeEffects = {};
  }
}

// GachaSystem Class
class GachaSystem {
  constructor() {
    this.statMapper = new StatMapper();
    this.localCandidates = [
      ...this.statMapper.cpblBatters,
      ...this.statMapper.cpblPitchers.filter(p => p.position === 'RP' || p.era <= 2.80)
    ].map(player => ({
      ...player,
      protected: (player.opsPlus || 0) >= 165 || (player.era && player.era <= 2.05)
    }));
    this.internationalCandidates = INTERNATIONAL_STAR_CANDIDATES;
  }

  drawPlayer(pool = 'local') {
    if (pool === 'international') {
      const candidate = this.internationalCandidates[Math.floor(Math.random() * this.internationalCandidates.length)];
      return this.statMapper.createInternationalPlayer(candidate);
    }
    const available = this.localCandidates.filter(player => !player.protected);
    const candidate = available[Math.floor(Math.random() * available.length)];
    return this.statMapper.createPlayerFromStats(candidate, {
      growthPotential: candidate.role === 'P' ? 25 : 35,
      injuryProbability: candidate.role === 'P' ? 0.045 : 0.03,
      ageDecline: 0.012
    });
  }

  getPoolPreview(pool = 'local') {
    const candidates = pool === 'international' ? this.internationalCandidates : this.localCandidates;
    return candidates.map(p => ({
      name: p.nickname ? `${p.name}「${p.nickname}」` : p.name,
      role: p.role,
      position: p.position,
      protected: Boolean(p.protected),
      info: p.role === 'P'
        ? `ERA ${p.era ?? '??'} / WHIP ${p.whip ?? '??'}`
        : `OPS ${p.ops ?? '??'} / HR ${p.hr ?? '??'}`
    }));
  }
}

// Opponent Team Class
class OpponentTeam {
  constructor() {
    const archetypes = ['力量型', '速度型', '控球型'];
    this.archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
    this.pitcher = this.generatePitcher();
    this.battingOrder = this.generateLineup();
    this.nextBatterIndex = 0;
  }

  generatePitcher() {
    let base = { velocity: 85, power: 75, control: 82, speed: 70, stamina: 100, mana: 80 };
    if (this.archetype === '力量型') {
      base.velocity = 88;
      base.control = 80;
    } else if (this.archetype === '速度型') {
      base.velocity = 86;
      base.control = 80;
      base.speed = 88;
    } else if (this.archetype === '控球型') {
      base.velocity = 84;
      base.control = 90;
    }
    return new Player(`對手投手 (${this.archetype})`, base.velocity, base.power, base.control, base.speed, base.stamina, base.mana, 0, [this.archetype]);
  }

  generateLineup() {
    return Array.from({ length: 9 }, (_, i) => this.generateBatter(i));
  }

  generateBatter(index) {
    let surnames = ['陳', '林', '李', '黃'];
    let givenNames = ['強', '飛', '球', '壘'];
    let surname = surnames[Math.floor(Math.random() * surnames.length)];
    let givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
    let name = `${surname}${givenName}`;
    let velocity = clampInt(75 + Math.random() * 15);
    let power = clampInt(75 + Math.random() * 15);
    let control = clampInt(75 + Math.random() * 15);
    let speed = clampInt(75 + Math.random() * 15);
    let traits = [];

    if (this.archetype === '力量型') {
      power += 10;
      velocity += 5;
      traits.push(i18n.powerHitter);
    } else if (this.archetype === '速度型') {
      speed += 10;
      control += 5;
      traits.push(i18n.buntSpecialist);
    } else if (this.archetype === '控球型') {
      control += 10;
      traits.push(i18n.disciplined);
    }

    return new Player(name, velocity, power, control, speed, clampInt(90 + Math.random() * 10), clampInt(80 + Math.random() * 20), 0, traits);
  }

  getCurrentBatter() {
    return this.battingOrder[this.nextBatterIndex];
  }

  advanceBatter() {
    this.nextBatterIndex = (this.nextBatterIndex + 1) % this.battingOrder.length;
  }

  getUpcomingBatters() {
    return [1, 2, 3].map(offset => {
      const idx = (this.nextBatterIndex + offset) % this.battingOrder.length;
      return this.battingOrder[idx];
    });
  }

  resetLineup() {
    this.nextBatterIndex = 0;
  }
}

// Roster Class
class Roster {
  constructor() {
    this.players = [];
    this.activeLineup = { pitcher: null, batter: null };
  }

  addPlayer(player) {
    this.players.push(player);
  }

  setActivePitcher(index) {
    const player = this.players[index];
    if (!player || !player.canPitch()) return false;
    this.activeLineup.pitcher = player;
    return true;
  }

  setActiveBatter(index) {
    const player = this.players[index];
    if (!player || !player.canBat()) return false;
    this.activeLineup.batter = player;
    return true;
  }
}

// SaveManager Class
class SaveManager {
  save(game) {
    let data = {
      dataVersion: PLAYER_DATA_VERSION,
      roster: game.roster.players.map(p => ({
        name: p.name,
        physical: p.physical,
        abilities: p.abilities,
        role: p.role,
        position: p.position,
        team: p.team,
        nickname: p.nickname,
        englishName: p.englishName,
        level: p.level,
        bats: p.bats,
        throws: p.throws,
        sourceStats: p.sourceStats,
        state: p.state,
        maxStamina: p.maxStamina,
        maxMana: p.maxMana,
        traits: p.traits,
        condition: p.condition,
        pitchTypes: p.pitchTypes,
        growthPotential: p.growthPotential,
        injuryProbability: p.injuryProbability,
        ageDecline: p.ageDecline,
        xp: p.xp,
        burnLifeActive: p.burnLifeActive,
        protectionDuration: p.protectionDuration
      })),
      activeLineup: {
        pitcher: game.roster.activeLineup.pitcher ? game.roster.players.indexOf(game.roster.activeLineup.pitcher) : null,
        batter: game.roster.activeLineup.batter ? game.roster.players.indexOf(game.roster.activeLineup.batter) : null
      },
      currency: game.currency,
      mana: game.pitcher.state.mana,
      playerScore: game.playerScore,
      opponentScore: game.opponentScore,
      season: {
        currentMatch: game.seasonManager.currentMatch,
        wins: game.seasonManager.wins,
        losses: game.seasonManager.losses,
        seasonLength: game.seasonManager.seasonLength
      },
      playerBattingOrder: game.playerBattingOrder,
      playerNextBatterIndex: game.playerNextBatterIndex,
      defensiveAssignments: game.defensiveAssignments,
      rotationOrder: game.rotationOrder,
      rotationSlot: game.rotationSlot,
      scoutingReports: game.scoutingReports,
      baserunningMode: game.baserunningMode,
      offenseApproach: game.offenseApproach,
      pitchPlan: game.pitchPlan,
      pickoffAttemptsThisHalf: game.pickoffAttemptsThisHalf,
      activeCoachId: game.activeCoachId,
      leagueStandings: game.leagueStandings,
      managementLog: game.managementLog,
      currentSeasonEvent: game.currentSeasonEvent,
      protectionBuffs: game.medicalCenter.protectionBuffs
    };
    localStorage.setItem('baseballGame', JSON.stringify(data));
  }

  load(game) {
    let data = localStorage.getItem('baseballGame');
    if (data) {
      data = JSON.parse(data);
      if ((data.dataVersion || 1) < PLAYER_DATA_VERSION) {
        localStorage.removeItem('baseballGame');
        return;
      }
      game.roster.players = data.roster.map(p => {
        const player = new Player(
          p.name,
          p.physical.velocity,
          p.physical.power,
          p.physical.control,
          p.physical.speed,
          p.maxStamina,
          p.maxMana,
          p.state.fatigue,
          p.traits,
          p.growthPotential || 0,
          p.injuryProbability || 0,
          p.ageDecline || 0,
          {
            role: p.role,
            position: p.position,
            team: p.team,
            abilities: p.abilities,
            nickname: p.nickname,
            englishName: p.englishName,
            level: p.level,
            bats: p.bats,
            throws: p.throws,
            condition: p.condition,
            pitchTypes: p.pitchTypes,
            sourceStats: p.sourceStats
          }
        );
        player.state.stamina = clampInt(p.state.stamina, 0, player.maxStamina);
        player.state.mana = clampInt(p.state.mana, 0, player.maxMana);
        player.xp = p.xp || 0;
        player.burnLifeActive = p.burnLifeActive || false;
        player.protectionDuration = p.protectionDuration || 0;
        return player;
      });
      if (data.activeLineup.pitcher !== null) {
        game.roster.activeLineup.pitcher = game.roster.players[data.activeLineup.pitcher];
        game.pitcher = game.roster.activeLineup.pitcher || game.pitcher;
      }
      if (data.activeLineup.batter !== null) {
        game.roster.activeLineup.batter = game.roster.players[data.activeLineup.batter];
        game.batter = game.roster.activeLineup.batter || game.batter;
      }
      game.currency = data.currency || 1000;
      game.pitcher.state.mana = data.mana || 100;
      game.playerScore = data.playerScore || 0;
      game.opponentScore = data.opponentScore || 0;
      if (data.season) {
        game.seasonManager.currentMatch = data.season.currentMatch || 1;
        game.seasonManager.wins = data.season.wins || 0;
        game.seasonManager.losses = data.season.losses || 0;
        game.seasonManager.seasonLength = data.season.seasonLength || 30;
      }
      if (data.protectionBuffs || data.protectionBufuffs) {
        game.medicalCenter.protectionBuffs = data.protectionBuffs || data.protectionBufuffs;
      }
      game.playerBattingOrder = Array.isArray(data.playerBattingOrder) ? data.playerBattingOrder : game.playerBattingOrder;
      game.playerNextBatterIndex = data.playerNextBatterIndex || 0;
      game.defensiveAssignments = data.defensiveAssignments || game.defensiveAssignments;
      game.rotationOrder = Array.isArray(data.rotationOrder) ? data.rotationOrder : game.rotationOrder;
      game.rotationSlot = data.rotationSlot || 0;
      game.scoutingReports = data.scoutingReports || game.scoutingReports;
      game.baserunningMode = data.baserunningMode || game.baserunningMode;
      game.offenseApproach = data.offenseApproach || game.offenseApproach;
      game.pitchPlan = data.pitchPlan || game.pitchPlan;
      game.pickoffAttemptsThisHalf = data.pickoffAttemptsThisHalf || 0;
      game.activeCoachId = data.activeCoachId || game.activeCoachId;
      game.leagueStandings = data.leagueStandings || game.leagueStandings;
      game.managementLog = data.managementLog || game.managementLog;
      game.currentSeasonEvent = data.currentSeasonEvent || game.currentSeasonEvent;
      game.normalizeManagementState();
    }
  }
}

// SeasonManager Class
class SeasonManager {
  constructor(game) {
    this.game = game;
    this.currentMatch = 1;
    this.wins = 0;
    this.losses = 0;
    this.seasonLength = 30;
  }

  get record() {
    return `${this.wins}-${this.losses}`;
  }

  endMatch() {
    let result;
    const heatReward = Math.round(this.game.getCrowdEnergy() * 2);
    this.game.currency += heatReward;
    if (this.game.playerScore > this.game.opponentScore) {
      this.wins++;
      result = 'Win';
      this.game.currency += 300;
    } else if (this.game.playerScore < this.game.opponentScore) {
      this.losses++;
      result = 'Loss';
    } else {
      this.losses++;
      result = 'Tie';
    }
    this.game.updateLeagueStandings(result);
    showMatchSummary(result, this.game.playerScore, this.game.opponentScore, this.game.currency, heatReward, this.game.getStandingsHTML());
    this.game.saveManager.save(this.game);
    if (this.currentMatch < this.seasonLength) {
      this.currentMatch++;
      this.game.prepareNextMatch();
    } else {
      this.game.seasonEndResolution();
    }
  }
}

// Game State Class
class Game {
  constructor() {
    this.inning = 1;
    this.currentHalf = 'top';
    this.outs = 0;
    this.balls = 0;
    this.strikes = 0;
    this.playerRunners = [null, null, null];
    this.opponentRunners = [null, null, null];
    this.pitcher = new Player("王投手", 92, 85, 88, 75, 100, 100, 0, []);
    this.batter = new Player("陳打者", 88, 95, 82, 90, 100, 100, 0, [i18n.clutchHitter]);
    this.log = [];
    this.weather = i18n.sunny;
    this.cardManager = new CardManager();
    this.roster = new Roster();
    this.gacha = new GachaSystem();
    this.statMapper = new StatMapper();
    this.opponentTeams = Object.keys(this.statMapper.cpblTeams);
    this.currentOpponent = this.opponentTeams[Math.floor(Math.random() * this.opponentTeams.length)];
    this.opponentTeam = this.generateOpponentTeam(this.currentOpponent);
    this.currentTactic = i18n.normal;
    this.currency = 1000;
    this.playerScore = 0;
    this.opponentScore = 0;
    this.autoSimEnabled = false;
    this.seasonManager = new SeasonManager(this);
    this.saveManager = new SaveManager();
    this.medicalCenter = new MedicalCenter(this);
    this.commentaryGenerator = new CommentaryGenerator();
    this.initialize7thTeamRoster(); // Initialize with real-stat CPBL expansion roster
    this.playerBattingOrder = [];
    this.playerNextBatterIndex = 0;
    this.defensiveSlots = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
    this.defensiveAssignments = {};
    this.rotationOrder = [];
    this.rotationSlot = 0;
    this.scoutingReports = { local: false, international: false };
    this.baserunningMode = 'normal';
    this.offenseApproach = 'normal';
    this.pitchPlan = 'balanced';
    this.pickoffAttemptsThisHalf = 0;
    this.managementLog = [];
    this.coaches = [
      { id: 'hitting', name: '打擊教練', bonus: '巧打/長打 +2', hitting: 2, heat: 0 },
      { id: 'pitching', name: '投手教練', bonus: '控球/球威 +2', pitching: 2, heat: 0 },
      { id: 'defense', name: '守備教練', bonus: '守備 +3', defense: 3, heat: 0 },
      { id: 'conditioning', name: '體能教練', bonus: '恢復力 +6，傷病風險下降', recovery: 6, heat: 0 },
      { id: 'marketing', name: '人氣教練', bonus: '球場熱度 +8', heat: 8 }
    ];
    this.activeCoachId = 'hitting';
    this.leagueStandings = this.createInitialStandings();
    this.currentSeasonEvent = null;
    this.crowdEnergy = 50;
    this.normalizeManagementState();
    this.currentSeasonEvent = { title: '開幕戰', text: '擴編球隊首次亮相，球迷期待值上升。' };
  }

  initialize7thTeamRoster() {
    const defaultNames = ['張育成', '范國宸', '林安可', '陳晨威', '李凱威', '許基宏', '郭天信', '江坤宇', '羅戈', '威能帝', '林詩翔'];
    const sourcePlayers = [...this.statMapper.cpblBatters, ...this.statMapper.cpblPitchers];
    defaultNames.forEach(name => {
      const playerData = sourcePlayers.find(player => player.name === name);
      if (!playerData) return;
      const player = this.statMapper.createPlayerFromStats(playerData, {
        growthPotential: playerData.role === 'P' ? 20 : 30,
        injuryProbability: playerData.role === 'P' ? 0.04 : 0.025,
        ageDecline: 0.01
      });
      this.roster.addPlayer(player);
    });
  }

  generateOpponentTeam(teamName) {
    const teamData = this.statMapper.cpblTeams[teamName];
    const pitcherData = teamData.players.find(p => p.role === 'P') || this.statMapper.cpblPitchers[0];
    let battersData = teamData.players.filter(p => p.role === 'B');
    if (battersData.length < 9) {
      const names = new Set(battersData.map(p => p.name));
      const fillers = this.statMapper.cpblBatters.filter(p => !names.has(p.name));
      battersData = [...battersData, ...fillers].slice(0, 9);
    }

    const pitcher = this.statMapper.createPlayerFromStats(pitcherData, { growthPotential: 0, injuryProbability: 0.03, ageDecline: 0 });
    const battingOrder = battersData.slice(0, 9).map(batterData =>
      this.statMapper.createPlayerFromStats(batterData, { growthPotential: 0, injuryProbability: 0.02, ageDecline: 0 })
    );

    return {
      name: teamName,
      pitcher: pitcher,
      battingOrder: battingOrder,
      nextBatterIndex: 0,
      getCurrentBatter: function() { return this.battingOrder[this.nextBatterIndex]; },
      advanceBatter: function() { this.nextBatterIndex = (this.nextBatterIndex + 1) % this.battingOrder.length; },
      getUpcomingBatters: function() { return [1,2,3].map(offset => this.battingOrder[(this.nextBatterIndex + offset) % this.battingOrder.length]); },
      resetLineup: function() { this.nextBatterIndex = 0; }
    };
  }

  createInitialStandings() {
    const teams = ['第七隊', ...this.opponentTeams];
    return teams.map(team => ({ team, wins: 0, losses: 0, streak: '-' }));
  }

  getActiveCoach() {
    return this.coaches.find(coach => coach.id === this.activeCoachId) || this.coaches[0];
  }

  setCoach(id) {
    if (!this.coaches.some(coach => coach.id === id)) return false;
    this.activeCoachId = id;
    this.addManagementLog(`教練團調整：${this.getActiveCoach().name} 上任。`);
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  updateLeagueStandings(result) {
    if (!Array.isArray(this.leagueStandings) || !this.leagueStandings.length) {
      this.leagueStandings = this.createInitialStandings();
    }
    const updateTeam = (team, won) => {
      let row = this.leagueStandings.find(item => item.team === team);
      if (!row) {
        row = { team, wins: 0, losses: 0, streak: '-' };
        this.leagueStandings.push(row);
      }
      if (won) {
        row.wins++;
        row.streak = row.streak?.startsWith('W') ? `W${Number(row.streak.slice(1) || 0) + 1}` : 'W1';
      } else {
        row.losses++;
        row.streak = row.streak?.startsWith('L') ? `L${Number(row.streak.slice(1) || 0) + 1}` : 'L1';
      }
    };
    updateTeam('第七隊', result === 'Win');
    updateTeam(this.currentOpponent, result !== 'Win');
    this.opponentTeams
      .filter(team => team !== this.currentOpponent)
      .forEach((team, index) => {
        if ((this.seasonManager.currentMatch + index) % 2 !== 0) return;
        updateTeam(team, Math.random() < 0.5);
      });
    this.leagueStandings.sort((a, b) => (b.wins / Math.max(1, b.wins + b.losses)) - (a.wins / Math.max(1, a.wins + a.losses)) || b.wins - a.wins);
  }

  getStandingsHTML() {
    return this.leagueStandings.map((row, index) => {
      const games = row.wins + row.losses;
      const pct = games ? (row.wins / games).toFixed(3) : '.000';
      return `<tr><td>${index + 1}</td><td>${row.team}</td><td>${row.wins}-${row.losses}</td><td>${pct}</td><td>${row.streak}</td></tr>`;
    }).join('');
  }

  normalizeManagementState() {
    const batterIndexes = this.roster.players
      .map((player, index) => ({ player, index }))
      .filter(({ player }) => player.canBat() && player.level !== 'minor')
      .map(({ index }) => index);
    const pitcherIndexes = this.roster.players
      .map((player, index) => ({ player, index }))
      .filter(({ player }) => player.canPitch() && player.level !== 'minor')
      .map(({ index }) => index);

    this.playerBattingOrder = (this.playerBattingOrder || []).filter(index => batterIndexes.includes(index));
    batterIndexes.forEach(index => {
      if (!this.playerBattingOrder.includes(index) && this.playerBattingOrder.length < 9) {
        this.playerBattingOrder.push(index);
      }
    });
    this.playerBattingOrder = this.playerBattingOrder.slice(0, 9);
    this.playerNextBatterIndex = this.playerBattingOrder.length
      ? this.playerNextBatterIndex % this.playerBattingOrder.length
      : 0;

    this.rotationOrder = (this.rotationOrder || []).filter(index => pitcherIndexes.includes(index));
    pitcherIndexes.forEach(index => {
      if (!this.rotationOrder.includes(index)) this.rotationOrder.push(index);
    });
    this.rotationSlot = this.rotationOrder.length ? this.rotationSlot % this.rotationOrder.length : 0;

    if (!this.roster.activeLineup.pitcher || !this.roster.activeLineup.pitcher.canPitch()) {
      const firstPitcher = this.rotationOrder[0] ?? pitcherIndexes[0];
      if (firstPitcher !== undefined) this.roster.setActivePitcher(firstPitcher);
    }
    if (!this.roster.activeLineup.batter || !this.roster.activeLineup.batter.canBat()) {
      const firstBatter = this.playerBattingOrder[0] ?? batterIndexes[0];
      if (firstBatter !== undefined) this.roster.setActiveBatter(firstBatter);
    }
    this.pitcher = this.roster.activeLineup.pitcher || this.pitcher;
    this.batter = this.roster.activeLineup.batter || this.batter;
    this.autoAssignDefense();
  }

  autoAssignDefense() {
    const assigned = {};
    const used = new Set();
    this.defensiveSlots.forEach(slot => {
      const existing = this.defensiveAssignments?.[slot];
      if (existing !== undefined && this.playerBattingOrder.includes(existing) && !used.has(existing)) {
        assigned[slot] = existing;
        used.add(existing);
      }
    });

    this.defensiveSlots.forEach(slot => {
      if (assigned[slot] !== undefined) return;
      const best = this.playerBattingOrder
        .filter(index => !used.has(index))
        .sort((a, b) => {
          const pa = this.roster.players[a].getPositionPenalty(slot);
          const pb = this.roster.players[b].getPositionPenalty(slot);
          return pa - pb;
        })[0];
      if (best !== undefined) {
        assigned[slot] = best;
        used.add(best);
      }
    });

    this.defensiveAssignments = assigned;
  }

  getPlayerBatter() {
    this.normalizeManagementState();
    const index = this.playerBattingOrder[this.playerNextBatterIndex] ?? this.playerBattingOrder[0];
    const batter = this.roster.players[index] || this.batter;
    this.roster.activeLineup.batter = batter;
    this.batter = batter;
    return batter;
  }

  getCurrentMatchup() {
    this.normalizeManagementState();
    if (this.currentHalf === 'top') {
      return {
        battingTeam: 'opponent',
        fieldingTeam: 'player',
        pitcher: this.roster.activeLineup.pitcher || this.pitcher,
        batter: this.opponentTeam.getCurrentBatter(),
        offenseLabel: this.opponentTeam.name,
        defenseLabel: '第七隊'
      };
    }
    return {
      battingTeam: 'player',
      fieldingTeam: 'opponent',
      pitcher: this.opponentTeam.pitcher,
      batter: this.getPlayerBatter(),
      offenseLabel: '第七隊',
      defenseLabel: this.opponentTeam.name
    };
  }

  advanceBatterOrder(team) {
    if (team === 'opponent') {
      this.opponentTeam.advanceBatter();
      return;
    }
    if (this.playerBattingOrder.length) {
      this.playerNextBatterIndex = (this.playerNextBatterIndex + 1) % this.playerBattingOrder.length;
      const next = this.roster.players[this.playerBattingOrder[this.playerNextBatterIndex]];
      if (next) {
        this.roster.activeLineup.batter = next;
        this.batter = next;
      }
    }
  }

  movePlayerInLineup(index, direction) {
    this.normalizeManagementState();
    const pos = this.playerBattingOrder.indexOf(index);
    const target = pos + direction;
    if (pos < 0 || target < 0 || target >= this.playerBattingOrder.length) return false;
    [this.playerBattingOrder[pos], this.playerBattingOrder[target]] = [this.playerBattingOrder[target], this.playerBattingOrder[pos]];
    this.playerNextBatterIndex = 0;
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  replaceLineupSlot(slot, index) {
    this.normalizeManagementState();
    const player = this.roster.players[index];
    if (!player || !player.canBat() || player.level === 'minor') return false;
    if (slot < 0 || slot >= this.playerBattingOrder.length) return false;
    const existingSlot = this.playerBattingOrder.indexOf(index);
    if (existingSlot >= 0) {
      [this.playerBattingOrder[slot], this.playerBattingOrder[existingSlot]] = [this.playerBattingOrder[existingSlot], this.playerBattingOrder[slot]];
    } else {
      const removed = this.playerBattingOrder[slot];
      this.playerBattingOrder[slot] = index;
      Object.keys(this.defensiveAssignments).forEach(position => {
        if (this.defensiveAssignments[position] === removed) delete this.defensiveAssignments[position];
      });
    }
    this.playerNextBatterIndex = 0;
    this.autoAssignDefense();
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  cycleDefensePosition(index) {
    this.normalizeManagementState();
    const currentSlot = this.defensiveSlots.find(slot => this.defensiveAssignments[slot] === index);
    const start = currentSlot ? this.defensiveSlots.indexOf(currentSlot) + 1 : 0;
    for (let step = 0; step < this.defensiveSlots.length; step++) {
      const slot = this.defensiveSlots[(start + step) % this.defensiveSlots.length];
      const occupant = this.defensiveAssignments[slot];
      if (occupant === undefined || occupant === index) {
        if (currentSlot) delete this.defensiveAssignments[currentSlot];
        this.defensiveAssignments[slot] = index;
        this.saveManager.save(this);
        this.updateUI();
        return slot;
      }
    }
    return currentSlot || '';
  }

  assignDefenseSlot(slot, index) {
    this.normalizeManagementState();
    const player = this.roster.players[index];
    if (!this.defensiveSlots.includes(slot) || !player || !player.canBat() || !this.playerBattingOrder.includes(index)) return false;
    Object.keys(this.defensiveAssignments).forEach(position => {
      if (this.defensiveAssignments[position] === index || position === slot) delete this.defensiveAssignments[position];
    });
    this.defensiveAssignments[slot] = index;
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  togglePlayerLevel(index) {
    const player = this.roster.players[index];
    if (!player) return false;
    const activeMajorCount = this.roster.players.filter(p => p.level !== 'minor').length;
    if (player.level !== 'minor' && activeMajorCount <= 10) {
      this.addManagementLog('一軍人數太少，至少保留 10 人。');
      return false;
    }
    player.level = player.level === 'minor' ? 'major' : 'minor';
    if (player.level === 'minor') {
      this.playerBattingOrder = this.playerBattingOrder.filter(i => i !== index);
      this.rotationOrder = this.rotationOrder.filter(i => i !== index);
      Object.keys(this.defensiveAssignments).forEach(slot => {
        if (this.defensiveAssignments[slot] === index) delete this.defensiveAssignments[slot];
      });
    }
    this.normalizeManagementState();
    this.addManagementLog(`${player.name} 已移至${player.level === 'minor' ? '二軍' : '一軍'}。`);
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  selectStartingPitcher(index) {
    if (!this.roster.setActivePitcher(index)) return false;
    const rotationIndex = this.rotationOrder.indexOf(index);
    if (rotationIndex >= 0) this.rotationSlot = rotationIndex;
    this.pitcher = this.roster.players[index];
    this.addManagementLog(`賽前指定先發投手：${this.pitcher.name}`);
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  getAssignedPosition(index) {
    return this.defensiveSlots.find(slot => this.defensiveAssignments[slot] === index) || '';
  }

  getTeamDefenseModifier() {
    const penalties = Object.entries(this.defensiveAssignments).map(([slot, index]) => {
      const player = this.roster.players[index];
      return player ? player.getPositionPenalty(slot) : 20;
    });
    if (!penalties.length) return 0;
    return (penalties.reduce((sum, value) => sum + value, 0) / penalties.length) - this.getTeamBonuses().defense;
  }

  getGameSituationLabel() {
    const matchup = this.getCurrentMatchup();
    const leverage = this.isHighLeverage() ? '關鍵局面' : '一般局面';
    const plan = matchup.battingTeam === 'player' ? this.getOffenseApproachLabel() : this.getPitchPlanLabel();
    return `${matchup.offenseLabel}進攻 · ${matchup.batter.name} vs ${matchup.pitcher.name} · ${leverage} · ${plan}`;
  }

  getCrowdEnergy() {
    const base = 45 + this.playerScore * 8 - this.opponentScore * 5 + this.inning * 2 + this.getTeamBonuses().morale;
    const leverage = this.isHighLeverage() ? 20 : 0;
    this.crowdEnergy = clampInt(base + leverage, 5, 99);
    return this.crowdEnergy;
  }

  getBaserunningLabel() {
    return { conservative: '保守', normal: '普通', aggressive: '激進' }[this.baserunningMode] || '普通';
  }

  cycleBaserunningMode() {
    const modes = ['conservative', 'normal', 'aggressive'];
    const next = modes[(modes.indexOf(this.baserunningMode) + 1) % modes.length];
    this.baserunningMode = next;
    this.addManagementLog(`跑壘策略改為：${this.getBaserunningLabel()}`);
    this.saveManager.save(this);
    this.updateUI();
  }

  getRunnerAdvanceBonus() {
    if (this.baserunningMode === 'conservative') return -0.18;
    if (this.baserunningMode === 'aggressive') return 0.18;
    return 0;
  }

  getOffenseApproachLabel() {
    return { patient: '等球', normal: '普通', aggressive: '積極' }[this.offenseApproach] || '普通';
  }

  setOffenseApproach(mode) {
    if (!['patient', 'normal', 'aggressive'].includes(mode)) return false;
    this.offenseApproach = mode;
    this.addManagementLog(`進攻策略改為：${this.getOffenseApproachLabel()}`);
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  getPitchPlanLabel() {
    return { fastball: '速球為主', balanced: '混合配球', breaking: '變化球為主', waste: '壞球引誘' }[this.pitchPlan] || '混合配球';
  }

  setPitchPlan(plan) {
    if (!['fastball', 'balanced', 'breaking', 'waste'].includes(plan)) return false;
    this.pitchPlan = plan;
    this.addManagementLog(`投球策略改為：${this.getPitchPlanLabel()}`);
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  getTeamBonuses() {
    this.normalizeManagementState();
    const starters = this.playerBattingOrder.map(index => this.roster.players[index]).filter(Boolean);
    const teamCounts = starters.reduce((counts, player) => {
      counts[player.team] = (counts[player.team] || 0) + 1;
      return counts;
    }, {});
    const sameTeamMax = Math.max(0, ...Object.values(teamCounts));
    const localOnly = starters.length >= 9 && starters.every(player => player.team !== 'MLB' && player.team !== 'NPB');
    const coach = this.getActiveCoach();
    return {
      defense: (sameTeamMax >= 3 ? 2 : 0) + (coach.defense || 0),
      hitting: (sameTeamMax >= 5 ? 3 : 0) + (coach.hitting || 0),
      pitching: coach.pitching || 0,
      recovery: coach.recovery || 0,
      morale: (localOnly ? 10 : 0) + (coach.heat || 0),
      label: [
        sameTeamMax >= 3 ? '同隊3人：守備 +2' : '',
        sameTeamMax >= 5 ? '同隊5人：打擊 +3' : '',
        localOnly ? '純本土打線：球迷熱度 +10' : '',
        coach ? `${coach.name}：${coach.bonus}` : ''
      ].filter(Boolean).join(' / ') || '尚未觸發隊伍加成'
    };
  }

  trainPlayer(index, focus) {
    const player = this.roster.players[index];
    if (!player) return { success: false, message: '找不到球員。' };
    const plans = {
      hitting: { label: '打擊特訓', cost: 80, keys: ['contact', 'power', 'discipline'], xp: 18 },
      defense: { label: '守備特訓', cost: 70, keys: ['fielding', 'arm'], xp: 14 },
      running: { label: '跑壘特訓', cost: 60, keys: ['speed'], xp: 12 },
      pitching: { label: '投手控球營', cost: 80, keys: ['control', 'breaking', 'stuff'], xp: 18 },
      stamina: { label: '體能訓練', cost: 65, keys: ['stamina'], xp: 10 }
    };
    const plan = plans[focus];
    if (!plan) return { success: false, message: '未知訓練。' };
    if (this.currency < plan.cost) return { success: false, message: i18n.notEnoughCurrency };
    if (focus === 'pitching' && !player.canPitch()) return { success: false, message: '這名球員不是投手。' };
    if (['hitting', 'running'].includes(focus) && !player.canBat()) return { success: false, message: '這名球員不是野手。' };
    this.currency -= plan.cost;
    const growth = Math.max(1, Math.round(1 + player.growthPotential / 32));
    plan.keys.forEach(key => {
      if (key === 'stamina') {
        player.maxStamina = clampInt(player.maxStamina + growth, 1, 120);
        player.state.fatigue = clampInt(player.state.fatigue + 8, 0, 100);
      } else {
        player.abilities[key] = clampInt((player.abilities[key] || 60) + growth);
      }
    });
    player.gainXP(plan.xp);
    player.pitchTypes = player.generatePitchTypes();
    this.addManagementLog(`${player.name} 完成${plan.label}，能力 +${growth}。`);
    this.saveManager.save(this);
    this.updateUI();
    return { success: true, message: `${plan.label}完成：${player.name}` };
  }

  attemptPickoff() {
    if (this.currentHalf !== 'top') {
      this.addToLog('目前是我方進攻，不能牽制。');
      return false;
    }
    if (this.pickoffAttemptsThisHalf >= 2) {
      this.addToLog('本半局牽制次數已用完。');
      return false;
    }
    const runners = this.opponentRunners;
    const occupied = runners
      .map((runner, base) => ({ runner, base }))
      .filter(item => item.runner);
    if (!occupied.length) {
      this.addToLog('壘上無人，牽制取消。');
      return false;
    }
    this.pickoffAttemptsThisHalf++;
    const target = occupied[0];
    const pitcher = this.roster.activeLineup.pitcher || this.pitcher;
    const runnerSpeed = target.runner.abilities?.speed || target.runner.physical.speed || 70;
    const pickoffSkill = (pitcher.abilities.pickoff || pitcher.abilities.control || 70) * 0.65 + (pitcher.abilities.quickDelivery || 70) * 0.35;
    const pickoffChance = Math.max(0.04, Math.min(0.18, 0.08 + (pickoffSkill - runnerSpeed) / 420));
    pitcher.consumeStamina(1);
    if (Math.random() < pickoffChance) {
      runners[target.base] = null;
      this.recordOut();
      this.addToLog(`牽制成功！${target.runner.name} 在${['一', '二', '三'][target.base]}壘前被抓到。`);
      this.saveManager.save(this);
      return true;
    }
    const badThrowChance = Math.max(0.06, 0.18 - (pitcher.abilities.control || 70) / 800);
    if (Math.random() < badThrowChance && target.base < 2) {
      runners[target.base + 1] = runners[target.base];
      runners[target.base] = null;
      this.addToLog(`牽制暴傳！${target.runner.name} 推進到${['二', '三'][target.base]}壘。`);
    } else {
      this.addToLog(`牽制沒有抓到，${target.runner.name} 安全回壘。`);
    }
    this.updateUI();
    this.saveManager.save(this);
    return false;
  }

  attemptSteal() {
    if (this.currentHalf !== 'bottom') {
      this.addToLog('目前是我方守備，不能發動盜壘。');
      return false;
    }
    const runners = this.playerRunners;
    const targetBase = runners[1] && !runners[2] ? 1 : runners[0] && !runners[1] ? 0 : -1;
    if (targetBase < 0) {
      this.addToLog('沒有適合盜壘的跑者。');
      return false;
    }
    const runner = runners[targetBase];
    const catcher = this.opponentTeam.battingOrder.find(player => player.position === 'C');
    const catcherArm = catcher?.abilities?.arm || 74;
    const speed = runner.abilities?.speed || runner.physical.speed || 70;
    const modeBonus = this.baserunningMode === 'aggressive' ? 0.08 : this.baserunningMode === 'conservative' ? -0.08 : 0;
    const stealTrait = runner.traits.includes('盜壘好手') ? 0.08 : 0;
    const successChance = Math.max(0.18, Math.min(0.86, 0.52 + (speed - catcherArm) / 170 + modeBonus + stealTrait));
    const destination = targetBase + 1;
    runner.consumeStamina(2);
    if (Math.random() < successChance) {
      runners[destination] = runner;
      runners[targetBase] = null;
      this.addToLog(`${runner.name} 發動盜壘成功，攻佔${destination === 1 ? '二' : '三'}壘！`);
      this.updateUI();
      this.saveManager.save(this);
      return true;
    }
    runners[targetBase] = null;
    this.recordOut();
    this.addToLog(`${runner.name} 盜壘失敗，被捕手阻殺。`);
    this.saveManager.save(this);
    return false;
  }

  trySacrificeFly(team, batter) {
    const runners = team === 'opponent' ? this.opponentRunners : this.playerRunners;
    if (this.outs >= 2 || !runners[2]) return false;
    const scoreKey = team === 'opponent' ? 'opponentScore' : 'playerScore';
    const runner = runners[2];
    const speed = runner.abilities?.speed || runner.physical.speed || 70;
    const armPenalty = team === 'opponent' ? Math.max(0, this.getTeamDefenseModifier()) : 0;
    const chance = Math.max(0.22, Math.min(0.78, 0.46 + (speed - 70) / 180 + (batter.abilities?.power || 70) / 500 - armPenalty / 90));
    if (Math.random() > chance) return false;
    runners[2] = null;
    this[scoreKey]++;
    this.addToLog(`${batter.name} 打出高飛犧牲打，${runner.name} 回本壘得分。`);
    return true;
  }

  applySeasonEvent() {
    const events = [
      { title: '主場滿員', text: '票房爆棚，球探點數 +120。', apply: () => { this.currency += 120; } },
      { title: '長途移動', text: '連續客場讓全隊體力 -6。', apply: () => { this.roster.players.forEach(p => p.state.stamina = clampInt(p.state.stamina - 6, 0, p.maxStamina)); } },
      { title: '情蒐奏效', text: '下一場對手打者攻擊慾望被看破。', apply: () => { this.currentTactic = '情蒐奏效'; } },
      { title: '牛棚疲勞', text: '牛棚投手體力 -8，先發輪值更重要。', apply: () => { this.roster.players.filter(p => p.canPitch()).forEach(p => p.state.stamina = clampInt(p.state.stamina - 8, 0, p.maxStamina)); } }
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    event.apply();
    this.currentSeasonEvent = { title: event.title, text: event.text };
    this.addManagementLog(`[賽季事件] ${event.title}：${event.text}`);
  }

  buyScoutReport(pool) {
    const cost = 50;
    if (this.scoutingReports[pool]) {
      this.addManagementLog(`[球探報告] ${pool === 'local' ? '本地新秀' : '國際巨星'}情報已解鎖，不再扣點。`);
      this.updateUI();
      return true;
    }
    if (this.currency < cost) {
      this.addManagementLog(i18n.notEnoughCurrency);
      return false;
    }
    this.currency -= cost;
    this.scoutingReports[pool] = true;
    this.addManagementLog(`[球探報告] ${pool === 'local' ? '本地新秀' : '國際巨星'}能力情報已解鎖。`);
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  updateUI() {
    const matchup = this.getCurrentMatchup();
    const activePitcher = matchup.pitcher;
    const logDiv = document.getElementById('play-log');
    logDiv.innerHTML = this.log.slice(-20).reverse().map(msg => `<p>${msg}</p>`).join('');
    document.getElementById('inning').textContent = this.inning;
    document.getElementById('half').textContent = this.currentHalf === 'top' ? i18n.top : i18n.bottom;
    document.getElementById('outs').textContent = this.outs;
    document.getElementById('balls').textContent = this.balls;
    document.getElementById('strikes').textContent = this.strikes;
    const runnersStr = this.getRunnersText();
    document.getElementById('runners').textContent = runnersStr;
    document.getElementById('weather').textContent = this.weather;
    document.getElementById('mana').textContent = activePitcher.state.mana;
    document.getElementById('currency').textContent = this.currency;
    document.getElementById('score-player').textContent = this.playerScore;
    document.getElementById('score-opponent').textContent = this.opponentScore;
    document.getElementById('season-record').textContent = this.seasonManager.record;
    document.getElementById('upcoming-match').textContent = this.seasonManager.currentMatch;
    document.getElementById('season-length').textContent = this.seasonManager.seasonLength;
    document.getElementById('current-tactic').textContent = this.getGameSituationLabel();
    const matchupText = document.getElementById('matchup-text');
    if (matchupText) matchupText.textContent = `${matchup.offenseLabel}進攻 / ${matchup.defenseLabel}守備`;
    const pitcherText = document.getElementById('current-pitcher');
    if (pitcherText) pitcherText.textContent = `${matchup.pitcher.name} (${matchup.pitcher.getPositionLabel()})`;
    const batterText = document.getElementById('current-batter');
    if (batterText) batterText.textContent = `${matchup.batter.name} (${matchup.batter.getPositionLabel()})`;
    const crowdText = document.getElementById('crowd-energy');
    if (crowdText) crowdText.textContent = this.getCrowdEnergy();
    const eventText = document.getElementById('season-event');
    if (eventText) eventText.textContent = this.currentSeasonEvent ? `${this.currentSeasonEvent.title}：${this.currentSeasonEvent.text}` : '尚無事件';
    document.getElementById('auto-toggle').textContent = this.autoSimEnabled ? `${i18n.autoSim}: 開啟` : `${i18n.autoSim}: 關閉`;
    const cardsDiv = document.getElementById('cards');
    cardsDiv.innerHTML = this.cardManager.hand.map((card, i) => `<button onclick="activateCard(${i})" class="bg-purple-500 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs mr-2 mb-2">${card.name} (${card.cost} ${i18n.mana})</button>`).join('');
    
    // Update baseball diamond
    this.updateDiamondUI();
    updateDiamondRunners(); // PATCH: was this.updateDiamondRunners() but it's a global function
    
    this.updateOpponentUI();
    this.updateBullpenUI();
    this.updateRosterUI();
  }

  updateDiamondUI() {
    let container = document.getElementById('diamond-container');
    if (!container) {
      const gameTab = document.getElementById('game-tab');
      container = document.createElement('div');
      container.id = 'diamond-container';
      container.className = 'baseball-diamond';
      gameTab.insertBefore(container, gameTab.firstChild);
    }
    if (container.querySelector('svg')) {
      container.removeChild(container.querySelector('svg'));
    }
    container.appendChild(createDiamondSVG());
  }

  updateRosterUI() {
    const rosterDiv = document.getElementById('roster-gallery');
    rosterDiv.innerHTML = '';
    
    this.roster.players.forEach((p, i) => {
      const rank = p.getRank();
      const abilityPairs = p.canPitch() && p.role === 'P'
        ? [['球速', p.abilities.velocity], ['控球', p.abilities.control], ['變化', p.abilities.breaking], ['體力', p.abilities.stamina], ['守備', p.abilities.fielding], ['精神', p.abilities.discipline]]
        : [['巧打', p.abilities.contact], ['長打', p.abilities.power], ['走力', p.abilities.speed], ['守備', p.abilities.fielding], ['肩力', p.abilities.arm], ['選球', p.abilities.discipline]];
      const sourceLine = p.sourceStats?.source ? `${p.sourceStats.source} / ${p.team}` : p.team;
      const lineupSpot = this.playerBattingOrder.indexOf(i);
      const assignedPosition = this.getAssignedPosition(i);
      const positionPenalty = p.getPositionPenalty(assignedPosition);
      const card = document.createElement('div');
      card.className = 'trading-card';
      
      // Create card HTML
      card.innerHTML = `
        <div class="card-rank-badge badge-${rank.toLowerCase()}">
          ${rank}
        </div>
        ${createPixelPortrait(p, 58)}
        <div class="card-name">${p.name}</div>
        <div class="card-meta">
          <span>${p.getRoleLabel()}</span>
          <span>${p.getPositionLabel()}</span>
          <span>${p.level === 'minor' ? '二軍' : '一軍'}</span>
          <span>調子 ${getConditionLabel(p.condition)}</span>
          <span>${sourceLine}</span>
          ${p.traits.slice(0, 4).map(trait => `<span class="trait-pill trait-${getTraitTier(trait)}" title="${getTraitDescription(trait)}">${trait}</span>`).join('')}
          ${lineupSpot >= 0 ? `<span>第 ${lineupSpot + 1} 棒</span>` : ''}
          ${assignedPosition ? `<span>守 ${assignedPosition}${positionPenalty ? ` -${positionPenalty}` : ''}</span>` : ''}
        </div>
        <div class="card-stats">
          ${abilityPairs.map(([label, value]) => `<div class="card-stat-item"><span>${label}</span> <span>${clampInt(value)}</span></div>`).join('')}
        </div>
        <div class="card-stat-item" style="justify-content: space-around; padding: 4px 0;">
          <span>XP: ${p.xp}</span>
          <span>HP: ${clampInt(p.state.stamina)}/${p.maxStamina}</span>
        </div>
        <div class="card-buttons">
          <button class="card-btn card-btn-pitcher" onclick="setActivePitcher(${i})" ${p.canPitch() ? '' : 'disabled'}>P</button>
          <button class="card-btn card-btn-batter" onclick="setActiveBatter(${i})" ${p.canBat() ? '' : 'disabled'}>B</button>
          <button class="card-btn card-btn-small" onclick="moveLineup(${i}, -1)" ${lineupSpot > 0 ? '' : 'disabled'}>↑</button>
          <button class="card-btn card-btn-small" onclick="moveLineup(${i}, 1)" ${lineupSpot >= 0 && lineupSpot < this.playerBattingOrder.length - 1 ? '' : 'disabled'}>↓</button>
          <button class="card-btn card-btn-defense" onclick="cycleDefense(${i})" ${p.canBat() ? '' : 'disabled'}>守位</button>
          <button class="card-btn card-btn-level" onclick="togglePlayerLevel(${i})">${p.level === 'minor' ? '升一軍' : '下二軍'}</button>
          <button class="card-btn card-btn-detail" onclick="openPlayerDetail(${i})">詳細</button>
        </div>
      `;
      
      rosterDiv.appendChild(card);
      
      // Add radar chart SVG to card
      const radarDiv = document.createElement('div');
      radarDiv.style.textAlign = 'center';
      radarDiv.style.marginBottom = '8px';
      radarDiv.appendChild(createRadarChart(p));
      
      // Insert radar chart after card name
      const cardName = card.querySelector('.card-name');
      cardName.parentNode.insertBefore(radarDiv, cardName.nextSibling);
    });
  }

  getCurrentRunners() {
    return this.currentHalf === 'top' ? this.opponentRunners : this.playerRunners;
  }

  getRunnersText() {
    const runners = this.getCurrentRunners();
    const positions = [];
    if (runners[0]) positions.push(`${i18n.first}:${runners[0].name}`);
    if (runners[1]) positions.push(`${i18n.second}:${runners[1].name}`);
    if (runners[2]) positions.push(`${i18n.third}:${runners[2].name}`);
    return positions.length ? positions.join(', ') : i18n.none;
  }

  updateOpponentUI() {
    const lineupDiv = document.getElementById('opponent-lineup');
    const upcomingDiv = document.getElementById('upcoming-batters');
    const playerLineupDiv = document.getElementById('player-lineup');
    if (!this.opponentTeam) {
      lineupDiv.innerHTML = '<p>No opponent loaded.</p>';
      upcomingDiv.innerHTML = '';
      return;
    }
    lineupDiv.innerHTML = `<h4 class="font-bold">${this.opponentTeam.name}</h4>` + this.opponentTeam.battingOrder.map((p, i) => {
      const currentClass = i === this.opponentTeam.nextBatterIndex ? 'font-bold text-blue-700' : '';
      return `<p class="${currentClass}">${i + 1}. ${p.name} (${p.getRank()})</p>`;
    }).join('');
    upcomingDiv.innerHTML = this.opponentTeam.getUpcomingBatters().map(p => `<p>${p.name} (${p.getRank()})</p>`).join('');
    if (playerLineupDiv) {
      playerLineupDiv.innerHTML = this.playerBattingOrder.map((index, orderIndex) => {
        const player = this.roster.players[index];
        const currentClass = orderIndex === this.playerNextBatterIndex && this.currentHalf === 'bottom' ? 'font-bold text-blue-700' : '';
        const assigned = this.getAssignedPosition(index) || 'DH';
        return `<p class="${currentClass}">${orderIndex + 1}. ${player.name} (${POSITION_LABELS[assigned] || assigned})</p>`;
      }).join('');
    }
  }

  updateBullpenUI() {
    const bullpenDiv = document.getElementById('bullpen');
    const pitchers = this.roster.players
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.canPitch());
    bullpenDiv.innerHTML = pitchers.map(({ p, i }) => `
      <div class="mb-2">
        <span class="font-semibold">${p.name}</span> - ${p.position} Sta ${clampInt(p.state.stamina)}/${p.maxStamina}
        <button onclick="setActivePitcher(${i})" class="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs ml-2">Sub</button>
      </div>
    `).join('') || '<p>No bullpen available.</p>';
  }

  resetCount() {
    this.balls = 0;
    this.strikes = 0;
  }

  advanceRunners(outcome, team = 'player', batter = null) {
    const runners = team === 'opponent' ? this.opponentRunners : this.playerRunners;
    const scoreKey = team === 'opponent' ? 'opponentScore' : 'playerScore';
    const hitter = batter || this.getCurrentMatchup().batter;
    const scoreRunner = () => { this[scoreKey]++; };

    if (outcome === i18n.walk || outcome === 'Walk') {
      if (runners[0] && runners[1] && runners[2]) scoreRunner();
      if (runners[0] && runners[1]) runners[2] = runners[1];
      if (runners[0]) runners[1] = runners[0];
      runners[0] = hitter;
    } else if (outcome === i18n.single || outcome === 'Single') {
      const old = [...runners];
      const extra = Math.random() < (0.38 + this.getRunnerAdvanceBonus());
      runners[0] = hitter;
      runners[1] = old[0] || null;
      runners[2] = old[1] && !extra ? old[1] : null;
      if (old[2]) scoreRunner();
      if (old[1] && extra) scoreRunner();
    } else if (outcome === i18n.double || outcome === 'Double') {
      const old = [...runners];
      const extra = Math.random() < (0.45 + this.getRunnerAdvanceBonus());
      if (old[2]) scoreRunner();
      if (old[1]) scoreRunner();
      if (old[0] && extra) scoreRunner();
      runners[0] = null;
      runners[1] = hitter;
      runners[2] = old[0] && !extra ? old[0] : null;
    } else if (outcome === i18n.triple || outcome === 'Triple') {
      this[scoreKey] += runners.filter(Boolean).length;
      runners[0] = null;
      runners[1] = null;
      runners[2] = hitter;
    } else if (outcome === i18n.homeRun || outcome === 'Home Run') {
      this[scoreKey] += 1 + runners.filter(Boolean).length;
      runners[0] = null;
      runners[1] = null;
      runners[2] = null;
    }
    this.updateUI();
  }

  recordOut() {
    this.outs++;
    if (this.outs >= 3) {
      this.switchHalf();
    }
    this.updateUI();
  }

  addToLog(message) {
    this.log.push(message);
    this.updateUI();
  }

  addManagementLog(message) {
    this.managementLog.push(message);
    this.managementLog = this.managementLog.slice(-30);
    this.updateUI();
  }

  addCommentary(outcomeKey, player, cardActive = false) {
    const commentary = this.commentaryGenerator.generateCommentary(outcomeKey, player, cardActive);
    if (commentary) {
      this.log.push(`<span class="commentary">${commentary}</span>`);
    }
  }

  switchHalf() {
    if (this.currentHalf === 'top') {
      this.currentHalf = 'bottom';
      this.outs = 0;
      this.pickoffAttemptsThisHalf = 0;
      this.resetCount();
      this.playerRunners = [null, null, null];
      this.opponentRunners = [null, null, null];
      this.getPlayerBatter();
      this.addToLog(`攻守交換！${i18n.bottomOf} ${this.inning}，第七隊進攻。`);
    } else {
      this.currentHalf = 'top';
      this.inning++;
      this.outs = 0;
      this.pickoffAttemptsThisHalf = 0;
      this.resetCount();
      this.playerRunners = [null, null, null];
      this.opponentRunners = [null, null, null];
      if (this.inning > 9) {
        this.seasonManager.endMatch();
        return;
      }
      this.addToLog(`攻守交換！${i18n.inningStart}${this.inning}${i18n.inningEnd}，第七隊守備。`);
    }
    this.updateUI();
  }

  nextInning() {
    this.outs = 0;
    this.inning++;
    this.resetCount();
    this.playerRunners = [null, null, null];
    this.opponentRunners = [null, null, null];
    this.cardManager.expireEffects();
    this.currency += 50; // reward after inning
    const opponentRuns = this.simulateOpponentRuns();
    if (opponentRuns > 0) {
      this.opponentScore += opponentRuns;
      this.addToLog(`${i18n.opponentScored} ${opponentRuns} ${opponentRuns > 1 ? i18n.runs : i18n.run}.`);
    }
    this.saveManager.save(this);
    if (this.inning > 9) {
      this.seasonManager.endMatch();
    } else {
      this.addToLog(`${i18n.inningStart}${this.inning}${i18n.inningEnd}`);
    }
  }

  simulateOpponentRuns() {
    const rand = Math.random();
    if (rand < 0.35) return Math.floor(1 + Math.random() * 2);
    if (rand < 0.65) return 1;
    return 0;
  }

  isHighLeverage() {
    const runners = this.getCurrentRunners();
    const runnersInScoring = runners[1] || runners[2];
    const closeScore = Math.abs(this.playerScore - this.opponentScore) <= 2;
    return runnersInScoring || ((this.inning >= 8) && closeScore) || (this.pitcher.state.stamina < 30);
  }

  prepareNextMatch() {
    this.inning = 1;
    this.outs = 0;
    this.pickoffAttemptsThisHalf = 0;
    this.resetCount();
    this.playerRunners = [null, null, null];
    this.opponentRunners = [null, null, null];
    this.playerScore = 0;
    this.opponentScore = 0;
    this.autoSimEnabled = false;
    this.cardManager.expireEffects();
    this.recoverPlayersBetweenGames();
    this.normalizeManagementState();
    this.playerNextBatterIndex = 0;
    if (this.rotationOrder.length) {
      this.rotationSlot = (this.rotationSlot + 1) % this.rotationOrder.length;
      this.roster.setActivePitcher(this.rotationOrder[this.rotationSlot]);
      this.pitcher = this.roster.activeLineup.pitcher;
    }
    this.currentOpponent = this.opponentTeams[Math.floor(Math.random() * this.opponentTeams.length)];
    this.opponentTeam = this.generateOpponentTeam(this.currentOpponent);
    this.currentTactic = i18n.normal;
    this.addManagementLog(`${i18n.startingMatch} vs ${this.currentOpponent} --- 先發投手：${this.pitcher.name}`);
    this.applySeasonEvent();
    this.saveManager.save(this);
  }

  recoverPlayersBetweenGames() {
    const recoveryBonus = this.getTeamBonuses().recovery || 0;
    this.roster.players.forEach(player => {
      const recovery = (player.level === 'minor' ? 45 : (player.canPitch() ? 24 : 32)) + recoveryBonus;
      player.state.stamina = clampInt(player.state.stamina + recovery, 0, player.maxStamina);
      player.state.mana = clampInt(player.state.mana + 25, 0, player.maxMana);
      player.state.fatigue = clampInt(player.state.fatigue - 12, 0, 100);
      player.rollCondition();
    });
    this.medicalCenter.updateProtectionStatus();
  }

  expireEffects() {
    this.cardManager.expireEffects();
  }

  drawPlayer(pool = 'local') {
    if (this.currency >= 100) {
      this.currency -= 100;
      const player = this.gacha.drawPlayer(pool);
      this.roster.addPlayer(player);
      this.normalizeManagementState();
      this.addManagementLog(`${i18n.recruited} ${player.name} (${pool === 'local' ? i18n.localTalent : i18n.internationalStar})!`);
      this.saveManager.save(this);
      this.updateExpansionPreview(player);
      this.updateUI();
    } else {
      this.addManagementLog(i18n.notEnoughCurrency);
    }
  }

  updateExpansionPreview(player) {
    const previewDiv = document.getElementById('expansion-preview');
    if (!previewDiv) return;

    const card = document.createElement('div');
    card.className = 'trading-card';
    const rank = player.getRank();
    const abilityPairs = player.canPitch() && player.role === 'P'
      ? [['球速', player.abilities.velocity], ['控球', player.abilities.control], ['變化', player.abilities.breaking], ['體力', player.abilities.stamina], ['守備', player.abilities.fielding], ['精神', player.abilities.discipline]]
      : [['巧打', player.abilities.contact], ['長打', player.abilities.power], ['走力', player.abilities.speed], ['守備', player.abilities.fielding], ['肩力', player.abilities.arm], ['選球', player.abilities.discipline]];

    card.innerHTML = `
      <div class="card-rank-badge badge-${rank.toLowerCase()}">
        ${rank}
      </div>
      <div class="card-name">${player.name}</div>
      <div class="card-meta">
        <span>${player.getRoleLabel()}</span>
        <span>${player.getPositionLabel()}</span>
        <span>${player.team}</span>
      </div>
      <div class="card-stats">
        ${abilityPairs.map(([label, value]) => `<div class="card-stat-item"><span>${label}</span> <span>${clampInt(value)}</span></div>`).join('')}
      </div>
      <div class="card-stat-item" style="justify-content: space-around; padding: 4px 0;">
        <span>XP: ${player.xp}</span>
        <span>HP: ${clampInt(player.state.stamina)}/${player.maxStamina}</span>
      </div>
    `;

    // Add radar chart
    const radarDiv = document.createElement('div');
    radarDiv.style.textAlign = 'center';
    radarDiv.style.marginBottom = '8px';
    radarDiv.appendChild(createRadarChart(player));
    card.insertBefore(radarDiv, card.querySelector('.card-stats'));

    previewDiv.innerHTML = '';
    previewDiv.appendChild(card);
  }

  autoSimulate() {
    this.autoSimEnabled = true;
    this.updateUI();
    const nextStep = () => {
      if (!this.autoSimEnabled) return;
      if (this.isHighLeverage() || this.inning > 9) {
        this.autoSimEnabled = false;
        this.updateUI();
        this.addToLog(i18n.autoSimPaused);
        return;
      }
      const { pitcher, batter } = this.getCurrentMatchup();
      const outcome = resolveAtBat(pitcher, batter, false);
      this.addToLog(`${i18n.autoSimOutcome} ${outcome}`);
      if (this.inning > 9) {
        return;
      }
      setTimeout(nextStep, 50);
    };
    nextStep();
  }

  stopAutoSim() {
    this.autoSimEnabled = false;
    this.updateUI();
  }

  seasonEndResolution() {
    this.addManagementLog(i18n.seasonComplete);
    this.roster.players.forEach(player => {
      player.gainXP(50); // Gain XP for playing season
      player.applyAgeDecline();
      if (player.checkInjury()) {
        this.addManagementLog(`${player.name} 受傷了！`);
      }
      player.restore();
    });
    this.addManagementLog(`${i18n.seasonEnded} ${this.seasonManager.record}.`);
    this.saveManager.save(this);
  }
}

// Gaussian Random Function
function gaussianRandom(mean = 0, std = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// SVG Baseball Diamond Renderer
function createDiamondSVG() {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "300");
  svg.setAttribute("height", "300");
  svg.setAttribute("viewBox", "0 0 300 300");
  svg.setAttribute("class", "diamond-svg");

  // Draw diamond outline
  const diamond = document.createElementNS(svgNS, "polygon");
  diamond.setAttribute("points", "150,32 268,150 150,268 32,150");
  diamond.setAttribute("fill", "#90EE90");
  diamond.setAttribute("stroke", "#333");
  diamond.setAttribute("stroke-width", "2");
  svg.appendChild(diamond);

  // Home Plate (rounded base)
  const home = document.createElementNS(svgNS, "polygon");
  home.setAttribute("points", "150,260 160,268 150,276 140,268");
  home.setAttribute("class", "base base-empty");
  home.setAttribute("id", "base-home");
  svg.appendChild(home);

  // First Base
  const first = document.createElementNS(svgNS, "polygon");
  first.setAttribute("points", "258,150 268,160 254,170 244,160");
  first.setAttribute("class", "base base-empty");
  first.setAttribute("id", "base-first");
  svg.appendChild(first);

  // Second Base
  const second = document.createElementNS(svgNS, "polygon");
  second.setAttribute("points", "150,28 160,38 150,48 140,38");
  second.setAttribute("class", "base base-empty");
  second.setAttribute("id", "base-second");
  svg.appendChild(second);

  // Third Base
  const third = document.createElementNS(svgNS, "polygon");
  third.setAttribute("points", "42,150 52,160 38,170 28,160");
  third.setAttribute("class", "base base-empty");
  third.setAttribute("id", "base-third");
  svg.appendChild(third);

  // Pitcher position icon
  const pitcher = document.createElementNS(svgNS, "text");
  pitcher.setAttribute("x", "150");
  pitcher.setAttribute("y", "150");
  pitcher.setAttribute("class", "pitcher-icon");
  pitcher.setAttribute("id", "pitcher-pos");
  pitcher.setAttribute("text-anchor", "middle");
  pitcher.setAttribute("dominant-baseline", "middle");
  pitcher.textContent = "⚾";
  svg.appendChild(pitcher);

  // Batter position icon
  const batter = document.createElementNS(svgNS, "text");
  batter.setAttribute("x", "150");
  batter.setAttribute("y", "258");
  batter.setAttribute("class", "batter-icon");
  batter.setAttribute("id", "batter-pos");
  batter.setAttribute("text-anchor", "middle");
  batter.setAttribute("dominant-baseline", "middle");
  batter.textContent = "🏏";
  svg.appendChild(batter);

  // Base labels
  const labels = [
    { id: "label-first", x: "278", y: "150", text: "1B" },
    { id: "label-second", x: "150", y: "22", text: "2B" },
    { id: "label-third", x: "22", y: "150", text: "3B" },
    { id: "label-home", x: "150", y: "292", text: "H" }
  ];
  labels.forEach(label => {
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", label.x);
    text.setAttribute("y", label.y);
    text.setAttribute("class", "base-label");
    text.textContent = label.text;
    svg.appendChild(text);
  });

  return svg;
}

function updateDiamondRunners() {
  const svg = document.getElementById("diamond-container");
  if (!svg || !svg.querySelector("svg")) return;

  const runners = game.getCurrentRunners();
  const first = document.getElementById("base-first");
  const second = document.getElementById("base-second");
  const third = document.getElementById("base-third");

  if (first) {
    first.setAttribute("class", runners[0] ? "base base-occupied" : "base base-empty");
  }
  if (second) {
    second.setAttribute("class", runners[1] ? "base base-occupied" : "base base-empty");
  }
  if (third) {
    third.setAttribute("class", runners[2] ? "base base-occupied" : "base base-empty");
  }
}

// SVG Radar Chart (Hexagon) Renderer
function createRadarChart(player) {
  const svgNS = "http://www.w3.org/2000/svg";
  const size = 100;
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("class", "radar-hexagon");

  const center = size / 2;
  const radius = size / 2.5;
  const attributes = player.canPitch() && player.role === 'P' ? [
    { name: "速", value: player.abilities.velocity },
    { name: "控", value: player.abilities.control },
    { name: "變", value: player.abilities.breaking },
    { name: "體", value: player.abilities.stamina },
    { name: "守", value: player.abilities.fielding },
    { name: "心", value: player.abilities.discipline }
  ] : [
    { name: "巧", value: player.abilities.contact },
    { name: "長", value: player.abilities.power },
    { name: "走", value: player.abilities.speed },
    { name: "守", value: player.abilities.fielding },
    { name: "肩", value: player.abilities.arm },
    { name: "選", value: player.abilities.discipline }
  ];

  // Generate hexagon grid
  for (let i = 0; i < 3; i++) {
    const hexPoints = [];
    for (let j = 0; j < 6; j++) {
      const angle = (j * 60 - 90) * Math.PI / 180;
      const r = (radius / 100) * (25 + i * 25);
      hexPoints.push(center + r * Math.cos(angle) + "," + (center + r * Math.sin(angle)));
    }
    const hex = document.createElementNS(svgNS, "polygon");
    hex.setAttribute("points", hexPoints.join(" "));
    hex.setAttribute("class", "hexagon-grid");
    hex.setAttribute("fill", "none");
    svg.appendChild(hex);
  }

  // Draw attribute axes
  for (let j = 0; j < attributes.length; j++) {
    const angle = (j * (360 / attributes.length) - 90) * Math.PI / 180;
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", center);
    line.setAttribute("y1", center);
    line.setAttribute("x2", center + radius * Math.cos(angle));
    line.setAttribute("y2", center + radius * Math.sin(angle));
    line.setAttribute("stroke", "#ddd");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
  }

  // Draw player's attribute polygon
  const polyPoints = [];
  attributes.forEach((attr, idx) => {
    const angle = (idx * (360 / attributes.length) - 90) * Math.PI / 180;
    const value = Math.min(99, Math.max(0, attr.value));
    const r = (radius / 99) * value;
    polyPoints.push(center + r * Math.cos(angle) + "," + (center + r * Math.sin(angle)));
  });

  const polygon = document.createElementNS(svgNS, "polygon");
  polygon.setAttribute("points", polyPoints.join(" "));
  
  // Color based on rank
  const rank = player.getRank();
  let fillColor = "#A9A9A9";
  if (rank === "SS" || rank === "S") fillColor = "#FFD700";
  else if (rank === "A") fillColor = "#C0C0C0";
  else if (rank === "B") fillColor = "#CD7F32";

  polygon.setAttribute("fill", fillColor);
  polygon.setAttribute("opacity", "0.6");
  polygon.setAttribute("stroke", fillColor);
  polygon.setAttribute("stroke-width", "2");
  polygon.setAttribute("class", "hexagon-fill");
  svg.appendChild(polygon);

  // Add axis labels
  attributes.forEach((attr, idx) => {
    const angle = (idx * (360 / attributes.length) - 90) * Math.PI / 180;
    const labelDist = radius + 12;
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", center + labelDist * Math.cos(angle));
    text.setAttribute("y", center + labelDist * Math.sin(angle));
    text.setAttribute("class", "hexagon-axis-label");
    text.textContent = attr.name;
    svg.appendChild(text);
  });

  return svg;
}

// VFX Animations
function triggerShakeEffect() {
  const container = document.querySelector(".container");
  if (container) {
    container.classList.add("shake-effect");
    setTimeout(() => container.classList.remove("shake-effect"), 500);
  }
}

function updateBurnLifeEffect(active) {
  const pitcherCard = document.querySelector("#pitcher-stamina");
  if (pitcherCard) {
    if (active) {
      pitcherCard.classList.add("burn-life-active");
    } else {
      pitcherCard.classList.remove("burn-life-active");
    }
  }
}

function triggerCloneEffect() {
  const cloneIcon = document.getElementById("pitcher-pos");
  if (cloneIcon) {
    cloneIcon.classList.add("clone-shadow");
    setTimeout(() => cloneIcon.classList.remove("clone-shadow"), 1500);
  }
}

// Resolve At-Bat Function
function resolveAtBat(pitcher, batter, burnLife = false) {
  const matchup = game.getCurrentMatchup();
  const battingTeam = matchup.battingTeam;
  let tempBoostedPlayer = null;

  if (burnLife) {
    if (battingTeam === 'opponent') {
      pitcher.burnLifeActive = true;
      tempBoostedPlayer = pitcher;
      game.addToLog(`${pitcher.name} ${i18n.activatedBurnLife}`);
    } else {
      batter.burnLifeActive = true;
      tempBoostedPlayer = batter;
      game.addToLog(`${batter.name} 啟動強攻模式！`);
    }
    updateBurnLifeEffect(true);
  }

  let vel = pitcher.getEffectiveVelocity();
  let ctrl = pitcher.getEffectiveControl();
  let breaking = pitcher.abilities?.breaking || ctrl;
  let contact = batter.abilities?.contact || batter.physical.control;
  let pow = batter.getEffectivePower();
  let spd = batter.abilities?.speed || batter.physical.speed;
  let discipline = batter.abilities?.discipline || contact;
  const pitcherCondition = pitcher.getConditionModifier ? pitcher.getConditionModifier() : 0;
  const batterCondition = batter.getConditionModifier ? batter.getConditionModifier() : 0;
  vel += pitcherCondition;
  ctrl += pitcherCondition;
  breaking += pitcherCondition;
  breaking *= pitcher.getPitchStaminaMultiplier ? pitcher.getPitchStaminaMultiplier() : 1;
  contact += batterCondition;
  pow += batterCondition;
  spd += batterCondition;
  discipline += batterCondition;

  if (pitcher.traits.includes(i18n.elitePitcher)) {
    vel += 4;
    breaking += 4;
  }
  if (pitcher.traits.includes('王牌') && game.isHighLeverage()) {
    ctrl += 5;
    breaking += 4;
  }
  if (pitcher.traits.includes('控球不穩')) ctrl -= 6;
  if (batter.traits.includes(i18n.powerHitter)) pow += 5;
  if (batter.traits.includes('怪力')) pow += 7;
  if (batter.traits.includes(i18n.disciplined)) discipline += 6;
  if (batter.traits.includes('選球眼')) discipline += 7;
  if (batter.traits.includes('低球打') && game.pitchPlan === 'breaking') contact += 4;
  if (batter.traits.includes('對左強') && pitcher.throws === 'L') {
    contact += 6;
    pow += 4;
  }
  if (batter.traits.includes('恐左') && pitcher.throws === 'L') {
    contact -= 8;
    pow -= 6;
    game.addToLog(`${batter.name} 有恐左傾向，面對左投打擊下修。`);
  }
  if (batter.traits.includes('大心臟') && game.getCurrentRunners().some((runner, index) => runner && index >= 1)) {
    contact += 7 + Math.round((batter.abilities.scoringPosition || 70) / 30);
    pow += 5;
    game.addToLog(`${batter.name} 大心臟發動，得點圈有人時更冷靜。`);
  }
  if (pitcher.traits.includes('滾地球投手')) {
    pow -= 3;
  }
  if (game.weather === i18n.rainy) {
    ctrl *= 0.85;
    spd *= 0.9;
  }
  if (game.currentTactic === '情蒐奏效' && battingTeam === 'opponent') {
    contact -= 5;
    pow -= 4;
  }
  if (pitcher.throws === 'L') contact += ((batter.abilities.vsLeft || contact) - 70) / 4;
  if (pitcher.throws !== 'L') contact += ((batter.abilities.vsRight || contact) - 70) / 5;
  if (game.getCurrentRunners().some((runner, index) => runner && index >= 1)) {
    contact += ((batter.abilities.scoringPosition || contact) - 70) / 5;
    ctrl += ((pitcher.abilities.crisis || ctrl) - 70) / 5;
  }
  const teamBonuses = game.getTeamBonuses();
  if (battingTeam === 'opponent') {
    ctrl += teamBonuses.pitching || 0;
    breaking += teamBonuses.pitching || 0;
    vel += (teamBonuses.pitching || 0) / 2;
  }
  if (battingTeam === 'player') {
    contact += teamBonuses.hitting;
    pow += teamBonuses.hitting;
  }
  if (battingTeam === 'player') {
    if (game.offenseApproach === 'aggressive') {
      pow += 6;
      contact -= 2;
      discipline -= 6;
    } else if (game.offenseApproach === 'patient') {
      discipline += 10;
      contact += 2;
      pow -= 3;
    }
  }
  let zonePlanMod = 0;
  let swingPlanMod = 0;
  let slugPlanMod = 0;
  const pitchPool = Array.isArray(pitcher.pitchTypes) ? pitcher.pitchTypes : [];
  const selectedPitch = game.pitchPlan === 'fastball'
    ? pitchPool.find(pitch => pitch.name.includes('縫線') || pitch.name.includes('卡特')) || pitchPool[0]
    : game.pitchPlan === 'breaking'
      ? pitchPool.slice().sort((a, b) => b.movement - a.movement)[0]
      : game.pitchPlan === 'waste'
        ? pitchPool.slice().sort((a, b) => b.control - a.control)[0]
        : pitchPool[0];
  if (battingTeam === 'opponent') {
    if (game.pitchPlan === 'fastball') {
      vel += 5;
      breaking -= 2;
      zonePlanMod += 0.04;
      slugPlanMod += 0.05;
    } else if (game.pitchPlan === 'breaking') {
      breaking += 7;
      ctrl -= 3;
      zonePlanMod -= 0.03;
      slugPlanMod -= 0.04;
    } else if (game.pitchPlan === 'waste') {
      ctrl -= 6;
      zonePlanMod -= 0.13;
      swingPlanMod += 0.08;
      slugPlanMod -= 0.03;
    }
  }
  if (selectedPitch && battingTeam === 'opponent') {
    vel += (selectedPitch.speed - 75) / 18;
    breaking += (selectedPitch.movement - 70) / 12;
    ctrl += (selectedPitch.control - 70) / 16;
    slugPlanMod += (selectedPitch.slugRisk - 55) / 260;
  }

  let shadowClone = game.cardManager.activeEffects.shadowClone;
  if (shadowClone) triggerCloneEffect();

  let balls = 0;
  let strikes = 0;
  let pitchCount = 0;

  const finishAtBat = (outcome, didExpire = true) => {
    if (tempBoostedPlayer) tempBoostedPlayer.burnLifeActive = false;
    updateBurnLifeEffect(false);
    if (didExpire) game.expireEffects();
    game.advanceBatterOrder(battingTeam);
    game.saveManager.save(game);
    game.updateUI();
    return outcome;
  };

  while (balls < 4 && strikes < 3 && pitchCount < 9) {
    pitchCount++;
    const approachSwing = battingTeam === 'player'
      ? (game.offenseApproach === 'aggressive' ? 0.12 : game.offenseApproach === 'patient' ? -0.12 : 0)
      : 0;
    const zoneProb = Math.max(0.18, Math.min(0.82, 0.48 + zonePlanMod + (ctrl - 75) / 150 + (vel - 85) / 220 + gaussianRandom(0, 0.04)));
    const swingProb = Math.max(0.22, Math.min(0.78, 0.44 + swingPlanMod + approachSwing + (pow - 75) / 260 - (discipline - 75) / 280 + strikes * 0.04 - balls * 0.03));
    const inZone = Math.random() < zoneProb;
    const swings = inZone || Math.random() < swingProb;

    pitcher.consumeStamina(burnLife && battingTeam === 'opponent' ? 3 : 2);
    batter.consumeStamina(burnLife && battingTeam === 'player' ? 2 : 1);

    if (!swings) {
      balls++;
      game.addToLog(`第 ${pitchCount} 球，${pitcher.name} 投到壞球區，${batter.name} 沒出棒。B${balls}-S${strikes}`);
      continue;
    }

    const contactProb = Math.max(0.18, Math.min(0.92, 0.58 + (contact - 75) / 115 + (pow - 78) / 260 - (vel - 86) / 210 - (breaking - 78) / 180));
    if (Math.random() > contactProb) {
      strikes++;
      game.addToLog(`第 ${pitchCount} 球，揮空！B${balls}-S${strikes}`);
      continue;
    }

    const foulProb = Math.max(0.12, Math.min(0.38, 0.22 + (vel - contact) / 280));
    if (Math.random() < foulProb && strikes < 2) {
      strikes++;
      game.addToLog(`第 ${pitchCount} 球，界外球！B${balls}-S${strikes}`);
      continue;
    }
    if (Math.random() < foulProb && strikes >= 2) {
      game.addToLog(`第 ${pitchCount} 球，纏鬥界外，滿場屏息。B${balls}-S${strikes}`);
      continue;
    }

    let hitRand = Math.random() + gaussianRandom(0, 0.08);
    hitRand += slugPlanMod + (pow - 78) / 360 + (spd - 75) / 500;
    if (battingTeam === 'opponent') hitRand += game.getTeamDefenseModifier() / 140;
    if (shadowClone) hitRand -= 0.2;

    game.balls = balls;
    game.strikes = strikes;

    if (hitRand < 0.32) {
      game.recordOut();
      game.resetCount();
      game.addCommentary(i18n.groundOut, batter, shadowClone);
      return finishAtBat(i18n.groundOut);
    }
    if (hitRand < 0.52) {
      game.trySacrificeFly(battingTeam, batter);
      game.recordOut();
      game.resetCount();
      game.addCommentary(i18n.flyOut, batter, shadowClone);
      return finishAtBat(i18n.flyOut);
    }
    if (hitRand < 0.76) {
      game.advanceRunners(i18n.single, battingTeam, batter);
      game.addCommentary(i18n.single, batter, shadowClone);
      game.resetCount();
      return finishAtBat(i18n.single);
    }
    if (hitRand < 0.88) {
      game.advanceRunners(i18n.double, battingTeam, batter);
      game.addCommentary(i18n.double, batter, shadowClone);
      game.resetCount();
      return finishAtBat(i18n.double);
    }
    if (hitRand < 0.95) {
      game.advanceRunners(i18n.triple, battingTeam, batter);
      game.addCommentary(i18n.triple, batter, shadowClone);
      game.resetCount();
      return finishAtBat(i18n.triple);
    }

    game.advanceRunners(i18n.homeRun, battingTeam, batter);
    game.addCommentary(i18n.homeRun, batter, shadowClone);
    game.resetCount();
    triggerShakeEffect();
    return finishAtBat(i18n.homeRun);
  }

  game.balls = balls;
  game.strikes = strikes;
  if (balls >= 4) {
    game.advanceRunners(i18n.walk, battingTeam, batter);
    game.addCommentary(i18n.walk, batter, shadowClone);
    game.resetCount();
    return finishAtBat(i18n.walk);
  }

  game.recordOut();
  game.resetCount();
  game.addCommentary(i18n.strikeout, batter, shadowClone);
  return finishAtBat(i18n.strikeout);
}

// Initialize Game
let game = new Game();
game.saveManager.load(game);
game.updateUI();

// Tab switching
function showTab(tabName) {
  document.getElementById('game-tab').style.display = tabName === 'game' ? 'block' : 'none';
  document.getElementById('roster-tab').style.display = tabName === 'roster' ? 'block' : 'none';
  document.getElementById('season-tab').style.display = tabName === 'season' ? 'block' : 'none';
  document.getElementById('shop-tab').style.display = tabName === 'shop' ? 'block' : 'none';
}

// UI Event Listeners
document.getElementById('normal-pitch').addEventListener('click', () => {
  const { pitcher, batter } = game.getCurrentMatchup();
  const outcome = resolveAtBat(pitcher, batter, false);
  game.addToLog(`${i18n.outcome} ${outcome}!`);
});

document.getElementById('magic-pitch').addEventListener('click', () => {
  const { pitcher, batter } = game.getCurrentMatchup();
  const outcome = resolveAtBat(pitcher, batter, true);
  game.addToLog(`${i18n.outcome} ${outcome}!`);
});

document.getElementById('auto-sim').addEventListener('click', () => {
  const { pitcher, batter } = game.getCurrentMatchup();
  const outcome = resolveAtBat(pitcher, batter, false);
  game.addToLog(`${i18n.autoSimOutcome} ${outcome}!`);
});

document.getElementById('pickoff').addEventListener('click', () => {
  game.attemptPickoff();
});

document.getElementById('steal-base').addEventListener('click', () => {
  game.attemptSteal();
});

document.getElementById('baserunning-mode').addEventListener('click', () => {
  game.cycleBaserunningMode();
});

document.getElementById('toggle-weather').addEventListener('click', () => {
  game.weather = game.weather === i18n.sunny ? i18n.rainy : i18n.sunny;
  game.addToLog(`${i18n.weatherChanged} ${game.weather}`);
  game.updateUI();
});

document.getElementById('auto-toggle').addEventListener('click', () => {
  if (game.autoSimEnabled) {
    game.stopAutoSim();
    game.addToLog('Auto-Sim disabled.');
  } else {
    game.autoSimulate();
    game.addToLog('Auto-Sim enabled.');
  }
});

document.getElementById('draw-local').addEventListener('click', () => {
  game.drawPlayer('local');
});

document.getElementById('draw-international').addEventListener('click', () => {
  game.drawPlayer('international');
});

// Global function for card activation
function activateCard(index) {
  game.cardManager.activateCard(index);
}

function setActivePitcher(index) {
  if (!game.selectStartingPitcher(index)) {
    game.addManagementLog(`${game.roster.players[index]?.name || '球員'} 不是投手，不能登板。`);
    return;
  }
}

function setActiveBatter(index) {
  if (!game.roster.setActiveBatter(index)) {
    game.addManagementLog(`${game.roster.players[index]?.name || '球員'} 不是野手，不能排入打線。`);
    return;
  }
  game.batter = game.roster.players[index];
  const lineupIndex = game.playerBattingOrder.indexOf(index);
  if (lineupIndex >= 0) game.playerNextBatterIndex = lineupIndex;
  game.addManagementLog(`打者指定：${game.roster.players[index].name}`);
  game.updateUI();
}

function moveLineup(index, direction) {
  game.movePlayerInLineup(index, direction);
}

function replaceLineupSlot(slot, index) {
  game.replaceLineupSlot(slot, index);
}

function cycleDefense(index) {
  const slot = game.cycleDefensePosition(index);
  if (slot) game.addManagementLog(`${game.roster.players[index].name} 改守 ${slot}`);
}

function assignDefenseSlot(slot, index) {
  if (game.assignDefenseSlot(slot, index)) {
    game.addManagementLog(`${game.roster.players[index].name} 指定守 ${slot}`);
  }
}

function togglePlayerLevel(index) {
  game.togglePlayerLevel(index);
}

function buyScoutReport(pool) {
  game.buyScoutReport(pool);
  if (typeof renderGachaPoolPreview === 'function') renderGachaPoolPreview();
}

function showMatchSummary(result, playerScore, opponentScore, currency, heatReward = 0, standingsHTML = '') {
  const modal = document.getElementById('match-summary-modal');
  document.getElementById('summary-result').textContent = `${i18n.matchSummary}: ${result}`;
  document.getElementById('summary-score').textContent = `${i18n.score}: ${playerScore} - ${opponentScore}`;
  document.getElementById('summary-reward').textContent = `${i18n.scoutsPoints}: ${currency}`;
  const heat = document.getElementById('summary-heat');
  if (heat) heat.textContent = `球場熱度收益：+${heatReward} SP`;
  const standings = document.getElementById('summary-standings');
  if (standings) standings.innerHTML = standingsHTML;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeSummary() {
  const modal = document.getElementById('match-summary-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}
