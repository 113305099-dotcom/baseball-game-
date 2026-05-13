// =====================================================================
// data.js — 球員、能力、教練、球場資料檔（v1.18 大改版）
// ---------------------------------------------------------------------
// v1.18 變更：
//   - 第七隊更名為「政治大學棒球隊」，主場改為政大河堤棒球場
//   - 新增 STADIUMS_DATA：CPBL 八座主場 + 政大河堤棒球場
//   - 新增 COACHES_POOL：教練卡池 (19 位)
//   - 新增 PLAYER_BIOS：球員一句話介紹
//   - 球員資料新增 preferredPositions、rating (S/A/B/C/D)
// =====================================================================


// ---------- v1.18：球場資料 ----------
const STADIUMS_DATA = {
  'nccu':       { name: '政大河堤棒球場',  team: '政治大學棒球隊',     LF: 76,  CF: 100, RF: 76,  fenceHeight: 10.0, surface: '紅土+草皮', altitude: 8,   hrFactor: 0.55, windHelp: 0.3,  notes: 'v2.11 啟用「天網」外野防護網（高 10 m），避免球打到划船上學的同學。距離雖短但天網難以越過，全壘打數量明顯下降。' },
  'chengcing':  { name: '澄清湖棒球場',    team: '台鋼雄鷹',           LF: 100, CF: 122, RF: 100, fenceHeight: 3.0, surface: '天然草皮', altitude: 10,  hrFactor: 0.98, windHelp: 0.7,  notes: '中性球場，夏季南風助攻右外野。' },
  'tianmu':     { name: '天母棒球場',      team: '味全龍',             LF: 99,  CF: 120, RF: 99,  fenceHeight: 2.8, surface: '人工草皮', altitude: 25,  hrFactor: 1.05, windHelp: 0.6,  notes: '台北市區小巧球場，打者天堂，22:00 夜禁。' },
  'taoyuan':    { name: '樂天桃園棒球場',  team: '樂天桃猿',           LF: 100, CF: 122, RF: 100, fenceHeight: 3.0, surface: '天然草皮', altitude: 60,  hrFactor: 1.02, windHelp: 0.6,  notes: '朝向設計錯誤導致下午西曬，夜間賽事為主。' },
  'xinzhuang':  { name: '新莊棒球場',      team: '富邦悍將',           LF: 99,  CF: 122, RF: 99,  fenceHeight: 2.8, surface: '天然草皮', altitude: 8,   hrFactor: 1.06, windHelp: 0.5,  notes: '緊鄰新莊捷運站，內野偏小打者偏好。' },
  'tainan':     { name: '台南棒球場',      team: '統一7-ELEVEn獅',     LF: 99,  CF: 120, RF: 99,  fenceHeight: 2.8, surface: '天然草皮', altitude: 12,  hrFactor: 1.00, windHelp: 0.7,  notes: '老球場（1931 開工），有逆光問題。' },
  'taichung':   { name: '洲際棒球場',      team: '中信兄弟',           LF: 99,  CF: 122, RF: 99,  fenceHeight: 3.2, surface: '天然草皮', altitude: 84,  hrFactor: 0.99, windHelp: 0.5,  notes: '美式風格球場，全壘打牆較高。' },
  'taipeidome': { name: '台北大巨蛋',      team: '共用主場',           LF: 102, CF: 122, RF: 102, fenceHeight: 3.5, surface: '美津濃人工草', altitude: 5,   hrFactor: 0.92, windHelp: 0.0,  notes: '室內無風 + 外野偏深，中性偏投手。' }
};


// ---------- v1.18：教練卡池 ----------
const COACHES_POOL = [
  { id: 'hung-yichung', name: '洪一中', roleType: 'head', rarity: 'SSR', specialty: '用兵如神', xpBonus: { all: 10 }, statBonus: { morale: 5 }, desc: '中職史上唯一千勝、7 座總冠軍、現台鋼雄鷹首任總教練。' },
  { id: 'yeh-chunchang', name: '葉君璋', roleType: 'head', rarity: 'SSR', specialty: '配球大師', xpBonus: { pitching: 20, defense: 10 }, statBonus: { control: 3 }, desc: '「無敵鐵金剛」、現味全龍總教練、捕手出身擅長投手調度。' },
  { id: 'hirano-keiichi', name: '平野惠一', roleType: 'head', rarity: 'SR', specialty: '小球戰術', xpBonus: { baserunning: 25 }, statBonus: { contact: 2 }, desc: '日籍中信兄弟總教練，酷愛觸擊戰術的「點點戰術」。' },
  { id: 'koganei-kenji', name: '古久保健二', roleType: 'head', rarity: 'SR', specialty: '配球專家', xpBonus: { pitching: 15, defense: 15 }, statBonus: {}, desc: '日籍前樂天桃猿總教練、現味全龍巡迴統籌教練，鼓勵型風格。' },
  { id: 'lin-yueping', name: '林岳平', roleType: 'head', rarity: 'SR', specialty: '左投王牌', xpBonus: { pitching: 18 }, statBonus: { stuff: 3 }, desc: '統一獅總教練 + WBC 中華隊總教練，前統一獅救援王。' },
  { id: 'peng-chengmin', name: '彭政閔', roleType: 'batting', rarity: 'SSR', specialty: '球來就打', xpBonus: { batting: 25 }, statBonus: { contact: 5 }, desc: '「恰恰」、中信兄弟先生、4 次打擊王，「球來就打」打擊哲學。' },
  { id: 'wang-chienming', name: '王建民', roleType: 'pitching', rarity: 'SSR', specialty: '伸卡球大師', xpBonus: { pitching: 30 }, statBonus: { control: 5, breaking: 3 }, desc: '台灣之光、洋基隊 19 勝勝投王，現中信兄弟投手教練。' },
  { id: 'kao-chihkang', name: '高志綱', roleType: 'pitching', rarity: 'SR', specialty: '配球細膩', xpBonus: { pitching: 18, defense: 8 }, statBonus: { control: 3 }, desc: 'WBC 中華隊首席兼捕手教練，前統一獅當家捕手。' },
  { id: 'hsu-mingchieh', name: '許銘傑', roleType: 'pitching', rarity: 'R', specialty: '日系投球', xpBonus: { pitching: 15 }, statBonus: { stuff: 2 }, desc: '前西武獅、興農牛日籍投手代表性人物，WBC 投手教練。' },
  { id: 'tseng-haochu', name: '曾豪駒', roleType: 'batting', rarity: 'SR', specialty: '日系細膩', xpBonus: { batting: 20 }, statBonus: { discipline: 3 }, desc: '前樂天桃猿總教練，2023 帶隊拿總冠軍，新生代日系派。' },
  { id: 'lin-weichu', name: '林威助', roleType: 'batting', rarity: 'SR', specialty: '日系打擊', xpBonus: { batting: 22 }, statBonus: { power: 2 }, desc: '前中信兄弟總教練（2021、2022 兩年總冠軍）。' },
  { id: 'lin-mingsen', name: '林明憲', roleType: 'pitching', rarity: 'R', specialty: '資深調度', xpBonus: { pitching: 12 }, statBonus: { stamina: 2 }, desc: '前富邦悍將投手教練、二軍總教練。' },
  { id: 'chiu-chunjung', name: '丘昌榮', roleType: 'head', rarity: 'R', specialty: '前 LG 雙子', xpBonus: { all: 5 }, statBonus: { power: 2 }, desc: '味全龍一軍首席教練、前興農牛強打。' },
  { id: 'huang-ganlin', name: '黃甘霖', roleType: 'baserunning', rarity: 'R', specialty: '盜壘戰術', xpBonus: { baserunning: 30 }, statBonus: { speed: 3 }, desc: '前統一獅總教練、左外野守備名人。' },
  { id: 'hsieh-chengheng', name: '謝長亨', roleType: 'pitching', rarity: 'R', specialty: '前草總', xpBonus: { pitching: 14 }, statBonus: { control: 2 }, desc: '「草總」、前統一獅總教練 339 勝。' },
  { id: 'chen-lienhung', name: '陳連宏', roleType: 'batting', rarity: 'R', specialty: '老派打擊', xpBonus: { batting: 14 }, statBonus: { contact: 2 }, desc: '前富邦悍將總教練。' },
  { id: 'navarro-jaime', name: '納瓦洛', roleType: 'pitching', rarity: 'SR', specialty: 'MLB 經驗', xpBonus: { pitching: 20 }, statBonus: { velocity: 3 }, desc: '味全龍 2026 新任投手教練、前 MLB 投手。' },
  { id: 'pederson-tyger', name: '彼得森', roleType: 'batting', rarity: 'R', specialty: 'MLB 攻擊', xpBonus: { batting: 15 }, statBonus: { power: 2 }, desc: '味全龍 2026 新任攻擊統籌教練。' },
  { id: 'lin-chihsheng', name: '林智勝', roleType: 'batting', rarity: 'SR', specialty: '長砲傳承', xpBonus: { batting: 22 }, statBonus: { power: 4 }, desc: '中職史上最多全壘打（300+），味全龍助理打擊教練。' }
];


// ---------- v1.18：球員一句話介紹 ----------
const PLAYER_BIOS = {
  '江坤宇': '中信兄弟「小愛」、四連霸金手套游擊手，CPBL 史上最年輕億元男（10 年 1.4 億），守備率 .988 史上最佳。',
  '陳晨威': '樂天桃猿「光速神威」、CPBL 盜壘王，國際賽屢敲關鍵長打的爆發力中外野手。',
  '王柏融': '「柏融大王」、前火腿、現台鋼雄鷹左打強棒，曾 2 次中職打擊王。',
  '林安可': '統一獅長打砲台，2024 年 20 轟 93 打點，2026 加盟西武獅旅日。',
  '朱育賢': '樂天桃猿左打強砲，2020/6/6 擊出中職史上第 10000 號全壘打。',
  '吉力吉撈．鞏冠': '統一獅排灣族重砲捕手，大巨蛋首位全壘打打者（2024/3/16），蹲捕+砲打雙刀流。',
  '林立': '樂天桃猿二壘手、選球眼極佳的「打點製造機」，近年隊長角色。',
  '張育成': '前印地安人/紅襪內野手，現富邦悍將三壘手，國際賽火力擔當。',
  '許基宏': '中信兄弟左打一壘手，2024 起佔據打擊王競逐席次的「兄弟長砲」。',
  '魔鷹': '統一獅多明尼加籍超級重砲，臂展驚人、揮棒幅度大、看球大爆發。',
  '吳念庭': '台鋼雄鷹日職歸國內野手，旅日經驗豐富、攻守俱佳的內野工兵。',
  '林泓育': '樂天桃猿老牌捕手兼指定打擊，砲管型打者代表。',
  '李凱威': '味全龍上壘機器、選球眼極佳的內野手。',
  '范國宸': '富邦悍將年輕一壘手，砲管型新秀。',
  '王威晨': '中信兄弟「老王」、CPBL 盜壘王與打擊王得主，全能型內野手。',
  '岳東華': '中信兄弟年輕內野手，選球眼極佳。',
  '林子偉': '前紅襪游擊手回台中信兄弟，國際賽經驗豐富。',
  '林靖凱': '統一獅快腿型游擊手，年輕世代代表。',
  '陳重羽': '中信兄弟中外野手，腳程出色的速度型打者。',
  '蘇緯達': '富邦悍將長打型外野手。',
  '張閔勛': '中信兄弟年輕捕手。',
  '高國麟': '樂天桃猿三壘手，砲管型打者。',
  '鄭浩均': '富邦悍將年輕捕手，砲管潛力。',
  '王博玄': '台鋼雄鷹年輕中外野手。',
  '郭天信': '味全龍快腿型外野手。',
  '林佳緯': '統一獅外野手。',
  '曾子祐': '台鋼雄鷹年輕游擊手。',
  '羅戈': '中信兄弟洋將右投王牌，2025 中職防禦率王。',
  '後勁': '台鋼雄鷹洋將右投，控球型先發。',
  '菲力士': '統一獅洋將右投，2025 防禦率超低。',
  '威能帝': '樂天桃猿洋將右投王牌，2025 三振王。',
  '艾速特': '台鋼雄鷹洋將左投，平衡型先發。',
  '魔神龍': '樂天桃猿洋將右投，控球穩定。',
  '鋼龍': '味全龍洋將右投，三振能力高。',
  '魔力藍': '富邦悍將洋將右投，平衡型先發。',
  '布雷克': '統一獅洋將右投，控球派。',
  '古林睿煬': '統一獅旅日歸來右投王牌、明星賽先發代表，球速 150+。',
  '徐若熙': '味全龍年輕右投王牌，球速與三振能力出眾。',
  '江國豪': '中信兄弟年輕右投，潛力型先發。',
  '林詩翔': '台鋼雄鷹後援投手，平衡型。',
  '陳禹勳': '樂天桃猿資深後援投手，老將代表。',
  '黃子鵬': '樂天桃猿後援投手。',
  '翁瑋均': '中信兄弟後援投手。',
  '王玉譜': '中信兄弟左投後援。',
  '宋家豪': '富邦悍將洋將後援王牌，球速 9 K/9。',
  '黃恩賜': '富邦悍將後援投手。',
  '陳柏清': '味全龍左投後援。'
};


// ---------- 本地野手 ----------
const CPBL_BATTER_STATS_2025 = [
  { name: '吳念庭',  team: '台鋼雄鷹', position: '2B/SS', preferredPositions: ['2B', 'SS', '3B'], role: 'B', avg: 0.328, obp: 0.400, slg: 0.407, ops: 0.807, opsPlus: 138, hr: 2,  sb: 5,  kRate: 11.94, bbRate: 10.88, errors: 4,  source: 'CPBL 2025', rating: 'A' },
  { name: '林安可',  team: '統一7-ELEVEn獅', position: 'LF', preferredPositions: ['LF', 'RF'], role: 'B', avg: 0.318, obp: 0.397, slg: 0.603, ops: 1.000, opsPlus: 192, hr: 23, sb: 4,  kRate: 17.33, bbRate: 9.60,  errors: 1,  source: 'CPBL 2025', rating: 'S' },
  { name: '陳晨威',  team: '樂天桃猿', position: 'CF', preferredPositions: ['CF', 'LF', 'RF'], role: 'B', avg: 0.307, obp: 0.366, slg: 0.411, ops: 0.777, opsPlus: 129, hr: 4,  sb: 27, kRate: 11.27, bbRate: 8.56,  errors: 3,  source: 'CPBL 2025', rating: 'A' },
  { name: '林泓育',  team: '樂天桃猿', position: 'C/DH', preferredPositions: ['C', 'DH', '1B'], role: 'B', avg: 0.307, obp: 0.345, slg: 0.415, ops: 0.760, opsPlus: 124, hr: 9,  sb: 0,  kRate: 15.35, bbRate: 4.56,  errors: 2,  source: 'CPBL 2025', rating: 'B' },
  { name: '魔鷹',    team: '台鋼雄鷹', position: '1B/RF', preferredPositions: ['1B', 'RF', 'LF', 'DH'], role: 'B', avg: 0.305, obp: 0.387, slg: 0.589, ops: 0.976, opsPlus: 185, hr: 25, sb: 0,  kRate: 15.71, bbRate: 8.90,  errors: 10, source: 'CPBL 2025', rating: 'S' },
  { name: '李凱威',  team: '味全龍',   position: '2B/3B', preferredPositions: ['2B', '3B', 'SS'], role: 'B', avg: 0.300, obp: 0.388, slg: 0.338, ops: 0.726, opsPlus: 116, hr: 0,  sb: 28, kRate: 9.21,  bbRate: 11.13, errors: 8,  source: 'CPBL 2025', rating: 'B' },
  { name: '朱育賢',  team: '味全龍',   position: '1B/LF', preferredPositions: ['1B', 'LF', 'DH'], role: 'B', avg: 0.293, obp: 0.355, slg: 0.476, ops: 0.831, opsPlus: 144, hr: 15, sb: 2,  kRate: 22.13, bbRate: 7.47,  errors: 7,  source: 'CPBL 2025', rating: 'A' },
  { name: '許基宏',  team: '中信兄弟', position: '1B',    preferredPositions: ['1B', 'DH'], role: 'B', avg: 0.292, obp: 0.390, slg: 0.525, ops: 0.915, opsPlus: 168, hr: 19, sb: 0,  kRate: 21.22, bbRate: 11.95, errors: 5,  source: 'CPBL 2025', rating: 'A' },
  { name: '王博玄',  team: '台鋼雄鷹', position: 'CF',    preferredPositions: ['CF', 'LF', 'RF'], role: 'B', avg: 0.284, obp: 0.348, slg: 0.351, ops: 0.699, opsPlus: 107, hr: 3,  sb: 21, kRate: 14.52, bbRate: 8.38,  errors: 11, source: 'CPBL 2025', rating: 'B' },
  { name: '郭天信',  team: '味全龍',   position: 'CF/RF', preferredPositions: ['CF', 'RF', 'LF'], role: 'B', avg: 0.280, obp: 0.334, slg: 0.351, ops: 0.685, opsPlus: 102, hr: 4,  sb: 17, kRate: 8.87,  bbRate: 6.19,  errors: 6,  source: 'CPBL 2025', rating: 'B' },
  { name: '林佳緯',  team: '統一7-ELEVEn獅', position: 'RF', preferredPositions: ['RF', 'LF', 'CF'], role: 'B', avg: 0.275, obp: 0.322, slg: 0.408, ops: 0.730, opsPlus: 114, hr: 6,  sb: 11, kRate: 15.46, bbRate: 5.62,  errors: 5,  source: 'CPBL 2025', rating: 'B' },
  { name: '吉力吉撈．鞏冠', team: '味全龍', position: 'C', preferredPositions: ['C', 'DH', '1B'], role: 'B', avg: 0.274, obp: 0.337, slg: 0.525, ops: 0.862, opsPlus: 152, hr: 24, sb: 4,  kRate: 17.64, bbRate: 6.41,  errors: 15, source: 'CPBL 2025', rating: 'A' },
  { name: '曾子祐',  team: '台鋼雄鷹', position: 'SS',    preferredPositions: ['SS', '2B'], role: 'B', avg: 0.273, obp: 0.319, slg: 0.323, ops: 0.642, opsPlus: 90,  hr: 0,  sb: 6,  kRate: 6.72,  bbRate: 6.52,  errors: 7,  source: 'CPBL 2025', rating: 'C' },
  { name: '江坤宇',  team: '中信兄弟', position: 'SS',    preferredPositions: ['SS', '2B', '3B'], role: 'B', avg: 0.272, obp: 0.357, slg: 0.317, ops: 0.674, opsPlus: 100, hr: 1,  sb: 7,  kRate: 11.21, bbRate: 7.03,  errors: 7,  source: 'CPBL 2025', rating: 'S' },
  { name: '范國宸',  team: '富邦悍將', position: '1B',    preferredPositions: ['1B', 'DH', 'LF'], role: 'B', avg: 0.275, obp: 0.334, slg: 0.453, ops: 0.787, opsPlus: 125, hr: 13, sb: 1,  kRate: 19.84, bbRate: 8.70,  errors: 2,  source: 'CPBL 2025', rating: 'B' },
  { name: '張育成',  team: '富邦悍將', position: '3B',    preferredPositions: ['3B', 'SS', '2B'], role: 'B', avg: 0.356, obp: 0.435, slg: 0.603, ops: 1.038, opsPlus: 221, hr: 4,  sb: 3,  kRate: 14.12, bbRate: 11.76, errors: 3,  source: 'CPBL 2026 current', rating: 'S' },
  { name: '王威晨',  team: '中信兄弟', position: '3B/2B', preferredPositions: ['3B', '2B', 'SS'], role: 'B', avg: 0.302, obp: 0.371, slg: 0.378, ops: 0.749, opsPlus: 120, hr: 2,  sb: 18, kRate: 10.10, bbRate: 9.20,  errors: 6,  source: 'CPBL 2024', rating: 'A' },
  { name: '岳東華',  team: '中信兄弟', position: '2B/SS', preferredPositions: ['2B', 'SS', '3B'], role: 'B', avg: 0.290, obp: 0.354, slg: 0.398, ops: 0.752, opsPlus: 122, hr: 5,  sb: 9,  kRate: 12.40, bbRate: 8.20,  errors: 5,  source: 'CPBL 2024', rating: 'B' },
  { name: '林立',    team: '樂天桃猿', position: 'CF/LF', preferredPositions: ['CF', 'LF', 'RF', '2B'], role: 'B', avg: 0.318, obp: 0.380, slg: 0.471, ops: 0.851, opsPlus: 150, hr: 9,  sb: 15, kRate: 13.50, bbRate: 7.80,  errors: 4,  source: 'CPBL 2024', rating: 'A' },
  { name: '林子偉',  team: '中信兄弟', position: 'SS/2B', preferredPositions: ['SS', '2B', '3B'], role: 'B', avg: 0.281, obp: 0.355, slg: 0.402, ops: 0.757, opsPlus: 124, hr: 6,  sb: 12, kRate: 16.20, bbRate: 9.30,  errors: 5,  source: 'CPBL 2024', rating: 'A' },
  { name: '林靖凱',  team: '統一7-ELEVEn獅', position: 'SS', preferredPositions: ['SS', '2B'], role: 'B', avg: 0.286, obp: 0.358, slg: 0.395, ops: 0.753, opsPlus: 122, hr: 4,  sb: 22, kRate: 14.90, bbRate: 9.10, errors: 6,  source: 'CPBL 2024', rating: 'B' },
  { name: '陳重羽',  team: '中信兄弟', position: 'CF',    preferredPositions: ['CF', 'LF', 'RF'], role: 'B', avg: 0.295, obp: 0.348, slg: 0.412, ops: 0.760, opsPlus: 124, hr: 4,  sb: 13, kRate: 13.10, bbRate: 7.40,  errors: 4,  source: 'CPBL 2024', rating: 'B' },
  { name: '蘇緯達',  team: '富邦悍將', position: 'LF/1B', preferredPositions: ['LF', '1B', 'DH'], role: 'B', avg: 0.284, obp: 0.344, slg: 0.466, ops: 0.810, opsPlus: 138, hr: 14, sb: 1,  kRate: 19.00, bbRate: 7.80,  errors: 4,  source: 'CPBL 2024', rating: 'B' },
  { name: '張閔勛',  team: '中信兄弟', position: 'C',     preferredPositions: ['C', 'DH'], role: 'B', avg: 0.270, obp: 0.330, slg: 0.388, ops: 0.718, opsPlus: 110, hr: 6,  sb: 0,  kRate: 16.50, bbRate: 7.60,  errors: 7,  source: 'CPBL 2024', rating: 'C' },
  { name: '高國麟',  team: '樂天桃猿', position: '3B/1B', preferredPositions: ['3B', '1B', 'LF'], role: 'B', avg: 0.288, obp: 0.346, slg: 0.452, ops: 0.798, opsPlus: 132, hr: 12, sb: 3,  kRate: 18.20, bbRate: 7.20,  errors: 6,  source: 'CPBL 2024', rating: 'B' },
  { name: '鄭浩均',  team: '富邦悍將', position: 'C/1B',  preferredPositions: ['C', '1B', 'DH'], role: 'B', avg: 0.272, obp: 0.330, slg: 0.396, ops: 0.726, opsPlus: 112, hr: 8,  sb: 0,  kRate: 17.50, bbRate: 7.00,  errors: 8,  source: 'CPBL 2024', rating: 'C' }
];


// ---------- 本地投手 ----------
const CPBL_PITCHER_STATS_2025 = [
  { name: '羅戈',     team: '中信兄弟', position: 'SP', role: 'P', era: 1.84, whip: 1.04, fip: 2.159, k9: 8.17, kRate: 22.83, bbRate: 5.63, ip: 156, starts: 25, source: 'CPBL 2025', throws: 'R', rating: 'S' },
  { name: '後勁',     team: '台鋼雄鷹', position: 'SP', role: 'P', era: 1.89, whip: 1.14, fip: 2.840, k9: 6.44, kRate: 17.93, bbRate: 6.25, ip: 152, starts: 25, source: 'CPBL 2025', throws: 'R', rating: 'A' },
  { name: '菲力士',   team: '統一7-ELEVEn獅', position: 'SP', role: 'P', era: 1.91, whip: 1.06, fip: 2.809, k9: 6.71, kRate: 18.85, bbRate: 6.75, ip: 127, starts: 21, source: 'CPBL 2025', throws: 'R', rating: 'A' },
  { name: '威能帝',   team: '樂天桃猿', position: 'SP', role: 'P', era: 2.01, whip: 0.91, fip: 2.080, k9: 8.89, kRate: 25.34, bbRate: 4.83, ip: 170, starts: 26, source: 'CPBL 2025', throws: 'R', rating: 'S' },
  { name: '艾速特',   team: '台鋼雄鷹', position: 'SP', role: 'P', era: 2.23, whip: 1.09, fip: 2.856, k9: 7.90, kRate: 21.99, bbRate: 5.32, ip: 141, starts: 25, source: 'CPBL 2025', throws: 'L', rating: 'A' },
  { name: '魔神龍',   team: '樂天桃猿', position: 'SP', role: 'P', era: 2.51, whip: 1.08, fip: 2.934, k9: 5.58, kRate: 15.41, bbRate: 4.87, ip: 158, starts: 25, source: 'CPBL 2025', throws: 'R', rating: 'B' },
  { name: '鋼龍',     team: '味全龍',   position: 'SP', role: 'P', era: 2.77, whip: 1.18, fip: 2.874, k9: 7.40, kRate: 19.93, bbRate: 6.64, ip: 146, starts: 24, source: 'CPBL 2025', throws: 'R', rating: 'B' },
  { name: '魔力藍',   team: '富邦悍將', position: 'SP', role: 'P', era: 2.98, whip: 1.25, fip: 3.019, k9: 7.19, kRate: 19.04, bbRate: 7.55, ip: 139, starts: 23, source: 'CPBL 2025', throws: 'R', rating: 'B' },
  { name: '布雷克',   team: '統一7-ELEVEn獅', position: 'SP', role: 'P', era: 4.13, whip: 1.31, fip: 3.030, k9: 6.57, kRate: 17.18, bbRate: 4.63, ip: 122, starts: 21, source: 'CPBL 2025', throws: 'R', rating: 'C' },
  { name: '古林睿煬', team: '統一7-ELEVEn獅', position: 'SP', role: 'P', era: 2.65, whip: 1.10, fip: 2.950, k9: 8.30, kRate: 21.50, bbRate: 6.00, ip: 145, starts: 24, source: 'CPBL 2024', throws: 'R', rating: 'S' },
  { name: '徐若熙',   team: '味全龍',   position: 'SP', role: 'P', era: 2.10, whip: 0.98, fip: 2.450, k9: 9.50, kRate: 26.10, bbRate: 5.20, ip: 130, starts: 22, source: 'CPBL 2024', throws: 'R', rating: 'S' },
  { name: '江國豪',   team: '中信兄弟', position: 'SP', role: 'P', era: 3.40, whip: 1.28, fip: 3.350, k9: 7.10, kRate: 18.20, bbRate: 7.20, ip: 115, starts: 20, source: 'CPBL 2024', throws: 'R', rating: 'B' },
  { name: '林詩翔',   team: '台鋼雄鷹', position: 'RP', role: 'P', era: 1.92, whip: 1.10, fip: 3.243, k9: 7.67, kRate: 21.05, bbRate: 8.33, ip: 56, starts: 0,  source: 'CPBL 2025', throws: 'R', rating: 'A' },
  { name: '陳禹勳',   team: '樂天桃猿', position: 'RP', role: 'P', era: 2.55, whip: 1.16, fip: 3.180, k9: 8.50, kRate: 22.10, bbRate: 6.80, ip: 60, starts: 0,  source: 'CPBL 2024', throws: 'R', rating: 'A' },
  { name: '黃子鵬',   team: '樂天桃猿', position: 'RP', role: 'P', era: 2.80, whip: 1.20, fip: 3.250, k9: 7.20, kRate: 19.40, bbRate: 6.50, ip: 55, starts: 0,  source: 'CPBL 2024', throws: 'R', rating: 'B' },
  { name: '翁瑋均',   team: '中信兄弟', position: 'RP', role: 'P', era: 3.10, whip: 1.30, fip: 3.500, k9: 7.80, kRate: 20.20, bbRate: 8.30, ip: 50, starts: 0,  source: 'CPBL 2024', throws: 'R', rating: 'B' },
  { name: '王玉譜',   team: '中信兄弟', position: 'RP', role: 'P', era: 2.65, whip: 1.18, fip: 3.300, k9: 8.10, kRate: 21.00, bbRate: 7.20, ip: 52, starts: 0,  source: 'CPBL 2024', throws: 'L', rating: 'B' },
  { name: '宋家豪',   team: '富邦悍將', position: 'RP', role: 'P', era: 2.40, whip: 1.10, fip: 3.000, k9: 9.20, kRate: 24.50, bbRate: 6.40, ip: 58, starts: 0,  source: 'CPBL 2024', throws: 'R', rating: 'A' },
  { name: '黃恩賜',   team: '富邦悍將', position: 'RP', role: 'P', era: 3.30, whip: 1.32, fip: 3.600, k9: 6.90, kRate: 18.80, bbRate: 9.10, ip: 48, starts: 0,  source: 'CPBL 2024', throws: 'R', rating: 'C' },
  { name: '陳柏清',   team: '味全龍',   position: 'RP', role: 'P', era: 2.90, whip: 1.25, fip: 3.400, k9: 7.50, kRate: 19.80, bbRate: 7.50, ip: 54, starts: 0,  source: 'CPBL 2024', throws: 'L', rating: 'B' }
];


// ---------- 國際巨星 ----------
const INTERNATIONAL_STAR_CANDIDATES = [
  { name: '亞倫・賈吉',   englishName: 'Aaron Judge',           nickname: '法官',     role: 'B', position: 'RF',    preferredPositions: ['RF', 'CF', 'LF'], team: 'MLB', bats: 'R', throws: 'R', rating: 'S',
    abilities: { contact: 84, power: 99, speed: 64, fielding: 83, arm: 94, discipline: 92, clutch: 90 },
    physical:  { velocity: 94, power: 99, control: 84, speed: 64 },
    traits: ['力量打者', '紀律性'] },
  { name: '大谷翔平',     englishName: 'Shohei Ohtani',         nickname: '二刀流神獸', role: 'T', position: 'SP/DH', preferredPositions: ['DH', 'RF'], team: 'MLB', bats: 'L', throws: 'R', rating: 'S',
    abilities: { contact: 86, power: 99, speed: 88, fielding: 72, arm: 98, discipline: 84, clutch: 93, velocity: 99, control: 83, breaking: 94, stamina: 89 },
    physical:  { velocity: 99, power: 99, control: 86, speed: 88 },
    traits: ['傳奇打者', '精英投手'] },
  { name: '穆奇・貝茲',   englishName: 'Mookie Betts',          nickname: '全能保齡球王', role: 'B', position: 'RF/2B', preferredPositions: ['RF', '2B', 'CF', 'SS'], team: 'MLB', bats: 'R', throws: 'R', rating: 'S',
    abilities: { contact: 88, power: 83, speed: 84, fielding: 95, arm: 87, discipline: 90, clutch: 87 },
    physical:  { velocity: 87, power: 83, control: 88, speed: 84 },
    traits: ['紀律性', '守備職人'] },
  { name: '胡安・索托',   englishName: 'Juan Soto',             nickname: '保送魔王', role: 'B', position: 'LF',    preferredPositions: ['LF', 'RF'], team: 'MLB', bats: 'L', throws: 'L', rating: 'S',
    abilities: { contact: 90, power: 94, speed: 58, fielding: 68, arm: 76, discipline: 99, clutch: 91 },
    physical:  { velocity: 76, power: 94, control: 90, speed: 58 },
    traits: ['力量打者', '紀律性', '選球眼'] },
  { name: '小葛雷諾',     englishName: 'Vladimir Guerrero Jr.', nickname: '暴力甜甜圈', role: 'B', position: '1B',  preferredPositions: ['1B', 'DH'], team: 'MLB', bats: 'R', throws: 'R', rating: 'A',
    abilities: { contact: 87, power: 93, speed: 52, fielding: 72, arm: 78, discipline: 80, clutch: 84 },
    physical:  { velocity: 78, power: 93, control: 87, speed: 52 },
    traits: ['力量打者'] },
  { name: '達比修有',     englishName: 'Yu Darvish',            nickname: '混球博士', role: 'P', position: 'SP',    team: 'MLB', bats: 'R', throws: 'R', rating: 'A',
    abilities: { velocity: 88, control: 87, breaking: 96, stamina: 80, fielding: 77, discipline: 74 },
    physical:  { velocity: 88, power: 50, control: 87, speed: 60 },
    traits: ['精英投手'] },
  { name: '山本由伸',     englishName: 'Yoshinobu Yamamoto',    nickname: '山本總舵主', role: 'P', position: 'SP',  team: 'MLB', bats: 'R', throws: 'R', rating: 'S',
    abilities: { velocity: 92, control: 93, breaking: 95, stamina: 88, fielding: 80, discipline: 76 },
    physical:  { velocity: 92, power: 48, control: 93, speed: 63 },
    traits: ['精英投手', '王牌'] },
  { name: '佐佐木朗希',   englishName: 'Roki Sasaki',           nickname: '令和怪物', role: 'P', position: 'SP',    team: 'MLB', bats: 'R', throws: 'R', rating: 'S',
    abilities: { velocity: 99, control: 78, breaking: 92, stamina: 76, fielding: 74, discipline: 70 },
    physical:  { velocity: 99, power: 45, control: 78, speed: 66 },
    traits: ['精英投手'] },
  { name: '吉田正尚',     englishName: 'Masataka Yoshida',      nickname: '肌肉吉田', role: 'B', position: 'LF/DH', preferredPositions: ['LF', 'DH'], team: 'MLB', bats: 'L', throws: 'R', rating: 'A',
    abilities: { contact: 88, power: 78, speed: 58, fielding: 65, arm: 70, discipline: 87, clutch: 85 },
    physical:  { velocity: 70, power: 78, control: 88, speed: 58 },
    traits: ['關鍵時刻打者'] },
  { name: '羅納德・艾庫尼亞 Jr.', englishName: 'Ronald Acuña Jr.', nickname: '颶風小子', role: 'B', position: 'RF', preferredPositions: ['RF', 'CF', 'LF'], team: 'MLB', bats: 'R', throws: 'R', rating: 'S',
    abilities: { contact: 89, power: 92, speed: 95, fielding: 84, arm: 90, discipline: 82, clutch: 89 },
    physical:  { velocity: 90, power: 92, control: 89, speed: 95 },
    traits: ['力量打者', '盜壘好手'] },
  { name: '法蘭西斯科・林多', englishName: 'Francisco Lindor', nickname: '微笑游擊', role: 'B', position: 'SS', preferredPositions: ['SS', '2B', '3B'], team: 'MLB', bats: 'B', throws: 'R', rating: 'S',
    abilities: { contact: 85, power: 84, speed: 82, fielding: 94, arm: 90, discipline: 84, clutch: 86 },
    physical:  { velocity: 90, power: 84, control: 85, speed: 82 },
    traits: ['守備職人', '對左強'] },
  { name: '科比・布萊森', englishName: 'Corbin Burnes',         nickname: '滑球之王', role: 'P', position: 'SP', team: 'MLB', bats: 'R', throws: 'R', rating: 'S',
    abilities: { velocity: 90, control: 91, breaking: 95, stamina: 87, fielding: 78, discipline: 76 },
    physical:  { velocity: 90, power: 48, control: 91, speed: 60 },
    traits: ['精英投手', '滾地球投手'] },
  { name: '達文・威廉斯',   englishName: 'Devin Williams',       nickname: '空氣斷氣',  role: 'P', position: 'RP', team: 'MLB', bats: 'R', throws: 'R', rating: 'A',
    abilities: { velocity: 91, control: 85, breaking: 96, stamina: 60, fielding: 75, discipline: 74 },
    physical:  { velocity: 91, power: 45, control: 85, speed: 58 },
    traits: ['精英投手', '王牌'] },
  { name: '艾梅特・西恩',   englishName: 'Emmet Sheehan',        nickname: '加州黑魔',  role: 'P', position: 'SP', team: 'MLB', bats: 'R', throws: 'R', rating: 'B',
    abilities: { velocity: 88, control: 80, breaking: 86, stamina: 78, fielding: 72, discipline: 72 },
    physical:  { velocity: 88, power: 45, control: 80, speed: 58 },
    traits: ['精英投手'] },
  { name: '鈴木一朗 II',  englishName: 'Ichiro II',             nickname: '小一朗',   role: 'B', position: 'CF', preferredPositions: ['CF', 'RF', 'LF'], team: 'NPB', bats: 'L', throws: 'R', rating: 'S',
    abilities: { contact: 96, power: 62, speed: 92, fielding: 92, arm: 90, discipline: 88, clutch: 80 },
    physical:  { velocity: 90, power: 62, control: 96, speed: 92 },
    traits: ['紀律性', '盜壘好手', '守備職人'] },
  { name: '李正厚',       englishName: 'Jung Hoo Lee',           nickname: '草地騎士', role: 'B', position: 'CF', preferredPositions: ['CF', 'LF', 'RF'], team: 'MLB', bats: 'L', throws: 'L', rating: 'A',
    abilities: { contact: 90, power: 70, speed: 85, fielding: 88, arm: 80, discipline: 87, clutch: 84 },
    physical:  { velocity: 80, power: 70, control: 90, speed: 85 },
    traits: ['紀律性', '關鍵時刻打者'] },
  { name: '布萊斯・哈波', englishName: 'Bryce Harper',           nickname: '鬼神超人', role: 'B', position: '1B/RF', preferredPositions: ['1B', 'RF', 'DH'], team: 'MLB', bats: 'L', throws: 'R', rating: 'S',
    abilities: { contact: 84, power: 92, speed: 70, fielding: 78, arm: 85, discipline: 88, clutch: 88 },
    physical:  { velocity: 85, power: 92, control: 84, speed: 70 },
    traits: ['力量打者', '關鍵時刻打者'] },
  { name: '城福斯特',     englishName: 'Castle Forster',         nickname: '城牆鎖門', role: 'P', position: 'RP', team: 'MLB', bats: 'R', throws: 'R', rating: 'A',
    abilities: { velocity: 95, control: 78, breaking: 86, stamina: 55, fielding: 72, discipline: 70 },
    physical:  { velocity: 95, power: 45, control: 78, speed: 58 },
    traits: ['精英投手'] }
];


// ---------- 傳奇英雄 ----------
const LEGENDARY_HERO_CANDIDATES = [
  { name: '雷霆・歐文',   nickname: '雷神之槌', shardCost: 30, role: 'B', position: 'RF', preferredPositions: ['RF', 'LF', 'CF'], team: '傳奇隊', bats: 'R', throws: 'R', rating: 'S',
    abilities: { contact: 92, power: 99, speed: 80, fielding: 88, arm: 96, discipline: 90, clutch: 95 },
    physical:  { velocity: 96, power: 99, control: 92, speed: 80 },
    traits: ['傳奇打者', '力量打者', '怪力', '大心臟'] },
  { name: '冰刃・桐生',   nickname: '無聲狙擊', shardCost: 28, role: 'P', position: 'SP', team: '傳奇隊', bats: 'R', throws: 'L', rating: 'S',
    abilities: { velocity: 95, control: 96, breaking: 98, stamina: 95, fielding: 84, discipline: 90 },
    physical:  { velocity: 95, power: 50, control: 96, speed: 65 },
    traits: ['精英投手', '王牌', '滾地球投手'] },
  { name: '光速・赤羽',   nickname: '逆風奔馳', shardCost: 25, role: 'B', position: 'CF', preferredPositions: ['CF', 'LF', 'RF', '2B'], team: '傳奇隊', bats: 'B', throws: 'R', rating: 'S',
    abilities: { contact: 95, power: 70, speed: 99, fielding: 97, arm: 92, discipline: 92, clutch: 88 },
    physical:  { velocity: 92, power: 70, control: 95, speed: 99 },
    traits: ['紀律性', '盜壘好手', '守備職人'] },
  { name: '岩壁・大門',   nickname: '人形萬里長城', shardCost: 22, role: 'B', position: 'C', preferredPositions: ['C', '1B', 'DH'], team: '傳奇隊', bats: 'R', throws: 'R', rating: 'S',
    abilities: { contact: 88, power: 95, speed: 50, fielding: 99, arm: 99, discipline: 86, clutch: 91 },
    physical:  { velocity: 99, power: 95, control: 88, speed: 50 },
    traits: ['守備職人', '大心臟', '怪力'] },
  { name: '迷霧・霧島',   nickname: '七色魔球', shardCost: 30, role: 'P', position: 'SP', team: '傳奇隊', bats: 'L', throws: 'R', rating: 'S',
    abilities: { velocity: 88, control: 99, breaking: 99, stamina: 92, fielding: 86, discipline: 95 },
    physical:  { velocity: 88, power: 48, control: 99, speed: 65 },
    traits: ['精英投手', '王牌'] },
  { name: '黃金・羅倫斯', nickname: '黃金球棒', shardCost: 26, role: 'B', position: '3B/1B', preferredPositions: ['3B', '1B', 'LF', 'DH'], team: '傳奇隊', bats: 'L', throws: 'R', rating: 'S',
    abilities: { contact: 93, power: 96, speed: 65, fielding: 86, arm: 90, discipline: 88, clutch: 94 },
    physical:  { velocity: 90, power: 96, control: 93, speed: 65 },
    traits: ['傳奇打者', '力量打者', '低球打'] },
  { name: '閃電・伊澤',   nickname: '雙刀流再臨', shardCost: 40, role: 'T', position: 'SP/CF', preferredPositions: ['CF', 'RF', 'LF', 'DH'], team: '傳奇隊', bats: 'L', throws: 'R', rating: 'S',
    abilities: { contact: 94, power: 96, speed: 90, fielding: 88, arm: 95, discipline: 88, clutch: 92, velocity: 96, control: 90, breaking: 92, stamina: 90 },
    physical:  { velocity: 96, power: 96, control: 94, speed: 90 },
    traits: ['傳奇打者', '精英投手', '王牌'] },
  { name: '鋼鐵・卡爾森', nickname: '深夜終結者', shardCost: 18, role: 'P', position: 'RP', team: '傳奇隊', bats: 'R', throws: 'R', rating: 'A',
    abilities: { velocity: 99, control: 88, breaking: 92, stamina: 70, fielding: 80, discipline: 82 },
    physical:  { velocity: 99, power: 50, control: 88, speed: 62 },
    traits: ['精英投手', '王牌'] }
];


// ---------- 教練團（保留 v1.14 舊版以相容） ----------
const COACHES_DATA = [
  { id: 'hitting',      name: '打擊教練', bonus: '巧打/長打 +2',         hitting: 2,  heat: 0 },
  { id: 'pitching',     name: '投手教練', bonus: '控球/球威 +2',         pitching: 2, heat: 0 },
  { id: 'defense',      name: '守備教練', bonus: '守備 +3',              defense: 3,  heat: 0 },
  { id: 'conditioning', name: '體能教練', bonus: '恢復力 +6，傷病風險下降', recovery: 6, heat: 0 },
  { id: 'marketing',    name: '人氣教練', bonus: '球場熱度 +8',          heat: 8 }
];


// ---------- 政大棒球隊初始陣容（v1.18 改名）----------
const INITIAL_ROSTER_SPEC = {
  fielders: {
    C:  '吉力吉撈．鞏冠',
    '1B': '許基宏',
    '2B': '吳念庭',
    '3B': '張育成',
    SS:  '江坤宇',
    LF:  '林安可',
    CF:  '陳晨威',
    RF:  '魔鷹',
    DH:  '朱育賢'
  },
  bench: ['林泓育', '李凱威', '范國宸'],
  rotation: ['羅戈', '威能帝', '徐若熙', '古林睿煬', '艾速特'],
  bullpen:  ['林詩翔', '陳禹勳', '宋家豪', '王玉譜', '黃子鵬']
};


// ============================================================
// v2.11：WBC 世界棒球經典賽資料
// ============================================================

// WBC 八強隊伍（除了中華隊由玩家政大棒球擔任，其餘 7 國固定陣容）
// 數值以 2026 年度該國代表隊球星水準調校
const WBC_NATIONAL_TEAMS = {
  'JPN': {
    code: 'JPN', name: '日本武士', flag: '🇯🇵', strength: 96,
    batters: [
      { name: '大谷翔平',   role: 'B', position: 'DH', power: 99, contact: 86, speed: 88, discipline: 84, clutch: 93 },
      { name: '佐藤輝明',   role: 'B', position: '3B', power: 92, contact: 80, speed: 70, discipline: 78, clutch: 82 },
      { name: '岡本和真',   role: 'B', position: '1B', power: 90, contact: 82, speed: 60, discipline: 80, clutch: 84 },
      { name: '村上宗隆',   role: 'B', position: '3B', power: 95, contact: 78, speed: 68, discipline: 86, clutch: 88 },
      { name: '近藤健介',   role: 'B', position: 'RF', power: 78, contact: 92, speed: 75, discipline: 94, clutch: 86 },
      { name: '吉田正尚',   role: 'B', position: 'LF', power: 80, contact: 90, speed: 64, discipline: 88, clutch: 87 },
      { name: '源田壯亮',   role: 'B', position: 'SS', power: 56, contact: 80, speed: 86, discipline: 78, clutch: 80 },
      { name: '中野拓夢',   role: 'B', position: '2B', power: 58, contact: 84, speed: 88, discipline: 75, clutch: 78 },
      { name: '甲斐拓也',   role: 'B', position: 'C',  power: 62, contact: 74, speed: 50, discipline: 70, clutch: 76 }
    ],
    pitchers: [
      { name: '山本由伸',     role: 'P', position: 'SP', velocity: 92, control: 93, breaking: 95, stamina: 88 },
      { name: '佐佐木朗希',   role: 'P', position: 'SP', velocity: 99, control: 78, breaking: 92, stamina: 76 },
      { name: '今永昇太',     role: 'P', position: 'SP', velocity: 88, control: 90, breaking: 90, stamina: 84 },
      { name: '戶郷翔征',     role: 'P', position: 'SP', velocity: 90, control: 88, breaking: 92, stamina: 82 },
      { name: '栗林良吏',     role: 'P', position: 'RP', velocity: 93, control: 86, breaking: 90, stamina: 60 }
    ]
  },
  'USA': {
    code: 'USA', name: '美國夢幻隊', flag: '🇺🇸', strength: 94,
    batters: [
      { name: 'Aaron Judge',         role: 'B', position: 'RF', power: 99, contact: 84, speed: 64, discipline: 92, clutch: 90 },
      { name: 'Mookie Betts',        role: 'B', position: '2B', power: 83, contact: 88, speed: 84, discipline: 90, clutch: 87 },
      { name: 'Bryce Harper',        role: 'B', position: '1B', power: 92, contact: 84, speed: 70, discipline: 88, clutch: 88 },
      { name: 'Mike Trout',          role: 'B', position: 'CF', power: 92, contact: 85, speed: 80, discipline: 92, clutch: 88 },
      { name: 'Pete Alonso',         role: 'B', position: '1B', power: 96, contact: 75, speed: 56, discipline: 82, clutch: 84 },
      { name: 'Trea Turner',         role: 'B', position: 'SS', power: 80, contact: 88, speed: 96, discipline: 82, clutch: 88 },
      { name: 'Nolan Arenado',       role: 'B', position: '3B', power: 86, contact: 82, speed: 62, discipline: 80, clutch: 86 },
      { name: 'Will Smith',          role: 'B', position: 'C',  power: 80, contact: 82, speed: 56, discipline: 84, clutch: 80 },
      { name: 'Kyle Tucker',         role: 'B', position: 'LF', power: 88, contact: 86, speed: 78, discipline: 88, clutch: 86 }
    ],
    pitchers: [
      { name: 'Corbin Burnes',     role: 'P', position: 'SP', velocity: 90, control: 91, breaking: 95, stamina: 87 },
      { name: 'Spencer Strider',   role: 'P', position: 'SP', velocity: 98, control: 84, breaking: 93, stamina: 80 },
      { name: 'Logan Webb',        role: 'P', position: 'SP', velocity: 86, control: 92, breaking: 90, stamina: 86 },
      { name: 'Tarik Skubal',      role: 'P', position: 'SP', velocity: 95, control: 88, breaking: 92, stamina: 84 },
      { name: 'Devin Williams',    role: 'P', position: 'RP', velocity: 91, control: 85, breaking: 96, stamina: 60 }
    ]
  },
  'KOR': {
    code: 'KOR', name: '韓國代表隊', flag: '🇰🇷', strength: 88,
    batters: [
      { name: '李正厚',     role: 'B', position: 'CF', power: 70, contact: 90, speed: 85, discipline: 87, clutch: 84 },
      { name: '金河成',     role: 'B', position: 'SS', power: 64, contact: 82, speed: 80, discipline: 80, clutch: 82 },
      { name: '裴芝煥',     role: 'B', position: '2B', power: 56, contact: 86, speed: 85, discipline: 78, clutch: 80 },
      { name: '姜白虎',     role: 'B', position: 'RF', power: 84, contact: 80, speed: 70, discipline: 82, clutch: 84 },
      { name: '朴炳鎬',     role: 'B', position: '1B', power: 88, contact: 78, speed: 50, discipline: 76, clutch: 84 },
      { name: '崔智晃',     role: 'B', position: 'LF', power: 80, contact: 82, speed: 70, discipline: 80, clutch: 82 },
      { name: '吳智煥',     role: 'B', position: 'C',  power: 68, contact: 76, speed: 50, discipline: 72, clutch: 78 },
      { name: '盧詩煥',     role: 'B', position: '3B', power: 78, contact: 80, speed: 65, discipline: 76, clutch: 80 },
      { name: '安致鎬',     role: 'B', position: 'DH', power: 82, contact: 84, speed: 60, discipline: 80, clutch: 84 }
    ],
    pitchers: [
      { name: '柳賢振',     role: 'P', position: 'SP', velocity: 86, control: 92, breaking: 90, stamina: 84 },
      { name: '金廣鉉',     role: 'P', position: 'SP', velocity: 84, control: 88, breaking: 88, stamina: 84 },
      { name: '高永表',     role: 'P', position: 'SP', velocity: 88, control: 84, breaking: 86, stamina: 80 },
      { name: '文東柱',     role: 'P', position: 'SP', velocity: 92, control: 84, breaking: 86, stamina: 78 },
      { name: '高于錫',     role: 'P', position: 'RP', velocity: 95, control: 80, breaking: 88, stamina: 58 }
    ]
  },
  'DOM': {
    code: 'DOM', name: '多明尼加', flag: '🇩🇴', strength: 92,
    batters: [
      { name: 'Juan Soto',              role: 'B', position: 'LF', power: 94, contact: 90, speed: 58, discipline: 99, clutch: 91 },
      { name: 'Vladimir Guerrero Jr.',  role: 'B', position: '1B', power: 93, contact: 87, speed: 52, discipline: 80, clutch: 84 },
      { name: 'Manny Machado',          role: 'B', position: '3B', power: 88, contact: 84, speed: 60, discipline: 82, clutch: 86 },
      { name: 'Rafael Devers',          role: 'B', position: '3B', power: 92, contact: 84, speed: 60, discipline: 78, clutch: 84 },
      { name: 'Fernando Tatis Jr.',     role: 'B', position: 'RF', power: 92, contact: 80, speed: 92, discipline: 76, clutch: 86 },
      { name: 'Julio Rodriguez',        role: 'B', position: 'CF', power: 90, contact: 84, speed: 88, discipline: 80, clutch: 86 },
      { name: 'Ketel Marte',            role: 'B', position: '2B', power: 80, contact: 88, speed: 70, discipline: 84, clutch: 84 },
      { name: 'Francisco Lindor',       role: 'B', position: 'SS', power: 84, contact: 85, speed: 82, discipline: 84, clutch: 86 },
      { name: 'Salvador Perez',         role: 'B', position: 'C',  power: 86, contact: 80, speed: 50, discipline: 70, clutch: 82 }
    ],
    pitchers: [
      { name: 'Sandy Alcantara',  role: 'P', position: 'SP', velocity: 94, control: 86, breaking: 88, stamina: 86 },
      { name: 'Cristian Javier',  role: 'P', position: 'SP', velocity: 90, control: 86, breaking: 90, stamina: 82 },
      { name: 'Luis Castillo',    role: 'P', position: 'SP', velocity: 94, control: 84, breaking: 88, stamina: 82 },
      { name: 'Framber Valdez',   role: 'P', position: 'SP', velocity: 88, control: 84, breaking: 90, stamina: 84 },
      { name: 'Camilo Doval',     role: 'P', position: 'RP', velocity: 97, control: 78, breaking: 90, stamina: 58 }
    ]
  },
  'VEN': {
    code: 'VEN', name: '委內瑞拉', flag: '🇻🇪', strength: 86,
    batters: [
      { name: 'Ronald Acuña Jr.',  role: 'B', position: 'RF', power: 92, contact: 89, speed: 95, discipline: 82, clutch: 89 },
      { name: 'Jose Altuve',       role: 'B', position: '2B', power: 76, contact: 90, speed: 80, discipline: 82, clutch: 90 },
      { name: 'Miguel Cabrera',    role: 'B', position: 'DH', power: 80, contact: 86, speed: 45, discipline: 84, clutch: 90 },
      { name: 'Salvador Perez',    role: 'B', position: 'C',  power: 86, contact: 80, speed: 50, discipline: 70, clutch: 82 },
      { name: 'Luis Arraez',       role: 'B', position: '1B', power: 60, contact: 98, speed: 60, discipline: 92, clutch: 86 },
      { name: 'Andres Gimenez',    role: 'B', position: '2B', power: 70, contact: 82, speed: 85, discipline: 76, clutch: 80 },
      { name: 'Eugenio Suarez',    role: 'B', position: '3B', power: 88, contact: 72, speed: 55, discipline: 78, clutch: 82 },
      { name: 'David Peralta',     role: 'B', position: 'LF', power: 76, contact: 80, speed: 65, discipline: 76, clutch: 78 },
      { name: 'Jose Trevino',      role: 'B', position: 'C',  power: 60, contact: 76, speed: 55, discipline: 70, clutch: 76 }
    ],
    pitchers: [
      { name: 'Pablo Lopez',      role: 'P', position: 'SP', velocity: 90, control: 88, breaking: 88, stamina: 84 },
      { name: 'Luis Garcia',      role: 'P', position: 'SP', velocity: 88, control: 84, breaking: 88, stamina: 80 },
      { name: 'Jesus Luzardo',    role: 'P', position: 'SP', velocity: 94, control: 80, breaking: 88, stamina: 78 },
      { name: 'Eduardo Rodriguez',role: 'P', position: 'SP', velocity: 86, control: 86, breaking: 84, stamina: 82 },
      { name: 'Felix Bautista',   role: 'P', position: 'RP', velocity: 98, control: 80, breaking: 90, stamina: 58 }
    ]
  },
  'PUR': {
    code: 'PUR', name: '波多黎各', flag: '🇵🇷', strength: 82,
    batters: [
      { name: 'Francisco Lindor',   role: 'B', position: 'SS', power: 84, contact: 85, speed: 82, discipline: 84, clutch: 86 },
      { name: 'Javier Baez',        role: 'B', position: 'SS', power: 84, contact: 76, speed: 78, discipline: 64, clutch: 82 },
      { name: 'Carlos Correa',      role: 'B', position: 'SS', power: 86, contact: 82, speed: 70, discipline: 82, clutch: 84 },
      { name: 'Yadier Molina',      role: 'B', position: 'C',  power: 70, contact: 80, speed: 50, discipline: 78, clutch: 86 },
      { name: 'Eddie Rosario',      role: 'B', position: 'LF', power: 82, contact: 78, speed: 65, discipline: 70, clutch: 80 },
      { name: 'Enrique Hernandez',  role: 'B', position: '2B', power: 72, contact: 76, speed: 70, discipline: 74, clutch: 80 },
      { name: 'Christian Vazquez',  role: 'B', position: 'C',  power: 68, contact: 76, speed: 58, discipline: 72, clutch: 76 },
      { name: 'MJ Melendez',        role: 'B', position: 'C',  power: 80, contact: 74, speed: 60, discipline: 76, clutch: 76 },
      { name: 'Kike Hernandez',     role: 'B', position: 'CF', power: 74, contact: 76, speed: 72, discipline: 76, clutch: 78 }
    ],
    pitchers: [
      { name: 'Marcus Stroman',   role: 'P', position: 'SP', velocity: 86, control: 90, breaking: 86, stamina: 82 },
      { name: 'Jose Berrios',     role: 'P', position: 'SP', velocity: 88, control: 86, breaking: 88, stamina: 84 },
      { name: 'Carlos Hernandez', role: 'P', position: 'SP', velocity: 94, control: 78, breaking: 84, stamina: 76 },
      { name: 'Joan Adon',        role: 'P', position: 'SP', velocity: 92, control: 76, breaking: 82, stamina: 76 },
      { name: 'Edwin Diaz',       role: 'P', position: 'RP', velocity: 99, control: 82, breaking: 92, stamina: 58 }
    ]
  },
  'MEX': {
    code: 'MEX', name: '墨西哥', flag: '🇲🇽', strength: 84,
    batters: [
      { name: 'Randy Arozarena',     role: 'B', position: 'LF', power: 86, contact: 80, speed: 86, discipline: 78, clutch: 92 },
      { name: 'Joey Meneses',        role: 'B', position: '1B', power: 80, contact: 82, speed: 50, discipline: 74, clutch: 80 },
      { name: 'Alex Verdugo',        role: 'B', position: 'CF', power: 76, contact: 86, speed: 72, discipline: 84, clutch: 82 },
      { name: 'Rowdy Tellez',        role: 'B', position: '1B', power: 84, contact: 74, speed: 48, discipline: 74, clutch: 78 },
      { name: 'Isaac Paredes',       role: 'B', position: '3B', power: 82, contact: 80, speed: 55, discipline: 84, clutch: 82 },
      { name: 'Luis Urias',          role: 'B', position: '2B', power: 70, contact: 78, speed: 70, discipline: 80, clutch: 78 },
      { name: 'Jarren Duran',        role: 'B', position: 'CF', power: 78, contact: 80, speed: 92, discipline: 76, clutch: 78 },
      { name: 'Austin Barnes',       role: 'B', position: 'C',  power: 60, contact: 72, speed: 55, discipline: 74, clutch: 74 },
      { name: 'Alejandro Kirk',      role: 'B', position: 'C',  power: 76, contact: 84, speed: 40, discipline: 84, clutch: 80 }
    ],
    pitchers: [
      { name: 'Julio Urias',       role: 'P', position: 'SP', velocity: 88, control: 88, breaking: 88, stamina: 82 },
      { name: 'Patrick Sandoval',  role: 'P', position: 'SP', velocity: 86, control: 84, breaking: 86, stamina: 80 },
      { name: 'Taijuan Walker',    role: 'P', position: 'SP', velocity: 88, control: 84, breaking: 86, stamina: 80 },
      { name: 'Jose Urquidy',      role: 'P', position: 'SP', velocity: 88, control: 86, breaking: 84, stamina: 80 },
      { name: 'Giovanny Gallegos', role: 'P', position: 'RP', velocity: 92, control: 86, breaking: 88, stamina: 58 }
    ]
  }
};


// WBC 資格積分制度（玩家累積 4 季 → 看誰積分最高 → 取得中華隊代表權）
const WBC_QUALIFICATION_RULES = {
  yearRank1Points: 7,        // 年度第一名（年度總戰績）
  yearRank2Points: 6,        // 年度第二名
  halfChampPoints: 3,        // 上半季或下半季冠軍
  champPoints: 10,           // 年度總冠軍
  runnerUpPoints: 7,         // 總冠軍亞軍
  thirdPlacePoints: 3,       // 季後賽季軍（挑戰賽敗者）
  totalSeasons: 4,           // 累計 2026、2027、2028、2029 共 4 季
  startYear: 2026
};


// 主線劇情文本
const STORYLINE_TEXTS = {
  introTitle: '2030 WBC 世界經典賽，等你來戰',
  introBody: [
    '時間是 2026 年，政治大學棒球隊（你的球隊）獲准加入 CPBL 進行為期 4 年的擴張試辦。',
    '4 個賽季結束後，CPBL 七隊中誰累積最多「WBC 積分」，誰就能代表中華隊出戰 2030 年的 WBC 世界棒球經典賽。',
    '積分來自年度排名、上下半季冠軍、總冠軍賽結果。',
    '只要連續 4 年表現穩定壓過聯盟其他隊，你就能站上 8 強舞台，與日本、美國、多明尼加、韓國、委內瑞拉、波多黎各、墨西哥同台競技。'
  ],
  wbcOpening: [
    '🎌 政大棒球以 4 年累積 WBC 積分第一名取得中華隊代表權！',
    '從台灣到全世界，你即將在 2030 年世界舞台代表中華民國國家隊出賽。',
    '8 強單淘汰，第一場對戰將決定一切。'
  ],
  failureTitle: '4 年了，我們還是去不了世界舞台',
  failureBody: [
    '4 個 CPBL 賽季結束。',
    '你帶領的政大棒球隊累積 WBC 積分未能在 7 隊中拔得頭籌。',
    '中華隊代表權落入聯盟其他球隊手中，你只能在電視機前看著別人為國爭光。',
    '但這 4 年中你看著球員從新秀變成老將、從業餘變成職業，球隊精神也已留下。'
  ],
  wbcChampion: [
    '🏆 中華隊在 2030 WBC 奪冠！',
    '你在政治大學的這 4 年訓練，造就了第一個由大學棒球隊帶領取得世界冠軍的奇蹟。',
    '全台灣陷入棒球狂歡。'
  ],
  wbcDefeated: [
    '中華隊在 8 強 {stage} 遭遇 {opp} 止步。',
    '雖然沒能再進一步，但你帶領中華隊站上世界舞台的故事，已成為棒球迷的共同記憶。',
    '回到政大球場，新的賽季又要開始了。'
  ]
};


// CSV 資料匯入/匯出欄位定義（給「資料中心」介面用）
const DATA_SCHEMAS = {
  cpblBatters: {
    label: '本土打者',
    target: 'CPBL_BATTER_STATS_2025',
    columns: ['name', 'team', 'position', 'preferredPositions', 'role', 'avg', 'obp', 'slg', 'ops', 'opsPlus', 'hr', 'sb', 'kRate', 'bbRate', 'errors', 'source', 'rating'],
    notes: 'preferredPositions 以「|」分隔（例如 "C|1B|DH"）；其餘欄位請維持數字。'
  },
  cpblPitchers: {
    label: '本土投手',
    target: 'CPBL_PITCHER_STATS_2025',
    columns: ['name', 'team', 'position', 'role', 'era', 'whip', 'fip', 'k9', 'kRate', 'bbRate', 'ip', 'starts', 'source', 'throws', 'rating'],
    notes: 'position 用 SP 或 RP；throws 用 R 或 L。'
  },
  stadiums: {
    label: '球場',
    target: 'STADIUMS_DATA',
    columns: ['id', 'name', 'team', 'LF', 'CF', 'RF', 'fenceHeight', 'surface', 'altitude', 'hrFactor', 'windHelp', 'notes'],
    notes: '欲新增球場直接加一列，id 不能重複。fenceHeight 單位為公尺。'
  },
  coaches: {
    label: '教練卡池',
    target: 'COACHES_POOL',
    columns: ['id', 'name', 'roleType', 'rarity', 'specialty', 'xpBonus', 'statBonus', 'desc'],
    notes: 'rarity 為 SSR/SR/R；xpBonus、statBonus 用 JSON 格式 (例如 {"all":10})。'
  }
};


// 暴露給 window
if (typeof window !== 'undefined') {
  window.CPBL_BATTER_STATS_2025      = CPBL_BATTER_STATS_2025;
  window.CPBL_PITCHER_STATS_2025     = CPBL_PITCHER_STATS_2025;
  window.INTERNATIONAL_STAR_CANDIDATES = INTERNATIONAL_STAR_CANDIDATES;
  window.LEGENDARY_HERO_CANDIDATES   = LEGENDARY_HERO_CANDIDATES;
  window.COACHES_DATA                = COACHES_DATA;
  window.INITIAL_ROSTER_SPEC         = INITIAL_ROSTER_SPEC;
  // v1.18 新增
  window.STADIUMS_DATA               = STADIUMS_DATA;
  window.COACHES_POOL                = COACHES_POOL;
  window.PLAYER_BIOS                 = PLAYER_BIOS;
  window.TEAM_NAME                   = '政治大學棒球隊';
  window.TEAM_NICKNAME               = '政大棒球';
  window.GAME_TITLE                  = '政大棒球征服世界';
  window.HOME_STADIUM_ID             = 'nccu';
  // v2.11 新增
  window.WBC_NATIONAL_TEAMS          = WBC_NATIONAL_TEAMS;
  window.WBC_QUALIFICATION_RULES     = WBC_QUALIFICATION_RULES;
  window.STORYLINE_TEXTS             = STORYLINE_TEXTS;
  window.DATA_SCHEMAS                = DATA_SCHEMAS;
}
