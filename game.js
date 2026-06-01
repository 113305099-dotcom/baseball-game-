// v1.18：取得隊名常數（從 data.js）
const TEAM_NAME_DISPLAY = (typeof window !== 'undefined' && window.TEAM_NAME) || '政治大學棒球隊';
const TEAM_NICKNAME_DISPLAY = (typeof window !== 'undefined' && window.TEAM_NICKNAME) || '政大棒球';

// Internationalization Dictionary
const i18n = {
  // UI Labels
  stamina: '體力',
  mana: '魔力',
  inning: '局數',
  score: '分數',
  autoSim: '自動模擬',
  recruit: '招募',
  scoutsPoints: '資金',
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
// CommentaryGenerator 已移至 commentary.js（v3.21）

const PLAYER_DATA_VERSION = 4; // v2.11: 新增 currentYear / seasonHistory / wbcPoints / storylineStage

function clampInt(value, min = 0, max = 99) {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : min;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

// v3.25.2：投手體力 5 級狀態
function getStaminaState(player) {
  const states = window.GAME_PARAMS?.staminaStates || [
    { min: 80, key: 'fresh',     label: '龍精虎猛', icon: '🐉', color: '#22c55e', decayMul: 0.50, mods: { velocity:  2, control:  2, breaking:  2 } },
    { min: 60, key: 'sweating',  label: '微微出汗', icon: '💧', color: '#3b82f6', decayMul: 0.85, mods: { velocity:  0, control:  0, breaking:  0 } },
    { min: 35, key: 'tiring',    label: '略顯疲憊', icon: '😮‍💨', color: '#facc15', decayMul: 1.20, mods: { velocity: -3, control: -2, breaking: -2 } },
    { min: 15, key: 'exhausted', label: '累死了',   icon: '😩', color: '#f97316', decayMul: 1.70, mods: { velocity: -8, control: -6, breaking: -4 } },
    { min:  0, key: 'broken',    label: '懷疑人生', icon: '💀', color: '#ef4444', decayMul: 2.20, mods: { velocity: -15, control: -12, breaking: -10 } }
  ];
  const pct = player?.maxStamina ? (player.state.stamina / player.maxStamina) * 100 : 0;
  for (const s of states) {
    if (pct >= s.min) return s;
  }
  return states[states.length - 1];
}
window.getStaminaState = getStaminaState;

// v3.25：能力值字母評級（S 90+, A 80-89, B 70-79, C 60-69, D 50-59, E 0-49）
function getAbilityGrade(value) {
  const table = window.GAME_PARAMS?.abilityGrades || [
    { min: 90, grade: 'S', color: '#ffd700' },
    { min: 80, grade: 'A', color: '#9b59b6' },
    { min: 70, grade: 'B', color: '#3498db' },
    { min: 60, grade: 'C', color: '#27ae60' },
    { min: 50, grade: 'D', color: '#7f8c8d' },
    { min: 0,  grade: 'E', color: '#95a5a6' }
  ];
  const v = Number(value) || 0;
  for (const t of table) {
    if (v >= t.min) return t;
  }
  return table[table.length - 1];
}
function abilityWithGrade(value) {
  const v = clampInt(value);
  const g = getAbilityGrade(v);
  return `<span class="ability-val">${v}</span><span class="ability-grade grade-${g.grade}" style="background:${g.color}">${g.grade}</span>`;
}
window.getAbilityGrade = getAbilityGrade;
window.abilityWithGrade = abilityWithGrade;

// v3.25：能力說明（給 UI tooltip 用）
window.ABILITY_DESCRIPTIONS = {
  '巧打':    '接觸打擊能力。影響進場率（一壘安打、二壘安打）',
  '長打':    '長打力。影響擊球初速 EV，越高越容易打全壘打',
  '走力':    '跑壘速度。影響盜壘成功率、推進壘包速度',
  '守備':    '守備範圍與穩定度。減少失誤、增加接殺',
  '肩力':    '傳球力量與速度。阻殺跑者的關鍵',
  '選球':    '辨識好壞球能力。提升選保送、減少追打',
  '得點圈':  '得點圈表現。壘上有人時 contact 加成',
  '代打':    '代打能力綜合值（power + 選球 + contact）',
  '球速':    '球速壓制力。提升球質 stuffScore',
  '控球':    '控球精準度。減少投球偏差、減少保送',
  '變化球':  '變化球尾勁。增加揮空率、減少擊出強勁球',
  '體力':    '一場可投數量。耐久度越高換投越晚',
  '球威':    '整體球質。直接影響 stuffPenalty 對打者的壓制',
  '危機處理':'得點圈時的修正。壘上有人時 control 加成',
  '牽制':    '阻止對手盜壘的能力',
  '快速出手':'縮短投球週期，減少跑者起跑優勢',
  '恢復力':  '比賽之間的體力恢復速度'
};

function createDefaultHeatMap() {
  const heatMap = {};
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      heatMap[`${row},${col}`] = { contactMod: 0, powerMod: 0, eyeMod: 0 };
    }
  }
  return heatMap;
}

function normalizeAdvancedStats(raw = {}) {
  const stats = raw && typeof raw === 'object' ? { ...raw } : {};
  const heatMap = (stats.heatMap && typeof stats.heatMap === 'object') ? { ...stats.heatMap } : {};
  const defaultHeatMap = createDefaultHeatMap();
  Object.keys(defaultHeatMap).forEach((key) => {
    const source = heatMap[key] || heatMap[key.replace(',', '-')] || {};
    heatMap[key] = {
      contactMod: clampNumber(source.contactMod ?? 0, -8, 8),
      powerMod: clampNumber(source.powerMod ?? 0, -6, 10),
      eyeMod: clampNumber(source.eyeMod ?? 0, -4, 4)
    };
  });
  stats.heatMap = heatMap;
  stats.gbRate = Number.isFinite(Number(stats.gbRate)) ? Number(stats.gbRate) : 0.42;
  stats.ldRate = Number.isFinite(Number(stats.ldRate)) ? Number(stats.ldRate) : 0.22;
  stats.fbRate = Number.isFinite(Number(stats.fbRate)) ? Number(stats.fbRate) : 0.30;
  stats.popupRate = Number.isFinite(Number(stats.popupRate)) ? Number(stats.popupRate) : 0.06;
  stats.avgLaunchAngle = Number.isFinite(Number(stats.avgLaunchAngle)) ? Number(stats.avgLaunchAngle) : 16;
  return stats;
}

// v1.14：球員資料已搬到外部 data.js（請見專案根目錄的 data.js）
// 這些變數在 data.js 用 const 宣告，且 data.js 必須在 game.js 之前載入。
// 為了避免「在不同 script 重複宣告 const」的錯誤，這邊只做 fallback：
// 如果 data.js 沒載入成功，就用 window 上補一個空陣列 / 預設教練清單。
if (typeof window !== 'undefined') {
  if (!Array.isArray(window.CPBL_BATTER_STATS_2025))      window.CPBL_BATTER_STATS_2025      = [];
  if (!Array.isArray(window.CPBL_PITCHER_STATS_2025))     window.CPBL_PITCHER_STATS_2025     = [];
  if (!Array.isArray(window.INTERNATIONAL_STAR_CANDIDATES)) window.INTERNATIONAL_STAR_CANDIDATES = [];
  if (!Array.isArray(window.LEGENDARY_HERO_CANDIDATES))   window.LEGENDARY_HERO_CANDIDATES   = [];
  if (!Array.isArray(window.COACHES_DATA) || !window.COACHES_DATA.length) {
    window.COACHES_DATA = [
      { id: 'hitting',      name: '打擊教練', bonus: '巧打/長打 +2',         hitting: 2,  heat: 0 },
      { id: 'pitching',     name: '投手教練', bonus: '控球/球威 +2',         pitching: 2, heat: 0 },
      { id: 'defense',      name: '守備教練', bonus: '守備 +3',              defense: 3,  heat: 0 },
      { id: 'conditioning', name: '體能教練', bonus: '恢復力 +6，傷病風險下降', recovery: 6, heat: 0 },
      { id: 'marketing',    name: '人氣教練', bonus: '球場熱度 +8',          heat: 8 }
    ];
  }
  if (typeof window.INITIAL_ROSTER_SPEC !== 'object' || !window.INITIAL_ROSTER_SPEC) window.INITIAL_ROSTER_SPEC = null;
}

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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

const CPBL_OFFICIAL_IMAGE_BY_NAME = {
  '吳念庭': 'https://www.cpbl.com.tw/files/atts/0O194044076909723984/39吳念庭2025.jpg',
  '林安可': 'https://www.cpbl.com.tw/files/atts/0L087782038188845240/77林安可2025.jpg',
  '陳晨威': 'https://www.cpbl.com.tw/files/atts/0L088835934921596757/98陳晨威2025.jpg',
  '林泓育': 'https://www.cpbl.com.tw/files/atts/0L087782141949560349/11林泓育2025.jpg',
  '魔鷹': 'https://www.cpbl.com.tw/files/atts/0O086380552430643341/94魔鷹2025.jpg',
  '李凱威': 'https://www.cpbl.com.tw/files/atts/0L088846283692901115/21李凱威.jpg',
  '朱育賢': 'https://www.cpbl.com.tw/files/atts/0L087782010562693207/11朱育賢.jpg',
  '許基宏': 'https://www.cpbl.com.tw/files/atts/0L087782011941038667/74_許基宏.png',
  '王博玄': 'https://www.cpbl.com.tw/files/atts/0N062494325095917865/6王博玄2025.jpg',
  '郭天信': 'https://www.cpbl.com.tw/files/atts/0L088847591564374230/2郭天信.jpg',
  '林佳緯': 'https://www.cpbl.com.tw/files/atts/0N301600677138588817/20林佳緯2026.jpg',
  '吉力吉撈．鞏冠': 'https://www.cpbl.com.tw/files/atts/0L087782153170013481/4吉力吉撈.jpg',
  '曾子祐': 'https://www.cpbl.com.tw/files/atts/0N062494061270649160/1曾子祐2025.jpg',
  '江坤宇': 'https://www.cpbl.com.tw/files/atts/0L088838281170132791/江坤宇2024.png',
  '范國宸': 'https://www.cpbl.com.tw/files/atts/0L087782035982469310/46范國宸2026.jpg',
  '張育成': 'https://www.cpbl.com.tw/files/atts/0O194042770407743516/99張育成2026.jpg',
  '王威晨': 'https://www.cpbl.com.tw/files/atts/0L087782008227837668/王威晨2024.png',
  '岳東華': 'https://www.cpbl.com.tw/files/atts/0L087782036996773808/岳東華2024.png',
  '林立': 'https://www.cpbl.com.tw/files/atts/0L087782035718925753/39林立2025.jpg',
  '林子偉': 'https://www.cpbl.com.tw/files/atts/0N228626166699407798/15林子偉2025.jpg',
  '林靖凱': 'https://www.cpbl.com.tw/files/atts/0L088853465542247023/64林靖凱.jpg',
  '陳重羽': 'https://www.cpbl.com.tw/files/atts/0L087782032347015376/65陳重羽.jpg',
  '蘇緯達': 'https://www.cpbl.com.tw/files/atts/0L087782007148089613/蘇緯達2024.png',
  '張閔勛': 'https://www.cpbl.com.tw/files/atts/0L087782035173056736/28張閔勛2025.jpg',
  '高國麟': 'https://www.cpbl.com.tw/files/atts/0L087782016679544153/98高國麟2026.jpg',
  '鄭浩均': 'https://www.cpbl.com.tw/files/atts/0M262620340599650028/33_鄭浩均.png',
  '羅戈': 'https://www.cpbl.com.tw/files/atts/0P114643464410450989/羅戈.jpg',
  '後勁': 'https://www.cpbl.com.tw/files/atts/0L088836205009344702/40後勁2025.jpg',
  '威能帝': 'https://www.cpbl.com.tw/files/atts/0N265548593305128625/49威能帝2025.jpg',
  '艾速特': 'https://www.cpbl.com.tw/files/atts/0N235644011761778473/30艾速特2025.jpg',
  '魔神龍': 'https://www.cpbl.com.tw/files/atts/0Q075585306043575207/魔神龍2026.jpg',
  '鋼龍': 'https://www.cpbl.com.tw/files/atts/0L088850493829401912/37鋼龍2025.jpg',
  '魔力藍': 'https://www.cpbl.com.tw/files/atts/0L309540302623875826/44魔力藍2026.jpg',
  '布雷克': 'https://www.cpbl.com.tw/files/atts/0L088851516909723984/50布雷克.jpg',
  '古林睿煬': 'https://www.cpbl.com.tw/files/atts/0L088851290003759624/19古林睿煬2024.jpg',
  '徐若熙': 'https://www.cpbl.com.tw/files/atts/0L088847062122566755/18徐若熙2024.jpg',
  '江國豪': 'https://www.cpbl.com.tw/files/atts/0L088856657657537117/12江國豪2026.jpg',
  '林詩翔': 'https://www.cpbl.com.tw/files/atts/0N241575734429211458/14林詩翔2025.jpg',
  '陳禹勳': 'https://www.cpbl.com.tw/files/atts/0L087781874779548454/5陳禹勳.jpg',
  '黃子鵬': 'https://www.cpbl.com.tw/files/atts/0L087782033816450736/T54123黃子鵬.jpg',
  '翁瑋均': 'https://www.cpbl.com.tw/files/atts/0L088834893549293678/00翁瑋均.jpg',
  '黃恩賜': 'https://www.cpbl.com.tw/files/atts/0L087782129429279243/S0000003287.jpg',
  '陳柏清': 'https://www.cpbl.com.tw/files/atts/0N062485644068375626/66陳柏清2025.jpg'
};

function getOfficialPortraitUrl(player) {
  const stats = player?.sourceStats || {};
  return stats.officialImage || stats.cpblImage || CPBL_OFFICIAL_IMAGE_BY_NAME[player?.name] || '';
}

function getLocalPixelPortraitUrl(player) {
  const redrawnManifest = typeof window !== 'undefined' ? window.LOCAL_REDRAWN_PIXEL_PORTRAITS : null;
  if (redrawnManifest?.[player?.name]) return redrawnManifest[player.name];
  const manifest = typeof window !== 'undefined' ? window.LOCAL_PIXEL_PORTRAITS : null;
  return manifest?.[player?.name] || '';
}

function isRedrawnPixelPortrait(player) {
  const redrawnManifest = typeof window !== 'undefined' ? window.LOCAL_REDRAWN_PIXEL_PORTRAITS : null;
  return Boolean(redrawnManifest?.[player?.name]);
}

// v2.11：CPBL 照片像素化（修正：去掉 crossorigin 確保照片能正常載入）
// 原本因 CORS 失敗 → 所有球員看起來都一樣；現在改成：
//   1. 不帶 crossorigin 直接載入照片（每位球員都有不同的照片）
//   2. 嘗試用 canvas 像素化（如果失敗會 fallback 顯示原圖 + CSS 像素濾鏡）
//   3. CSS image-rendering: pixelated + 縮放放大造成像素感
function pixelatePortraitFromImg(img, blockW = 32, outputW = 192) {
  if (!img || !img.naturalWidth) return null;
  const ratio = img.naturalHeight / img.naturalWidth;
  const blockH = Math.max(1, Math.round(blockW * ratio));
  const small = document.createElement('canvas');
  small.width = blockW; small.height = blockH;
  const sctx = small.getContext('2d');
  sctx.imageSmoothingEnabled = true;
  try {
    sctx.drawImage(img, 0, 0, blockW, blockH);
  } catch (err) {
    return null; // CORS / 載入失敗
  }
  // 嘗試色階量化（如果 CORS 阻擋 readback，會 throw → 回傳 null 不阻塞）
  try {
    const imageData = sctx.getImageData(0, 0, blockW, blockH);
    const data = imageData.data;
    const step = 32;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, Math.round(data[i] / step) * step));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(data[i + 1] / step) * step));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(data[i + 2] / step) * step));
    }
    sctx.putImageData(imageData, 0, 0);
  } catch (err) {
    return null;
  }
  const big = document.createElement('canvas');
  big.width = outputW;
  big.height = Math.round(outputW * ratio);
  const bctx = big.getContext('2d');
  bctx.imageSmoothingEnabled = false;
  bctx.drawImage(small, 0, 0, big.width, big.height);
  return big;
}

// 設定圖片載入後嘗試像素化（如果 CORS 失敗就維持原圖 + CSS 像素濾鏡）
function setupPixelPortraitConversion(img) {
  if (!img || img.dataset.pixelated === 'true') return;
  const apply = () => {
    if (!img.complete || img.naturalWidth === 0) return;
    // v2.11：強制 CSS 像素風（即使 canvas 失敗也有效果）
    img.style.imageRendering = 'pixelated';
    try {
      const canvas = pixelatePortraitFromImg(img, 32, 192);
      if (canvas) {
        const url = canvas.toDataURL();
        img.src = url;
        img.dataset.pixelated = 'true';
      } else {
        // CORS 失敗 → 維持原圖，但仍有 CSS pixelated
        img.dataset.pixelated = 'css-only';
      }
    } catch (err) {
      img.dataset.pixelated = 'css-only';
    }
  };
  if (img.complete && img.naturalWidth > 0) apply();
  else img.addEventListener('load', apply, { once: true });
}

function createFallbackPixelPortrait(player, size = 64) {
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

function createPixelPortrait(player, size = 64) {
  const fallback = createFallbackPixelPortrait(player, size);
  const localUrl = getLocalPixelPortraitUrl(player);
  if (localUrl) {
    const safeName = escapeAttr(player.name);
    const safeUrl = escapeAttr(localUrl);
    const fallbackSvg = fallback.replace('class="pixel-portrait"', 'class="pixel-portrait portrait-fallback"');
    const portraitClass = isRedrawnPixelPortrait(player) ? 'redrawn-pixel-portrait' : 'local-pixel-portrait';
    const fitMode = isRedrawnPixelPortrait(player) ? 'contain' : 'cover';
    return `<span class="pixel-portrait official-pixel-portrait local-pixel-portrait ${portraitClass}" style="width:${size}px;height:${size}px" role="img" aria-label="${safeName} 本地像素頭像"><img src="${safeUrl}" alt="${safeName}" loading="lazy" data-pixelated="true" onerror="this.parentElement.classList.add('portrait-failed')" style="image-rendering:pixelated;image-rendering:crisp-edges;width:100%;height:100%;object-fit:${fitMode}">${fallbackSvg}</span>`;
  }

  const officialUrl = getOfficialPortraitUrl(player);
  if (!officialUrl) return fallback;

  const safeName = escapeAttr(player.name);
  const safeUrl = escapeAttr(officialUrl);
  const fallbackSvg = fallback.replace('class="pixel-portrait"', 'class="pixel-portrait portrait-fallback"');
  // v2.11：拿掉 crossorigin，照片才能正常載入；CSS image-rendering 提供像素效果，
  //         load 後再嘗試用 canvas 像素化（CORS 失敗也沒關係，CSS 已提供基本像素感）
  return `<span class="pixel-portrait official-pixel-portrait" style="width:${size}px;height:${size}px" role="img" aria-label="${safeName} 官方像素頭像"><img src="${safeUrl}" alt="${safeName}" loading="lazy" referrerpolicy="no-referrer" onload="window.setupPixelPortraitConversion && window.setupPixelPortraitConversion(this)" onerror="this.parentElement.classList.add('portrait-failed')" style="image-rendering:pixelated;image-rendering:crisp-edges;width:100%;height:100%;object-fit:cover">${fallbackSvg}</span>`;
}

// v1.18：將像素化函式暴露到 window，供 onload 呼叫
if (typeof window !== 'undefined') {
  window.setupPixelPortraitConversion = setupPixelPortraitConversion;
  window.pixelatePortraitFromImg = pixelatePortraitFromImg;
}

// StatMapper Class - Converts real stats to game attributes
class StatMapper {
  constructor() {
    this.cpblBatters = window.CPBL_BATTER_STATS_2025 || [];
    this.cpblPitchers = window.CPBL_PITCHER_STATS_2025 || [];
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
    if (stats.abilities && stats.abilities.contact != null) return stats.abilities;
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
    if (stats.abilities && stats.abilities.velocity != null) return stats.abilities;
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
    const talents = this.inferTalents(stats, abilities);  // v3.25：純顯示天賦
    const traits = [];  // v3.25：特質只能透過品階解鎖
    // v3.25.4：特殊投法投手自動標記 armSlot
    const armSlot = window.GAME_PARAMS?.specialPitcherArmSlot?.[stats.name] || null;
    if (armSlot) {
      const armLabel = window.GAME_PARAMS?.armSlotBonus?.[armSlot]?.label;
      if (armLabel && !talents.includes(armLabel)) talents.push(armLabel);
    }
    const player = new Player(
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
        advancedStats: stats.advancedStats,
        nickname: stats.nickname,
        englishName: stats.englishName
      }
    );
    player.talents = talents;
    if (armSlot) player.armSlot = armSlot;
    return player;
  }

  createInternationalPlayer(candidate) {
    // v3.25：國際球員給予內建特質（已預設好），天賦從 abilities 推
    const player = new Player(
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
        sourceStats: { source: 'International star preset', name: candidate.englishName },
        advancedStats: candidate.advancedStats
      }
    );
    player.talents = this.inferTalents({ role: candidate.role }, candidate.abilities);
    return player;
  }

  // v1.14：建立傳奇英雄（碎片商店兌換用）
  createLegendaryHero(candidate) {
    const traits = ['傳奇英雄', ...(candidate.traits || [])];
    const player = new Player(
      `${candidate.name}「${candidate.nickname}」`,
      candidate.physical.velocity,
      candidate.physical.power,
      candidate.physical.control,
      candidate.physical.speed,
      candidate.abilities.stamina || 115,
      120,
      0,
      traits,
      0,
      0.06, // 傳奇英雄傷病率低
      0.03, // 衰退也慢
      {
        role: candidate.role,
        position: candidate.position,
        team: candidate.team,
        abilities: candidate.abilities,
        bats: candidate.bats,
        throws: candidate.throws,
        nickname: candidate.nickname,
        englishName: candidate.englishName,
        sourceStats: { source: 'Legendary hero', name: candidate.name },
        advancedStats: candidate.advancedStats
      }
    );
    player.talents = this.inferTalents({ role: candidate.role }, candidate.abilities);
    return player;
  }

  // v3.25：從 abilities 推出「天賦」（純顯示，不加成）
  inferTalents(stats, abilities) {
    const talents = [];
    const pool = window.GAME_PARAMS?.talents || [];
    const isPitcher = stats.role === 'P';
    const side = isPitcher ? 'P' : 'B';
    for (const t of pool) {
      if (t.side !== side && t.side !== 'BP') continue;
      try {
        if (t.condition(abilities, stats)) talents.push(t.name);
      } catch (e) { /* abilities 缺欄位略過 */ }
    }
    return talents;
  }
  // 舊接口別名（避免外部呼叫炸掉）
  inferTraits(stats, abilities) { return this.inferTalents(stats, abilities); }

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
    this.team = meta.team || '政治大學棒球隊';
    this.nickname = meta.nickname || '';
    this.englishName = meta.englishName || '';
    this.level = meta.level || 'major';
    this.bats = meta.bats || (this.role === 'P' ? 'R' : (Math.random() < 0.34 ? 'L' : 'R'));
    this.throws = meta.throws || (this.role === 'P' || this.role === 'T' ? (Math.random() < 0.28 ? 'L' : 'R') : 'R');
    this.sourceStats = meta.sourceStats || {};
    this.advancedStats = normalizeAdvancedStats(meta.advancedStats || this.sourceStats.advancedStats || {});
    this.abilities = this.normalizeAbilities(meta.abilities);
    this.condition = meta.condition || 'normal';
    // v1.5：真實 pitchTypes（含 moveX/Y）優先，並儲存供升級時保留
    if (Array.isArray(meta.pitchTypes) && meta.pitchTypes.length > 0) {
      this._realPitchTypes = meta.pitchTypes;
      this.pitchTypes = this.generatePitchTypes(); // 初次生成（用真實資料 + 當前能力）
    } else {
      this.pitchTypes = this.generatePitchTypes();
    }

    // v1.14：投手分工與恢復系統
    // pitcherRole: 'SP'（先發） / 'RP'（後援） / null（非投手）
    if (this.canPitch()) {
      const pos = String(this.position || '');
      if (meta.pitcherRole) this.pitcherRole = meta.pitcherRole;
      else if (pos === 'SP') this.pitcherRole = 'SP';
      else if (pos === 'RP') this.pitcherRole = 'RP';
      else if (pos.includes('SP')) this.pitcherRole = 'SP';
      else this.pitcherRole = 'RP';
    } else {
      this.pitcherRole = null;
    }
    // daysOfRest：距離上次登板的休息場數（越大越精神，理想：SP 4、RP 1）
    this.daysOfRest = Number.isFinite(meta.daysOfRest) ? meta.daysOfRest : (this.pitcherRole === 'SP' ? 4 : 2);
    // pitchedLastGame：上一場是否登板（給 SeasonManager 在賽後更新 daysOfRest 用）
    this.pitchedLastGame = Boolean(meta.pitchedLastGame);
    // v4.1：教練一軍能力加成的可逆 delta（abilities 已含此 delta；save 連同存，load 不重複加）
    this.coachAbilityDelta = (meta.coachAbilityDelta && typeof meta.coachAbilityDelta === 'object') ? meta.coachAbilityDelta : {};
  }

  // v1.14：取得本投手的理想休息場數
  idealRest() {
    if (this.pitcherRole === 'SP') return 4;
    if (this.pitcherRole === 'RP') return 1;
    return 0;
  }

  // v1.14：是否處於疲勞登板（休息不足）狀態
  isOverworked() {
    if (!this.canPitch()) return false;
    return this.daysOfRest < this.idealRest();
  }

  // v1.14：取得本投手場內體力上限（SP 體力長但恢復慢，RP 體力短但恢復快）
  getStaminaCeiling() {
    if (this.pitcherRole === 'SP') return 110;
    if (this.pitcherRole === 'RP') return 60;
    return this.maxStamina || 100;
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

    // v1.5：若從真實資料載入過 pitchTypes，升級時保留位移資料，只更新能力欄位
    if (Array.isArray(this._realPitchTypes) && this._realPitchTypes.length > 0) {
      const velocity = this.abilities.velocity || this.physical.velocity || 70;
      const control = this.abilities.control || this.physical.control || 70;
      const breaking = this.abilities.breaking || control;
      const stuff = this.abilities.stuff || Math.round((velocity + breaking) / 2);

      return this._realPitchTypes.map(pt => {
        // 計算此球種的原始偏移量（真實值 − 當時能力值）
        const orig = pt._origin || {};
        const speedOffset = orig.speedOffset ?? (pt.speed - (orig.velocity || velocity));
        const moveOffset  = orig.moveOffset  ?? (pt.movement - (orig.breaking || breaking));
        const ctrlOffset  = orig.ctrlOffset  ?? (pt.control - (orig.control || control));
        const stuffOffset = orig.stuffOffset ?? (pt.stuff - (orig.stuff || stuff));

        return {
          name: pt.name,
          speed:    clampInt(velocity + speedOffset),
          movement: clampInt(breaking + moveOffset),
          control:  clampInt(control + ctrlOffset),
          stuff:    clampInt(stuff + stuffOffset),
          slugRisk: pt.slugRisk || 50,
          // 保留真實位移範圍
          moveXMin: pt.moveXMin, moveXMax: pt.moveXMax,
          moveYMin: pt.moveYMin, moveYMax: pt.moveYMax,
          _origin: { velocity, breaking, control, stuff, speedOffset, moveOffset, ctrlOffset, stuffOffset }
        };
      }).slice(0, 5);
    }

    // Fallback：現行公式
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
    // v3.25.2：體力非線性下降 — 高體力區下降慢（0.5x），低體力區崩盤快（2.2x）
    let multiplier = this.burnLifeActive ? 1.2 : 1;
    if (this.canPitch() && this.isOverworked && this.isOverworked()) multiplier *= 1.4;
    // 投手套用 staminaStates.decayMul（打者不適用，跑壘/打擊體力消耗仍線性）
    if (this.canPitch && typeof getStaminaState === 'function') {
      const state = getStaminaState(this);
      if (state && typeof state.decayMul === 'number') multiplier *= state.decayMul;
    }
    this.state.stamina -= amount * multiplier;
    this.state.stamina = clampInt(this.state.stamina, 0, this.maxStamina);
  }

  // v3.25.2：投手體力狀態（給 UI 用，回傳一個物件 { key, label, icon, color, mods, decayMul }）
  getStaminaStateInfo() {
    return (typeof getStaminaState === 'function') ? getStaminaState(this) : null;
  }

  getAverageAttribute() {
    return (this.physical.velocity + this.physical.power + this.physical.control + this.physical.speed) / 4;
  }

  getRank() {
    // 防禦性處理：避免在 game 尚未完全初始化時被呼叫造成整個渲染崩潰
    const g = (typeof game !== 'undefined' && game) || (typeof window !== 'undefined' && window.game) || null;
    if (!g || !g.statMapper) return '?';
    return g.statMapper.getRank(this.getAverageAttribute());
  }

  getRankColor() {
    const g = (typeof game !== 'undefined' && game) || (typeof window !== 'undefined' && window.game) || null;
    if (!g || !g.statMapper) return '#999';
    return g.statMapper.getRankColor(this.getRank());
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
    // v1.14：投手休息不足 → 受傷率上升
    if (this.canPitch() && this.isOverworked && this.isOverworked()) {
      const shortBy = this.idealRest() - this.daysOfRest;
      effectiveProb += 0.015 * shortBy;
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
    this.internationalCandidates = window.INTERNATIONAL_STAR_CANDIDATES || [];
  }

  drawPlayer(pool = 'local') {
    if (pool === 'international') {
      return this.drawInternationalByRarity();
    }
    const available = this.localCandidates.filter(player => !player.protected);
    const candidate = available[Math.floor(Math.random() * available.length)];
    return this.statMapper.createPlayerFromStats(candidate, {
      growthPotential: candidate.role === 'P' ? 25 : 35,
      injuryProbability: candidate.role === 'P' ? 0.045 : 0.03,
      ageDecline: 0.012
    });
  }

  // v4.1：海外池稀有度分級 — SSR 1.5%(rating S) / SR 13%(rating A,B) / R 85%(虛構填充)
  drawInternationalByRarity() {
    const roll = Math.random();
    let tier;
    if (roll < 0.015) tier = 'SSR';
    else if (roll < 0.015 + 0.13) tier = 'SR';
    else tier = 'R';
    if (tier === 'R') {
      return this.statMapper.createInternationalPlayer(this.createFictionalFillerCandidate());
    }
    const wantRatings = tier === 'SSR' ? ['S'] : ['A', 'B'];
    let bucket = this.internationalCandidates.filter(c => wantRatings.includes(c.rating || 'A'));
    if (!bucket.length) bucket = this.internationalCandidates; // 該層名單為空時退而求其次
    if (!bucket.length) return this.statMapper.createInternationalPlayer(this.createFictionalFillerCandidate());
    const candidate = bucket[Math.floor(Math.random() * bucket.length)];
    return this.statMapper.createInternationalPlayer(candidate);
  }

  // v4.1：虛構一般海外球員（R 級填充，用來拉低整體巨星抽中機率）
  createFictionalFillerCandidate() {
    const r = (lo, hi) => Math.round(lo + Math.random() * (hi - lo));
    const pick = arr => arr[r(0, arr.length - 1)];
    const westSur = ['洛佩茲','史密斯','岡薩雷茲','約翰森','布朗','加西亞','威爾森','安德森','馬丁','克拉克','劉易斯','沃克','貝克','里維拉','摩根','羅斯'];
    const westGiven = ['卡洛斯','凱文','馬丁','路易斯','東尼','瑞奇','艾迪','荷西','麥可','傑森','布萊恩','丹尼','維克多','法蘭克','戴夫'];
    const jpSur = ['佐藤','鈴木','高橋','田中','渡邊','伊藤','中村','小林','加藤','吉田'];
    const jpGiven = ['健太','大輔','翔','拓海','直樹','和也','陽介','亮','颯太','駿'];
    const isJp = Math.random() < 0.4;
    const name = isJp
      ? pick(jpSur) + pick(jpGiven)
      : pick(westSur) + '・' + pick(westGiven);
    const nickname = pick(['輪值班底','即戰力','工具人','潛力股','老將','板凳奇兵']);
    const team = isJp ? 'NPB' : 'MLB';
    const isPitcher = Math.random() < 0.4;
    if (isPitcher) {
      const velocity = r(56, 72), control = r(52, 68), breaking = r(50, 66), stamina = r(60, 78), fielding = r(55, 68), discipline = r(50, 62);
      return {
        name, nickname, englishName: 'Journeyman',
        role: 'P', position: Math.random() < 0.5 ? 'SP' : 'RP', team,
        bats: 'R', throws: Math.random() < 0.25 ? 'L' : 'R', rating: 'R',
        abilities: { velocity, control, breaking, stamina, fielding, discipline },
        physical: { velocity, power: 48, control, speed: r(55, 66) },
        traits: []
      };
    }
    const contact = r(52, 66), power = r(50, 66), speed = r(50, 72), fielding = r(55, 70), arm = r(55, 70), discipline = r(50, 65), clutch = r(50, 64);
    return {
      name, nickname, englishName: 'Journeyman',
      role: 'B', position: pick(['LF','CF','RF','1B','2B','3B','SS','C']), team,
      bats: Math.random() < 0.35 ? 'L' : 'R', throws: 'R', rating: 'R',
      abilities: { contact, power, speed, fielding, arm, discipline, clutch },
      physical: { velocity: arm, power, control: contact, speed },
      traits: []
    };
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
        advancedStats: p.advancedStats,
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
        protectionDuration: p.protectionDuration,
        // v1.14
        pitcherRole: p.pitcherRole,
        daysOfRest: p.daysOfRest,
        pitchedLastGame: p.pitchedLastGame,
        coachAbilityDelta: p.coachAbilityDelta
      })),
      activeLineup: {
        pitcher: game.roster.activeLineup.pitcher ? game.roster.players.indexOf(game.roster.activeLineup.pitcher) : null,
        batter: game.roster.activeLineup.batter ? game.roster.players.indexOf(game.roster.activeLineup.batter) : null
      },
      currency: game.currency,
      goldBaseball: game.goldBaseball,
      mana: game.pitcher.state.mana,
      playerScore: game.playerScore,
      opponentScore: game.opponentScore,
      lineScore: game.lineScore,
      playerHits: game.playerHits || 0,
      opponentHits: game.opponentHits || 0,
      playerErrors: game.playerErrors || 0,
      opponentErrors: game.opponentErrors || 0,
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
      bullpenOrder: game.bullpenOrder, // v1.14
      scoutingReports: game.scoutingReports,
      baserunningMode: game.baserunningMode,
      defensiveShift: game.defensiveShift,
      opponentDefensiveShift: game.opponentDefensiveShift,
      offenseApproach: game.offenseApproach,
      pitchPlan: game.pitchPlan,
      battingStrategy: game.battingStrategy,
      opponentBattingStrategy: game.opponentBattingStrategy,
      battingTargetZone: game.battingTargetZone,
      opponentTargetZone: game.opponentTargetZone,
      battingVelocityLock: game.battingVelocityLock,
      opponentVelocityLock: game.opponentVelocityLock,
      pitchAimCell: game.pitchAimCell,
      pitchEffort: game.pitchEffort,
      opponentPitchEffort: game.opponentPitchEffort,
      pickoffAttemptsThisHalf: game.pickoffAttemptsThisHalf,
      activeCoachId: game.activeCoachId,
      leagueStandings: game.leagueStandings,
      managementLog: game.managementLog,
      currentSeasonEvent: game.currentSeasonEvent,
      protectionBuffs: game.medicalCenter.protectionBuffs,
      // v1.14
      playerShards: game.playerShards,
      unlockedHeroes: game.unlockedHeroes,
      collectedPlayerKeys: Array.from(game.collectedPlayerKeys || []),
      majorRosterLimit: game.majorRosterLimit,
      // v1.18
      currentStadiumId: game.currentStadiumId,
      coachingStaff: game.coachingStaff,
      hiredCoaches: game.hiredCoaches,
      firstHalfChamp: game.firstHalfChamp,
      secondHalfChamp: game.secondHalfChamp,
      // v2.11
      currentYear: game.currentYear,
      seasonHistory: game.seasonHistory,
      wbcPointsByTeam: game.wbcPointsByTeam,
      storylineStage: game.storylineStage,
      wbcBracket: game.wbcBracket,
      storylineIntroShown: game.storylineIntroShown,
      tutorialCompleted: game.tutorialCompleted, // v4.1 Phase 4 新手教學旗標
      // 投手等級/XP
      playerLevels: game.roster.players.map(p => ({ playerLevel: p.playerLevel, playerXP: p.playerXP, rating: p.rating })),
      // v3.23：後勤資料、教練證、球員養成三軌
      coachCerts: game.coachCerts || 0,
      playerBatterStats: game.playerBatterStats || {},
      logisticsData: typeof game.logisticsCenter?.toJSON === 'function' ? game.logisticsCenter.toJSON() : null,
      playerGrowthData: game.roster.players.map(p => ({
        name: p.name,
        cardLevel: p.cardLevel || 0,
        cardCards: p.cardCards || 0,
        playerFragments: p.playerFragments || 0,
        playerRank: p.playerRank || 0,
        growthLog: p.growthLog || []
      }))
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
            sourceStats: p.sourceStats,
            advancedStats: p.advancedStats,
            // v1.14
            pitcherRole: p.pitcherRole,
            daysOfRest: p.daysOfRest,
            pitchedLastGame: p.pitchedLastGame,
            coachAbilityDelta: p.coachAbilityDelta
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
      game.goldBaseball = Number.isFinite(data.goldBaseball) ? data.goldBaseball : 300; // v4.1 migration：舊存檔補起手包
      game.pitcher.state.mana = data.mana || 100;
      game.playerScore = data.playerScore || 0;
      game.opponentScore = data.opponentScore || 0;
      game.lineScore = data.lineScore || game.createEmptyLineScore();
      game.playerHits = Number.isFinite(data.playerHits) ? data.playerHits : 0;
      game.opponentHits = Number.isFinite(data.opponentHits) ? data.opponentHits : 0;
      game.playerErrors = Number.isFinite(data.playerErrors) ? data.playerErrors : 0;
      game.opponentErrors = Number.isFinite(data.opponentErrors) ? data.opponentErrors : 0;
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
      game.bullpenOrder = Array.isArray(data.bullpenOrder) ? data.bullpenOrder : []; // v1.14
      game.scoutingReports = data.scoutingReports || game.scoutingReports;
      game.baserunningMode = data.baserunningMode || game.baserunningMode;
      game.defensiveShift = (typeof DefenseStateBuilder !== 'undefined' && Object.prototype.hasOwnProperty.call(DefenseStateBuilder.DEFENSIVE_ALIGNMENTS, data.defensiveShift))
        ? data.defensiveShift
        : (game.defensiveShift || 'standard');
      game.opponentDefensiveShift = (typeof DefenseStateBuilder !== 'undefined' && Object.prototype.hasOwnProperty.call(DefenseStateBuilder.DEFENSIVE_ALIGNMENTS, data.opponentDefensiveShift))
        ? data.opponentDefensiveShift
        : 'standard';
      game.offenseApproach = data.offenseApproach || game.offenseApproach;
      game.pitchPlan = data.pitchPlan || game.pitchPlan;
      game.battingStrategy = getStrategyKey(data.battingStrategy || LEGACY_OFFENSE_STRATEGY_MAP[game.offenseApproach] || game.battingStrategy);
      game.opponentBattingStrategy = getStrategyKey(data.opponentBattingStrategy || LEGACY_OFFENSE_STRATEGY_MAP[game.opponentOffenseApproach] || game.opponentBattingStrategy);
      game.battingTargetZone = normalizeZoneIndex(data.battingTargetZone, 3, game.battingTargetZone);
      game.opponentTargetZone = normalizeZoneIndex(data.opponentTargetZone, 3, game.opponentTargetZone);
      game.battingVelocityLock = ['fast', 'slow', 'none'].includes(data.battingVelocityLock) ? data.battingVelocityLock : game.battingVelocityLock;
      game.opponentVelocityLock = ['fast', 'slow', 'none'].includes(data.opponentVelocityLock) ? data.opponentVelocityLock : game.opponentVelocityLock;
      game.pitchAimCell = normalizeZoneIndex(data.pitchAimCell, 5, game.pitchAimCell);
      game.pitchEffort = normalizeEffortKey(data.pitchEffort || game.pitchEffort);
      game.opponentPitchEffort = normalizeEffortKey(data.opponentPitchEffort || game.opponentPitchEffort);
      game.pickoffAttemptsThisHalf = data.pickoffAttemptsThisHalf || 0;
      game.activeCoachId = data.activeCoachId || game.activeCoachId;
      game.leagueStandings = data.leagueStandings || game.leagueStandings;
      game.managementLog = data.managementLog || game.managementLog;
      game.currentSeasonEvent = data.currentSeasonEvent || game.currentSeasonEvent;
      // v1.14
      game.playerShards = Number.isFinite(data.playerShards) ? data.playerShards : 0;
      game.unlockedHeroes = Array.isArray(data.unlockedHeroes) ? data.unlockedHeroes : [];
      game.collectedPlayerKeys = new Set(Array.isArray(data.collectedPlayerKeys) ? data.collectedPlayerKeys : []);
      // 補上：讓存檔之前已在隊上的球員也被列入已收集（避免老存檔抽到同名又入隊）
      game.roster.players.forEach(p => game.collectedPlayerKeys.add(game.playerKey(p)));
      if (Number.isFinite(data.majorRosterLimit)) game.majorRosterLimit = data.majorRosterLimit;
      // v1.18 + v2.11 新欄位（向後相容）
      if (data.currentStadiumId) game.currentStadiumId = data.currentStadiumId;
      if (data.coachingStaff) game.coachingStaff = data.coachingStaff;
      if (Array.isArray(data.hiredCoaches)) game.hiredCoaches = data.hiredCoaches;
      if (data.firstHalfChamp) game.firstHalfChamp = data.firstHalfChamp;
      if (data.secondHalfChamp) game.secondHalfChamp = data.secondHalfChamp;
      // v2.11 劇情狀態
      if (Number.isFinite(data.currentYear)) game.currentYear = data.currentYear;
      if (Array.isArray(data.seasonHistory)) game.seasonHistory = data.seasonHistory;
      if (data.wbcPointsByTeam) game.wbcPointsByTeam = data.wbcPointsByTeam;
      if (data.storylineStage) game.storylineStage = data.storylineStage;
      if (data.wbcBracket) game.wbcBracket = data.wbcBracket;
      if (typeof data.storylineIntroShown === 'boolean') game.storylineIntroShown = data.storylineIntroShown;
      if (typeof data.tutorialCompleted === 'boolean') game.tutorialCompleted = data.tutorialCompleted;
      // 球員等級回填
      if (Array.isArray(data.playerLevels)) {
        data.playerLevels.forEach((info, idx) => {
          const p = game.roster.players[idx];
          if (p && info) {
            if (info.playerLevel) p.playerLevel = info.playerLevel;
            if (info.playerXP) p.playerXP = info.playerXP;
            if (info.rating) p.rating = info.rating;
          }
        });
      }
      // v3.23：教練證 / 統計 / 後勤
      if (Number.isFinite(data.coachCerts)) game.coachCerts = data.coachCerts;
      if (data.playerBatterStats && typeof data.playerBatterStats === 'object') game.playerBatterStats = data.playerBatterStats;
      if (data.logisticsData && typeof game.logisticsCenter?.loadFromJSON === 'function') {
        game.logisticsCenter.loadFromJSON(data.logisticsData);
      }
      // v4.1：載入後重算教練一軍能力加成（先移除存檔內舊 delta 再依現況重算，idempotent）
      if (typeof game.applyCoachAbilityBonuses === 'function') game.applyCoachAbilityBonuses();
      // v3.23：球員養成三軌回填
      if (Array.isArray(data.playerGrowthData) && typeof window.PlayerGrowth?.ensureGrowthFields === 'function') {
        const byName = new Map(data.playerGrowthData.map(g => [g.name, g]));
        game.roster.players.forEach(p => {
          window.PlayerGrowth.ensureGrowthFields(p);
          const g = byName.get(p.name);
          if (g) {
            p.cardLevel = g.cardLevel || 0;
            p.cardCards = g.cardCards || 0;
            p.playerFragments = g.playerFragments || 0;
            p.playerRank = g.playerRank || 0;
            if (Array.isArray(g.growthLog)) p.growthLog = g.growthLog;
          }
        });
      }
      // v3.25：天賦/特質 migration — 舊存檔的 traits 內含天賦字串，移到 talents
      const TALENT_NAMES = new Set((window.GAME_PARAMS?.talents || []).map(t => t.name));
      const LEGACY_TALENT_NAMES = new Set(['力量打者', '紀律性', '觸擊專家', '精英投手', '王牌', '滾地球投手', '守備職人', '對左強', '盜壘好手', '低球打']);
      game.roster.players.forEach(p => {
        if (!Array.isArray(p.talents)) p.talents = [];
        if (Array.isArray(p.traits)) {
          const migrated = [];
          const keepTraits = [];
          for (const t of p.traits) {
            if (TALENT_NAMES.has(t) || LEGACY_TALENT_NAMES.has(t)) {
              if (!p.talents.includes(t)) migrated.push(t);
            } else {
              keepTraits.push(t);  // 留下真正的特質、傳奇英雄 tag
            }
          }
          p.talents.push(...migrated);
          p.traits = keepTraits;
        }
        // 重新從 abilities 推算 talents（補上漏掉的）
        if (p.abilities && game.statMapper?.inferTalents) {
          const fresh = game.statMapper.inferTalents({ role: p.role }, p.abilities);
          for (const t of fresh) {
            if (!p.talents.includes(t)) p.talents.push(t);
          }
        }
      });
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
    this.seasonLength = 40;          // v1.18 #19：一季 40 場
    this.halfSeasonLength = 20;       // 上下半季各 20 場
    this.firstHalfRecord = { wins: 0, losses: 0 };
    this.secondHalfRecord = { wins: 0, losses: 0 };
  }

  get record() {
    return `${this.wins}-${this.losses}`;
  }

  // v1.18 #19：取得目前是上半季或下半季
  getCurrentHalf() {
    return this.currentMatch <= this.halfSeasonLength ? 'first' : 'second';
  }

  // v1.18 #19：上半季結束時記錄冠軍
  recordHalfChampion() {
    const half = this.getCurrentHalf();
    if (this.currentMatch === this.halfSeasonLength && half === 'first' && !this.game.firstHalfChamp) {
      // 上半季結束（這是第 20 場）
      this.game.firstHalfChamp = this.findHalfSeasonChampion();
      this.game.addManagementLog(`🏆 上半季結束！冠軍：${this.game.firstHalfChamp}`);
    } else if (this.currentMatch === this.seasonLength && half === 'second' && !this.game.secondHalfChamp) {
      this.game.secondHalfChamp = this.findHalfSeasonChampion();
      this.game.addManagementLog(`🏆 下半季結束！冠軍：${this.game.secondHalfChamp}`);
    }
  }

  // 從聯盟戰績找出當前半季冠軍（簡化版：取勝率最高隊伍）
  findHalfSeasonChampion() {
    const standings = this.game.leagueStandings || [];
    if (!standings.length) return TEAM_NAME_DISPLAY;
    const sorted = [...standings].sort((a, b) => {
      const ar = (a.wins || 0) / Math.max(1, (a.wins || 0) + (a.losses || 0));
      const br = (b.wins || 0) / Math.max(1, (b.wins || 0) + (b.losses || 0));
      return br - ar;
    });
    return sorted[0].team || TEAM_NAME_DISPLAY;
  }

  endMatch() {
    let result;
    this.game.autoSimEnabled = false;
    const heatReward = Math.round(this.game.getCrowdEnergy() * 2);
    this.game.currency += heatReward;
    if (this.game.playerScore > this.game.opponentScore) {
      this.wins++;
      result = 'Win';
      this.game.currency += 300;
      this.game.goldBaseball = (this.game.goldBaseball || 0) + 20; // v4.1：勝利發放黃金棒球（賽後獎勵）
    } else if (this.game.playerScore < this.game.opponentScore) {
      this.losses++;
      result = 'Loss';
    } else {
      this.losses++;
      result = 'Tie';
    }
    // v1.18 #19：分別紀錄上下半季勝負
    if (this.getCurrentHalf() === 'first') {
      if (result === 'Win') this.firstHalfRecord.wins++;
      else this.firstHalfRecord.losses++;
    } else {
      if (result === 'Win') this.secondHalfRecord.wins++;
      else this.secondHalfRecord.losses++;
    }
    this.game.updateLeagueStandings(result);
    this.recordHalfChampion();
    // v1.18 #2：賽後每位上場球員給 XP（出場費用 XP）
    this.game.roster.players.forEach(p => {
      if (p.level === 'minor') {
        awardPlayerXP(p, 10, 'all', this.game);
      } else {
        awardPlayerXP(p, 20, p.role === 'P' ? 'pitching' : 'batting', this.game);
      }
    });
    // v3.23：套用一軍 / 二軍訓練倍率
    if (this.game.logisticsCenter?.applyBetweenGamesEffects) {
      this.game.logisticsCenter.applyBetweenGamesEffects();
    }
    // v3.23：生成並套用獎勵，改顯示報紙頭版
    let rewards = null;
    if (typeof window.RewardsSystem?.generateRewards === 'function') {
      rewards = window.RewardsSystem.generateRewards(this.game, result, {
        playerHits: this.game.playerHits,
        playerHR: this.game.matchStats?.playerHR || 0,
        heat: heatReward
      });
      window.RewardsSystem.applyRewards(this.game, rewards);
    }
    if (typeof window.NewspaperSummary?.showNewspaperSummary === 'function') {
      window.NewspaperSummary.showNewspaperSummary({
        result,
        playerScore: this.game.playerScore,
        opponentScore: this.game.opponentScore,
        opponentName: this.game.opponentTeam?.name || '對手',
        lineScore: this.game.lineScore,
        matchStats: this.game.matchStats,
        playerHits: this.game.playerHits,
        opponentHits: this.game.opponentHits,
        playerErrors: this.game.playerErrors,
        opponentErrors: this.game.opponentErrors,
        mvp: rewards?.mvp || null,
        rewards: rewards ? { money: rewards.money, coachCerts: rewards.coachCerts, playerCards: rewards.playerCards, heat: heatReward } : { money: 0, heat: heatReward },
        standingsHTML: this.game.getStandingsHTML(),
        game: this.game,
        walkoff: (result === 'Win' && this.game.currentHalf === 'bottom' && this.game.inning >= 9),
        comeback: false
      });
    } else {
      // fallback：使用舊版摘要
      showMatchSummary(result, this.game.playerScore, this.game.opponentScore, this.game.currency, heatReward, this.game.getStandingsHTML(), this.game.matchStats, this.game.lineScore, this.game.playerHits, this.game.opponentHits, this.game.playerErrors, this.game.opponentErrors, this.game.opponentTeam?.name || '對手');
    }
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
    this.goldBaseball = 300; // v4.1：抽卡專用貨幣（教練池／海外池）。新手起手包；主要靠任務／賽後／賽季里程碑取得，無保底
    this.playerScore = 0;
    this.opponentScore = 0;
    this.lineScore = this.createEmptyLineScore();
    this.playerHits = 0;
    this.opponentHits = 0;
    this.playerErrors = 0;
    this.opponentErrors = 0;
    this.autoSimEnabled = false;
    this.seasonManager = new SeasonManager(this);
    this.saveManager = new SaveManager();
    // v3.23：以 LogisticsCenter 取代 MedicalCenter，保留別名以維持舊呼叫
    this.logisticsCenter = (typeof LogisticsCenter !== 'undefined')
      ? new LogisticsCenter(this)
      : new MedicalCenter(this);
    this.medicalCenter = this.logisticsCenter;
    // v3.23：教練證（升級教練用）
    this.coachCerts = 0;
    // v3.23：每位球員的場內統計（per-batter stats）
    this.playerBatterStats = {};
    this.commentaryGenerator = new CommentaryGenerator();
    this.uiRenderer = null;
    this.initialize7thTeamRoster(); // Initialize with real-stat CPBL expansion roster
    this.playerBattingOrder = [];
    this.playerNextBatterIndex = 0;
    this.defensiveSlots = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
    this.defensiveAssignments = {};
    this.defensiveShift = 'standard';
    this.opponentDefensiveShift = 'standard';
    this.rotationOrder = [];
    this.rotationSlot = 0;
    this.scoutingReports = { local: false, international: false };
    this.baserunningMode = 'normal';
    this.offenseApproach = 'normal';
    this.pitchPlan = 'balanced';
    this.opponentOffenseApproach = 'normal';
    this.opponentPitchPlan = 'balanced';
    this.battingStrategy = 'standard';
    this.opponentBattingStrategy = 'standard';
    this.battingTargetZone = 4; // 3x3 center
    this.opponentTargetZone = 4;
    this.battingVelocityLock = 'none';
    this.opponentVelocityLock = 'none';
    this.pitchAimCell = 12; // 5x5 center
    this.pitchEffort = 'normal';
    this.opponentPitchEffort = 'normal';
    this.lastPitchContext = null;
    this.lastInPlayContext = null;
    this.opponentUseBurnLife = false;
    this.pickoffAttemptsThisHalf = 0;
    // v4.1 #6：對決模式（'pitch' = 投球；'pickoff' = 鎖定牽制）。對決開始鈕依此路由。
    this.duelMode = 'pitch';
    // v4.1 3C'：玩家指定的實際球種名稱（null = 交給配球邏輯自動選）。只影響我方投球。
    this.playerPitchChoice = null;
    // Phase 0：打席脈絡（配球歷史、打者預期狀態、投手使用統計）。每打席開始時重建。
    this.atBatContext = null;
    this.managementLog = [];
    // v3.22：賽事統計（每場比賽重置）
    this.matchStats = { playerK: 0, playerBB: 0, playerHR: 0, opponentK: 0, opponentBB: 0, opponentHR: 0, keyEvents: [] };
    // v1.14：教練資料來自 data.js（COACHES_DATA）
    this.coaches = Array.isArray(window.COACHES_DATA) && window.COACHES_DATA.length
      ? window.COACHES_DATA.map(coach => ({ ...coach }))
      : [
          { id: 'hitting', name: '打擊教練', bonus: '巧打/長打 +2', hitting: 2, heat: 0 },
          { id: 'pitching', name: '投手教練', bonus: '控球/球威 +2', pitching: 2, heat: 0 },
          { id: 'defense', name: '守備教練', bonus: '守備 +3', defense: 3, heat: 0 },
          { id: 'conditioning', name: '體能教練', bonus: '恢復力 +6，傷病風險下降', recovery: 6, heat: 0 },
          { id: 'marketing', name: '人氣教練', bonus: '球場熱度 +8', heat: 8 }
        ];
    this.activeCoachId = this.coaches[0]?.id || 'hitting';
    // v1.14：一軍上限（最多 22 人，可在這裡調整）
    this.majorRosterLimit = 22;
    // v1.14：碎片系統與已抽過名單
    this.playerShards = 0;
    this.collectedPlayerKeys = new Set();
    this.unlockedHeroes = [];
    this.leagueStandings = this.createInitialStandings();
    this.currentSeasonEvent = null;
    this.crowdEnergy = 50;
    this.normalizeManagementState();
    this.currentSeasonEvent = { title: '開幕戰', text: '擴編球隊首次亮相，球迷期待值上升。' };
    // v1.14：把已在隊上的球員都列入已收集，後續抽到同名就會變碎片
    this.roster.players.forEach(p => this.collectedPlayerKeys.add(this.playerKey(p)));

    // ===== v1.18 新增狀態 =====
    // 主場
    this.currentStadiumId = (typeof window !== 'undefined' && window.HOME_STADIUM_ID) || 'nccu';
    // 教練團（一軍總教練/投手教練/打擊教練/守備教練/體能教練/跑壘教練）
    this.coachingStaff = { head: null, pitching: null, batting: null, defense: null, conditioning: null, baserunning: null };
    // 已聘僱的教練 id（從 COACHES_POOL 抽出來的）
    this.hiredCoaches = [];
    // 球員等級
    this.roster.players.forEach(p => {
      if (!p.playerLevel) p.playerLevel = 1;
      if (!p.playerXP) p.playerXP = 0;
      if (!p.rating && p.sourceStats?.rating) p.rating = p.sourceStats.rating;
    });
    // 季後賽狀態
    this.halfSeason = 'first';      // 'first' / 'second'
    this.firstHalfChamp = null;
    this.secondHalfChamp = null;
    this.playoffStage = null;
    // 賽程長度更新為一季 40 場（上下半季各 20）
    if (this.seasonManager) this.seasonManager.seasonLength = 40;

    // ===== v2.11 新增狀態 =====
    // 主線劇情：年份從 2026 開始，4 季 = 2026~2029，第 5 年 = WBC 2030
    this.currentYear = 2026;
    // 歷史戰績：每年一筆 {year, wins, losses, firstHalfChamp, secondHalfChamp, finalRank, playoffResult, wbcPointsThisYear}
    this.seasonHistory = [];
    // WBC 累計積分（每隊一個 key），4 季結束後比積分
    this.wbcPointsByTeam = {};
    // 主線階段：'cpbl_seasons' (1-4 季) / 'wbc_qualified' / 'wbc_eliminated' / 'wbc_running' / 'game_over'
    this.storylineStage = 'cpbl_seasons';
    // WBC 對戰結果（取得代表權後使用）
    this.wbcBracket = null;
    // 是否已經顯示過主線劇情開場
    this.storylineIntroShown = false;
    // v4.1 Phase 4：是否已完成新手教學
    this.tutorialCompleted = false;

    // v2.11 #5：補初始開場廣播（讓玩家第一場就有歡迎詞）
    const initStadium = window.STADIUMS_DATA?.[this.currentStadiumId];
    if (this.opponentTeam && initStadium) {
      const openingC = pickCommentary('opening', TEAM_NAME_DISPLAY, this.currentOpponent || this.opponentTeam.name, initStadium.name);
      if (openingC) this.log.push(`📢 ${openingC}`);
    }
  }

  ensureUIRenderer() {
    if (!this.uiRenderer && typeof window !== 'undefined' && window.GameUIRenderer && typeof document !== 'undefined') {
      this.uiRenderer = new window.GameUIRenderer(document);
    }
    return this.uiRenderer;
  }

  // v1.14：球員唯一識別 key（國際巨星用 englishName，本土用 name + team）
  playerKey(player) {
    if (!player) return '';
    if (player.englishName) return `intl:${player.englishName}`;
    if (player.sourceStats?.source === 'International star preset') return `intl:${player.englishName || player.name}`;
    if (player.traits?.includes && player.traits.includes('傳奇英雄')) return `legend:${player.name}`;
    return `local:${player.name}`;
  }

  initialize7thTeamRoster() {
    // v1.14：使用 data.js 內的 INITIAL_ROSTER_SPEC 建立初始陣容
    //   - 9 名固定守備位置的野手（C / 1B / 2B / 3B / SS / LF / CF / RF / DH）
    //   - 數位候補野手
    //   - 5 名先發投手 + 5 名後援投手
    //
    // 如果 data.js 抓不到，會 fallback 到舊版的簡略名單
    const sourcePlayers = [...this.statMapper.cpblBatters, ...this.statMapper.cpblPitchers];
    const addedNames = new Set();

    const addPlayer = (name, opts = {}) => {
      const playerData = sourcePlayers.find(p => p.name === name);
      if (!playerData) return false;
      if (addedNames.has(playerData.name)) return false;
      const player = this.statMapper.createPlayerFromStats(playerData, {
        growthPotential: opts.growthPotential ?? (playerData.role === 'P' ? 20 : 30),
        injuryProbability: opts.injuryProbability ?? (playerData.role === 'P' ? 0.04 : 0.025),
        ageDecline: opts.ageDecline ?? 0.01
      });
      // v1.14：強制套上指定的 pitcherRole 與守位
      if (opts.pitcherRole) player.pitcherRole = opts.pitcherRole;
      if (opts.assignedPosition) player.position = opts.assignedPosition;
      this.roster.addPlayer(player);
      addedNames.add(playerData.name);
      return true;
    };

    const spec = window.INITIAL_ROSTER_SPEC;
    if (spec && spec.fielders) {
      // 1. 九守備位置
      const positionOrder = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
      positionOrder.forEach(pos => {
        const wantedName = spec.fielders[pos];
        if (wantedName && addPlayer(wantedName, { assignedPosition: pos })) return;
        // fallback：從同位置池子裡找一個還沒加的野手
        const candidate = this.statMapper.cpblBatters.find(p =>
          !addedNames.has(p.name) && String(p.position).split('/').includes(pos)
        ) || this.statMapper.cpblBatters.find(p => !addedNames.has(p.name));
        if (candidate) addPlayer(candidate.name, { assignedPosition: pos });
      });
      // 2. 候補野手
      (spec.bench || []).forEach(name => addPlayer(name));
      // 3. 先發投手
      (spec.rotation || []).forEach(name => addPlayer(name, { pitcherRole: 'SP' }));
      // 補滿 5 位先發
      while (this.roster.players.filter(p => p.canPitch() && p.pitcherRole === 'SP').length < 5) {
        const candidate = this.statMapper.cpblPitchers.find(p =>
          !addedNames.has(p.name) && (p.position === 'SP' || String(p.position).includes('SP'))
        );
        if (!candidate) break;
        addPlayer(candidate.name, { pitcherRole: 'SP' });
      }
      // 4. 後援投手
      (spec.bullpen || []).forEach(name => addPlayer(name, { pitcherRole: 'RP' }));
      // 補滿 5 位後援
      while (this.roster.players.filter(p => p.canPitch() && p.pitcherRole === 'RP').length < 5) {
        const candidate = this.statMapper.cpblPitchers.find(p =>
          !addedNames.has(p.name) && (p.position === 'RP' || String(p.position).includes('RP'))
        );
        if (!candidate) {
          // 沒有純後援可挑就把先發抓來轉任後援（救援場面）
          const fallback = this.statMapper.cpblPitchers.find(p => !addedNames.has(p.name));
          if (!fallback) break;
          addPlayer(fallback.name, { pitcherRole: 'RP' });
        } else {
          addPlayer(candidate.name, { pitcherRole: 'RP' });
        }
      }
    } else {
      // 沒有 data.js 時的最簡 fallback：和 v1.13 行為一致
      const defaultNames = ['張育成', '范國宸', '林安可', '陳晨威', '李凱威', '許基宏', '郭天信', '江坤宇', '羅戈', '威能帝', '林詩翔'];
      defaultNames.forEach(name => addPlayer(name));
    }
  }

  generateOpponentTeam(teamName) {
    const teamData = this.statMapper.cpblTeams[teamName];
    const pitcherData = teamData.players.find(p => p.role === 'P') || this.statMapper.cpblPitchers[0];
    let battersData = teamData.players.filter(p => p.role === 'B');
    let bullpenData = teamData.players.filter(p => p.role === 'P' && p.name !== pitcherData.name);
    if (battersData.length < 9) {
      const names = new Set(battersData.map(p => p.name));
      const fillers = this.statMapper.cpblBatters.filter(p => !names.has(p.name));
      battersData = [...battersData, ...fillers].slice(0, 9);
    }
    if (bullpenData.length < 4) {
      const usedPitchers = new Set([pitcherData.name, ...bullpenData.map(p => p.name)]);
      bullpenData = [
        ...bullpenData,
        ...this.statMapper.cpblPitchers.filter(p => !usedPitchers.has(p.name))
      ].slice(0, 4);
    }

    const pitcher = this.statMapper.createPlayerFromStats(pitcherData, { growthPotential: 0, injuryProbability: 0.03, ageDecline: 0 });
    pitcher.pitcherRole = 'SP';
    const battingOrder = battersData.slice(0, 9).map(batterData =>
      this.statMapper.createPlayerFromStats(batterData, { growthPotential: 0, injuryProbability: 0.02, ageDecline: 0 })
    );
    const bullpen = bullpenData.map(relieverData => {
      const reliever = this.statMapper.createPlayerFromStats(relieverData, { growthPotential: 0, injuryProbability: 0.02, ageDecline: 0 });
      reliever.pitcherRole = 'RP';
      return reliever;
    });

    return {
      name: teamName,
      pitcher: pitcher,
      bullpen: bullpen,
      battingOrder: battingOrder,
      nextBatterIndex: 0,
      getCurrentBatter: function() { return this.battingOrder[this.nextBatterIndex]; },
      advanceBatter: function() { this.nextBatterIndex = (this.nextBatterIndex + 1) % this.battingOrder.length; },
      getUpcomingBatters: function() { return [1,2,3].map(offset => this.battingOrder[(this.nextBatterIndex + offset) % this.battingOrder.length]); },
      resetLineup: function() { this.nextBatterIndex = 0; }
    };
  }

  createInitialStandings() {
    const teams = ['政治大學棒球隊', ...this.opponentTeams];
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

  // v4.1：套用「一軍教練→對應族群球員」的能力加成（可逆 delta，不污染基礎值）
  // 在部署/卸任/升級教練（logistics-system）、載入存檔、每場賽前都會呼叫
  applyCoachAbilityBonuses() {
    if (!this.logisticsCenter || !this.roster || !Array.isArray(this.roster.players)) return;
    const contribs = (typeof this.logisticsCenter.getMajorAbilityContributions === 'function')
      ? this.logisticsCenter.getMajorAbilityContributions() : [];
    this.roster.players.forEach(player => {
      if (!player || !player.abilities) return;
      const oldDelta = player.coachAbilityDelta || {};
      // 1) 先移除上一輪加成（可逆）
      for (const k of Object.keys(oldDelta)) {
        if (typeof player.abilities[k] === 'number') player.abilities[k] -= oldDelta[k];
      }
      // 2) 計算這一輪加成（僅一軍 + 對應族群）
      const newDelta = {};
      if (player.level !== 'minor') {
        const canP = typeof player.canPitch === 'function' && player.canPitch();
        const canB = typeof player.canBat === 'function' && player.canBat();
        contribs.forEach(c => {
          const applies = c.group === 'pitcher' ? canP : canB;
          if (!applies) return;
          c.abilities.forEach(ab => {
            if (typeof player.abilities[ab] === 'number') {
              newDelta[ab] = (newDelta[ab] || 0) + c.amount;
            }
          });
        });
      }
      // 3) 套用新加成，夾 99，記錄實際套用量確保可逆
      for (const k of Object.keys(newDelta)) {
        const before = player.abilities[k];
        const after = Math.min(99, before + newDelta[k]);
        newDelta[k] = after - before;
        player.abilities[k] = after;
      }
      player.coachAbilityDelta = newDelta;
    });
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
    updateTeam('政治大學棒球隊', result === 'Win');
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
    // v1.14：rotation 只放先發投手（pitcherRole === 'SP'）
    this.rotationOrder = this.rotationOrder.filter(index => this.roster.players[index].pitcherRole === 'SP');
    pitcherIndexes.forEach(index => {
      if (this.roster.players[index].pitcherRole === 'SP' && !this.rotationOrder.includes(index)) {
        this.rotationOrder.push(index);
      }
    });
    this.rotationSlot = this.rotationOrder.length ? this.rotationSlot % this.rotationOrder.length : 0;

    // v1.14：牛棚（後援投手）獨立列表
    if (!Array.isArray(this.bullpenOrder)) this.bullpenOrder = [];
    this.bullpenOrder = this.bullpenOrder.filter(index => pitcherIndexes.includes(index) && this.roster.players[index].pitcherRole === 'RP');
    pitcherIndexes.forEach(index => {
      if (this.roster.players[index].pitcherRole === 'RP' && !this.bullpenOrder.includes(index)) {
        this.bullpenOrder.push(index);
      }
    });

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
    // 1. 保留已有的合法分配
    this.defensiveSlots.forEach(slot => {
      const existing = this.defensiveAssignments?.[slot];
      if (existing !== undefined && this.playerBattingOrder.includes(existing) && !used.has(existing)) {
        assigned[slot] = existing;
        used.add(existing);
      }
    });

    // v1.14：2. 把主守位剛好等於空位的球員優先排上去（讓初始陣容的守位被尊重）
    this.defensiveSlots.forEach(slot => {
      if (assigned[slot] !== undefined) return;
      const direct = this.playerBattingOrder.find(index => {
        if (used.has(index)) return false;
        const player = this.roster.players[index];
        if (!player) return false;
        return player.getPrimaryPositions().includes(slot);
      });
      if (direct !== undefined) {
        assigned[slot] = direct;
        used.add(direct);
      }
    });

    // 3. 剩下用最小懲罰補上
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
        defenseLabel: '政治大學棒球隊'
      };
    }
    return {
      battingTeam: 'player',
      fieldingTeam: 'opponent',
      pitcher: this.opponentTeam.pitcher,
      batter: this.getPlayerBatter(),
      offenseLabel: '政治大學棒球隊',
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
    const player = this.roster.players[index];
    if (!player || !player.canBat() || player.level === 'minor' || !this.playerBattingOrder.includes(index)) {
      this.addManagementLog(`${player?.name || '球員'} 需要在一軍打線內才能安排守位。`);
      return false;
    }
    const currentSlot = this.defensiveSlots.find(slot => this.defensiveAssignments[slot] === index);
    const naturalSlots = player.getPrimaryPositions().filter(slot => this.defensiveSlots.includes(slot));
    const cycleSlots = [...new Set([...naturalSlots, ...this.defensiveSlots])];
    const start = currentSlot ? cycleSlots.indexOf(currentSlot) + 1 : 0;
    const nextSlot = cycleSlots[(start < 0 ? 0 : start) % cycleSlots.length];
    const occupant = this.defensiveAssignments[nextSlot];
    if (currentSlot) {
      if (occupant !== undefined && occupant !== index) {
        this.defensiveAssignments[currentSlot] = occupant;
      } else {
        delete this.defensiveAssignments[currentSlot];
      }
    }
    this.defensiveAssignments[nextSlot] = index;
    this.saveManager.save(this);
    this.updateUI();
    return nextSlot;
  }

  assignDefenseSlot(slot, index) {
    this.normalizeManagementState();
    const player = this.roster.players[index];
    if (!this.defensiveSlots.includes(slot) || !player || !player.canBat() || !this.playerBattingOrder.includes(index)) return false;
    const currentSlot = this.defensiveSlots.find(position => this.defensiveAssignments[position] === index);
    const occupant = this.defensiveAssignments[slot];
    if (currentSlot && currentSlot !== slot) {
      if (occupant !== undefined && occupant !== index) {
        this.defensiveAssignments[currentSlot] = occupant;
      } else {
        delete this.defensiveAssignments[currentSlot];
      }
    }
    if (occupant === index) return true;
    this.defensiveAssignments[slot] = index;
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  // v1.14：兩個守位之間互換球員（拖拽守位用）
  swapDefenseSlots(fromSlot, toSlot) {
    if (!this.defensiveSlots.includes(fromSlot) || !this.defensiveSlots.includes(toSlot)) return false;
    if (fromSlot === toSlot) return false;
    const fromIndex = this.defensiveAssignments[fromSlot];
    const toIndex = this.defensiveAssignments[toSlot];
    if (fromIndex === undefined && toIndex === undefined) return false;
    if (toIndex === undefined) {
      delete this.defensiveAssignments[fromSlot];
      this.defensiveAssignments[toSlot] = fromIndex;
    } else if (fromIndex === undefined) {
      delete this.defensiveAssignments[toSlot];
      this.defensiveAssignments[fromSlot] = toIndex;
    } else {
      this.defensiveAssignments[fromSlot] = toIndex;
      this.defensiveAssignments[toSlot] = fromIndex;
    }
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  togglePlayerLevel(index) {
    const player = this.roster.players[index];
    if (!player) return false;
    return this.setPlayerLevel(index, player.level === 'minor' ? 'major' : 'minor');
  }

  // v1.14：直接指定球員去一軍或二軍（給 UI 拖拽用）
  setPlayerLevel(index, targetLevel) {
    const player = this.roster.players[index];
    if (!player) return false;
    if (targetLevel !== 'major' && targetLevel !== 'minor') return false;
    if (player.level === targetLevel) return false;

    const activeMajorCount = this.roster.players.filter(p => p.level !== 'minor').length;
    if (targetLevel === 'minor' && activeMajorCount <= 10) {
      this.addManagementLog('一軍人數太少，至少保留 10 人。');
      return false;
    }
    if (targetLevel === 'major' && activeMajorCount >= this.majorRosterLimit) {
      this.addManagementLog(`一軍名額已滿（${this.majorRosterLimit} 人），請先下放球員。`);
      return false;
    }

    player.level = targetLevel;
    if (targetLevel === 'minor') {
      this.playerBattingOrder = this.playerBattingOrder.filter(i => i !== index);
      this.rotationOrder = this.rotationOrder.filter(i => i !== index);
      this.bullpenOrder = (this.bullpenOrder || []).filter(i => i !== index);
      Object.keys(this.defensiveAssignments).forEach(slot => {
        if (this.defensiveAssignments[slot] === index) delete this.defensiveAssignments[slot];
      });
    }
    this.normalizeManagementState();
    this.addManagementLog(`${player.name} 已移至${targetLevel === 'minor' ? '二軍' : '一軍'}。`);
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  // v3.22：比賽是否已開始（任何球數或得分已發生）
  isMatchInProgress() {
    return this.inning > 1 || this.playerScore > 0 || this.opponentScore > 0 ||
           this.playerHits > 0 || this.opponentHits > 0;
  }

  // v3.22：對手投球傾向計算（依球數、壘況、投手球種）
  computeOpponentPitchTendency() {
    const pitcher = this.opponentTeam?.pitcher;
    const pitchTypes = Array.isArray(pitcher?.pitchTypes) ? pitcher.pitchTypes : [];
    const plan = this.opponentPitchPlan || 'balanced';
    const effort = this.opponentPitchEffort || 'normal';
    const b = this.balls, s = this.strikes;
    const runnersOn = this.playerRunners.filter(Boolean).length;
    const hasFB = pitchTypes.some(p => ['SFF','FF','SI','FC','FT'].includes(p) || String(p).includes('速'));
    const hasBR = pitchTypes.some(p => ['SL','CB','CU','KC'].includes(p) || /滑|曲|變化/.test(String(p)));
    const hasOS = pitchTypes.some(p => ['CH','FS','FK'].includes(p) || /指|叉|變速/.test(String(p)));
    let fb = plan==='fastball'?0.55 : plan==='breaking'?0.22 : plan==='waste'?0.28 : 0.40;
    let br = plan==='breaking'?0.52 : plan==='fastball'?0.20 : plan==='waste'?0.26 : 0.33;
    let os = plan==='waste'?0.38 : 0.17;
    // 球數調整
    if (b===3)                 { fb+=0.18; br-=0.10; }
    if (s===2)                 { br+=0.12; os+=0.06; fb-=0.10; }
    if (b===0 && s===0)        { fb+=0.06; }
    if (b===3 && s===2)        { fb+=0.08; br-=0.04; }
    if (effort==='full')       { fb+=0.08; br-=0.04; }
    if (effort==='easy')       { fb-=0.05; os+=0.05; }
    if (runnersOn>0 && s<2)    { fb+=0.05; }
    if (runnersOn>=2)          { br+=0.05; }
    if (!hasBR) { fb+=br*0.6; os+=br*0.4; br=0; }
    if (!hasOS) { fb+=os*0.6; br+=os*0.4; os=0; }
    if (!hasFB) { br+=fb*0.7; os+=fb*0.3; fb=0; }
    const total = fb+br+os; if (total<=0) return {fastball:0.40,breaking:0.35,offspeed:0.25};
    return { fastball:Math.max(0,Math.round(fb/total*100))/100, breaking:Math.max(0,Math.round(br/total*100))/100, offspeed:Math.max(0,Math.round(os/total*100))/100 };
  }

  selectStartingPitcher(index) {
    // v3.22：比賽進行中禁止更換先發（應使用 bringInReliever）
    if (this.isMatchInProgress()) {
      this.addManagementLog('比賽進行中無法更換先發投手，請使用「換投」功能。');
      return false;
    }
    if (!this.roster.setActivePitcher(index)) return false;
    const player = this.roster.players[index];
    // v1.14：若不是 SP，給訊息提示但仍允許指定
    if (player && player.pitcherRole !== 'SP') {
      this.addManagementLog(`提示：${player.name} 是後援投手，臨時擔任先發體力可能不足。`);
    }
    // 不在 rotation 裡也插進去（救火 SP）
    const rotationIndex = this.rotationOrder.indexOf(index);
    if (rotationIndex >= 0) {
      this.rotationSlot = rotationIndex;
    } else if (player && player.pitcherRole === 'SP') {
      this.rotationOrder.push(index);
      this.rotationSlot = this.rotationOrder.length - 1;
    }
    this.pitcher = this.roster.players[index];
    this.addManagementLog(`賽前指定先發投手：${this.pitcher.name}`);
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  // v1.14：比賽中換投（後援登板）
  bringInReliever(index) {
    const player = this.roster.players[index];
    if (!player || !player.canPitch() || player.level === 'minor') return false;
    this.roster.setActivePitcher(index);
    this.pitcher = player;
    this.addToLog(`【換投】${player.name} (${player.pitcherRole}) 登板！`);
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

  // v4.1 3C：直接設定跑壘風格（戰術旋鈕用）
  setBaserunningMode(mode) {
    if (!['conservative', 'normal', 'aggressive'].includes(mode)) return false;
    this.baserunningMode = mode;
    this.addManagementLog(`跑壘策略改為：${this.getBaserunningLabel()}`);
    this.saveManager.save(this);
    this.updateUI();
    return true;
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
    // v1.18 #1 #18：守備時不能調進攻策略
    if (this.currentHalf === 'top') {
      this.addToLog('守備半局無法調整進攻策略。');
      return false;
    }
    this.offenseApproach = mode;
    this.battingStrategy = LEGACY_OFFENSE_STRATEGY_MAP[mode] || 'standard';
    this.addManagementLog(`進攻策略改為：${this.getOffenseApproachLabel()}`);
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  getBattingStrategyLabel() {
    const profile = STRATEGY_PROFILE_MAP[this.battingStrategy] || STRATEGY_PROFILE_MAP.standard;
    return profile.label;
  }

  setBattingStrategy(strategyKey) {
    const key = getStrategyKey(strategyKey);
    if (this.currentHalf === 'top') {
      this.addToLog('守備半局無法調整進攻策略。');
      return false;
    }
    this.battingStrategy = key;
    if (key === 'patient') this.offenseApproach = 'patient';
    else if (key === 'aggressive') this.offenseApproach = 'aggressive';
    else this.offenseApproach = 'normal';
    this.addManagementLog(`打擊策略改為：${this.getBattingStrategyLabel()}`);
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  setBattingTargetZone(zoneIndex) {
    this.battingTargetZone = normalizeZoneIndex(zoneIndex, 3, this.battingTargetZone);
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  setBattingVelocityLock(lockMode) {
    if (!['fast', 'slow', 'none'].includes(lockMode)) return false;
    this.battingVelocityLock = lockMode;
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  setPitchAimCell(cellIndex) {
    this.pitchAimCell = normalizeZoneIndex(cellIndex, 5, this.pitchAimCell);
    // v3.25.3：同步更新 pitchAimPosition 為該格中心 cm 座標
    const idx = this.pitchAimCell;
    const col = idx % 5;
    const row = Math.floor(idx / 5);
    this.pitchAimPosition = { x: (col - 2) * 15, y: (2 - row) * 15 };
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  setPitchEffort(effort) {
    const key = normalizeEffortKey(effort);
    this.pitchEffort = key;
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  // v4.1 3C'：玩家選擇實際球種（傳 null 取消＝自動配球）。只在我方投球時生效。
  setPitchTypeChoice(name) {
    if (this.currentHalf === 'bottom') {
      this.addToLog('進攻半局無法選球種（那是對手投手的事）。');
      return false;
    }
    const pool = Array.isArray(this.pitcher?.pitchTypes) ? this.pitcher.pitchTypes : [];
    if (name && !pool.some(p => (p.name || p) === name)) return false;
    this.playerPitchChoice = name || null;
    if (typeof this.saveManager?.save === 'function') this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  // v4.1 #6：設定對決模式（'pitch' 投球 / 'pickoff' 鎖定牽制）。對決開始鈕依此路由執行。
  setDuelMode(mode) {
    let next = (mode === 'pickoff') ? 'pickoff' : 'pitch';
    // 進攻半局（我方打擊）不能鎖牽制 — 牽制是守備方行為
    if (next === 'pickoff' && this.currentHalf === 'bottom') {
      this.addToLog('進攻半局無法鎖定牽制（牽制是守備方行為）。');
      next = 'pitch';
    }
    this.duelMode = next;
    if (next === 'pickoff') this.addToLog('已鎖定牽制：按「對決開始」將執行牽制。');
    this.updateDuelModeUI();
    return true;
  }

  // 同步對決開始鈕標籤與牽制鈕的鎖定狀態到畫面
  updateDuelModeUI() {
    const isPickoff = this.duelMode === 'pickoff';
    const sub = (typeof document !== 'undefined') && document.getElementById('duel-start-sub');
    const startBtn = (typeof document !== 'undefined') && document.getElementById('duel-start');
    const pickoffBtn = (typeof document !== 'undefined') && document.getElementById('pickoff');
    if (sub) sub.textContent = isPickoff ? '牽制' : '投球';
    if (startBtn) startBtn.classList.toggle('duel-pickoff', isPickoff);
    if (pickoffBtn) {
      pickoffBtn.classList.toggle('active', isPickoff);
      pickoffBtn.setAttribute('aria-pressed', isPickoff ? 'true' : 'false');
    }
    // v4.1 3B：同步投手 console 的牽制旋鈕
    const knobPick = (typeof document !== 'undefined') && document.getElementById('knob-pickoff');
    const kvPick = (typeof document !== 'undefined') && document.getElementById('knob-val-pickoff');
    if (knobPick) {
      knobPick.classList.toggle('active', isPickoff);
      knobPick.setAttribute('aria-pressed', isPickoff ? 'true' : 'false');
    }
    if (kvPick) kvPick.textContent = isPickoff ? '開' : '關';
  }

  getPitchPlanLabel() {
    return { fastball: '速球為主', balanced: '混合配球', breaking: '變化球為主', waste: '壞球引誘' }[this.pitchPlan] || '混合配球';
  }

  setPitchPlan(plan) {
    if (!['fastball', 'balanced', 'breaking', 'waste'].includes(plan)) return false;
    // v1.18 #1 #18：進攻時不能調投球策略（那是對手的事）
    if (this.currentHalf === 'bottom') {
      this.addToLog('進攻半局無法調整我方投球策略（對手投手）。');
      return false;
    }
    this.pitchPlan = plan;
    this.addManagementLog(`投球策略改為：${this.getPitchPlanLabel()}`);
    this.saveManager.save(this);
    this.updateUI();
    return true;
  }

  // v3.21：玩家手動切換守備佈陣
  setDefensiveShift(shiftKey) {
    if (typeof DefenseStateBuilder === 'undefined') return false;
    if (!Object.prototype.hasOwnProperty.call(DefenseStateBuilder.DEFENSIVE_ALIGNMENTS, shiftKey)) return false;
    if (this.currentHalf === 'bottom') {
      this.addToLog('進攻半局無法調整守備佈陣。');
      return false;
    }
    this.defensiveShift = shiftKey;
    const label = DefenseStateBuilder.DEFENSIVE_ALIGNMENTS[shiftKey]?.label || shiftKey;
    this.addManagementLog(`守備佈陣改為：${label}`);
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
    // v1.18 #2 #3：訓練只給 XP，等級提升才會自動加屬性；資金（原球探點數）轉做訓練費用
    const plans = {
      hitting:  { label: '打擊特訓', cost: 80, xp: 60, category: 'batting' },
      defense:  { label: '守備特訓', cost: 70, xp: 50, category: 'defense' },
      running:  { label: '跑壘特訓', cost: 60, xp: 40, category: 'baserunning' },
      pitching: { label: '投手控球營', cost: 80, xp: 60, category: 'pitching' },
      stamina:  { label: '體能訓練', cost: 65, xp: 40, category: 'all' }
    };
    const plan = plans[focus];
    if (!plan) return { success: false, message: '未知訓練。' };
    if (this.currency < plan.cost) return { success: false, message: i18n.notEnoughCurrency };
    if (focus === 'pitching' && !player.canPitch()) return { success: false, message: '這名球員不是投手。' };
    if (['hitting', 'running'].includes(focus) && !player.canBat()) return { success: false, message: '這名球員不是野手。' };
    this.currency -= plan.cost;
    if (focus === 'stamina') {
      // 體能訓練特例：直接加 maxStamina
      player.maxStamina = clampInt(player.maxStamina + 2, 1, 120);
    }
    // 給予 XP（會自動升等與加屬性）
    awardPlayerXP(player, plan.xp, plan.category, this);
    player.pitchTypes = player.generatePitchTypes();
    this.addManagementLog(`${player.name} 完成${plan.label}，獲得 ${plan.xp} XP（Lv.${player.playerLevel}）。`);
    this.saveManager.save(this);
    this.updateUI();
    return { success: true, message: `${plan.label}完成：${player.name}` };
  }

  // ========== v1.18 #16：教練聘僱 ==========
  hireCoach(coachId, role) {
    if (typeof window === 'undefined' || !window.COACHES_POOL) return { success: false, message: '教練資料未載入' };
    const pool = window.COACHES_POOL;
    const coach = pool.find(c => c.id === coachId);
    if (!coach) return { success: false, message: '找不到此教練' };
    if (!this.hiredCoaches.includes(coachId)) {
      // 聘僱費用：SSR 800、SR 400、R 150
      const cost = { SSR: 800, SR: 400, R: 150 }[coach.rarity] || 200;
      if (this.currency < cost) return { success: false, message: `資金不足（需要 ${cost}）` };
      this.currency -= cost;
      this.hiredCoaches.push(coachId);
      this.addManagementLog(`🤝 已聘僱 ${coach.name}（${coach.rarity}）！`);
    }
    // 指派角色
    if (role && this.coachingStaff[role] !== undefined) {
      this.coachingStaff[role] = coach;
      this.addManagementLog(`📋 ${coach.name} 已指派為${this.coachRoleLabel(role)}。`);
    }
    this.saveManager.save(this);
    return { success: true, message: `已聘僱 ${coach.name}` };
  }

  coachRoleLabel(role) {
    return ({ head: '總教練', pitching: '投手教練', batting: '打擊教練',
             defense: '守備教練', conditioning: '體能教練', baserunning: '跑壘教練' })[role] || role;
  }

  drawCoach() {
    // v2.11：每次 200 資金；回傳 {success, coach, message} 給 UI 使用
    if (typeof window === 'undefined' || !window.COACHES_POOL) {
      return { success: false, message: '教練資料未載入。' };
    }
    const pool = window.COACHES_POOL;
    const cost = 100; // v4.1：教練池改用黃金棒球
    if ((this.goldBaseball || 0) < cost) {
      this.addManagementLog('黃金棒球不足，無法抽教練。');
      return { success: false, message: `黃金棒球不足（需要 ${cost}，目前 ${this.goldBaseball || 0}）` };
    }
    // 先檢查整體是否還抽得到任何教練
    const remaining = pool.filter(c => !this.hiredCoaches.includes(c.id));
    if (!remaining.length) {
      return { success: false, message: '所有教練都已聘僱完畢。' };
    }
    this.goldBaseball -= cost;
    // SSR 5%, SR 20%, R 75%
    const roll = Math.random();
    let rarity = 'R';
    if (roll < 0.05) rarity = 'SSR';
    else if (roll < 0.25) rarity = 'SR';
    let pickPool = remaining.filter(c => c.rarity === rarity);
    // v2.11 修正：若目標稀有度抽完，往下層稀有度補抽（避免抽到 undefined）
    if (!pickPool.length) {
      const fallbackOrder = rarity === 'SSR' ? ['SR', 'R'] : rarity === 'SR' ? ['R', 'SSR'] : ['SR', 'SSR'];
      for (const r of fallbackOrder) {
        const candidates = remaining.filter(c => c.rarity === r);
        if (candidates.length) { pickPool = candidates; rarity = r; break; }
      }
    }
    if (!pickPool.length) {
      // 應該不會走到這（前面已檢查 remaining），保險用
      this.goldBaseball += cost;
      return { success: false, message: '抽不到教練了。' };
    }
    const coach = pickPool[Math.floor(Math.random() * pickPool.length)];
    this.hiredCoaches.push(coach.id);
    this.addManagementLog(`🌟 抽到 ${coach.rarity} 教練：${coach.name}！`);
    this.saveManager.save(this);
    return { success: true, coach, message: `抽到 ${coach.rarity} 教練 ${coach.name}！` };
  }

  // v4.1：黃金棒球發放（任務／賽後／里程碑都走這裡，方便 Phase 4 接入）
  grantGoldBaseball(amount, reason = '') {
    if (!Number.isFinite(amount) || amount === 0) return;
    this.goldBaseball = Math.max(0, (this.goldBaseball || 0) + amount);
    const sign = amount > 0 ? '+' : '';
    this.addManagementLog(`⚾ 黃金棒球 ${sign}${amount}${reason ? `（${reason}）` : ''}`);
    if (this.saveManager) this.saveManager.save(this);
    if (typeof this.updateUI === 'function') this.updateUI();
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
    pitcher.consumeStamina(0.6); // v1.14：牽制扣 0.6
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
    // v3.25：「閃電俠」特質才加盜壘成功率，「快腿」天賦純顯示
    const stealTrait = runner.traits.includes('閃電俠') ? 0.10 : 0;
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
    this.recordTeamRuns(team, 1);
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
    const renderer = this.ensureUIRenderer();
    if (!renderer || typeof renderer.render !== 'function') return;
    renderer.render(this);
  }

  updateDiamondUI() {
    const renderer = this.ensureUIRenderer();
    if (!renderer || typeof renderer.updateDiamondUI !== 'function') return;
    renderer.updateDiamondUI(this);
  }

  updateRosterUI() {
    const renderer = this.ensureUIRenderer();
    if (!renderer || typeof renderer.updateRosterUI !== 'function') return;
    renderer.updateRosterUI(this);
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
    const renderer = this.ensureUIRenderer();
    if (!renderer || typeof renderer.updateOpponentUI !== 'function') return;
    renderer.updateOpponentUI(this);
  }

  updateBullpenUI() {
    const renderer = this.ensureUIRenderer();
    if (!renderer || typeof renderer.updateBullpenUI !== 'function') return;
    renderer.updateBullpenUI(this);
  }

  createEmptyLineScore() {
    return {
      player: Array(9).fill(0),
      opponent: Array(9).fill(0)
    };
  }

  resetBoxScore() {
    this.lineScore = this.createEmptyLineScore();
    this.playerHits = 0;
    this.opponentHits = 0;
    this.playerErrors = 0;
    this.opponentErrors = 0;
  }

  recordTeamHit(team) {
    if (team === 'opponent') this.opponentHits = (this.opponentHits || 0) + 1;
    else this.playerHits = (this.playerHits || 0) + 1;
  }

  recordTeamRuns(team, runs) {
    const total = Number(runs) || 0;
    if (total <= 0) return;
    if (!this.lineScore) this.lineScore = this.createEmptyLineScore();
    const key = team === 'opponent' ? 'opponent' : 'player';
    const inningIndex = Math.max(0, Math.min(8, (this.inning || 1) - 1));
    this.lineScore[key][inningIndex] = (this.lineScore[key][inningIndex] || 0) + total;
  }

  getLineScoreValue(team, inningNumber) {
    if (!this.lineScore) this.lineScore = this.createEmptyLineScore();
    const key = team === 'opponent' ? 'opponent' : 'player';
    return this.lineScore[key]?.[inningNumber - 1] || 0;
  }

  updateClassicScoreboard(matchup = this.getCurrentMatchup()) {
    const renderer = this.ensureUIRenderer();
    if (!renderer || typeof renderer.updateClassicScoreboard !== 'function') return;
    renderer.updateClassicScoreboard(this, matchup);
  }

  resetCount() {
    this.balls = 0;
    this.strikes = 0;
  }

  advanceRunners(outcome, team = 'player', batter = null, precomputedAdvance = null) {
    if (typeof BaserunningEngine === 'undefined') {
      console.error('[advanceRunners] BaserunningEngine 未載入，請確認 baserunning-engine.js 已在 game.js 之前引入。');
      return;
    }
    const runners = team === 'opponent' ? this.opponentRunners : this.playerRunners;
    const scoreKey = team === 'opponent' ? 'opponentScore' : 'playerScore';
    const hitter = batter || this.getCurrentMatchup().batter;
    const scoreBefore = this[scoreKey];
    const result = precomputedAdvance || BaserunningEngine.resolveAdvance({
      outcome,
      runners,
      hitter,
      advanceBonus: this.getRunnerAdvanceBonus(),
      rng: Math.random
    });
    if (result.isHit) this.recordTeamHit(team);
    runners[0] = result.runners[0] || null;
    runners[1] = result.runners[1] || null;
    runners[2] = result.runners[2] || null;
    this[scoreKey] += result.runs;
    this.recordTeamRuns(team, this[scoreKey] - scoreBefore);
    const baseOuts = Array.isArray(result.outsOnBases) ? result.outsOnBases.length : 0;
    const outsToRecord = Math.min(baseOuts, Math.max(0, 3 - this.outs));
    for (let i = 0; i < outsToRecord; i++) {
      this.recordOut();
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

  // addToLog(message, opts?)
  // opts: { type: 'hr'|'hit'|'k'|'bb'|'out'|'error'|'sb'|'run'|'system'|'tension'|'double'|'triple',
  //          level: 'normal'|'highlight',
  //          lines: [{speaker:'caster'|'color', text}, ...] }  ← v4.2b 雙人播報格式
  addToLog(message, opts = {}) {
    // 正規化：支援只傳字串（舊呼叫點向下相容）
    if (typeof message === 'string' && arguments.length === 1) {
      opts = { type: 'system', level: 'normal' };
    }
    const entry = (typeof message === 'object' && message.text != null) ? message : { text: String(message) };
    entry.type  = opts.type  || entry.type  || 'system';
    entry.level = opts.level || entry.level || 'normal';
    if (opts.lines && !entry.lines) entry.lines = opts.lines;

    this.log.push(entry);
    // v3.22：即時追蹤關鍵事件供賽後回顧
    if (this.matchStats && entry.text) {
      const txt = (typeof entry.text === 'string' ? entry.text : String(entry.text)).replace(/<[^>]+>/g, '');
      const isOffense = this.currentHalf === 'bottom'; // 我方進攻
      if (txt.includes('本壘打') || txt.includes('全壘打')) {
        if (isOffense) this.matchStats.playerHR++; else this.matchStats.opponentHR++;
        if (this.matchStats.keyEvents.length < 12) this.matchStats.keyEvents.push({ inning: this.inning, half: this.currentHalf, txt });
      } else if (txt.includes('三振') && !txt.includes('保送')) {
        if (!isOffense) this.matchStats.playerK++; else this.matchStats.opponentK++;
      } else if (txt.includes('保送') || txt.includes('四壞球')) {
        if (isOffense) this.matchStats.playerBB++; else this.matchStats.opponentBB++;
      } else if ((txt.includes('安打') || txt.includes('二壘安打') || txt.includes('三壘安打')) && this.matchStats.keyEvents.length < 12) {
        this.matchStats.keyEvents.push({ inning: this.inning, half: this.currentHalf, txt });
      }
      // v3.23：per-batter stats 追蹤
      this._trackPerPlayerStats(txt, isOffense);
    }
    // v4.2a：事件音效
    this._triggerEventSFX(typeof entry.text === 'string' ? entry.text : String(entry.text || ''));
    this.updateUI();
  }

  // v4.2a：從 addToLog 文字辨識事件類型並觸發對應 SFX
  _triggerEventSFX(txt) {
    if (typeof window === 'undefined' || !window.SoundManager) return;
    const raw = txt.replace(/<[^>]+>/g, '');
    if (raw.includes('全壘打') || raw.includes('本壘打'))       SoundManager.playSFX('homerun');
    else if (raw.includes('三振'))                             SoundManager.playSFX('strikeout');
    else if (raw.includes('安打'))                             SoundManager.playSFX('hit');
    else if (raw.includes('界外'))                             SoundManager.playSFX('foul');
    else if (raw.includes('接殺') || (raw.includes('出局') && raw.includes('球'))) SoundManager.playSFX('catch');
    else if (raw.includes('得分') || raw.includes('回本壘'))   SoundManager.playSFX('cheer');
  }

  // v3.23：依當前打者/投手把事件累加到 playerBatterStats
  _trackPerPlayerStats(txt, isOffense) {
    if (!this.playerBatterStats) this.playerBatterStats = {};
    const batter = isOffense ? this.batter : null;
    const pitcher = !isOffense ? this.pitcher : null;
    // 打者
    if (batter && batter.name) {
      const s = this.playerBatterStats[batter.name] = this.playerBatterStats[batter.name] || { ab: 0, h: 0, hr: 0, rbi: 0, k: 0, bb: 0, r: 0 };
      if (txt.includes('本壘打') || txt.includes('全壘打')) { s.h++; s.hr++; s.ab++; }
      else if (/[一二三]壘安打|安打/.test(txt) && !txt.includes('保送')) { s.h++; s.ab++; }
      else if (txt.includes('三振')) { s.k++; s.ab++; }
      else if (txt.includes('保送') || txt.includes('四壞')) { s.bb++; }
      else if (txt.includes('出局') && /滾地|飛球|接殺|內野|外野/.test(txt)) { s.ab++; }
    }
    // 投手
    if (pitcher && pitcher.name) {
      const s = this.playerBatterStats[pitcher.name] = this.playerBatterStats[pitcher.name] || { ip: 0, k: 0, bb: 0, er: 0 };
      if (txt.includes('三振')) s.k = (s.k || 0) + 1;
      if (txt.includes('保送') || txt.includes('四壞')) s.bb = (s.bb || 0) + 1;
    }
  }

  addManagementLog(message) {
    this.managementLog.push(message);
    this.managementLog = this.managementLog.slice(-30);
    this.updateUI();
  }

  // v4.2b：使用 BroadcastGenerator 產生雙人播報 + 隨機閒聊/冷笑話
  addCommentary(outcomeKey, player, cardActive = false, extra = {}) {
    // 初始化 broadcast generator（若尚未建立）
    if (!this._broadcastGen) {
      this._broadcastGen = (typeof BroadcastGenerator !== 'undefined')
        ? new BroadcastGenerator() : null;
    }
    // 初始化 banter 追蹤（每場重置）
    if (!this._banterClock) this._banterClock = 0;

    const tension = this._estimateTension();
    const lines = this._broadcastGen
      ? this._broadcastGen.generateCall(outcomeKey, player, extra)
      : null;

    // 決定事件類型（給 color coding 用）
    const typeMap = {
      homeRun: 'hr', strikeout: 'k', single: 'hit', double: 'double',
      triple: 'triple', groundOut: 'out', flyOut: 'out', popupOut: 'out',
      walk: 'bb', error: 'error', stolenBase: 'sb', runScored: 'run'
    };
    const evType = typeMap[outcomeKey] || 'system';
    const evLevel = (outcomeKey === 'homeRun' || extra.walkoff || extra.grandSlam) ? 'highlight' : 'normal';

    if (lines && lines.length) {
      this.addToLog({ text: lines.map(l => l.text).join(' '), lines, type: evType, level: evLevel });
    } else {
      // fallback 舊格式
      const text = this.commentaryGenerator.generateCommentary(outcomeKey, player, cardActive, extra);
      if (text) this.addToLog(text, { type: evType, level: evLevel });
    }

    // v4.2b：閒聊/冷笑話觸發（在低張力事件後，機率觸發）
    this._banterClock++;
    if (this._banterClock >= 3 && tension < 7 && this._broadcastGen) {
      // 先試冷笑話（低機率）
      const joke = this._broadcastGen.maybeDadJoke(tension);
      if (joke && joke.lines) {
        this.addToLog({ text: joke.lines.map(l => l.text).join(' '), lines: joke.lines, type: 'tension', level: 'normal' });
      } else {
        // 再試閒聊
        const banter = this._broadcastGen.maybeBanter(tension, this.currentHalf);
        if (banter && banter.lines) {
          this.addToLog({ text: banter.lines.map(l => l.text).join(' '), lines: banter.lines, type: 'system', level: 'normal' });
        }
      }
      this._banterClock = 0;
    }
  }

  // v4.2b：估算當前比賽張力（0-10，0=超鬆／10=九局下半平手）
  _estimateTension() {
    let t = 3; // baseline
    if (this.inning >= 7) t += 2;
    if (this.inning >= 9) t += 1;
    const diff = Math.abs((this.playerScore || 0) - (this.opponentScore || 0));
    if (diff <= 1) t += 2;
    else if (diff <= 3) t += 1;
    else t -= 1;
    if (this.outs >= 2 && this.currentHalf === 'bottom') t += 1;
    const runnersOn = (this.playerRunners || []).filter(Boolean).length + (this.opponentRunners || []).filter(Boolean).length;
    if (runnersOn >= 2) t += 2;
    else if (runnersOn === 1) t += 1;
    return Math.max(0, Math.min(10, t));
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
      this.addToLog(`攻守交換！${i18n.bottomOf} ${this.inning}，政治大學棒球隊進攻。`);
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
      this.addToLog(`攻守交換！${i18n.inningStart}${this.inning}${i18n.inningEnd}，政治大學棒球隊守備。`);
    }
    // v4.1 CRT：換局重置牽制鎖定
    this.duelMode = 'pitch';
    if (typeof this.updateDuelModeUI === 'function') this.updateDuelModeUI();
    this.updateUI();
    // v4.1 CRT：換局時自動彈出記分板 overlay（含本局結束的 linescore）；全場自動模式不彈，避免卡住
    if (!this.autoSimEnabled && typeof window !== 'undefined' && typeof window.showInningScoreboard === 'function') {
      const halfTxt = this.currentHalf === 'bottom' ? `${this.inning} 局下` : `${this.inning} 局上`;
      window.showInningScoreboard(`換局 ▸ ${halfTxt}`);
    }
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
      this.recordTeamRuns('opponent', opponentRuns);
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
    // v4.1：每場賽前依當前教練部署重算一軍能力加成
    if (typeof this.applyCoachAbilityBonuses === 'function') this.applyCoachAbilityBonuses();
    // v2.11 #10：清空上一場的轉播日誌
    this.log = [];
    // v4.2b：重置廣播生成器狀態（每場新比賽重置笑話/閒聊記錄）
    this._banterClock = 0;
    if (this._broadcastGen) this._broadcastGen.resetForMatch();
    // v3.22：重置賽事統計
    this.matchStats = { playerK: 0, playerBB: 0, playerHR: 0, opponentK: 0, opponentBB: 0, opponentHR: 0, keyEvents: [] };
    // v3.23：重置 per-batter stats
    this.playerBatterStats = {};
    this.inning = 1;
    this.outs = 0;
    this.currentHalf = 'top';   // 重新從上半局開始
    this.pickoffAttemptsThisHalf = 0;
    this.resetCount();
    this.playerRunners = [null, null, null];
    this.opponentRunners = [null, null, null];
    this.playerScore = 0;
    this.opponentScore = 0;
    this.resetBoxScore();
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
    this.opponentOffenseApproach = 'normal';
    this.opponentPitchPlan = 'balanced';
    this.opponentBattingStrategy = 'standard';
    this.opponentTargetZone = 4;
    this.opponentVelocityLock = 'none';
    this.opponentPitchEffort = 'normal';
    // v1.18 #10：依對手選擇球場（50% 主場、50% 客場）
    this.currentStadiumId = pickStadiumForOpponent(this.currentOpponent);
    const stadiumName = (window.STADIUMS_DATA?.[this.currentStadiumId]?.name) || '主場';
    this.currentTactic = i18n.normal;
    this.addManagementLog(`${i18n.startingMatch} vs ${this.currentOpponent} 於 ${stadiumName} --- 先發投手：${this.pitcher.name}`);
    // v1.18 #15：主播開場
    const openingC = pickCommentary('opening', TEAM_NAME_DISPLAY, this.currentOpponent, stadiumName);
    if (openingC) this.addToLog(`📢 ${openingC}`);
    this.applySeasonEvent();
    this.saveManager.save(this);
  }

  recoverPlayersBetweenGames() {
    const recoveryBonus = this.getTeamBonuses().recovery || 0;
    this.roster.players.forEach(player => {
      // v1.14：先處理投手場間恢復
      if (player.canPitch()) {
        // 上場過的投手：歸零休息天數；沒上場的：休息 +1
        if (player.pitchedLastGame) {
          player.daysOfRest = 0;
          player.pitchedLastGame = false;
        } else {
          player.daysOfRest = Math.min(7, (player.daysOfRest || 0) + 1);
        }
        // 體力恢復隨身分：SP 慢、RP 快
        let recovery;
        if (player.pitcherRole === 'SP') recovery = 22 + recoveryBonus;
        else if (player.pitcherRole === 'RP') recovery = 45 + recoveryBonus;
        else recovery = 30 + recoveryBonus;
        if (player.level === 'minor') recovery += 18;
        player.state.stamina = clampInt(player.state.stamina + recovery, 0, player.maxStamina);
      } else {
        // 野手：照舊 32 點恢復
        const recovery = (player.level === 'minor' ? 45 : 32) + recoveryBonus;
        player.state.stamina = clampInt(player.state.stamina + recovery, 0, player.maxStamina);
      }
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
    // v4.1：海外池用黃金棒球，本土池維持資金
    const useGold = pool === 'international';
    const cost = 100;
    if (useGold) {
      if ((this.goldBaseball || 0) < cost) {
        this.addManagementLog('黃金棒球不足（海外池需用黃金棒球，可由任務／賽後／里程碑取得）。');
        return;
      }
      this.goldBaseball -= cost;
    } else {
      if (this.currency < cost) {
        this.addManagementLog(i18n.notEnoughCurrency);
        return;
      }
      this.currency -= cost;
    }
    const player = this.gacha.drawPlayer(pool);
    this._acquireDrawnPlayer(player, pool);
    this.saveManager.save(this);
    this.updateUI();
    if (typeof renderShardShop === 'function') renderShardShop();
  }

  // v4.1：把抽到的球員放進名單／重複轉碎片（單抽與 11 連抽共用）
  _acquireDrawnPlayer(player, pool) {
    const key = this.playerKey(player);
    // v1.14：抽到已收集的球員 → 轉換成碎片
    if (this.collectedPlayerKeys.has(key)) {
      const shardGain = pool === 'international' ? 8 : 5;
      this.playerShards += shardGain;
      // v3.23：同時加到該球員的個人碎片庫（用於品階提升）
      const existing = this.roster.players.find(p => this.playerKey(p) === key);
      if (existing && typeof window.PlayerGrowth?.addFragments === 'function') {
        window.PlayerGrowth.addFragments(existing, shardGain);
      }
      this.addManagementLog(`抽到重複球員 ${player.name}，獲得 ${shardGain} 枚碎片（球員個人 + 通用各 ${shardGain}）！`);
      this.updateExpansionPreview(player, { duplicate: true, shardGain });
      return { player, duplicate: true };
    }
    this.roster.addPlayer(player);
    this.collectedPlayerKeys.add(key);
    this.normalizeManagementState();
    this.addManagementLog(`${i18n.recruited} ${player.name} (${pool === 'local' ? i18n.localTalent : i18n.internationalStar})!`);
    this.updateExpansionPreview(player);
    return { player, duplicate: false };
  }

  // v4.1：海外池 11 連抽（10+1），1000 黃金棒球
  drawInternationalEleven() {
    const cost = 1000, draws = 11;
    if ((this.goldBaseball || 0) < cost) {
      this.addManagementLog('黃金棒球不足（11 連抽需 1000）。');
      return;
    }
    this.goldBaseball -= cost;
    let added = 0, dup = 0;
    for (let i = 0; i < draws; i++) {
      const p = this.gacha.drawPlayer('international');
      const res = this._acquireDrawnPlayer(p, 'international');
      if (res.duplicate) dup++; else added++;
    }
    this.addManagementLog(`🎉 海外 11 連抽完成！新進 ${added} 人、重複轉碎片 ${dup} 人。`);
    this.saveManager.save(this);
    this.updateUI();
    if (typeof renderShardShop === 'function') renderShardShop();
  }

  // v1.14：用碎片兌換傳奇英雄
  redeemHero(heroIndex) {
    const heroes = Array.isArray(window.LEGENDARY_HERO_CANDIDATES) ? window.LEGENDARY_HERO_CANDIDATES : [];
    const hero = heroes[heroIndex];
    if (!hero) return { success: false, message: '無效的英雄索引。' };
    if (this.unlockedHeroes.includes(hero.name)) {
      return { success: false, message: `${hero.name} 已經在隊上了。` };
    }
    if (this.playerShards < hero.shardCost) {
      return { success: false, message: `碎片不足，需要 ${hero.shardCost} 枚，目前 ${this.playerShards}。` };
    }
    this.playerShards -= hero.shardCost;
    const player = this.statMapper.createLegendaryHero(hero);
    this.roster.addPlayer(player);
    this.unlockedHeroes.push(hero.name);
    this.collectedPlayerKeys.add(`legend:${hero.name}`);
    this.normalizeManagementState();
    this.addManagementLog(`⭐ 傳奇英雄登場：${hero.name}「${hero.nickname}」加入政治大學棒球隊！`);
    this.saveManager.save(this);
    this.updateUI();
    if (typeof renderShardShop === 'function') renderShardShop();
    return { success: true, message: `${hero.name} 已加入！` };
  }

  updateExpansionPreview(player, options = {}) {
    const previewDiv = document.getElementById('expansion-preview');
    if (!previewDiv) return;

    const card = document.createElement('div');
    card.className = 'trading-card';
    const rank = player.getRank();
    const abilityPairs = player.canPitch() && player.role === 'P'
      ? [['球速', player.abilities.velocity], ['控球', player.abilities.control], ['變化', player.abilities.breaking], ['體力', player.abilities.stamina], ['守備', player.abilities.fielding], ['精神', player.abilities.discipline]]
      : [['巧打', player.abilities.contact], ['長打', player.abilities.power], ['走力', player.abilities.speed], ['守備', player.abilities.fielding], ['肩力', player.abilities.arm], ['選球', player.abilities.discipline]];

    const dupBanner = options.duplicate
      ? `<div class="duplicate-banner">重複！+${options.shardGain || 0} 碎片</div>`
      : '';

    card.innerHTML = `
      <div class="card-rank-badge badge-${rank.toLowerCase()}">
        ${rank}
      </div>
      ${dupBanner}
      <div class="card-name">${player.name}</div>
      <div class="card-meta">
        <span>${player.getRoleLabel()}</span>
        <span>${player.getPositionLabel()}</span>
        <span>${player.team}</span>
      </div>
      <div class="card-stats">
        ${abilityPairs.map(([label, value]) => `<div class="card-stat-item"><span>${label}</span> <span>${abilityWithGrade(value)}</span></div>`).join('')}
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
    if (this.engine && typeof this.engine.startAutoSim === 'function') {
      return this.engine.startAutoSim();
    }
    this.autoSimEnabled = true;
    this.updateUI();
    const nextStep = () => {
      if (!this.autoSimEnabled) return;
      if (this.inning > 9) {
        this.autoSimEnabled = false;
        this.updateUI();
        return;
      }
      if (this.opponentAI) this.opponentAI.decide();
      const { pitcher, batter } = this.getCurrentMatchup();
      const outcome = resolveAtBat(pitcher, batter, false);
      this.addToLog(`${i18n.autoSimOutcome} ${outcome}`);
      if (!this.autoSimEnabled || this.inning > 9) {
        return;
      }
      setTimeout(nextStep, 50);
    };
    nextStep();
  }

  stopAutoSim() {
    if (this.engine && typeof this.engine.stopAutoSim === 'function') {
      return this.engine.stopAutoSim();
    }
    this.autoSimEnabled = false;
    this.updateUI();
  }

  seasonEndResolution() {
    this.addManagementLog(i18n.seasonComplete);
    this.roster.players.forEach(player => {
      player.gainXP(50);
      player.applyAgeDecline();
      if (player.checkInjury()) {
        this.addManagementLog(`${player.name} 受傷了！`);
      }
      player.restore();
    });
    this.addManagementLog(`${i18n.seasonEnded} ${this.seasonManager.record}.`);

    // v1.18 #19：CPBL 季後賽結算（會更新 firstHalfChamp / secondHalfChamp 與冠軍）
    const playoffResult = this.runPlayoffs();

    // v2.11：紀錄歷史戰績 + 計算 WBC 積分
    this.recordSeasonHistoryAndWbcPoints(playoffResult);

    this.saveManager.save(this);

    // v2.11：劇情分支判斷
    if (this.currentYear >= WBC_QUALIFICATION_RULES.startYear + WBC_QUALIFICATION_RULES.totalSeasons - 1) {
      // 已打完 4 季 → 判定代表權
      this.evaluateWBCQualification();
    } else {
      // 進入下一年
      this.startNextYear();
    }
  }

  // v2.11：紀錄這季成績與計算 WBC 積分
  recordSeasonHistoryAndWbcPoints(playoffResult) {
    const TEAM = TEAM_NAME_DISPLAY;
    const RULES = window.WBC_QUALIFICATION_RULES || WBC_QUALIFICATION_RULES;
    const standings = (this.leagueStandings || []).slice();
    standings.forEach(row => {
      const g = (row.wins || 0) + (row.losses || 0);
      row.winPct = g > 0 ? (row.wins || 0) / g : 0;
    });
    standings.sort((a, b) => b.winPct - a.winPct);

    // 對每支隊伍計算這個球季積分並累加進 wbcPointsByTeam
    const yearPoints = {};
    standings.forEach((row, idx) => {
      let pts = 0;
      if (idx === 0) pts += RULES.yearRank1Points;
      if (idx === 1) pts += RULES.yearRank2Points;
      if (row.team === this.firstHalfChamp)  pts += RULES.halfChampPoints;
      if (row.team === this.secondHalfChamp) pts += RULES.halfChampPoints;
      if (row.team === playoffResult?.champion)  pts += RULES.champPoints;
      if (row.team === playoffResult?.runnerUp)  pts += RULES.runnerUpPoints;
      if (row.team === playoffResult?.thirdPlace) pts += RULES.thirdPlacePoints;
      yearPoints[row.team] = pts;
      this.wbcPointsByTeam[row.team] = (this.wbcPointsByTeam[row.team] || 0) + pts;
    });

    const myRow = standings.find(s => s.team === TEAM);
    const myRank = standings.findIndex(s => s.team === TEAM) + 1;

    this.seasonHistory.push({
      year: this.currentYear,
      wins: myRow?.wins || this.seasonManager.wins,
      losses: myRow?.losses || this.seasonManager.losses,
      firstHalfChamp: this.firstHalfChamp,
      secondHalfChamp: this.secondHalfChamp,
      finalRank: myRank || null,
      playoffChampion: playoffResult?.champion,
      playoffRunnerUp: playoffResult?.runnerUp,
      myWbcPoints: yearPoints[TEAM] || 0,
      cumulativeWbcPoints: this.wbcPointsByTeam[TEAM] || 0,
      yearPoints: yearPoints
    });

    this.addManagementLog(`📊 ${this.currentYear} 年度結束：政大棒球 ${myRank} 名，本季 WBC 積分 +${yearPoints[TEAM] || 0}，累計 ${this.wbcPointsByTeam[TEAM] || 0}。`);
  }

  // v2.11：開始下一年
  startNextYear() {
    this.currentYear++;
    this.seasonManager.currentMatch = 1;
    this.seasonManager.wins = 0;
    this.seasonManager.losses = 0;
    this.seasonManager.firstHalfRecord = { wins: 0, losses: 0 };
    this.seasonManager.secondHalfRecord = { wins: 0, losses: 0 };
    this.firstHalfChamp = null;
    this.secondHalfChamp = null;
    this.leagueStandings = this.createInitialStandings();
    this.addManagementLog(`🗓️ 進入 ${this.currentYear} 年球季，目標 WBC 代表權！`);
    this.prepareNextMatch();
  }

  // v2.11：4 季結束後判定 WBC 代表權
  evaluateWBCQualification() {
    const TEAM = TEAM_NAME_DISPLAY;
    const entries = Object.entries(this.wbcPointsByTeam).sort((a, b) => b[1] - a[1]);
    const topTeam = entries[0]?.[0];
    this.addManagementLog('═══ 4 年 WBC 積分結算 ═══');
    entries.forEach(([team, pts], idx) => {
      this.addManagementLog(`  ${idx + 1}. ${team}：${pts} 分${team === TEAM ? ' ← 你的隊伍' : ''}`);
    });
    if (topTeam === TEAM) {
      this.storylineStage = 'wbc_qualified';
      this.addManagementLog('🎌 取得中華隊代表權！');
    } else {
      this.storylineStage = 'wbc_eliminated';
      this.addManagementLog(`代表權落入 ${topTeam} 手中。遊戲結束。`);
    }
    this.saveManager.save(this);
    // 顯示對應結算畫面
    if (typeof window !== 'undefined' && typeof window.showStorylineEnding === 'function') {
      window.showStorylineEnding(this.storylineStage);
    }
  }

  // v2.11：執行 WBC 8 強單淘汰賽
  runWBCTournament() {
    const TEAM = TEAM_NAME_DISPLAY;
    const teams = window.WBC_NATIONAL_TEAMS || {};
    // 8 強：中華隊 + 7 國
    const bracket = [
      { code: 'TPE', name: '中華隊', strength: this.estimateTeamStrength(), isPlayer: true },
      ...Object.values(teams).map(t => ({ code: t.code, name: t.name, strength: t.strength, isPlayer: false }))
    ];
    // 隨機抽籤
    for (let i = bracket.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bracket[i], bracket[j]] = [bracket[j], bracket[i]];
    }
    this.wbcBracket = {
      quarterfinals: [],   // [[t1, t2, winner], ...]
      semifinals: [],
      final: null,
      thirdPlace: null,
      result: null         // 'champion' / 'runnerUp' / 'semifinal' / 'quarterfinal'
    };
    const log = [];
    log.push('═══ WBC 2030 八強單淘汰賽開幕 ═══');
    // 八強對戰 4 場
    const semiTeams = [];
    for (let i = 0; i < 8; i += 2) {
      const a = bracket[i], b = bracket[i + 1];
      const winner = this.simulateWBCGame(a, b);
      this.wbcBracket.quarterfinals.push({ a, b, winner });
      log.push(`【八強】${a.name} vs ${b.name} → ${winner.name} 晉級`);
      semiTeams.push(winner);
      // 若玩家八強就被淘汰 → 結束
      if (a.isPlayer || b.isPlayer) {
        if (!winner.isPlayer) {
          this.wbcBracket.result = 'quarterfinal';
          this.wbcBracket.eliminatedBy = winner.name;
          this.wbcBracket.eliminatedStage = '八強';
        }
      }
    }
    // 四強 2 場
    const finalTeams = [];
    let semiLosers = [];
    for (let i = 0; i < 4; i += 2) {
      const a = semiTeams[i], b = semiTeams[i + 1];
      const winner = this.simulateWBCGame(a, b);
      this.wbcBracket.semifinals.push({ a, b, winner });
      log.push(`【四強】${a.name} vs ${b.name} → ${winner.name} 晉級`);
      finalTeams.push(winner);
      semiLosers.push(a === winner ? b : a);
      if ((a.isPlayer || b.isPlayer) && !winner.isPlayer && !this.wbcBracket.result) {
        this.wbcBracket.result = 'semifinal';
        this.wbcBracket.eliminatedBy = winner.name;
        this.wbcBracket.eliminatedStage = '四強';
      }
    }
    // 季軍戰
    if (semiLosers.length === 2) {
      const t3 = this.simulateWBCGame(semiLosers[0], semiLosers[1]);
      this.wbcBracket.thirdPlace = { a: semiLosers[0], b: semiLosers[1], winner: t3 };
      log.push(`【季軍戰】${semiLosers[0].name} vs ${semiLosers[1].name} → 第三名：${t3.name}`);
    }
    // 冠軍戰
    if (finalTeams.length === 2) {
      const a = finalTeams[0], b = finalTeams[1];
      const champion = this.simulateWBCGame(a, b);
      const runnerUp = a === champion ? b : a;
      this.wbcBracket.final = { a, b, winner: champion };
      log.push(`【冠軍戰】${a.name} vs ${b.name} → 冠軍：${champion.name}`);
      if (champion.isPlayer) {
        this.wbcBracket.result = 'champion';
      } else if (runnerUp.isPlayer) {
        this.wbcBracket.result = 'runnerUp';
        this.wbcBracket.eliminatedBy = champion.name;
        this.wbcBracket.eliminatedStage = '冠軍戰';
      } else if (!this.wbcBracket.result) {
        // 玩家不在冠軍戰
      }
    }
    log.push('═══ WBC 賽程結束 ═══');
    log.forEach(line => this.addManagementLog(line));
    this.storylineStage = 'wbc_running';
    this.saveManager.save(this);
  }

  // v2.11：單場 WBC 模擬（簡化版，依隊伍強度）
  simulateWBCGame(teamA, teamB) {
    const a = teamA.strength + (Math.random() - 0.5) * 15;
    const b = teamB.strength + (Math.random() - 0.5) * 15;
    return a >= b ? teamA : teamB;
  }

  // v2.11：估算中華隊（=政大棒球一軍）整體強度，用於 WBC 比賽
  estimateTeamStrength() {
    const majors = this.roster.players.filter(p => p.level !== 'minor');
    if (!majors.length) return 80;
    const avgBatter = majors.filter(p => p.role === 'B').reduce((s, p) => s + ((p.abilities.contact + p.abilities.power) / 2), 0) / Math.max(1, majors.filter(p => p.role === 'B').length);
    const avgPitcher = majors.filter(p => p.role === 'P').reduce((s, p) => s + ((p.abilities.velocity + p.abilities.control + p.abilities.breaking) / 3), 0) / Math.max(1, majors.filter(p => p.role === 'P').length);
    return Math.round((avgBatter * 0.5 + avgPitcher * 0.5));
  }

  // v1.18 #19：CPBL 季後賽完整流程（v2.11 修：回傳結果讓 WBC 積分計算用）
  runPlayoffs() {
    const TEAM = TEAM_NAME_DISPLAY;
    const standings = (this.leagueStandings || []).slice();
    // 計算每隊年度勝率
    standings.forEach(row => {
      const g = (row.wins || 0) + (row.losses || 0);
      row.winPct = g > 0 ? (row.wins || 0) / g : 0;
    });
    standings.sort((a, b) => b.winPct - a.winPct);

    const firstChamp = this.firstHalfChamp || TEAM;
    const secondChamp = this.secondHalfChamp || TEAM;

    this.addManagementLog('═══ 季後賽開始 ═══');
    this.addManagementLog(`上半季冠軍：${firstChamp}　下半季冠軍：${secondChamp}`);

    let champion, runnerUp, thirdPlace;
    if (firstChamp === secondChamp) {
      // 情境 B：上下半季同隊 → 年度 2、3 名打挑戰賽，5 戰 3 勝
      const nonChamps = standings.filter(s => s.team !== firstChamp);
      const seed2 = nonChamps[0]?.team || '未知';
      const seed3 = nonChamps[1]?.team || '未知';
      this.addManagementLog(`季後挑戰賽：${seed2} vs ${seed3}（年度第 2 vs 年度第 3，5 戰 3 勝）`);
      const challengeWinner = this.simulatePlayoffSeries(seed2, seed3, 3, 0);
      thirdPlace = challengeWinner === seed2 ? seed3 : seed2;
      this.addManagementLog(`季後挑戰賽勝出：${challengeWinner}`);
      this.addManagementLog(`總冠軍賽：${firstChamp} (讓 1 勝) vs ${challengeWinner}（7 戰 4 勝）`);
      champion = this.simulatePlayoffSeries(firstChamp, challengeWinner, 4, 1);
      runnerUp = champion === firstChamp ? challengeWinner : firstChamp;
    } else {
      const firstRow = standings.find(s => s.team === firstChamp);
      const secondRow = standings.find(s => s.team === secondChamp);
      const higherChamp = (firstRow?.winPct || 0) >= (secondRow?.winPct || 0) ? firstChamp : secondChamp;
      const lowerChamp = higherChamp === firstChamp ? secondChamp : firstChamp;
      const wildCard = standings.find(s => s.team !== firstChamp && s.team !== secondChamp)?.team || '未知';
      this.addManagementLog(`季後挑戰賽：${lowerChamp} (讓 1 勝) vs ${wildCard}（5 戰 3 勝，半季冠軍 1 勝優勢）`);
      const challengeWinner = this.simulatePlayoffSeries(lowerChamp, wildCard, 3, 1);
      thirdPlace = challengeWinner === lowerChamp ? wildCard : lowerChamp;
      this.addManagementLog(`季後挑戰賽勝出：${challengeWinner}`);
      this.addManagementLog(`總冠軍賽：${higherChamp} vs ${challengeWinner}（7 戰 4 勝，無讓 1 勝）`);
      champion = this.simulatePlayoffSeries(higherChamp, challengeWinner, 4, 0);
      runnerUp = champion === higherChamp ? challengeWinner : higherChamp;
    }

    this.addManagementLog(`🏆 總冠軍：${champion} 🏆`);
    if (champion === TEAM) {
      this.addManagementLog('🎉 政大棒球隊奪得總冠軍！');
      this.currency += 5000;
    } else {
      this.addManagementLog(`政大棒球隊本季止步於 ${this.seasonManager.record}，明年再戰！`);
    }
    this.addManagementLog('═══ 季後賽結束 ═══');
    return { champion, runnerUp, thirdPlace };
  }

  // v1.18：模擬季後賽系列賽（簡化用 winPct 機率模型）
  // teamA 為主場隊（享主場 + 讓勝）；teamB 為挑戰隊。winsNeeded 為勝場數；handicap 為 teamA 預先佔有的勝場。
  simulatePlayoffSeries(teamA, teamB, winsNeeded, handicap = 0) {
    const standings = this.leagueStandings || [];
    const pctA = standings.find(s => s.team === teamA)?.winPct || 0.5;
    const pctB = standings.find(s => s.team === teamB)?.winPct || 0.5;
    let probA = pctA / (pctA + pctB || 1);
    probA = Math.max(0.35, Math.min(0.7, probA + 0.05)); // teamA 享 5% 主場優勢
    let winsA = handicap;
    let winsB = 0;
    let gameNo = 1;
    while (winsA < winsNeeded && winsB < winsNeeded) {
      if (Math.random() < probA) {
        winsA++;
        this.addManagementLog(`　G${gameNo}：${teamA} ${winsA}-${winsB} ${teamB}`);
      } else {
        winsB++;
        this.addManagementLog(`　G${gameNo}：${teamA} ${winsA}-${winsB} ${teamB}`);
      }
      gameNo++;
    }
    return winsA >= winsNeeded ? teamA : teamB;
  }
}

// =====================================================================
// v1.18：球物理引擎 + 球場系統 + 守備系統 + 主播播報 + 球員等級
// ---------------------------------------------------------------------
// 這段是 v1.18 新功能的核心 helper，不動原本的 resolveAtBat / Player class，
// 而是提供獨立的計算函式，由 resolveAtBat 在「擊球發生」時呼叫。
// =====================================================================

// ---------- 球場系統 ----------
function pickStadiumForOpponent(opponentName) {
  if (typeof window === 'undefined' || !window.STADIUMS_DATA) return 'nccu';
  // 50% 機率在政大主場，50% 機率在對手主場
  if (Math.random() < 0.5) return 'nccu';
  const stadiums = window.STADIUMS_DATA;
  const match = Object.entries(stadiums).find(([key, s]) => s.team === opponentName);
  return match ? match[0] : 'nccu';
}

// ---------- 球物理引擎 ----------
// 給定 EV(初速 mph)、LA(仰角 °)、SA(噴射角 °, -45 拉打 → +45 反向)，
// 回傳擊球去向資訊
function calcBattedBall(ev_mph, la_deg, sa_deg, stadium) {
  // 真空拋體公式並衰減
  const ev_mps = ev_mph * 0.44704;
  const la_rad = la_deg * Math.PI / 180;
  const g = 9.81;
  let dist_m = (ev_mps * ev_mps * Math.sin(2 * Math.max(0, la_rad))) / g;
  dist_m *= 0.65; // 空氣阻力校準
  if (stadium) {
    dist_m *= (1 + (stadium.altitude || 0) / 10000);
  }
  // 全壘打牆距離（依噴射角內插）
  let wallDist = 100;
  if (stadium) {
    const t = (Math.max(-45, Math.min(45, sa_deg)) + 45) / 90;
    if (t < 0.5) wallDist = stadium.LF + (stadium.CF - stadium.LF) * (t * 2);
    else wallDist = stadium.CF + (stadium.RF - stadium.CF) * ((t - 0.5) * 2);
    dist_m *= (stadium.hrFactor || 1);
  }
  // 是否界外（噴射角超過 ±45°）
  const isFoul = Math.abs(sa_deg) > 45;
  // 球種分類
  let ballType;
  if (la_deg < 10) ballType = 'ground';
  else if (la_deg < 25) ballType = 'liner';
  else if (la_deg < 40) ballType = 'fly';
  else ballType = 'popup';

  // v2.11：計算球到達全壘打牆位置時的高度（給政大「天網」用）
  let trajectoryHeightAtWall = Infinity;
  if (!isFoul && ballType !== 'ground' && ballType !== 'popup' && wallDist > 0) {
    const v_h = ev_mps * Math.cos(la_rad);
    const v_v = ev_mps * Math.sin(la_rad);
    if (v_h > 0) {
      const t_wall = wallDist / v_h;
      // 空氣阻力衰減（簡化）：高度比真空計算少 ~15%
      trajectoryHeightAtWall = (v_v * t_wall - 0.5 * g * t_wall * t_wall) * 0.85;
    }
  }
  const fenceHeight = (stadium && stadium.fenceHeight) || 3;

  // 全壘打判定：距離超過 + 高度也夠（v2.11：天網 10m 卡掉低彈道砲）
  const isHR = !isFoul && ballType !== 'ground' && ballType !== 'popup'
            && dist_m >= wallDist
            && trajectoryHeightAtWall > fenceHeight;
  // Barrel 判定（Statcast）：EV ≥ 98 且 LA 在 26-30 之間，每多 1 mph EV 擴張 LA 範圍
  let isBarrel = false;
  if (ev_mph >= 98) {
    const evBonus = Math.floor((ev_mph - 98) * 1.5);
    const laMin = 26 - evBonus;
    const laMax = 30 + evBonus;
    if (la_deg >= laMin && la_deg <= laMax) isBarrel = true;
  }
  // 方向描述
  let direction;
  if (sa_deg < -25) direction = '左外野方向';
  else if (sa_deg < -8) direction = '左中外野方向';
  else if (sa_deg < 8) direction = '中外野方向';
  else if (sa_deg < 25) direction = '右中外野方向';
  else direction = '右外野方向';
  if (ballType === 'ground') {
    if (sa_deg < -20) direction = '三壘方向';
    else if (sa_deg < -5) direction = '游擊方向';
    else if (sa_deg < 8) direction = '投手前方';
    else if (sa_deg < 20) direction = '二壘方向';
    else direction = '一壘方向';
  }
  // v2.11：若擊到天網（距離夠但高度不夠），讓擊球結果偏向 fly out 接殺或牆前安打
  const hitNet = !isFoul && ballType !== 'ground' && ballType !== 'popup'
              && dist_m >= wallDist && trajectoryHeightAtWall <= fenceHeight;
  return {
    ev_mph, la_deg, sa_deg, dist_m: Math.round(dist_m),
    wallDist: Math.round(wallDist),
    fenceHeight,
    trajectoryHeightAtWall: Math.round(trajectoryHeightAtWall * 10) / 10,
    ballType, direction, isFoul, isHR, isBarrel, hitNet
  };
}

// 依打者能力產生 EV/LA/SA（含戰術修正）
function generateBattedBallParams(batter, pitcher, contactRoll, swingType = 'normal') {
  const pow = batter.getEffectivePower ? batter.getEffectivePower() : (batter.abilities?.power || 70);
  const contact = batter.abilities?.contact || 70;
  // EV (Exit Velocity)：基準 92 mph，power 影響 ±15
  let ev = 92 + (pow - 75) * 0.35 + gaussianRandom(0, 4);
  if (swingType === 'aggressive') ev += 3;
  else if (swingType === 'patient') ev -= 2;
  if (batter.burnLifeActive) ev += 5;
  ev = Math.max(60, Math.min(120, ev));
  // LA (Launch Angle)：基準依 contactRoll 偏移
  let la = 12 + gaussianRandom(0, 14);  // -16 ~ +40 大致範圍
  if (swingType === 'aggressive') la += 6;
  // 力量打者更可能高仰角
  if (batter.traits?.includes('力量打者') || batter.traits?.includes('怪力')) la += 4;
  if (batter.traits?.includes('低球打')) la -= 6;
  la = Math.max(-30, Math.min(60, la));
  // Spray Angle：基準偏拉打方向（右打 → 左外野，左打 → 右外野）
  let sa = gaussianRandom(0, 18);
  if (batter.bats === 'R') sa -= 5;  // 右打偏拉左
  if (batter.bats === 'L') sa += 5;  // 左打偏拉右
  sa = Math.max(-55, Math.min(55, sa));
  return { ev, la, sa };
}

// ---------- v1.18：守備系統 ----------
// 依擊球位置判斷由誰守備，並計算成功率
const FIELDING_ERROR_LABELS = {
  throw: '暴傳失誤',
  field: '漏接失誤',
  mental: '判斷失誤'
};

// ---------- v1.18：主播播報語料庫 ----------
const COMMENTARY_POOL = {
  opening: [
    (h, a, stadium) => `歡迎收看今天的賽事！由 ${a} 對戰 ${h}，這裡是 ${stadium}。`,
    (h, a, stadium) => `今天的主場是 ${stadium}，由 ${h} 迎戰 ${a}！`,
    (h, a, stadium) => `球場已準備就緒，今天 ${h} 對戰 ${a}，比賽即將開始！`
  ],
  hr: [
    (b) => `打到了！這球飛出去了！${b.name} 的全壘打！`,
    (b) => `炸裂！${b.name} 把這球打到看台上去了！`,
    (b) => `${b.name} 本季的全壘打入袋！這球真是又高又遠！`
  ],
  hrClutch: [
    (b) => `關鍵時刻！${b.name} 的全壘打改寫戰局！`,
    (b) => `${b.name} 在這個關鍵局面送出致勝一擊！`
  ],
  triple: [
    (b) => `深遠的長打！${b.name} 一路衝上三壘！這是一支三壘安打！`,
    (b) => `球打到了無人防守的中外野深處！${b.name} 站上三壘！`
  ],
  double: [
    (b) => `平飛球！穿越外野！${b.name} 站上二壘！`,
    (b) => `強勁的二壘安打！${b.name} 把球打到外野角落！`
  ],
  single: [
    (b) => `${b.name} 擊出安打！輕巧地放在外野前。`,
    (b) => `德州安打！剛好掉在三不管地帶。`,
    (b) => `落地安打！${b.name} 站上一壘。`
  ],
  walk: [
    (b) => `${b.name} 選到四壞球保送！`,
    (b) => `投手沒有對決，${b.name} 直接走上一壘。`
  ],
  strikeout: [
    (b, p) => `三振！${p.name} K 掉了 ${b.name}！`,
    (b, p) => `揮空三振！${b.name} 完全摸不到這顆球。`,
    (b, p) => `站著被三振！${b.name} 看著球進入好球帶。`
  ],
  groundOut: [
    (b) => `強勁的滾地球！被內野手接到後傳一壘，${b.name} 出局。`,
    (b) => `${b.name} 的滾地球被輕鬆處理。`
  ],
  flyOut: [
    (b) => `高飛球！外野手從容接殺，${b.name} 出局。`,
    (b) => `${b.name} 把球打高了，外野輕鬆解決。`
  ],
  popup: [
    (b) => `軟弱的內野高飛球！${b.name} 出局。`
  ],
  error: [
    (b, fielder, errType) => `哎呀！這球${FIELDING_ERROR_LABELS[errType] || '失誤'}了！${fielder?.name || '守備員'} 沒處理好。`,
    (b, fielder, errType) => `${fielder?.name || '守備員'} 出現${FIELDING_ERROR_LABELS[errType] || '失誤'}！${b.name} 上壘了。`
  ]
};

function pickCommentary(category, ...args) {
  const pool = COMMENTARY_POOL[category];
  if (!pool || !pool.length) return '';
  const fn = pool[Math.floor(Math.random() * pool.length)];
  return fn(...args);
}

// ---------- v1.18：球員等級與評等成長系統 ----------
// v3.25：RATING_GROWTH_MULTIPLIER 仍用於 XP 累積速度（S 升級快 / D 升級慢）
// RATING_STAT_CAP 已 deprecated，改由 PlayerGrowth.getAbilityCeiling (= 95 + rank × 5) 統一處理
const RATING_GROWTH_MULTIPLIER = { S: 1.5, A: 1.2, B: 1.0, C: 0.8, D: 0.6 };
const RATING_STAT_CAP = { S: 99, A: 92, B: 84, C: 70, D: 58 }; // deprecated, kept for legacy refs

function getXPForNextLevel(level) {
  return Math.round(100 * Math.pow(level, 1.5));
}

function getPlayerLevel(player) {
  return player.playerLevel || 1;
}

function getPlayerRating(player) {
  return player.rating || player.sourceStats?.rating || 'B';
}

// v3.25：統一升級入口 — 算出有效 XP 後委派給 PlayerGrowth
//   - game.js 層只負責教練 xpBonus + 評等倍率
//   - 升級判定、屬性加成、品階特質解鎖全部走 PlayerGrowth
function awardPlayerXP(player, baseXP, category = 'all', game) {
  if (!player) return;
  // 教練 XP 加成
  let bonus = 0;
  const staff = game?.coachingStaff || {};
  Object.values(staff).forEach(coach => {
    if (!coach) return;
    const xb = coach.xpBonus || {};
    if (xb.all) bonus += xb.all;
    if (xb[category]) bonus += xb[category];
  });
  // 評等成長倍率（S 1.5x、A 1.2x、B 1.0x、C 0.8x、D 0.6x）
  const rating = getPlayerRating(player);
  const ratingMul = RATING_GROWTH_MULTIPLIER[rating] || 1.0;
  const gain = Math.round(baseXP * (1 + bonus / 100) * ratingMul);

  // 委派給 PlayerGrowth：累積 XP、依等級門檻自動升級、依 category 加屬性
  if (typeof PlayerGrowth !== 'undefined' && PlayerGrowth.gainXP) {
    const beforeLv = player.playerLevel || 1;
    PlayerGrowth.gainXP(player, gain, category);
    const afterLv = player.playerLevel || 1;
    if (game && afterLv > beforeLv) {
      game.addManagementLog(`🎉 ${player.name} 升到 Lv.${afterLv}！`);
    }
  } else {
    // PlayerGrowth 未載入時的最小備援
    player.playerXP = (player.playerXP || 0) + gain;
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

const AT_BAT_GEOMETRY = {
  gridHalf: 67.5,
  strikeHalf: 22.5,
  cellSizeCm: 15,
  ballRadiusCm: 3.6
};

const STRATEGY_PROFILE_MAP = {
  standard: {
    label: '標準',
    radiusDelta: 0,
    contactMod: 0,
    powerMod: 0,
    eyeMod: 0,
    chaseBonus: 0,
    whiffDelta: 0,
    foulDelta: 0,
    inPlayDelta: 0
  },
  power: {
    label: '強力揮擊',
    radiusDelta: -6,
    contactMod: -8,
    powerMod: 10,
    eyeMod: -6,
    chaseBonus: -0.01,
    whiffDelta: 0.03,
    foulDelta: -0.02,
    inPlayDelta: -0.01
  },
  tightZone: {
    label: '縮小好球帶',
    radiusDelta: -8,
    contactMod: 3,
    powerMod: 8,
    eyeMod: 3,
    chaseBonus: -0.05,
    whiffDelta: 0.01,
    foulDelta: -0.02,
    inPlayDelta: 0.01
  },
  protect: {
    label: '保護好球帶',
    radiusDelta: 10,
    contactMod: 8,
    powerMod: -8,
    eyeMod: 2,
    chaseBonus: 0.12,
    whiffDelta: -0.04,
    foulDelta: 0.07,
    inPlayDelta: -0.03
  },
  patient: {
    label: '耐心選球',
    radiusDelta: -10,
    contactMod: -2,
    powerMod: -4,
    eyeMod: 8,
    chaseBonus: -0.08,
    whiffDelta: -0.02,
    foulDelta: 0.01,
    inPlayDelta: 0.01
  },
  aggressive: {
    label: '積極攻擊',
    radiusDelta: 8,
    contactMod: -3,
    powerMod: 4,
    eyeMod: -5,
    chaseBonus: 0.15,
    whiffDelta: 0.03,
    foulDelta: -0.05,
    inPlayDelta: 0.02
  }
};

const LEGACY_OFFENSE_STRATEGY_MAP = {
  normal: 'standard',
  patient: 'patient',
  aggressive: 'aggressive'
};

const GRADE_MOVE_SCALE = { S: 1.15, A: 1.08, B: 1.03, C: 1.00, D: 0.94, E: 0.88 };
const EFFORT_MOVE_SCALE = { easy: 0.94, normal: 1.0, full: 1.05, max: 1.10 };

const FAST_PITCH_TOKENS = ['四縫', '二縫', '卡特', '切球', '伸卡', '速叉', '快速指叉'];

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

function randomBetween(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return 0;
  if (min === max) return min;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.random() * (hi - lo);
}

function normalizeZoneIndex(value, size, fallback) {
  const index = Number(value);
  if (Number.isInteger(index) && index >= 0 && index < size * size) return index;
  return fallback;
}

function getGridCenter(index, size = 3) {
  const safeIndex = normalizeZoneIndex(index, size, Math.floor((size * size) / 2));
  const row = Math.floor(safeIndex / size);
  const col = safeIndex % size;
  const pivot = (size - 1) / 2;
  return {
    x: (col - pivot) * AT_BAT_GEOMETRY.cellSizeCm,
    y: (pivot - row) * AT_BAT_GEOMETRY.cellSizeCm
  };
}

function pickWeighted(items) {
  if (!Array.isArray(items) || !items.length) return null;
  const total = items.reduce((sum, item) => sum + Math.max(0, Number(item.weight) || 0), 0);
  if (total <= 0) return items[Math.floor(Math.random() * items.length)]?.value ?? null;
  let roll = Math.random() * total;
  for (const item of items) {
    const weight = Math.max(0, Number(item.weight) || 0);
    roll -= weight;
    if (roll <= 0) return item.value;
  }
  return items[items.length - 1]?.value ?? null;
}

function resolvePitchAimCell(game, battingTeam, plan = 'balanced', control = 70) {
  if (battingTeam === 'opponent') {
    return normalizeZoneIndex(game.pitchAimCell, 5, 12);
  }
  // §16.14 Wave B（control→BB9 通道）：對手投手控球 → 壞球率乘數。
  //   好球帶外格子（誘揮帶/純壞球）的權重 ×mul，樞紐 control=70 → ×1.0（保住聯盟平均）；
  //   弱控 >1（投更多壞球→保送↑）、強控 <1。單一來源＝pitch-engine.js controlBallRateMul()。
  const ballMul = (window.PitchEngine && PitchEngine.controlBallRateMul)
    ? PitchEngine.controlBallRateMul(control) : 1;
  // 5×5 好球帶內＝inner 3×3：6,7,8,11,12,13,16,17,18；其餘皆好球帶外。
  const IN_ZONE = new Set([6, 7, 8, 11, 12, 13, 16, 17, 18]);
  const applyBallMul = arr => arr.map(c => IN_ZONE.has(c.value) ? c : { ...c, weight: c.weight * ballMul });

  if (plan === 'fastball') {
    return pickWeighted(applyBallMul([
      { value: 6, weight: 0.9 }, { value: 7, weight: 1 }, { value: 8, weight: 0.9 },
      { value: 11, weight: 1.1 }, { value: 12, weight: 1.45 }, { value: 13, weight: 1.1 },
      { value: 16, weight: 0.9 }, { value: 17, weight: 1 }, { value: 18, weight: 0.9 },
      { value: 1, weight: 0.65 }, { value: 3, weight: 0.65 }, { value: 5, weight: 0.55 }, { value: 9, weight: 0.55 },
      { value: 15, weight: 0.55 }, { value: 19, weight: 0.55 }, { value: 21, weight: 0.65 }, { value: 23, weight: 0.65 }
    ]));
  }
  if (plan === 'breaking') {
    return pickWeighted(applyBallMul([
      { value: 6, weight: 1.2 }, { value: 8, weight: 1.2 }, { value: 16, weight: 1.2 }, { value: 18, weight: 1.2 },
      { value: 1, weight: 0.8 }, { value: 3, weight: 0.8 }, { value: 21, weight: 0.8 }, { value: 23, weight: 0.8 },
      { value: 0, weight: 0.35 }, { value: 4, weight: 0.35 }, { value: 20, weight: 0.35 }, { value: 24, weight: 0.35 }
    ]));
  }
  if (plan === 'waste') {
    // 故意投壞球（保送/誘揮戰術），不套 control 乘數。
    return pickWeighted([
      { value: 0, weight: 1 }, { value: 1, weight: 1 }, { value: 2, weight: 1 }, { value: 3, weight: 1 }, { value: 4, weight: 1 },
      { value: 5, weight: 1 }, { value: 9, weight: 1 }, { value: 10, weight: 1 }, { value: 14, weight: 1 },
      { value: 15, weight: 1 }, { value: 19, weight: 1 }, { value: 20, weight: 1 }, { value: 21, weight: 1 },
      { value: 22, weight: 1 }, { value: 23, weight: 1 }, { value: 24, weight: 1 }
    ]);
  }
  return pickWeighted(applyBallMul([
    { value: 6, weight: 0.9 }, { value: 7, weight: 0.95 }, { value: 8, weight: 0.9 },
    { value: 11, weight: 1 }, { value: 12, weight: 1.15 }, { value: 13, weight: 1 },
    { value: 16, weight: 0.9 }, { value: 17, weight: 0.95 }, { value: 18, weight: 0.9 },
    { value: 1, weight: 0.75 }, { value: 3, weight: 0.75 }, { value: 5, weight: 0.55 }, { value: 9, weight: 0.55 },
    { value: 15, weight: 0.55 }, { value: 19, weight: 0.55 }, { value: 21, weight: 0.75 }, { value: 23, weight: 0.75 },
    { value: 0, weight: 0.3 }, { value: 4, weight: 0.3 }, { value: 20, weight: 0.3 }, { value: 24, weight: 0.3 }
  ]));
}

function sampleMissOffset(controlScore) {
  const control = clampNumber(controlScore, 0, 100);
  const missRadius = clampNumber(36 - control * 0.34, 3, 28);
  const sigma = missRadius / 2.2;
  let dx = 0;
  let dy = 0;
  let guard = 0;
  do {
    dx = gaussianRandom(0, sigma);
    dy = gaussianRandom(0, sigma);
    guard += 1;
  } while ((dx * dx + dy * dy) > (missRadius * missRadius) && guard < 30);
  return { dx, dy, missRadius };
}

function classifyStuffGrade(stuffScore) {
  const score = clampNumber(stuffScore, 0, 100);
  if (score >= 93) return 'S';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 55) return 'D';
  return 'E';
}

function normalizeEffortKey(value) {
  if (value === 'full' || value === 'normal' || value === 'easy' || value === 'max') return value;
  if (value === '全力') return 'full';
  if (value === '輕鬆') return 'easy';
  if (value === '爆發' || value === '全開') return 'max';
  return 'normal';
}

function getFatigueScore(pitcher) {
  const ceiling = Math.max(1, pitcher.getStaminaCeiling ? pitcher.getStaminaCeiling() : (pitcher.maxStamina || 100));
  const staminaRatio = clampNumber((pitcher.state?.stamina ?? ceiling) / ceiling, 0, 1);
  return clampNumber((1 - staminaRatio) * 100 + (pitcher.state?.fatigue || 0) * 0.3, 0, 100);
}

function getPitchName(pitch) {
  return String(pitch?.name || '');
}

function estimateStuffScore(pitcher, pitch) {
  let base;
  if (Number.isFinite(pitch?.stuff)) base = clampNumber(pitch.stuff, 0, 100);
  else {
    const velocity = clampNumber((pitch?.speed ?? pitcher.abilities?.velocity ?? 70), 0, 100);
    const movement = clampNumber((pitch?.movement ?? pitcher.abilities?.breaking ?? 70), 0, 100);
    const control = clampNumber((pitch?.control ?? pitcher.abilities?.control ?? 70), 0, 100);
    base = clampNumber(velocity * 0.45 + movement * 0.4 + control * 0.15, 0, 100);
  }
  // v3.25.4：特殊投法加成（下勾 +6、側投 +4，模擬出手點優勢補球速不足）
  const armSlot = pitcher?.armSlot || window.GAME_PARAMS?.specialPitcherArmSlot?.[pitcher?.name];
  const armBonus = armSlot ? (window.GAME_PARAMS?.armSlotBonus?.[armSlot]?.stuffScore || 0) : 0;
  return clampNumber(base + armBonus, 0, 100);
}

function estimatePitchSpeedKmh(pitcher, pitch) {
  const velocity = Number.isFinite(pitcher?.abilities?.velocity) ? pitcher.abilities.velocity : 75;
  const maxSpeed = 112 + velocity * 0.6;
  const ratio = (pitch && pitch.name && window.PitchEngine?.PITCH_SPEED_RATIO?.[pitch.name]) || 1.0;
  return clampNumber(maxSpeed * ratio + gaussianRandom(0, 1.5), 95, 175);
}

function classifyPitchSpeedGroup(pitchName) {
  const name = String(pitchName || '');
  return FAST_PITCH_TOKENS.some(token => name.includes(token)) ? 'fast' : 'slow';
}

function getPitchMovementRangeCm(pitcher, pitch) {
  if (Number.isFinite(pitch?.moveXMin) && Number.isFinite(pitch?.moveXMax) && Number.isFinite(pitch?.moveYMin) && Number.isFinite(pitch?.moveYMax)) {
    return {
      xMin: Number(pitch.moveXMin),
      xMax: Number(pitch.moveXMax),
      yMin: Number(pitch.moveYMin),
      yMax: Number(pitch.moveYMax)
    };
  }
  const movement = clampNumber(pitch?.movement ?? pitcher.abilities?.breaking ?? 70, 0, 100);
  const spread = clampNumber((movement - 45) * 0.45, 2, 24);
  const name = getPitchName(pitch);
  const handSign = pitcher.throws === 'L' ? -1 : 1;
  if (name.includes('曲')) return { xMin: 0.18 * spread * handSign, xMax: 0.45 * spread * handSign, yMin: -0.95 * spread, yMax: -0.62 * spread };
  if (name.includes('滑') || name.includes('橫掃')) return { xMin: -0.95 * spread * handSign, xMax: -0.48 * spread * handSign, yMin: -0.3 * spread, yMax: 0.05 * spread };
  if (name.includes('指叉') || name.includes('速叉')) return { xMin: -0.15 * spread, xMax: 0.15 * spread, yMin: -0.88 * spread, yMax: -0.5 * spread };
  if (name.includes('變速')) return { xMin: -0.2 * spread, xMax: 0.2 * spread, yMin: -0.45 * spread, yMax: -0.1 * spread };
  if (name.includes('伸卡') || name.includes('二縫')) return { xMin: 0.38 * spread * handSign, xMax: 0.72 * spread * handSign, yMin: -0.62 * spread, yMax: -0.28 * spread };
  if (name.includes('卡特') || name.includes('切球')) return { xMin: -0.45 * spread * handSign, xMax: -0.15 * spread * handSign, yMin: -0.25 * spread, yMax: 0.05 * spread };
  return { xMin: -0.12 * spread, xMax: 0.12 * spread, yMin: -0.15 * spread, yMax: 0.1 * spread };
}

function resolveVelocityTimingMod(lockMode, pitchSpeedGroup) {
  const mode = lockMode === 'fast' || lockMode === 'slow' ? lockMode : 'none';
  if (mode === 'none') {
    return { contact: 0, power: 0, eye: 0, matched: null };
  }
  const matched = mode === pitchSpeedGroup;
  return matched
    ? { contact: 8, power: 4, eye: 0, matched: true }
    : { contact: -14, power: -8, eye: -3, matched: false };
}

function getStrategyKey(value) {
  if (STRATEGY_PROFILE_MAP[value]) return value;
  return 'standard';
}

function getActiveBattingStrategy(game, battingTeam, strikes = 0) {
  const explicit = battingTeam === 'player'
    ? game.battingStrategy
    : game.opponentBattingStrategy;
  const legacy = battingTeam === 'player'
    ? LEGACY_OFFENSE_STRATEGY_MAP[game.offenseApproach]
    : LEGACY_OFFENSE_STRATEGY_MAP[game.opponentOffenseApproach];
  let strategy = getStrategyKey(explicit || legacy || 'standard');
  if (battingTeam === 'opponent' && strikes === 2 && strategy === 'standard' && Math.random() < 0.45) {
    strategy = 'protect';
  }
  return strategy;
}

function getActiveTargetZoneIndex(game, battingTeam) {
  if (battingTeam === 'player') {
    return normalizeZoneIndex(game.battingTargetZone, 3, 4);
  }
  return normalizeZoneIndex(game.opponentTargetZone, 3, Math.floor(Math.random() * 9));
}

function getActiveVelocityLock(game, battingTeam) {
  if (battingTeam === 'player') return game.battingVelocityLock || 'none';
  const lock = game.opponentVelocityLock || 'none';
  return ['fast', 'slow', 'none'].includes(lock) ? lock : 'none';
}

function resolveHotZoneMods(batter, finalPosition) {
  const heatMap = batter?.advancedStats?.heatMap;
  if (!heatMap || typeof heatMap !== 'object') {
    return { contact: 0, power: 0, eye: 0 };
  }
  const x = finalPosition.x;
  const y = finalPosition.y;
  const col = Math.max(0, Math.min(2, Math.floor((x + 22.5) / 15)));
  const row = Math.max(0, Math.min(2, Math.floor((22.5 - y) / 15)));
  const key = `${row},${col}`;
  const cell = heatMap[key] || heatMap[`${row}-${col}`] || {};
  return {
    contact: clampNumber(cell.contactMod || 0, -8, 8),
    power: clampNumber(cell.powerMod || 0, -6, 10),
    eye: clampNumber(cell.eyeMod || 0, -4, 4)
  };
}

function applyWildPitchAdvance(game, battingTeam) {
  const runners = battingTeam === 'opponent' ? game.opponentRunners : game.playerRunners;
  const scoreKey = battingTeam === 'opponent' ? 'opponentScore' : 'playerScore';
  const before = game[scoreKey];
  if (runners[2]) {
    game[scoreKey] += 1;
    runners[2] = null;
  }
  if (runners[1]) {
    runners[2] = runners[1];
    runners[1] = null;
  }
  if (runners[0]) {
    runners[1] = runners[0];
    runners[0] = null;
  }
  const gained = game[scoreKey] - before;
  if (gained > 0) game.recordTeamRuns(battingTeam, gained);
  return gained;
}

function normalizeThreeWayProbabilities(whiffProb, foulProb, inPlayProb) {
  const safeWhiff = Math.max(0, whiffProb);
  const safeFoul = Math.max(0, foulProb);
  const safeInPlay = Math.max(0, inPlayProb);
  const total = safeWhiff + safeFoul + safeInPlay;
  if (total <= 0) return { whiffProb: 0.34, foulProb: 0.33, inPlayProb: 0.33 };
  return {
    whiffProb: safeWhiff / total,
    foulProb: safeFoul / total,
    inPlayProb: safeInPlay / total
  };
}

function sampleBattedBallType(batter) {
  const stats = batter?.advancedStats || {};
  const gb = Number(stats.gbRate);
  const ld = Number(stats.ldRate);
  const fb = Number(stats.fbRate);
  const popup = Number(stats.popupRate ?? stats.puRate);
  const hasRealMix = [gb, ld, fb, popup].every(value => Number.isFinite(value) && value >= 0);
  const mix = hasRealMix
    ? { ground: gb, liner: ld, fly: fb, popup }
    : { ground: 0.42, liner: 0.22, fly: 0.30, popup: 0.06 };
  return pickWeighted([
    { value: 'ground', weight: mix.ground },
    { value: 'liner', weight: mix.liner },
    { value: 'fly', weight: mix.fly },
    { value: 'popup', weight: mix.popup }
  ]) || 'ground';
}

function generateInPlayAngles(batter, finalPosition, ballTypeHint, contactQuality) {
  const typeRanges = {
    ground: [-15, 9],
    liner: [10, 24],
    fly: [25, 39],
    popup: [40, 60]
  };
  const [laMin, laMax] = typeRanges[ballTypeHint] || typeRanges.ground;
  const baseLaunch = randomBetween(laMin, laMax);
  const avgLaunch = Number(batter?.advancedStats?.avgLaunchAngle);
  const launch = Number.isFinite(avgLaunch)
    ? clampNumber(baseLaunch * 0.7 + avgLaunch * 0.3, -20, 65)
    : clampNumber(baseLaunch + (contactQuality - 0.5) * 4, -20, 65);
  const pullBias = batter?.bats === 'L' ? 6 : batter?.bats === 'R' ? -6 : 0;
  const spray = clampNumber(gaussianRandom(pullBias + finalPosition.x * 0.25, 14), -55, 55);
  return { launch, spray };
}

// ===== v1.15 對手 AI =====
class OpponentAI {
  constructor(game) { this.game = game; }

  decide() {
    const g = this.game;
    const scoreDiff = g.opponentScore - g.playerScore;
    const inning = g.inning;
    const runnersOn = (g.currentHalf === 'top' ? g.opponentRunners : g.playerRunners).filter(Boolean).length;
    const outs = g.outs;
    g.opponentUseBurnLife = false;

    if (g.currentHalf === 'top') {
      // 對手進攻 → 選擇打擊策略
      if (scoreDiff < -3) {
        g.opponentOffenseApproach = 'aggressive';
      } else if (scoreDiff > 2 && inning >= 7) {
        g.opponentOffenseApproach = 'patient';
      } else if (runnersOn >= 1 && outs === 2) {
        g.opponentOffenseApproach = 'aggressive';
      } else {
        g.opponentOffenseApproach = 'normal';
      }
      g.opponentBattingStrategy = LEGACY_OFFENSE_STRATEGY_MAP[g.opponentOffenseApproach] || 'standard';
      g.opponentVelocityLock = Math.random() < 0.36
        ? (Math.random() < 0.5 ? 'fast' : 'slow')
        : 'none';
      g.opponentTargetZone = pickWeighted([
        { value: 4, weight: 2.4 }, { value: 1, weight: 1.1 }, { value: 3, weight: 1.1 },
        { value: 5, weight: 1.1 }, { value: 7, weight: 1.1 }, { value: 0, weight: 0.5 },
        { value: 2, weight: 0.5 }, { value: 6, weight: 0.5 }, { value: 8, weight: 0.5 }
      ]) ?? 4;
      const label = { aggressive: '積極揮擊', patient: '消極等球', normal: '普通' }[g.opponentOffenseApproach];
      if (g.opponentOffenseApproach !== 'normal') {
        g.addToLog(`⚙ 對手策略：${g.opponentTeam?.name || '對手'} 採用【${label}】`);
      }
      const batter = g.opponentTeam?.getCurrentBatter?.();
      const highLeverageSwing = inning >= 7 || runnersOn >= 2 || scoreDiff < 0;
      if (batter && highLeverageSwing && batter.state.stamina > 18 && Math.random() < 0.42) {
        g.opponentUseBurnLife = true;
        g.addToLog(`⚙ 對手技能：${batter.name} 準備燃燒生命強攻。`);
      }
      // 換投手：對手先發體力不足時自動換投
      const sp = g.opponentTeam?.pitcher;
      if (sp && (sp.state.stamina / Math.max(1, sp.maxStamina)) < 0.25 && inning >= 5) {
        const bullpen = g.opponentTeam?.bullpen;
        if (Array.isArray(bullpen)) {
          const fresh = bullpen.find(rp => rp.state.stamina > 25 && !rp._usedAsReliever);
          if (fresh) {
            g.addToLog(`⚙ 對手換投：${g.opponentTeam.name} 換上後援 ${fresh.name}`);
            g.opponentTeam.pitcher = fresh;
            fresh._usedAsReliever = true;
          }
        }
      }
    } else {
      // 對手守備 → 選擇投球策略
      const sp = g.opponentTeam?.pitcher;
      if (sp && (sp.state.stamina / Math.max(1, sp.maxStamina)) < 0.25 && inning >= 5) {
        const bullpen = g.opponentTeam?.bullpen;
        if (Array.isArray(bullpen)) {
          const fresh = bullpen.find(rp => rp.state.stamina > 25 && !rp._usedAsReliever);
          if (fresh) {
            g.addToLog(`⚙ 對手換投：${g.opponentTeam.name} 換上後援 ${fresh.name}`);
            g.opponentTeam.pitcher = fresh;
            fresh._usedAsReliever = true;
          }
        }
      }
      if (runnersOn > 0 && outs < 2 && scoreDiff > 0) {
        g.opponentPitchPlan = 'breaking';
      } else if (scoreDiff < -2) {
        g.opponentPitchPlan = 'fastball';
      } else if (inning >= 8 && scoreDiff >= 0) {
        g.opponentPitchPlan = 'waste';
      } else {
        g.opponentPitchPlan = pickWeighted([
          { value: 'fastball', weight: 2.5 },
          { value: 'balanced', weight: 3.5 },
          { value: 'breaking', weight: 3 },
          { value: 'waste', weight: 1 }
        ]);
      }
      // Phase 1：sequencing 啟用時，用意圖系統記錄配球策略
      if (typeof PitchSequencingEngine !== 'undefined' && typeof GAME_PARAMS !== 'undefined' && GAME_PARAMS.pitcherChannels && GAME_PARAMS.pitcherChannels.sequencingEnabled) {
        var aiRunners = g.playerRunners.filter(Boolean).length;
        var aiScDiff = g.opponentScore - g.playerScore;
        g._opponentIntent = PitchSequencingEngine.selectIntent(g.balls, g.strikes, aiRunners, aiScDiff);
      }
      g.opponentPitchEffort = inning >= 8 && Math.abs(scoreDiff) <= 1 ? 'full' : (scoreDiff < -2 ? 'easy' : 'normal');
      const label = { fastball: '速球強攻', balanced: '均衡配球', breaking: '變化球誘騙', waste: '引誘出棒' }[g.opponentPitchPlan];
      if (g.opponentPitchPlan !== 'balanced') {
        g.addToLog(`⚙ 對手投球策略：${label}`);
      }
      const pitcher = g.opponentTeam?.pitcher;
      const highLeveragePitch = inning >= 7 || runnersOn >= 2 || (scoreDiff > 0 && outs >= 1);
      if (pitcher && highLeveragePitch && pitcher.state.stamina > 22 && Math.random() < 0.46) {
        g.opponentUseBurnLife = true;
        g.addToLog(`⚙ 對手技能：${pitcher.name} 燃燒生命壓制打者。`);
      }
      // v3.21：對手佈陣 AI（依局勢自動調整守備佈陣）
      // v3.23：加入「打者特性」因素 — 長打型 → outfield_deep，觸擊型 → 防短打
      const runnerOnThird = !!g.playerRunners[2];
      const upcomingBatter = g.batter;
      // v3.25：改讀 player.talents（天賦）判斷打者特性
      const talents = upcomingBatter?.talents || [];
      const traits  = upcomingBatter?.traits  || [];
      const isPowerHitter = talents.includes('重砲手') || talents.includes('怪力') || traits.includes('傳奇英雄');
      const isBuntSpecialist = talents.includes('快腿');
      const isContactHitter = talents.includes('安打製造機') || talents.includes('選球眼');
      if (runnersOn === 0) {
        g.opponentDefensiveShift = isPowerHitter ? 'outfield_deep' : 'standard';
      } else if (isBuntSpecialist && outs < 2 && runnersOn >= 1) {
        g.opponentDefensiveShift = 'bunt_defense';
      } else if (runnerOnThird && outs < 2 && Math.abs(scoreDiff) <= 1) {
        g.opponentDefensiveShift = isContactHitter ? 'infield_in' : 'infield_in';
      } else if (scoreDiff >= 4 && inning >= 7) {
        g.opponentDefensiveShift = 'outfield_deep';
      } else if (isPowerHitter && (runnersOn >= 1 && scoreDiff <= 1)) {
        g.opponentDefensiveShift = 'outfield_deep';
      } else if (runnersOn >= 2 || (runnersOn >= 1 && outs === 0)) {
        g.opponentDefensiveShift = 'double_play';
      } else {
        g.opponentDefensiveShift = 'standard';
      }
    }
  }
}

// =============================================================================
// resolveAtBatWithContext  v4.1
// 這個檔案是 game.js 第 4471~5007 行的替換版本。
//
// 修改摘要（對應 §16.3.1）：
//   - 純物理計算（投球位置、打者判斷、contact 分流、進場輸出）
//     全部委派給 PitchEngine.resolveSinglePitch()。
//   - 此函式只保留「game 狀態副作用層」：
//       • burnLife / opponentBurnLife 暴投效果
//       • 能力值修正（trait / condition / weather / team bonus）
//       • 球數推進、日誌、跑者、XP、updateUI
//   - 外部呼叫介面不變（game, pitcher, batter, burnLife）。
//
// 安裝方式：
//   把 game.js 從「// Resolve At-Bat Function」到第一個 }
//   （即原本的 resolveAtBatWithContext 整個函式）替換成以下程式碼。
//   pitch-engine.js 必須在 game.js 之前載入。
// =============================================================================

// Resolve At-Bat Function  (v4.1 — delegates to PitchEngine)
function resolveAtBatWithContext(game, pitcher, batter, burnLife = false) {
  // ── 護衛：確保 PitchEngine 已載入 ──────────────────────────────────────
  if (typeof PitchEngine === 'undefined') {
    console.error('[resolveAtBatWithContext] PitchEngine 未載入，請確認 pitch-engine.js 已在 game.js 之前引入。');
    return 'ball';
  }

  const matchup      = game.getCurrentMatchup();
  const battingTeam  = matchup.battingTeam;
  const tempBoostedPlayers = [];

  // ── 1. 燃燒生命 / 對手 burnLife 設定 ──────────────────────────────────
  if (battingTeam === 'opponent' && pitcher.canPitch && pitcher.canPitch()) {
    pitcher.pitchedLastGame = true;
  }

  if (burnLife) {
    if (battingTeam === 'opponent') {
      pitcher.burnLifeActive = true;
      tempBoostedPlayers.push(pitcher);
      game.addToLog(`${pitcher.name} ${i18n.activatedBurnLife}`);
    } else {
      batter.burnLifeActive = true;
      tempBoostedPlayers.push(batter);
      game.addToLog(`${batter.name} 啟動強攻模式！`);
    }
    updateBurnLifeEffect(true);
  }

  if (game.opponentUseBurnLife) {
    const aiBoosted = battingTeam === 'opponent' ? batter : pitcher;
    if (aiBoosted) {
      aiBoosted.burnLifeActive = true;
      tempBoostedPlayers.push(aiBoosted);
      updateBurnLifeEffect(true);
    }
    game.opponentUseBurnLife = false;
  }

  // Phase 1/2：新打席開始時（球數 0-0）重置 atBatContext
  if (game.balls === 0 && game.strikes === 0) {
    game.atBatContext = null;
  }

  // ── 2. 計算投手有效能力值（trait / condition / weather / team bonus）──
  let vel      = pitcher.getEffectiveVelocity();
  let ctrl     = pitcher.getEffectiveControl();
  let breaking = pitcher.abilities?.breaking || ctrl;

  // 疲勞懲罰（對手投手過勞）
  if (battingTeam === 'opponent' && pitcher.isOverworked && pitcher.isOverworked()) {
    const shortBy = pitcher.idealRest() - pitcher.daysOfRest;
    const penalty = 4 + shortBy * 3;
    vel -= penalty; ctrl -= penalty; breaking -= penalty;
    game.addToLog(`【疲勞登板】${pitcher.name} 休息不足 (${pitcher.daysOfRest}/${pitcher.idealRest()})，能力下降。`);
  }

  const pitcherCond = pitcher.getConditionModifier ? pitcher.getConditionModifier() : 0;
  vel      += pitcherCond;
  ctrl     += pitcherCond;
  breaking += pitcherCond;
  breaking *= pitcher.getPitchStaminaMultiplier ? pitcher.getPitchStaminaMultiplier() : 1;

  // v3.25.2：投手體力狀態對能力的修正（取代並擴充舊有的 getPitchStaminaMultiplier）
  const staminaState = typeof getStaminaState === 'function' ? getStaminaState(pitcher) : null;
  if (staminaState && staminaState.mods) {
    vel      += staminaState.mods.velocity || 0;
    ctrl     += staminaState.mods.control  || 0;
    breaking += staminaState.mods.breaking || 0;
  }

  // v3.25.4：特殊投法（下勾/側投）出手點加成
  const armSlot = pitcher.armSlot || window.GAME_PARAMS?.specialPitcherArmSlot?.[pitcher.name] || null;
  const armBonus = armSlot ? (window.GAME_PARAMS?.armSlotBonus?.[armSlot]) : null;
  // 標記給後續 stuffScore 計算
  pitcher._activeArmSlot = armSlot;
  pitcher._activeArmBonus = armBonus;

  // Trait 加成（投手）— v3.25：改為品階解鎖的「特質」名稱
  if (pitcher.traits.includes('光速球'))    { vel += 6; breaking += 0; }
  if (pitcher.traits.includes('縫紉機'))    { ctrl += 5; }
  if (pitcher.traits.includes('魔球師'))    { breaking += 5; }
  if (pitcher.traits.includes('絕對王牌') && game.isHighLeverage()) { ctrl += 5; breaking += 4; }
  if (pitcher.traits.includes('覺醒'))      { vel += 2; ctrl += 2; breaking += 2; }
  // 「控球不穩」「滾地球投手」改為純天賦標籤，已反映在 abilities.control / fip 數值上

  // 天氣
  if (game.weather === i18n.rainy) ctrl *= 0.85;

  // 投球計畫對能力值的修正（對方投手是 player 守備時用 opponentPitchPlan）
  const activePitchPlan = battingTeam === 'player' ? game.opponentPitchPlan : game.pitchPlan;

  // 選球種
  const pitchPool = Array.isArray(pitcher.pitchTypes) ? pitcher.pitchTypes : [];
  // v4.1 3C'：我方投球時，若玩家有指定實際球種，優先用玩家選的；否則沿用配球邏輯
  const playerChoice = (battingTeam === 'opponent' && game.playerPitchChoice)
    ? pitchPool.find(p => getPitchName(p) === game.playerPitchChoice)
    : null;

  // Phase 1：PitchIntent 配球引擎（sequencingEnabled=1 時啟用）
  var aimCellFromIntent = null;
  var selectedPitch = null;
  var intentUsed = null;

  if (typeof PitchSequencingEngine !== 'undefined' && typeof GAME_PARAMS !== 'undefined' && GAME_PARAMS.pitcherChannels && GAME_PARAMS.pitcherChannels.sequencingEnabled) {
    // ── 意圖驅動配球 ──
    var runnerCnt = (battingTeam === 'player' ? game.playerRunners : game.opponentRunners).filter(Boolean).length;
    var scDiff = battingTeam === 'player' ? game.opponentScore - game.playerScore : game.playerScore - game.opponentScore;

    intentUsed = PitchSequencingEngine.selectIntent(game.balls, game.strikes, runnerCnt, scDiff);

    // 打者弱點資料（從 batter.advancedStats.pitchTypeMatchup）
    var batterMatchup = (batter.advancedStats && batter.advancedStats.pitchTypeMatchup) || null;

    // 建立/更新 atBatContext
    if (!game.atBatContext) {
      game.atBatContext = { pitchHistory: [], batterGuess: null, pitcherState: { usageCount: {}, lastPitches: [] } };
      // Phase 2：初始化打者預期模型
      if (typeof BatterAIModel !== 'undefined') {
        game.atBatContext.batterGuess = BatterAIModel.initializeExpectation(pitchPool);
      }
    }

    // Phase 2：打者預測下一球（在 PitchEngine 之前）
    if (game.atBatContext && game.atBatContext.batterGuess && typeof BatterAIModel !== 'undefined') {
      game.atBatContext.batterGuess = BatterAIModel.predictNextPitch(
        game.atBatContext.batterGuess, game.atBatContext,
        { balls: game.balls, strikes: game.strikes }
      );
    }

    var chosen = PitchSequencingEngine.selectPitchIntent(
      intentUsed, pitchPool, batterMatchup, vel, pitcher.throws, game.atBatContext, ctrl
    );

    if (chosen && chosen.pitch) {
      selectedPitch = chosen.pitch;
      aimCellFromIntent = chosen.aimCellIndex;
      // Wave B control→BB9：PitchIntent 選的理想 aim 疊加控球偏移
      var ctrlBallMul = (typeof PitchEngine !== 'undefined' && PitchEngine.controlBallRateMul)
        ? PitchEngine.controlBallRateMul(ctrl) : 1;
      if (ctrlBallMul > 1.0) {
        var overrideChance = Math.min(0.45, (ctrlBallMul - 1.0) * 0.55);
        if (Math.random() < overrideChance) {
          aimCellFromIntent = null; // 退回 resolvePitchAimCell 的 control 加權路徑
        }
      }
    }
  }

  // Fallback：若 sequencing 未啟用或選不出球種，退回現行邏輯
  if (!selectedPitch) {
    if (activePitchPlan === 'fastball')  { vel += 5; breaking -= 2; }
    if (activePitchPlan === 'breaking')  { breaking += 7; ctrl -= 3; }
    if (activePitchPlan === 'waste')     ctrl -= 6;

    selectedPitch = playerChoice
      ? playerChoice
      : activePitchPlan === 'fastball'
        ? pitchPool.find(p => getPitchName(p).includes('縫線') || getPitchName(p).includes('卡特')) || pitchPool[0]
        : activePitchPlan === 'breaking'
          ? pitchPool.slice().sort((a, b) => (b.movement || 0) - (a.movement || 0))[0]
          : activePitchPlan === 'waste'
            ? pitchPool.slice().sort((a, b) => (b.control || 0) - (a.control || 0))[0]
            : pitchPool[0];
  }

  if (selectedPitch) {
    vel      += ((selectedPitch.speed    || 75) - 75) / 18;
    breaking += ((selectedPitch.movement || 70) - 70) / 12;
    ctrl     += ((selectedPitch.control  || 70) - 70) / 16;
  }

  const stuffScore = estimateStuffScore(pitcher, selectedPitch);
  const pitchSpeedKmh = estimatePitchSpeedKmh(pitcher, selectedPitch);
  game.lastPitchSpeed = Math.round(pitchSpeedKmh);
  game.lastPitchType  = selectedPitch?.name || '速球';

  const effort    = burnLife
    ? 'full'
    : normalizeEffortKey(battingTeam === 'opponent' ? game.pitchEffort : game.opponentPitchEffort);

  // ── 3. 計算打者有效能力值 ──────────────────────────────────────────────
  let contact = batter.abilities?.contact    || batter.physical.control;
  let pow     = batter.getEffectivePower();
  let spd     = batter.abilities?.speed      || batter.physical.speed;
  let eye     = batter.abilities?.discipline || contact;

  const batterCond = batter.getConditionModifier ? batter.getConditionModifier() : 0;
  contact += batterCond; pow += batterCond; spd += batterCond; eye += batterCond;

  // Trait 加成（打者）— v3.25：改為品階解鎖的「特質」名稱
  if (batter.traits.includes('巨人之力'))   pow += 7;
  if (batter.traits.includes('神之巧手'))   contact += 6;
  if (batter.traits.includes('綠繡眼'))     eye += 7;
  if (batter.traits.includes('剋左狂魔') && pitcher.throws === 'L') { contact += 7; pow += 5; }
  if (batter.traits.includes('最終兵器') && game.getCurrentRunners().some((r, idx) => r && idx >= 1)) {
    contact += 8;
    pow += 5;
    game.addToLog(`${batter.name} 最終兵器啟動！得點圈火力大爆發。`);
  }
  if (batter.traits.includes('覺醒'))       { contact += 2; pow += 2; eye += 2; }
  // 「恐左」「重砲手」「選球眼」等已改為天賦（純顯示），不再額外加成
  if (game.weather === i18n.rainy) spd *= 0.9;
  if (game.currentTactic === '情蒐奏效' && battingTeam === 'opponent') { contact -= 5; pow -= 4; }

  // 左右投加成
  if (pitcher.throws === 'L') contact += ((batter.abilities.vsLeft  || contact) - 70) / 4;
  else                         contact += ((batter.abilities.vsRight || contact) - 70) / 5;

  // v3.25.4：特殊投法（下勾/側投）對打者的修正
  if (pitcher._activeArmBonus) {
    const b = pitcher._activeArmBonus;
    if (batter.bats === 'R' && Number.isFinite(b.vsRightContact)) contact += b.vsRightContact;
    if (batter.bats === 'L' && Number.isFinite(b.vsLeftContact))  contact += b.vsLeftContact;
    if (game._lastArmSlotLog !== pitcher.name) {
      game.addToLog(`${pitcher.name}（${b.label}）：${b.battleLog || ''}`);
      game._lastArmSlotLog = pitcher.name;  // 同投手只報一次
    }
  }

  // 得點圈加成（§16.15 Wave C-2 通道 6：crisis 擴大到 ctrl/break/vel，與打者 scoringPosition 對稱）
  if (game.getCurrentRunners().some((r, idx) => r && idx >= 1)) {
    contact += ((batter.abilities.scoringPosition || contact) - 70) / 5;
    const pc = (typeof GAME_PARAMS !== 'undefined' && GAME_PARAMS.pitcherChannels) || {};
    const crisisAdj = (pitcher.abilities.crisis ?? ctrl) - 70;
    ctrl     += crisisAdj * (pc.crisisCtrlCoef  ?? 0.20);  // 0.20 = 舊 /5（相容）
    breaking += crisisAdj * (pc.crisisBreakCoef ?? 0.10);
    vel      += crisisAdj * (pc.crisisVelCoef   ?? 0.05);
  }

  // 教練 bonus
  const teamBonuses = game.getTeamBonuses();
  if (battingTeam === 'opponent') {
    ctrl += teamBonuses.pitching || 0;
    breaking += teamBonuses.pitching || 0;
    vel  += (teamBonuses.pitching || 0) / 2;
  } else {
    contact += teamBonuses.hitting || 0;
    pow     += teamBonuses.hitting || 0;
  }

  // ── 4. 準備 PitchEngine 輸入 ───────────────────────────────────────────
  const pitcherStats = {
    control:    ctrl,
    velocity:   vel,
    breaking,
    stuffScore,
    fatigue:    getFatigueScore(pitcher),
    pitchTypes: pitchPool,
    throws:     pitcher.throws
  };

  // Phase 1：sequencing 啟用且有 intent 決定的 aim cell → 優先使用；否則走現行邏輯
  const pitchAimCellIndex = (aimCellFromIntent != null)
    ? aimCellFromIntent
    : resolvePitchAimCell(game, battingTeam, activePitchPlan, ctrl);
  // v3.25.3：玩家投手時若有設定 pitchAimPosition（拖拉式 UI），優先使用
  const aimPos = (battingTeam === 'opponent' && game.pitchAimPosition
                  && Number.isFinite(game.pitchAimPosition.x))
    ? game.pitchAimPosition
    : null;
  const pitchConfig = {
    aimCellIndex: pitchAimCellIndex,
    aimPosition:  aimPos,
    effortKey:    effort,
    pitchType:    selectedPitch
  };

  const batterStats = {
    contact,
    power: pow,
    eye,
    bats:         batter.bats,
    advancedStats: batter.advancedStats
  };

  const strategyKey     = getActiveBattingStrategy(game, battingTeam, game.strikes);
  const targetZoneIndex = getActiveTargetZoneIndex(game, battingTeam);
  const velocityLock    = getActiveVelocityLock(game, battingTeam);

  // hotZoneMod 需要 finalPosition，先帶空值進去，拿到 finalPosition 後再修正 contact
  // （§INTEGRATION_PATCH.md 選項 A：兩段計算）
  const battingConfig = {
    strategyKey,
    targetZoneIndex,
    velocityLock,
    balls:   Number.isFinite(game.balls)   ? game.balls   : 0,
    strikes: Number.isFinite(game.strikes) ? game.strikes : 0,
    hotZoneMod: { contact: 0, power: 0 },   // 先用 0，下面拿到 finalPosition 後疊加
    situationalContactMod: 0
  };

  // ── 5. 呼叫純物理引擎 ─────────────────────────────────────────────────
  const engineResult = PitchEngine.resolveSinglePitch({
    pitcherStats,
    pitchConfig,
    batterStats,
    battingConfig,
    batterExpectation: (game.atBatContext && game.atBatContext.batterGuess) || null
  });

  const { pitch, swing, contact: contactResult, inPlay, summary } = engineResult;

  if (contactResult) {
    game._lastHotZoneCorrection = {
      contactDelta: contactResult.hotZoneMod?.contact ?? 0,
      powerDelta:   contactResult.hotZoneMod?.power ?? 0
    };
  }

  // ── 6. 同步 game.lastPitchContext ─────────────────────────────────────
  game.lastPitchContext = {
    pitchType:      game.lastPitchType,
    speedKmh:       pitch.speedKmh,
    stuffScore:     Math.round(pitch.stuffScore),
    stuffGrade:     pitch.stuffGrade,
    effortLevel:    pitch.effortKey,
    originalTarget: pitch.originalTarget,
    postMiss:       pitch.postMiss,
    finalPosition:  pitch.finalPosition,
    movement: { x: pitch.moveX, y: pitch.moveY, scale: pitch.movementScale },
    targetZoneIndex,
    strategy:       swing?.strategy?.label ?? '',
    velocityLock,
    perceivedStrike:    swing?.perceivedStrike,
    isStrike:           pitch.isStrike,
    isWildPitch:        pitch.isWildPitch,
    isControlLapse:     pitch.isControlLapse,   // v4.1 3B：高出力失控
    wildChance:         pitch.wildChance,
    // 打擊端視覺化額外欄位（BatterVisualizer 使用）
    didSwing:           summary.swings ?? false,
    pitchOutcome:       summary.outcome ?? null,
    finalContactScore:  contactResult?.finalContactScore ?? null,
    hotZoneMod:         contactResult?.hotZoneMod ?? null
  };

  // Phase 1：更新 atBatContext（配球歷史）
  if (game.atBatContext && selectedPitch) {
    var pState = game.atBatContext.pitcherState;
    var pName = getPitchName(selectedPitch);
    var pCode = (typeof PitchEngine !== 'undefined' && PitchEngine.classifyPitchTypeCode)
      ? PitchEngine.classifyPitchTypeCode(pName) : pName;
    var aimCenter = (typeof PitchSequencingEngine !== 'undefined')
      ? PitchSequencingEngine.getAimCenter(pitchAimCellIndex) : { x: 0, y: 0 };

    pState.usageCount[pName] = (pState.usageCount[pName] || 0) + 1;
    pState.lastPitches.push({
      name: pName,
      ptCode: pCode,
      aimCellIndex: pitchAimCellIndex,
      aimX: aimCenter.x,
      aimY: aimCenter.y,
      aimZone: pitch ? (pitch.isStrike ? 'strike' : 'ball') : 'unknown',
      speedKmh: pitch ? pitch.speedKmh : null
    });
    // 保留最近 12 球
    if (pState.lastPitches.length > 12) pState.lastPitches.shift();

    game.atBatContext.pitchHistory.push({
      pitchType: pName,
      ptCode: pCode,
      speedKmh: pitch ? pitch.speedKmh : null,
      finalPosition: pitch ? pitch.finalPosition : null,
      isStrike: pitch ? pitch.isStrike : false,
      outcome: summary.outcome,
      countBefore: { balls: game.balls, strikes: game.strikes }
    });
  }

  // Phase 2：更新打者預期（每球後學習）
  if (game.atBatContext && game.atBatContext.batterGuess && typeof BatterAIModel !== 'undefined' && selectedPitch) {
    var pFinalY = pitch && pitch.finalPosition ? pitch.finalPosition.y : null;
    game.atBatContext.batterGuess = BatterAIModel.updateAfterPitch(
      game.atBatContext.batterGuess, getPitchName(selectedPitch),
      pitch ? pitch.speedKmh : null, pFinalY
    );
  }

  // ── 7. 副作用：消耗體力、卡牌效果 ────────────────────────────────────
  const shadowClone = game.cardManager.activeEffects.shadowClone;
  if (shadowClone) triggerCloneEffect();

  const swings = summary.swings;
  // v4.1 3B：四段出力體力消耗（normal=1.0 不動；越紅越耗）
  const effortStaminaMul = effort === 'max' ? 1.5 : effort === 'full' ? 1.15 : effort === 'easy' ? 0.9 : 1;
  pitcher.consumeStamina(0.85 * effortStaminaMul);
  // v4.1 3B：高出力失控提示
  if (pitch.isControlLapse) {
    game.addToLog(`⚠️ 出力過猛，${pitcher.name} 一時失控，球大幅跑偏！`);
  }
  batter.consumeStamina((burnLife && battingTeam === 'player' ? 0.8 : 0.35) + (swings ? 0.15 : 0));

  // ── 8. finalizePitch 閉包（與原版相同）──────────────────────────────
  const finalizePitch = (outcome, atBatEnded = false, expireEffects = false) => {
    tempBoostedPlayers.forEach(p => { p.burnLifeActive = false; });
    updateBurnLifeEffect(false);
    if (expireEffects) game.expireEffects();
    if (atBatEnded) game.advanceBatterOrder(battingTeam);
    game.saveManager.save(game);
    game.updateUI();
    return outcome;
  };

  if (typeof PitchResultApplier === 'undefined') {
    console.error('[resolveAtBatWithContext] PitchResultApplier 未載入，請確認 pitch-result-applier.js 已在 game.js 之前引入。');
    return finalizePitch('pitch_result_module_missing');
  }

  const pitchResult = PitchResultApplier.apply({
    game,
    battingTeam,
    batter,
    pitcher,
    pitch,
    summary,
    contactResult,
    i18n,
    shadowClone,
    finalizePitch,
    pickCommentary,
    awardPlayerXP,
    applyWildPitchAdvance
  });
  if (pitchResult.handled) return pitchResult.outcome;

  if (typeof FieldingEngine === 'undefined') {
    console.error('[resolveAtBatWithContext] FieldingEngine 未載入，請確認 fielding-engine.js 已在 game.js 之前引入。');
    game.advanceRunners(i18n.single, battingTeam, batter);
    game.resetCount();
    return finalizePitch(i18n.single, true, true);
  }
  if (typeof DefenseStateBuilder === 'undefined') {
    console.error('[resolveAtBatWithContext] DefenseStateBuilder 未載入，請確認 defense-state-builder.js 已在 game.js 之前引入。');
    game.advanceRunners(i18n.single, battingTeam, batter);
    game.resetCount();
    return finalizePitch(i18n.single, true, true);
  }

  const evKmh = inPlay.evKmh;
  const angles = { launch: inPlay.launchAngleDeg, spray: inPlay.sprayAngleDeg };
  const runners = battingTeam === 'opponent' ? game.opponentRunners : game.playerRunners;
  const fieldingResolution = FieldingEngine.resolveInPlay({
    inPlay,
    stadium: DefenseStateBuilder.getCurrentStadium(game),
    defense: DefenseStateBuilder.buildDefenseState(
      game,
      battingTeam,
      battingTeam === 'opponent' ? (game.defensiveShift || 'standard') : (game.opponentDefensiveShift || 'standard')
    ),
    batter,
    runners,
    outs: game.outs,
    advanceBonus: battingTeam === 'player' ? game.getRunnerAdvanceBonus() : 0,
    rng: Math.random,
    allowPhysicalFoul: false
  });
  const { ballInfo, fielding, playResult, visualTimeline } = fieldingResolution;

  game.lastInPlayContext = {
    ...inPlay,
    ballInfo,
    fielding,
    playResult,
    visualTimeline
  };

  if (typeof InPlayResultApplier === 'undefined') {
    console.error('[resolveAtBatWithContext] InPlayResultApplier 未載入，請確認 in-play-result-applier.js 已在 game.js 之前引入。');
    game.advanceRunners(i18n.single, battingTeam, batter);
    game.resetCount();
    return finalizePitch(i18n.single, true, true);
  }

  return InPlayResultApplier.apply({
    game,
    battingTeam,
    batter,
    pitcher,
    i18n,
    shadowClone,
    fieldingResolution,
    inPlay,
    evKmh,
    angles,
    ballInfo,
    fielding,
    playResult,
    visualTimeline,
    runners,
    finalizePitch,
    pickCommentary,
    awardPlayerXP,
    triggerShakeEffect,
    errorLabels: FieldingEngine.ERROR_LABELS,
    fieldingErrorLabels: FIELDING_ERROR_LABELS
  });
}


function resolveAtBat(pitcher, batter, burnLife = false) {
  return resolveAtBatWithContext(game, pitcher, batter, burnLife);
}

// Initialize runtime through the standalone engine host
let game = null;
let gameEngine = null;

function bindEngineControl(id, handler) {
  const element = document.getElementById(id);
  if (!element || element.dataset.engineBound === 'true') return;
  element.addEventListener('click', handler);
  element.dataset.engineBound = 'true';
}

function bindGameplayControls(engine) {
  bindEngineControl('normal-pitch', () => {
    engine.dispatch('pitch.normal');
  });

  // v4.1 #6：對決開始 — 唯一執行鈕，依 duelMode 路由（投球 / 牽制），設定與執行分離
  bindEngineControl('duel-start', () => {
    const activeGame = engine.getGame();
    if (activeGame && activeGame.duelMode === 'pickoff') {
      engine.dispatch('game.pickoff');
      // 牽制執行後解除鎖定，回到投球模式
      if (typeof activeGame.setDuelMode === 'function') activeGame.setDuelMode('pitch');
    } else {
      engine.dispatch('pitch.normal');
    }
  });

  bindEngineControl('magic-pitch', () => {
    engine.dispatch('pitch.magic');
  });

  const legacyAutoSimButton = document.getElementById('auto-sim');
  if (legacyAutoSimButton && legacyAutoSimButton.dataset.engineBound !== 'true') {
    legacyAutoSimButton.addEventListener('click', () => {
      engine.performPitch({ burnLife: false, auto: true });
    });
    legacyAutoSimButton.dataset.engineBound = 'true';
  }

  // v4.1 #6：牽制鈕改為「鎖定牽制」開關（設定），不再立即執行；由對決開始鈕執行
  bindEngineControl('pickoff', () => {
    const activeGame = engine.getGame();
    if (!activeGame || typeof activeGame.setDuelMode !== 'function') {
      engine.dispatch('game.pickoff');
      return;
    }
    activeGame.setDuelMode(activeGame.duelMode === 'pickoff' ? 'pitch' : 'pickoff');
  });

  bindEngineControl('steal-base', () => {
    engine.dispatch('game.steal');
  });

  bindEngineControl('baserunning-mode', () => {
    engine.dispatch('game.baserunning.cycle');
  });

  bindEngineControl('toggle-weather', () => {
    engine.dispatch('game.weather.toggle');
  });

  bindEngineControl('auto-toggle', () => {
    const wasRunning = engine.getGame()?.autoSimEnabled;
    engine.dispatch('game.auto.toggle');
    const activeGame = engine.getGame();
    if (!activeGame) return;
    if (wasRunning) {
      activeGame.addToLog('全場自動已停止。');
    } else {
      activeGame.addToLog('全場自動開始，會一路模擬到比賽結束。');
    }
  });

  bindEngineControl('draw-local', () => {
    engine.dispatch('game.draw.local');
  });

  bindEngineControl('draw-international', () => {
    engine.dispatch('game.draw.international');
  });

  bindEngineControl('draw-international-11', () => {
    engine.dispatch('game.draw.international11');
  });
}

function initializeGameRuntime() {
  if (!window.BaseballGameEngine) {
    throw new Error('BaseballGameEngine is not loaded.');
  }

  gameEngine = new window.BaseballGameEngine({ autoSimDelayMs: 50 })
    .bootstrap({
      GameClass: Game,
      OpponentAIClass: OpponentAI,
      resolveAtBat,
      resolveAtBatWithContext,
      i18n
    });

  game = gameEngine.start();
  window.game = game;
  window.gameEngine = gameEngine;
  bindGameplayControls(gameEngine);

  // 詞法 `game` 已賦值，這時候才能安全地觸發第一次 UI 渲染。
  if (typeof game.updateUI === 'function') {
    game.updateUI();
  }

  // v3.23：第一次進入遊戲播放主線序章；確保所有球員都有三軌養成欄位
  if (typeof window.PlayerGrowth?.ensureGrowthFields === 'function') {
    game.roster.players.forEach(p => window.PlayerGrowth.ensureGrowthFields(p));
  }
  if (typeof window.StoryIntro?.autoPlayIfNeeded === 'function') {
    window.StoryIntro.autoPlayIfNeeded(game);
  }
  return game;
}

initializeGameRuntime();

// Tab switching
function showTab(tabName) {
  document.getElementById('game-tab').style.display = tabName === 'game' ? 'block' : 'none';
  document.getElementById('roster-tab').style.display = tabName === 'roster' ? 'block' : 'none';
  document.getElementById('season-tab').style.display = tabName === 'season' ? 'block' : 'none';
  document.getElementById('shop-tab').style.display = tabName === 'shop' ? 'block' : 'none';
}

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

// v1.14：比賽中換投（牛棚登板）
function bringInReliever(index) {
  game.bringInReliever(index);
}

// v1.14：碎片商店兌換傳奇英雄
function redeemHero(heroIndex) {
  const result = game.redeemHero(heroIndex);
  if (typeof renderShardShop === 'function') renderShardShop();
  return result;
}

// v1.14：拖拽球員卡片到一軍 / 二軍區
function dropRosterLevel(event, targetLevel) {
  event.preventDefault();
  const raw = event.dataTransfer?.getData('text/plain');
  const index = Number(raw);
  if (!Number.isInteger(index)) return;
  game.setPlayerLevel(index, targetLevel);
}

function showMatchSummary(result, playerScore, opponentScore, currency, heatReward = 0, standingsHTML = '', matchStats = null, lineScore = null, playerHits = 0, opponentHits = 0, playerErrors = 0, opponentErrors = 0, opponentName = '對手') {
  const modal = document.getElementById('match-summary-modal');
  // 結果標題
  const resultMap = { Win: '勝利 🏆', Loss: '敗北', Tie: '平局' };
  document.getElementById('summary-result').textContent = resultMap[result] || result;
  document.getElementById('summary-result').className = `summary-result-title result-${(result||'').toLowerCase()}`;
  document.getElementById('summary-score').textContent = `${i18n.score}: ${playerScore} - ${opponentScore}`;
  document.getElementById('summary-reward').textContent = `${i18n.scoutsPoints}: ${currency}`;
  const heat = document.getElementById('summary-heat');
  if (heat) heat.textContent = `球場熱度收益：+${heatReward} SP`;
  // 逐局記分板
  const lsEl = document.getElementById('summary-linescore');
  if (lsEl && lineScore) {
    const inningNums = Array.from({length:9},(_,i)=>`<th>${i+1}</th>`).join('');
    const playerRow = Array.from({length:9},(_,i)=>`<td>${lineScore.player?.[i]||0}</td>`).join('');
    const oppRow = Array.from({length:9},(_,i)=>`<td>${lineScore.opponent?.[i]||0}</td>`).join('');
    lsEl.innerHTML = `<table class="summary-ls-table"><thead><tr><th>隊伍</th>${inningNums}<th>R</th><th>H</th><th>E</th></tr></thead><tbody>
      <tr><td class="team-name-cell">政大</td>${playerRow}<td>${playerScore}</td><td>${playerHits}</td><td>${playerErrors}</td></tr>
      <tr><td class="team-name-cell">${opponentName}</td>${oppRow}<td>${opponentScore}</td><td>${opponentHits}</td><td>${opponentErrors}</td></tr>
    </tbody></table>`;
  }
  // 賽事數據
  const statsEl = document.getElementById('summary-stats');
  if (statsEl && matchStats) {
    statsEl.innerHTML = `<div class="summary-stats-grid">
      <div class="stats-col"><strong>政大</strong><div>HR ${matchStats.playerHR}｜K ${matchStats.playerK}｜BB ${matchStats.playerBB}</div></div>
      <div class="stats-col"><strong>${opponentName}</strong><div>HR ${matchStats.opponentHR}｜K ${matchStats.opponentK}｜BB ${matchStats.opponentBB}</div></div>
    </div>`;
  }
  // 關鍵事件
  const eventsEl = document.getElementById('summary-events');
  if (eventsEl && matchStats?.keyEvents?.length) {
    const halfLabel = h => h==='bottom' ? '下' : '上';
    eventsEl.innerHTML = '<h4 class="summary-section-title">關鍵事件</h4><ul class="summary-events-list">' +
      matchStats.keyEvents.slice(-8).map(e=>`<li>${e.inning}局${halfLabel(e.half)}｜${e.txt}</li>`).join('') +
      '</ul>';
    eventsEl.style.display = '';
  } else if (eventsEl) {
    eventsEl.style.display = 'none';
  }
  // 聯盟戰績
  const standings = document.getElementById('summary-standings');
  if (standings) standings.innerHTML = standingsHTML;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeSummary() {
  const modal = document.getElementById('match-summary-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  // v1.16：結算後強制回主畫面，避免留在比賽頁。
  if (typeof changeScene === 'function') changeScene('lobby');
  const lobby = document.getElementById('scene-lobby');
  if (lobby) {
    document.querySelectorAll('.scene').forEach(scene => {
      scene.classList.remove('active', 'scene-enter', 'scene-exit');
    });
    lobby.classList.add('active');
  }
}
