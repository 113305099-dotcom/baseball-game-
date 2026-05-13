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
      return `${mvpPlayer.name} 於政治大學棒球隊勝利中大放異彩！ (${playerScore}-${opponentScore})`;
    } else if (playerScore < opponentScore) {
      return `${mvpPlayer.name} 的表現不足以阻止敗北。 (${playerScore}-${opponentScore})`;
    } else {
      return `戲劇性平局！${mvpPlayer.name} 無法突破僵局。 (${playerScore}-${opponentScore})`;
    }
  }
}

const PLAYER_DATA_VERSION = 3; // v1.14: 新增 pitcherRole / daysOfRest / 碎片 / 牛棚順序

function clampInt(value, min = 0, max = 99) {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : min;
  return Math.max(min, Math.min(max, Math.round(numeric)));
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

// v1.18 #1 #7：像素化處理（基於 hbl917070/pixel_table 演算法）
// 用 Canvas drawImage 縮小 → 再放大 + imageSmoothingEnabled=false → 取得像素風頭像
function pixelatePortraitFromImg(img, blockW = 40, outputW = 192) {
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
  const big = document.createElement('canvas');
  big.width = outputW;
  big.height = Math.round(outputW * ratio);
  const bctx = big.getContext('2d');
  bctx.imageSmoothingEnabled = false;
  bctx.drawImage(small, 0, 0, big.width, big.height);
  return big;
}

// 設定圖片載入後自動像素化
function setupPixelPortraitConversion(img) {
  if (!img || img.dataset.pixelated === 'true') return;
  const apply = () => {
    if (!img.complete || img.naturalWidth === 0) return;
    const canvas = pixelatePortraitFromImg(img, 40, 192);
    if (canvas) {
      img.src = canvas.toDataURL();
      img.dataset.pixelated = 'true';
      img.style.imageRendering = 'pixelated';
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
  const officialUrl = getOfficialPortraitUrl(player);
  if (!officialUrl) return fallback;

  const safeName = escapeAttr(player.name);
  const safeUrl = escapeAttr(officialUrl);
  const fallbackSvg = fallback.replace('class="pixel-portrait"', 'class="pixel-portrait portrait-fallback"');
  // v1.18 #1 #7：圖片載入完成後呼叫 setupPixelPortraitConversion 把照片像素化（pixel_table 演算法）
  return `<span class="pixel-portrait official-pixel-portrait" style="width:${size}px;height:${size}px" role="img" aria-label="${safeName} 官方像素頭像"><img src="${safeUrl}" alt="${safeName}" loading="lazy" crossorigin="anonymous" onload="window.setupPixelPortraitConversion && window.setupPixelPortraitConversion(this)" onerror="this.parentElement.classList.add('portrait-failed')" style="image-rendering:pixelated;image-rendering:crisp-edges">${fallbackSvg}</span>`;
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

  // v1.14：建立傳奇英雄（碎片商店兌換用）
  createLegendaryHero(candidate) {
    const traits = ['傳奇英雄', ...(candidate.traits || [])];
    return new Player(
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
        sourceStats: { source: 'Legendary hero', name: candidate.name }
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
    this.team = meta.team || '政治大學棒球隊';
    this.nickname = meta.nickname || '';
    this.englishName = meta.englishName || '';
    this.level = meta.level || 'major';
    this.bats = meta.bats || (this.role === 'P' ? 'R' : (Math.random() < 0.34 ? 'L' : 'R'));
    this.throws = meta.throws || (this.role === 'P' || this.role === 'T' ? (Math.random() < 0.28 ? 'L' : 'R') : 'R');
    this.sourceStats = meta.sourceStats || {};
    this.abilities = this.normalizeAbilities(meta.abilities);
    this.condition = meta.condition || 'normal';
    this.pitchTypes = Array.isArray(meta.pitchTypes) ? meta.pitchTypes : this.generatePitchTypes();

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
    // v1.16：燃燒生命保留爆發感，但避免一個打席直接燒掉大量體力。
    let multiplier = this.burnLifeActive ? 1.2 : 1;
    if (this.canPitch() && this.isOverworked && this.isOverworked()) multiplier *= 1.4;
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
        protectionDuration: p.protectionDuration,
        // v1.14
        pitcherRole: p.pitcherRole,
        daysOfRest: p.daysOfRest,
        pitchedLastGame: p.pitchedLastGame
      })),
      activeLineup: {
        pitcher: game.roster.activeLineup.pitcher ? game.roster.players.indexOf(game.roster.activeLineup.pitcher) : null,
        batter: game.roster.activeLineup.batter ? game.roster.players.indexOf(game.roster.activeLineup.batter) : null
      },
      currency: game.currency,
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
      offenseApproach: game.offenseApproach,
      pitchPlan: game.pitchPlan,
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
      majorRosterLimit: game.majorRosterLimit
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
            // v1.14
            pitcherRole: p.pitcherRole,
            daysOfRest: p.daysOfRest,
            pitchedLastGame: p.pitchedLastGame
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
      game.offenseApproach = data.offenseApproach || game.offenseApproach;
      game.pitchPlan = data.pitchPlan || game.pitchPlan;
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
        // 二軍球員：少量 XP（v1.18 #2）
        awardPlayerXP(p, 10, 'all', this.game);
      } else {
        // 一軍球員：較多 XP
        awardPlayerXP(p, 20, p.role === 'P' ? 'pitching' : 'batting', this.game);
      }
    });
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
    this.lineScore = this.createEmptyLineScore();
    this.playerHits = 0;
    this.opponentHits = 0;
    this.playerErrors = 0;
    this.opponentErrors = 0;
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
    this.opponentOffenseApproach = 'normal';
    this.opponentPitchPlan = 'balanced';
    this.opponentUseBurnLife = false;
    this.pickoffAttemptsThisHalf = 0;
    this.managementLog = [];
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

  selectStartingPitcher(index) {
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
    // 抽教練（v1.18 #16），每次 200 資金
    if (typeof window === 'undefined' || !window.COACHES_POOL) return null;
    const pool = window.COACHES_POOL;
    if (this.currency < 200) {
      this.addManagementLog('資金不足，無法抽教練。');
      return null;
    }
    this.currency -= 200;
    // SSR 5%, SR 20%, R 75%
    const roll = Math.random();
    let rarity = 'R';
    if (roll < 0.05) rarity = 'SSR';
    else if (roll < 0.25) rarity = 'SR';
    const pickPool = pool.filter(c => c.rarity === rarity && !this.hiredCoaches.includes(c.id));
    if (!pickPool.length) {
      this.addManagementLog('該稀有度教練已抽完。');
      return null;
    }
    const coach = pickPool[Math.floor(Math.random() * pickPool.length)];
    this.hiredCoaches.push(coach.id);
    this.addManagementLog(`🌟 抽到 ${coach.rarity} 教練：${coach.name}！`);
    this.saveManager.save(this);
    return coach;
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
    this.updateClassicScoreboard(matchup);
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
    document.getElementById('auto-toggle').textContent = this.autoSimEnabled ? '全場自動：進行中' : '全場自動';
    const cardsDiv = document.getElementById('cards');
    cardsDiv.innerHTML = this.cardManager.hand.map((card, i) => `<button onclick="activateCard(${i})" class="bg-purple-500 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs mr-2 mb-2">${card.name} (${card.cost} ${i18n.mana})</button>`).join('');
    
    // Update baseball diamond
    this.updateDiamondUI();
    updateDiamondRunners(); // PATCH: was this.updateDiamondRunners() but it's a global function

    this.updateOpponentUI();
    this.updateBullpenUI();
    this.updateRosterUI();
    // v1.14：碎片數量在 HUD / 商店顯示
    const shardChip = document.getElementById('shard-count');
    if (shardChip) shardChip.textContent = this.playerShards || 0;
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
    // v1.15：改為橫列模式（一列一列），更直覺
    const rosterDiv = document.getElementById('roster-gallery');
    if (!rosterDiv) return;

    const cardMajorCount = this.roster.players.filter(player => player.level !== 'minor').length;
    const renderRosterCard = ({ p, i }) => {
      const rank = p.getRank();
      const isPitcher = p.canPitch() && p.role === 'P';
      const lineupSpot = this.playerBattingOrder.indexOf(i);
      const assignedPos = this.getAssignedPosition(i);
      const inLineup = lineupSpot >= 0;
      const canAssignDefense = p.canBat() && p.level !== 'minor' && inLineup;
      const staminaPct = Math.max(0, Math.min(100, Math.round((p.state.stamina / Math.max(1, p.maxStamina)) * 100)));
      const staminaState = staminaPct < 30 ? 'danger' : staminaPct < 60 ? 'warning' : 'safe';
      const roleTag = isPitcher ? (p.pitcherRole === 'SP' ? '先發投手' : '後援投手') : p.getPositionLabel();
      const restTag = isPitcher && p.idealRest ? `休 ${p.daysOfRest ?? 0}/${p.idealRest()}${p.isOverworked && p.isOverworked() ? ' 警戒' : ''}` : '';
      const statPairs = isPitcher
        ? [['球速', p.abilities.velocity], ['控球', p.abilities.control], ['變化', p.abilities.breaking], ['球威', p.abilities.stuff]]
        : [['巧打', p.abilities.contact], ['長打', p.abilities.power], ['走力', p.abilities.speed], ['守備', p.abilities.fielding]];
      const positionOptions = this.defensiveSlots.map(slot => {
        const label = POSITION_LABELS[slot] || slot;
        return `<option value="${slot}" ${assignedPos === slot ? 'selected' : ''}>${label}</option>`;
      }).join('');
      const traitMarkup = (p.traits || []).slice(0, 3).map(trait => `<span class="trait-pill trait-${getTraitTier(trait)}">${trait}</span>`).join('') || '<span class="trait-pill">標準型</span>';
      // v1.18 #17：取得球員一句話介紹
      const bio = (window.PLAYER_BIOS && window.PLAYER_BIOS[p.name]) || '';
      return `
        <article class="trading-card roster-card ${p.level === 'minor' ? 'minor-card' : ''}">
          <div class="card-rank-badge badge-${rank.toLowerCase()}">${rank}</div>
          <div class="roster-card-art">${createPixelPortrait(p, 84)}</div>
          <div class="card-name">${p.name}</div>
          <div class="card-meta">
            <span>${roleTag}</span>
            <span>${p.team}</span>
            ${lineupSpot >= 0 ? `<span>第 ${lineupSpot + 1} 棒</span>` : ''}
            ${assignedPos ? `<span>守 ${POSITION_LABELS[assignedPos] || assignedPos}</span>` : ''}
            ${restTag ? `<span>${restTag}</span>` : ''}
          </div>
          ${bio ? `<p class="roster-card-bio">${bio}</p>` : ''}
          <div class="detail-traits roster-card-traits">${traitMarkup}</div>
          <div class="card-stats roster-card-stats">
            ${statPairs.map(([label, value]) => `
              <div class="card-stat-item">
                <span>${label}</span>
                <strong>${clampInt(value)}</strong>
                <div class="stat-meter"><i style="width:${clampInt(value, 0, 99)}%"></i></div>
              </div>
            `).join('')}
          </div>
          <div class="stamina-line">
            <span>體力 ${clampInt(p.state.stamina)}/${p.maxStamina}</span>
            <strong>${staminaPct}%</strong>
          </div>
          <div class="meter ${staminaState}"><span style="width:${staminaPct}%"></span></div>
          <div class="card-buttons roster-card-actions">
            <button class="card-btn card-btn-detail" onclick="openPlayerDetail(${i})">詳細</button>
            ${p.canPitch() && p.level !== 'minor' ? `<button class="card-btn" onclick="setActivePitcher(${i})">登板</button>` : ''}
            ${p.canBat() && p.level !== 'minor' ? `<button class="card-btn card-btn-batter" onclick="setActiveBatter(${i})">指定打者</button>` : ''}
            <button class="card-btn card-btn-level" onclick="togglePlayerLevel(${i})">${p.level === 'minor' ? '升一軍' : '下二軍'}</button>
          </div>
        </article>`;
    };
    const majorCards = this.roster.players.map((p, i) => ({ p, i })).filter(({ p }) => p.level !== 'minor');
    const minorCards = this.roster.players.map((p, i) => ({ p, i })).filter(({ p }) => p.level === 'minor');
    rosterDiv.innerHTML = `
      <div class="roster-sections card-mode">
        <section class="roster-section major-section">
          <header>
            <h3>一軍卡牌牆 <span class="roster-count">${cardMajorCount} / ${this.majorRosterLimit}</span></h3>
            <p>可直接指定投手、打者與防守位置；守位下拉選單會與原位置球員互換。</p>
          </header>
          <div class="roster-section-cards">${majorCards.map(renderRosterCard).join('')}</div>
        </section>
        <section class="roster-section minor-section">
          <header>
            <h3>二軍與培養名單 <span class="roster-count">${minorCards.length}</span></h3>
            <p>二軍球員先升上一軍後才能加入打線與守備。</p>
          </header>
          <div class="roster-section-cards">${minorCards.map(renderRosterCard).join('') || '<p class="pregame-note">目前沒有二軍球員。</p>'}</div>
        </section>
      </div>`;
    return;

    const majorCount = this.roster.players.filter(p => p.level !== 'minor').length;

    const renderSection = (players, level) => {
      return players.map(({ p, i }) => {
        const rank = p.getRank();
        const isPitcher = p.canPitch() && p.role === 'P';
        const statA = isPitcher ? `球速 ${clampInt(p.abilities.velocity)}` : `巧打 ${clampInt(p.abilities.contact)}`;
        const statB = isPitcher ? `控球 ${clampInt(p.abilities.control)}` : `長打 ${clampInt(p.abilities.power)}`;
        const statC = isPitcher ? `變化 ${clampInt(p.abilities.breaking)}` : `走力 ${clampInt(p.abilities.speed)}`;
        const roleTag = isPitcher ? (p.pitcherRole === 'SP' ? '先發' : '後援') : p.getPositionLabel();
        const restTag = (isPitcher && p.idealRest) ? ` | 休${p.daysOfRest ?? 0}/${p.idealRest()}${p.isOverworked && p.isOverworked() ? '⚠' : ''}` : '';
        const lineupSpot = this.playerBattingOrder.indexOf(i);
        const assignedPos = this.getAssignedPosition(i);
        const staminaPct = Math.round((p.state.stamina / Math.max(1, p.maxStamina)) * 100);
        const staminaColor = staminaPct < 30 ? 'var(--red)' : staminaPct < 60 ? 'var(--amber)' : 'var(--field)';
        return `
          <div class="player-row ${p.level === 'minor' ? 'player-row-minor' : ''}">
            <div class="player-row-rank badge-${rank.toLowerCase()}">${rank}</div>
            <div class="player-row-name">
              <strong>${p.name}</strong>
              <span>${roleTag}${restTag}${lineupSpot >= 0 ? ` | 第${lineupSpot + 1}棒` : ''}${assignedPos ? ` | 守${assignedPos}` : ''}</span>
            </div>
            <div class="player-row-stats">${statA} &nbsp;${statB} &nbsp;${statC}</div>
            <div class="player-row-stamina">
              <span>HP ${clampInt(p.state.stamina)}/${p.maxStamina}</span>
              <div class="mini-bar"><div style="width:${staminaPct}%;background:${staminaColor}"></div></div>
            </div>
            <div class="player-row-cond">${getConditionLabel(p.condition)}</div>
            <div class="player-row-actions">
              <button class="row-btn" onclick="openPlayerDetail(${i})">詳細</button>
              <button class="row-btn row-btn-pos" onclick="cycleDefense(${i})">守位</button>
              <button class="row-btn row-btn-level" onclick="togglePlayerLevel(${i})">${p.level === 'minor' ? '升一軍' : '下二軍'}</button>
            </div>
          </div>`;
      }).join('');
    };

    const major = this.roster.players.map((p, i) => ({ p, i })).filter(({ p }) => p.level !== 'minor');
    const minor = this.roster.players.map((p, i) => ({ p, i })).filter(({ p }) => p.level === 'minor');

    rosterDiv.innerHTML = `
      <div class="roster-list-wrap">
        <div class="roster-list-section major-section">
          <div class="roster-list-header">
            <span>一軍 <span class="roster-count">${majorCount} / ${this.majorRosterLimit}</span></span>
            <small>拖曳卡片可升降軍</small>
          </div>
          ${renderSection(major, 'major') || '<p class="pregame-note" style="padding:12px">一軍目前沒有球員</p>'}
        </div>
        <div class="roster-list-section minor-section">
          <div class="roster-list-header">
            <span>二軍 <span class="roster-count">${minor.length}</span></span>
          </div>
          ${renderSection(minor, 'minor') || '<p class="pregame-note" style="padding:12px">二軍目前沒有球員</p>'}
        </div>
      </div>`;
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
    // v1.18 #18：只顯示當前棒次 + 後兩棒（共 3 位）
    const oppOrder = this.opponentTeam.battingOrder;
    const oppCurrent = this.opponentTeam.nextBatterIndex;
    const oppWindow = [0, 1, 2].map(off => {
      const idx = (oppCurrent + off) % oppOrder.length;
      return { player: oppOrder[idx], orderIndex: idx, isCurrent: off === 0 };
    });
    lineupDiv.innerHTML = `<h4 class="font-bold">${this.opponentTeam.name}</h4>` + oppWindow.map(({ player, orderIndex, isCurrent }) => {
      const cls = isCurrent ? 'font-bold text-blue-700 lineup-current' : 'lineup-upcoming';
      const label = isCurrent ? '⚾ 當前' : `+${oppWindow.findIndex(x => x.orderIndex === orderIndex)}`;
      return `<p class="${cls}"><span class="lineup-tag">${label}</span> ${orderIndex + 1}. ${player.name} (${player.getRank()})</p>`;
    }).join('');

    // 下一輪打者：原本邏輯保留
    upcomingDiv.innerHTML = this.opponentTeam.getUpcomingBatters().map(p => `<p>${p.name} (${p.getRank()})</p>`).join('');

    if (playerLineupDiv) {
      // v1.18 #18：我方打序也只顯示當前棒次 + 後兩棒
      const myCurrent = this.playerNextBatterIndex;
      const myWindow = [0, 1, 2].map(off => {
        const idx = (myCurrent + off) % this.playerBattingOrder.length;
        return { idx, off };
      });
      playerLineupDiv.innerHTML = myWindow.map(({ idx, off }) => {
        const playerIndex = this.playerBattingOrder[idx];
        const player = this.roster.players[playerIndex];
        const isCurrent = off === 0 && this.currentHalf === 'bottom';
        const cls = isCurrent ? 'font-bold text-blue-700 lineup-current' : 'lineup-upcoming';
        const label = off === 0 ? '⚾ 當前' : `+${off}`;
        const assigned = this.getAssignedPosition(playerIndex) || 'DH';
        return `<p class="${cls}"><span class="lineup-tag">${label}</span> ${idx + 1}. ${player.name} (${POSITION_LABELS[assigned] || assigned})</p>`;
      }).join('');
    }
  }

  updateBullpenUI() {
    const bullpenDiv = document.getElementById('bullpen');
    if (!bullpenDiv) return;
    // v1.14：分先發 / 後援兩段顯示
    const pitchers = this.roster.players
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.canPitch() && p.level !== 'minor');
    const renderRow = ({ p, i }) => {
      const ideal = p.idealRest ? p.idealRest() : 0;
      const rest = p.daysOfRest ?? 0;
      const tired = p.isOverworked && p.isOverworked();
      const restTag = ideal ? `休 ${rest}/${ideal}${tired ? ' ⚠' : ''}` : '';
      const roleTag = p.pitcherRole === 'SP' ? '先發' : p.pitcherRole === 'RP' ? '後援' : '投手';
      return `
        <div class="bullpen-row ${tired ? 'tired' : ''}">
          <div>
            <strong>${p.name}</strong>
            <small>${roleTag}・體 ${clampInt(p.state.stamina)}/${p.maxStamina}・${restTag}</small>
          </div>
          <button onclick="bringInReliever(${i})" class="bullpen-btn">登板</button>
        </div>`;
    };
    const sps = pitchers.filter(x => x.p.pitcherRole === 'SP');
    const rps = pitchers.filter(x => x.p.pitcherRole === 'RP');
    bullpenDiv.innerHTML =
      `<h4 class="bullpen-section">先發輪值</h4>` +
      (sps.length ? sps.map(renderRow).join('') : '<p class="pregame-note">無先發投手</p>') +
      `<h4 class="bullpen-section">後援牛棚</h4>` +
      (rps.length ? rps.map(renderRow).join('') : '<p class="pregame-note">無後援投手</p>');
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
    const board = document.getElementById('classic-scoreboard');
    if (!board) return;
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText('board-batter', matchup?.batter?.name || '--');
    setText('board-ball', this.balls);
    setText('board-strike', this.strikes);
    setText('board-out', this.outs);
    setText('board-visitor-name', (this.currentOpponent || 'VISITOR').slice(0, 8));
    setText('board-home-name', 'HOME');
    setText('line-visitor-r', this.opponentScore);
    setText('line-home-r', this.playerScore);
    setText('line-visitor-h', this.opponentHits || 0);
    setText('line-home-h', this.playerHits || 0);
    setText('line-visitor-e', this.opponentErrors || 0);
    setText('line-home-e', this.playerErrors || 0);

    for (let inningNo = 1; inningNo <= 9; inningNo++) {
      setText(`line-visitor-${inningNo}`, this.getLineScoreValue('opponent', inningNo));
      setText(`line-home-${inningNo}`, this.getLineScoreValue('player', inningNo));
    }
  }

  resetCount() {
    this.balls = 0;
    this.strikes = 0;
  }

  advanceRunners(outcome, team = 'player', batter = null) {
    const runners = team === 'opponent' ? this.opponentRunners : this.playerRunners;
    const scoreKey = team === 'opponent' ? 'opponentScore' : 'playerScore';
    const hitter = batter || this.getCurrentMatchup().batter;
    const scoreBefore = this[scoreKey];
    const isHit = [i18n.single, i18n.double, i18n.triple, i18n.homeRun, 'Single', 'Double', 'Triple', 'Home Run'].includes(outcome);
    if (isHit) this.recordTeamHit(team);
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
    this.recordTeamRuns(team, this[scoreKey] - scoreBefore);
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
    this.inning = 1;
    this.outs = 0;
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
    if (this.currency < 100) {
      this.addManagementLog(i18n.notEnoughCurrency);
      return;
    }
    this.currency -= 100;
    const player = this.gacha.drawPlayer(pool);
    const key = this.playerKey(player);
    // v1.14：抽到已收集的球員 → 轉換成碎片
    if (this.collectedPlayerKeys.has(key)) {
      const shardGain = pool === 'international' ? 8 : 5;
      this.playerShards += shardGain;
      this.addManagementLog(`抽到重複球員 ${player.name}，轉換成 ${shardGain} 枚球員碎片！（總共 ${this.playerShards}）`);
      this.updateExpansionPreview(player, { duplicate: true, shardGain });
    } else {
      this.roster.addPlayer(player);
      this.collectedPlayerKeys.add(key);
      this.normalizeManagementState();
      this.addManagementLog(`${i18n.recruited} ${player.name} (${pool === 'local' ? i18n.localTalent : i18n.internationalStar})!`);
      this.updateExpansionPreview(player);
    }
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

    // v1.18 #19：CPBL 季後賽結算
    this.runPlayoffs();

    this.saveManager.save(this);
  }

  // v1.18 #19：CPBL 季後賽完整流程（依研究報告 8 修正）
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
    const myWinPct = (() => {
      const r = standings.find(s => s.team === TEAM);
      return r ? r.winPct : 0.5;
    })();

    this.addManagementLog('═══ 季後賽開始 ═══');
    this.addManagementLog(`上半季冠軍：${firstChamp}　下半季冠軍：${secondChamp}`);

    let champion;
    if (firstChamp === secondChamp) {
      // 情境 B：上下半季同隊 → 年度 2、3 名打挑戰賽，5 戰 3 勝
      const nonChamps = standings.filter(s => s.team !== firstChamp);
      const seed2 = nonChamps[0]?.team || '未知';
      const seed3 = nonChamps[1]?.team || '未知';
      this.addManagementLog(`季後挑戰賽：${seed2} vs ${seed3}（年度第 2 vs 年度第 3，5 戰 3 勝）`);
      const challengeWinner = this.simulatePlayoffSeries(seed2, seed3, 3, 0);
      this.addManagementLog(`季後挑戰賽勝出：${challengeWinner}`);
      // 總冠軍賽：包辦兩半季隊讓 1 勝 + 主場優勢
      this.addManagementLog(`總冠軍賽：${firstChamp} (讓 1 勝) vs ${challengeWinner}（7 戰 4 勝）`);
      champion = this.simulatePlayoffSeries(firstChamp, challengeWinner, 4, 1);
    } else {
      // 情境 A：上下半季不同隊
      // 取兩半季冠軍各自年度勝率
      const firstRow = standings.find(s => s.team === firstChamp);
      const secondRow = standings.find(s => s.team === secondChamp);
      const higherChamp = (firstRow?.winPct || 0) >= (secondRow?.winPct || 0) ? firstChamp : secondChamp;
      const lowerChamp = higherChamp === firstChamp ? secondChamp : firstChamp;

      // 第三隊：年度勝率最高之非半季冠軍
      const wildCard = standings.find(s => s.team !== firstChamp && s.team !== secondChamp)?.team || '未知';
      this.addManagementLog(`季後挑戰賽：${lowerChamp} (讓 1 勝) vs ${wildCard}（5 戰 3 勝，半季冠軍 1 勝優勢）`);
      const challengeWinner = this.simulatePlayoffSeries(lowerChamp, wildCard, 3, 1);
      this.addManagementLog(`季後挑戰賽勝出：${challengeWinner}`);
      this.addManagementLog(`總冠軍賽：${higherChamp} vs ${challengeWinner}（7 戰 4 勝，無讓 1 勝）`);
      champion = this.simulatePlayoffSeries(higherChamp, challengeWinner, 4, 0);
    }

    this.addManagementLog(`🏆 總冠軍：${champion} 🏆`);
    if (champion === TEAM) {
      this.addManagementLog('🎉 政大棒球隊奪得總冠軍！');
      this.currency += 5000;
    } else {
      this.addManagementLog(`政大棒球隊本季止步於 ${this.seasonManager.record}，明年再戰！`);
    }
    this.addManagementLog('═══ 季後賽結束 ═══');
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
function getCurrentStadium() {
  if (typeof window === 'undefined') return null;
  const id = (game && game.currentStadiumId) || window.HOME_STADIUM_ID || 'nccu';
  return (window.STADIUMS_DATA && window.STADIUMS_DATA[id]) || null;
}

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
  if (la_deg < 10) ballType = 'ground';        // 滾地球
  else if (la_deg < 25) ballType = 'liner';    // 平飛球
  else if (la_deg < 40) ballType = 'fly';      // 高飛球
  else ballType = 'popup';                     // 內野高飛
  // 全壘打判定
  const isHR = !isFoul && ballType !== 'ground' && ballType !== 'popup' && dist_m >= wallDist;
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
  return {
    ev_mph, la_deg, sa_deg, dist_m: Math.round(dist_m),
    wallDist: Math.round(wallDist),
    ballType, direction, isFoul, isHR, isBarrel
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
const FIELDING_POSITIONS_GROUND = ['1B', '2B', '3B', 'SS', 'P'];
const FIELDING_POSITIONS_FLY    = ['LF', 'CF', 'RF'];

function determineFielder(battedBall, defensiveAssignments, players) {
  const { ballType, sa_deg } = battedBall;
  if (battedBall.isHR || battedBall.isFoul) return null;
  // 滾地球
  if (ballType === 'ground') {
    let pos;
    if (sa_deg < -20) pos = '3B';
    else if (sa_deg < -5) pos = 'SS';
    else if (sa_deg < 5) pos = 'P';
    else if (sa_deg < 20) pos = '2B';
    else pos = '1B';
    return { position: pos, playerIndex: defensiveAssignments[pos] };
  }
  if (ballType === 'popup') {
    // 內野高飛球 → 距離最近的內野手
    const candidates = ['1B', '2B', '3B', 'SS', 'C'];
    const pos = candidates[Math.floor(Math.abs(sa_deg) / 12) % candidates.length];
    return { position: pos, playerIndex: defensiveAssignments[pos] };
  }
  // 飛球/平飛
  let pos;
  if (sa_deg < -15) pos = 'LF';
  else if (sa_deg < 15) pos = 'CF';
  else pos = 'RF';
  return { position: pos, playerIndex: defensiveAssignments[pos] };
}

// 守備成功率與失誤類型
function rollFieldingOutcome(fielder, battedBall, gameRef) {
  if (!fielder || !fielder.player) {
    return { success: false, error: null, reason: '無人防守' };
  }
  const p = fielder.player;
  const fielding = p.abilities?.fielding || 60;
  const arm = p.abilities?.arm || 60;
  // 守位適性懲罰
  const penalty = p.getPositionPenalty ? p.getPositionPenalty(fielder.position) : 0;
  const effective = Math.max(20, fielding - penalty);
  // 擊球難度（Barrel 越難守、極端噴射角越難守）
  let difficulty = 0;
  if (battedBall.isBarrel) difficulty += 25;
  if (Math.abs(battedBall.sa_deg) > 35) difficulty += 10;
  if (battedBall.ballType === 'liner') difficulty += 15; // 平飛球最難守
  // 成功率 = (effective - difficulty) / 100, baseline ≈ 0.7
  const successProb = Math.max(0.25, Math.min(0.95, 0.70 + (effective - 65) / 200 - difficulty / 200));
  if (Math.random() < successProb) {
    return { success: true, error: null };
  }
  // 失誤類型 by 機率
  // 暴傳取決於肩力，漏接取決於 fielding，恍神取決於 經驗(level)
  const totalErrRoll = Math.random();
  const throwErrChance = 0.5 - (arm - 70) / 200;
  const fieldErrChance = 0.4 - (fielding - 70) / 200;
  let errorType;
  if (totalErrRoll < throwErrChance) errorType = 'throw';      // 暴傳
  else if (totalErrRoll < throwErrChance + fieldErrChance) errorType = 'field';  // 漏接
  else errorType = 'mental';   // 恍神
  return { success: false, error: errorType };
}

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
const RATING_GROWTH_MULTIPLIER = { S: 1.5, A: 1.2, B: 1.0, C: 0.8, D: 0.6 };
const RATING_STAT_CAP = { S: 99, A: 92, B: 84, C: 70, D: 58 };

function getXPForNextLevel(level) {
  return Math.round(100 * Math.pow(level, 1.5));
}

function getPlayerLevel(player) {
  return player.playerLevel || 1;
}

function getPlayerRating(player) {
  return player.rating || player.sourceStats?.rating || 'B';
}

// 球員獲得經驗值（v1.18 #2、#4）
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
  // 評等成長倍率
  const rating = getPlayerRating(player);
  const ratingMul = RATING_GROWTH_MULTIPLIER[rating] || 1.0;
  const gain = Math.round(baseXP * (1 + bonus / 100) * ratingMul);
  player.playerXP = (player.playerXP || 0) + gain;
  // 自動升級判定
  while (true) {
    const lv = getPlayerLevel(player);
    const need = getXPForNextLevel(lv);
    if (player.playerXP >= need) {
      player.playerXP -= need;
      player.playerLevel = lv + 1;
      // 升級加屬性（依評等決定上限）
      const cap = RATING_STAT_CAP[rating] || 84;
      const incChance = 0.5;
      const increment = (key, amount) => {
        if (player.abilities[key] !== undefined && player.abilities[key] < cap && Math.random() < incChance) {
          player.abilities[key] = Math.min(cap, player.abilities[key] + amount);
        }
      };
      if (category === 'batting') {
        increment('contact', 1);
        increment('power', 1);
        increment('discipline', 1);
      } else if (category === 'pitching') {
        increment('velocity', 1);
        increment('control', 1);
        increment('breaking', 1);
        increment('stuff', 1);
      } else if (category === 'defense') {
        increment('fielding', 1);
        increment('arm', 1);
      } else if (category === 'baserunning') {
        increment('speed', 1);
      } else {
        // all
        Object.keys(player.abilities).forEach(k => increment(k, 1));
      }
      if (game) game.addManagementLog(`🎉 ${player.name} 升到 Lv.${player.playerLevel}！`);
    } else break;
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
        const plans = ['fastball', 'balanced', 'breaking'];
        g.opponentPitchPlan = plans[Math.floor(Math.random() * 3)];
      }
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
    }
  }
}

// Resolve At-Bat Function
function resolveAtBat(pitcher, batter, burnLife = false) {
  const matchup = game.getCurrentMatchup();
  const battingTeam = matchup.battingTeam;
  const tempBoostedPlayers = [];

  // v1.14：本方投手登板的話標記，這樣場間恢復才知道誰累
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
    const aiBoostedPlayer = battingTeam === 'opponent' ? batter : pitcher;
    if (aiBoostedPlayer) {
      aiBoostedPlayer.burnLifeActive = true;
      tempBoostedPlayers.push(aiBoostedPlayer);
      updateBurnLifeEffect(true);
    }
    game.opponentUseBurnLife = false;
  }

  let vel = pitcher.getEffectiveVelocity();
  let ctrl = pitcher.getEffectiveControl();
  let breaking = pitcher.abilities?.breaking || ctrl;
  // v1.14：疲勞登板（休息不足）能力打折，且 stuff/控球下修
  if (battingTeam === 'opponent' && pitcher.isOverworked && pitcher.isOverworked()) {
    const shortBy = pitcher.idealRest() - pitcher.daysOfRest;
    const penalty = 4 + shortBy * 3;
    vel -= penalty;
    ctrl -= penalty;
    breaking -= penalty;
    game.addToLog(`【疲勞登板】${pitcher.name} 休息不足 (${pitcher.daysOfRest}/${pitcher.idealRest()})，能力下降。`);
  }
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
  let zonePlanMod = 0;
  let swingPlanMod = 0;
  let slugPlanMod = 0;
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
  // v1.15：對手進攻策略
  if (battingTeam === 'opponent') {
    if (game.opponentOffenseApproach === 'aggressive') {
      pow += 6;
      contact -= 2;
      discipline -= 6;
    } else if (game.opponentOffenseApproach === 'patient') {
      discipline += 10;
      contact += 2;
      pow -= 3;
    }
  }
  // v1.15：對手投球策略（玩家進攻時）
  if (battingTeam === 'player') {
    if (game.opponentPitchPlan === 'fastball') {
      vel += 5;
      breaking -= 2;
      zonePlanMod += 0.04;
      slugPlanMod += 0.05;
    } else if (game.opponentPitchPlan === 'breaking') {
      breaking += 7;
      ctrl -= 3;
      zonePlanMod -= 0.03;
      slugPlanMod -= 0.04;
    } else if (game.opponentPitchPlan === 'waste') {
      ctrl -= 6;
      zonePlanMod -= 0.13;
      swingPlanMod += 0.08;
      slugPlanMod -= 0.03;
    }
  }
  const pitchPool = Array.isArray(pitcher.pitchTypes) ? pitcher.pitchTypes : [];
  const activePitchPlan = battingTeam === 'player' ? game.opponentPitchPlan : game.pitchPlan;
  const selectedPitch = activePitchPlan === 'fastball'
    ? pitchPool.find(pitch => pitch.name.includes('縫線') || pitch.name.includes('卡特')) || pitchPool[0]
    : activePitchPlan === 'breaking'
      ? pitchPool.slice().sort((a, b) => b.movement - a.movement)[0]
      : activePitchPlan === 'waste'
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
  if (selectedPitch) {
    vel += (selectedPitch.speed - 75) / 18;
    breaking += (selectedPitch.movement - 70) / 12;
    ctrl += (selectedPitch.control - 70) / 16;
    slugPlanMod += (selectedPitch.slugRisk - 55) / 260;
  }

  // v1.18 #18：記錄當下用球的球速（km/h），給比賽頁顯示
  // 將投手 velocity 屬性（50-99 區間）映射到 130-160 km/h，再加上球種速差
  const baseSpeedKmh = 130 + (pitcher.abilities.velocity || 60) * 0.3;
  const pitchSpeedDelta = selectedPitch ? (selectedPitch.speed - 80) * 0.4 : 0;
  game.lastPitchSpeed = Math.round(baseSpeedKmh + pitchSpeedDelta);
  game.lastPitchType = selectedPitch?.name || '速球';

  let shadowClone = game.cardManager.activeEffects.shadowClone;
  if (shadowClone) triggerCloneEffect();

  let balls = 0;
  let strikes = 0;
  let pitchCount = 0;

  const finishAtBat = (outcome, didExpire = true) => {
    tempBoostedPlayers.forEach(player => { player.burnLifeActive = false; });
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

    pitcher.consumeStamina(0.85);   // v1.16：降低單球體力消耗，燃燒生命倍率在 consumeStamina 內處理。
    batter.consumeStamina(burnLife && battingTeam === 'player' ? 0.8 : 0.4);   // v1.14：打者消耗更小

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

    // v1.14：高斯雜訊標準差降低、速度修正權重減半，讓三壘安打不再過量
    let hitRand = Math.random() + gaussianRandom(0, 0.06);
    hitRand += slugPlanMod + (pow - 78) / 380 + (spd - 75) / 1100;
    if (battingTeam === 'opponent') hitRand += game.getTeamDefenseModifier() / 160;
    if (shadowClone) hitRand -= 0.2;

    game.balls = balls;
    game.strikes = strikes;

    // ========== v1.18 #9 #12 #13：球物理 + 守備系統 + 失誤機制 ==========
    // 用 hitRand 決定 contact 品質，再用 EV/LA/SA 模型計算具體去向
    const swingType = battingTeam === 'player'
      ? game.offenseApproach
      : (game.opponentOffenseApproach || 'normal');
    const battedBall = generateBattedBallParams(batter, pitcher, hitRand, swingType);
    const currentStadium = getCurrentStadium();
    const ballInfo = calcBattedBall(battedBall.ev, battedBall.la, battedBall.sa, currentStadium);

    // 主播播報擊球瞬間
    game.addToLog(`💥 ${batter.name} 揮棒擊中！初速 ${ballInfo.ev_mph.toFixed(0)} mph、仰角 ${ballInfo.la_deg.toFixed(0)}°，${ballInfo.direction}` + (ballInfo.isBarrel ? '【完美擊球 Barrel！】' : ''));

    // 界外
    if (ballInfo.isFoul) {
      if (strikes < 2) {
        strikes++;
        game.addToLog(`界外球！B${balls}-S${strikes}`);
        continue;
      } else {
        game.addToLog(`纏鬥界外，再來一球。B${balls}-S${strikes}`);
        continue;
      }
    }

    // 全壘打
    if (ballInfo.isHR) {
      const c = pickCommentary(game.isHighLeverage && game.isHighLeverage() ? 'hrClutch' : 'hr', batter);
      if (c) game.addToLog(`📢 ${c}`);
      game.advanceRunners(i18n.homeRun, battingTeam, batter);
      game.addCommentary(i18n.homeRun, batter, shadowClone);
      game.resetCount();
      triggerShakeEffect();
      // v1.18 #2：擊出全壘打給予 XP
      awardPlayerXP(batter, 50, 'batting', game);
      return finishAtBat(i18n.homeRun);
    }

    // 守備判定
    const defensiveTeamRunners = battingTeam === 'player' ? game.opponentTeam : null;
    const myDefensiveAssignments = battingTeam === 'opponent' ? game.defensiveAssignments : null;
    let fielderInfo = null;
    let fielderPlayer = null;
    if (battingTeam === 'opponent' && myDefensiveAssignments) {
      fielderInfo = determineFielder(ballInfo, myDefensiveAssignments, game.roster.players);
      if (fielderInfo) fielderPlayer = game.roster.players[fielderInfo.playerIndex];
    } else {
      // 對手守備：用對手 battingOrder 中前 9 人模擬守備
      const oppDefense = game.opponentTeam?.battingOrder || [];
      // 簡化：依擊球方向直接挑一個對手球員當守備
      let posIdx = 0;
      if (ballInfo.ballType === 'ground') {
        if (ballInfo.sa_deg < -10) posIdx = 6; else if (ballInfo.sa_deg < 5) posIdx = 5; else posIdx = 3;
      } else {
        if (ballInfo.sa_deg < -15) posIdx = 7; else if (ballInfo.sa_deg < 15) posIdx = 8; else posIdx = 4;
      }
      fielderPlayer = oppDefense[posIdx % oppDefense.length];
      fielderInfo = fielderPlayer ? { position: fielderPlayer.position || 'OF', player: fielderPlayer } : null;
    }
    if (fielderInfo) fielderInfo.player = fielderInfo.player || fielderPlayer;

    const fieldingResult = rollFieldingOutcome(fielderInfo, ballInfo, game);

    // 失誤發生
    if (!fieldingResult.success && fieldingResult.error) {
      if (battingTeam === 'opponent') game.playerErrors = (game.playerErrors || 0) + 1;
      else game.opponentErrors = (game.opponentErrors || 0) + 1;
      const errComment = pickCommentary('error', batter, fielderInfo?.player, fieldingResult.error);
      if (errComment) game.addToLog(`📢 ${errComment}`);
      game.advanceRunners(i18n.single, battingTeam, batter);
      game.resetCount();
      return finishAtBat(`失誤上壘 (${FIELDING_ERROR_LABELS[fieldingResult.error] || '失誤'})`);
    }

    // 滾地球
    if (ballInfo.ballType === 'ground') {
      if (fieldingResult.success) {
        game.recordOut();
        game.resetCount();
        const c = pickCommentary('groundOut', batter);
        if (c) game.addToLog(`📢 ${c}`);
        game.addCommentary(i18n.groundOut, batter, shadowClone);
        return finishAtBat(i18n.groundOut);
      } else {
        // 強勁滾地穿越（內野安打）
        game.advanceRunners(i18n.single, battingTeam, batter);
        game.resetCount();
        game.addToLog(`📢 強勁滾地穿越！${batter.name} 安打上壘。`);
        awardPlayerXP(batter, 15, 'batting', game);
        return finishAtBat(i18n.single);
      }
    }

    // 內野高飛
    if (ballInfo.ballType === 'popup') {
      game.recordOut();
      game.resetCount();
      const c = pickCommentary('popup', batter);
      if (c) game.addToLog(`📢 ${c}`);
      game.addCommentary(i18n.flyOut, batter, shadowClone);
      return finishAtBat(i18n.flyOut);
    }

    // 平飛/外野飛球 → 看距離決定是否為長打
    if (fieldingResult.success && ballInfo.dist_m < ballInfo.wallDist * 0.85) {
      // 高飛接殺
      game.trySacrificeFly(battingTeam, batter);
      game.recordOut();
      game.resetCount();
      const c = pickCommentary('flyOut', batter);
      if (c) game.addToLog(`📢 ${c}`);
      game.addCommentary(i18n.flyOut, batter, shadowClone);
      return finishAtBat(i18n.flyOut);
    }

    // 安打分類（依距離與球種）
    let hitType;
    if (ballInfo.dist_m >= ballInfo.wallDist * 0.92) {
      // 距離接近全壘打牆 → 三壘安打或場地規則二壘安打
      hitType = ballInfo.isBarrel && Math.random() < 0.3 ? i18n.triple : i18n.double;
    } else if (ballInfo.dist_m >= ballInfo.wallDist * 0.65 || ballInfo.ballType === 'liner') {
      hitType = i18n.double;
    } else {
      hitType = i18n.single;
    }

    const cKey = hitType === i18n.homeRun ? 'hr' : hitType === i18n.triple ? 'triple' : hitType === i18n.double ? 'double' : 'single';
    const c = pickCommentary(cKey, batter);
    if (c) game.addToLog(`📢 ${c}`);
    game.advanceRunners(hitType, battingTeam, batter);
    game.addCommentary(hitType, batter, shadowClone);
    game.resetCount();
    // v1.18：給予 XP
    awardPlayerXP(batter, hitType === i18n.triple ? 30 : hitType === i18n.double ? 22 : 12, 'batting', game);
    return finishAtBat(hitType);
  }

  game.balls = balls;
  game.strikes = strikes;
  if (balls >= 4) {
    game.advanceRunners(i18n.walk, battingTeam, batter);
    game.addCommentary(i18n.walk, batter, shadowClone);
    game.resetCount();
    // v1.18 #2：保送給選球 XP
    if (battingTeam === 'player') awardPlayerXP(batter, 8, 'batting', game);
    if (battingTeam === 'opponent') awardPlayerXP(pitcher, 3, 'pitching', game);
    return finishAtBat(i18n.walk);
  }

  game.recordOut();
  game.resetCount();
  const skComment = pickCommentary('strikeout', batter, pitcher);
  if (skComment) game.addToLog(`📢 ${skComment}`);
  game.addCommentary(i18n.strikeout, batter, shadowClone);
  // v1.18 #2：三振給投手 XP
  if (battingTeam === 'opponent') awardPlayerXP(pitcher, 12, 'pitching', game);
  return finishAtBat(i18n.strikeout);
}

// Initialize Game
let game = new Game();
game.opponentAI = new OpponentAI(game);
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
  if (game.opponentAI) game.opponentAI.decide();
  const { pitcher, batter } = game.getCurrentMatchup();
  const outcome = resolveAtBat(pitcher, batter, false);
  game.addToLog(`${i18n.outcome} ${outcome}!`);
});

document.getElementById('magic-pitch').addEventListener('click', () => {
  if (game.opponentAI) game.opponentAI.decide();
  const { pitcher, batter } = game.getCurrentMatchup();
  const outcome = resolveAtBat(pitcher, batter, true);
  game.addToLog(`${i18n.outcome} ${outcome}!`);
});

const legacyAutoSimButton = document.getElementById('auto-sim');
if (legacyAutoSimButton) {
  legacyAutoSimButton.addEventListener('click', () => {
    if (game.opponentAI) game.opponentAI.decide();
    const { pitcher, batter } = game.getCurrentMatchup();
    const outcome = resolveAtBat(pitcher, batter, false);
    game.addToLog(`${i18n.autoSimOutcome} ${outcome}!`);
  });
}

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
    game.addToLog('全場自動已停止。');
  } else {
    game.autoSimulate();
    game.addToLog('全場自動開始，會一路模擬到比賽結束。');
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
