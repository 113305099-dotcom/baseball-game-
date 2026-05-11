// =====================================================================
// data.js — 球員、能力、教練資料檔（v1.14 拆出獨立檔案）
// ---------------------------------------------------------------------
// 這個檔案放在 game.js 之前載入，所有資料會以 const 方式提供給遊戲使用。
//
// 你可以直接編輯這個檔案來：
//   - 新增 / 修改本地球員（CPBL_BATTER_STATS_2025 / CPBL_PITCHER_STATS_2025）
//   - 新增 / 修改國際巨星（INTERNATIONAL_STAR_CANDIDATES）
//   - 調整傳奇英雄（LEGENDARY_HERO_CANDIDATES，靠碎片商店兌換）
//   - 改變教練團（COACHES_DATA）
//   - 重新指定第七隊的初始陣容（INITIAL_ROSTER_SPEC）
//
// 修改後存檔，重新整理瀏覽器即可生效。
// 注意：欄位名稱要維持不變；遊戲讀的時候靠這些 key 對照能力值。
// =====================================================================


// ---------- 本地野手（CPBL 2025／2026 數據近似值） ----------
// 欄位說明：
//   name        中文名稱
//   team        所屬球隊
//   position    主守位（單位 C / 1B / 2B / 3B / SS / LF / CF / RF / OF / IF）
//               可以用 '/' 分隔多守位，例如 'OF/IF'
//   role        固定 'B'（野手）
//   avg/obp/slg/ops/opsPlus  打擊指標，越高越好
//   hr/sb       全壘打 / 盜壘次數
//   kRate/bbRate 三振率 / 保送率
//   errors      失誤次數（越多守備越扣分）
const CPBL_BATTER_STATS_2025 = [
  { name: '吳念庭',  team: '台鋼雄鷹', position: '2B/SS', role: 'B', avg: 0.328, obp: 0.400, slg: 0.407, ops: 0.807, opsPlus: 138, hr: 2,  sb: 5,  kRate: 11.94, bbRate: 10.88, errors: 4,  source: 'CPBL 2025' },
  { name: '林安可',  team: '統一7-ELEVEn獅', position: 'LF', role: 'B', avg: 0.318, obp: 0.397, slg: 0.603, ops: 1.000, opsPlus: 192, hr: 23, sb: 4,  kRate: 17.33, bbRate: 9.60,  errors: 1,  source: 'CPBL 2025' },
  { name: '陳晨威',  team: '樂天桃猿', position: 'CF', role: 'B', avg: 0.307, obp: 0.366, slg: 0.411, ops: 0.777, opsPlus: 129, hr: 4,  sb: 27, kRate: 11.27, bbRate: 8.56,  errors: 3,  source: 'CPBL 2025' },
  { name: '林泓育',  team: '樂天桃猿', position: 'C/DH', role: 'B', avg: 0.307, obp: 0.345, slg: 0.415, ops: 0.760, opsPlus: 124, hr: 9,  sb: 0,  kRate: 15.35, bbRate: 4.56,  errors: 2,  source: 'CPBL 2025' },
  { name: '魔鷹',    team: '台鋼雄鷹', position: '1B/RF', role: 'B', avg: 0.305, obp: 0.387, slg: 0.589, ops: 0.976, opsPlus: 185, hr: 25, sb: 0,  kRate: 15.71, bbRate: 8.90,  errors: 10, source: 'CPBL 2025' },
  { name: '李凱威',  team: '味全龍',   position: '2B/3B', role: 'B', avg: 0.300, obp: 0.388, slg: 0.338, ops: 0.726, opsPlus: 116, hr: 0,  sb: 28, kRate: 9.21,  bbRate: 11.13, errors: 8,  source: 'CPBL 2025' },
  { name: '朱育賢',  team: '味全龍',   position: '1B/LF', role: 'B', avg: 0.293, obp: 0.355, slg: 0.476, ops: 0.831, opsPlus: 144, hr: 15, sb: 2,  kRate: 22.13, bbRate: 7.47,  errors: 7,  source: 'CPBL 2025' },
  { name: '許基宏',  team: '中信兄弟', position: '1B',    role: 'B', avg: 0.292, obp: 0.390, slg: 0.525, ops: 0.915, opsPlus: 168, hr: 19, sb: 0,  kRate: 21.22, bbRate: 11.95, errors: 5,  source: 'CPBL 2025' },
  { name: '王博玄',  team: '台鋼雄鷹', position: 'CF',    role: 'B', avg: 0.284, obp: 0.348, slg: 0.351, ops: 0.699, opsPlus: 107, hr: 3,  sb: 21, kRate: 14.52, bbRate: 8.38,  errors: 11, source: 'CPBL 2025' },
  { name: '郭天信',  team: '味全龍',   position: 'CF/RF', role: 'B', avg: 0.280, obp: 0.334, slg: 0.351, ops: 0.685, opsPlus: 102, hr: 4,  sb: 17, kRate: 8.87,  bbRate: 6.19,  errors: 6,  source: 'CPBL 2025' },
  { name: '林佳緯',  team: '統一7-ELEVEn獅', position: 'RF', role: 'B', avg: 0.275, obp: 0.322, slg: 0.408, ops: 0.730, opsPlus: 114, hr: 6,  sb: 11, kRate: 15.46, bbRate: 5.62,  errors: 5,  source: 'CPBL 2025' },
  { name: '吉力吉撈．鞏冠', team: '味全龍', position: 'C', role: 'B', avg: 0.274, obp: 0.337, slg: 0.525, ops: 0.862, opsPlus: 152, hr: 24, sb: 4,  kRate: 17.64, bbRate: 6.41,  errors: 15, source: 'CPBL 2025' },
  { name: '曾子祐',  team: '台鋼雄鷹', position: 'SS',    role: 'B', avg: 0.273, obp: 0.319, slg: 0.323, ops: 0.642, opsPlus: 90,  hr: 0,  sb: 6,  kRate: 6.72,  bbRate: 6.52,  errors: 7,  source: 'CPBL 2025' },
  { name: '江坤宇',  team: '中信兄弟', position: 'SS',    role: 'B', avg: 0.272, obp: 0.357, slg: 0.317, ops: 0.674, opsPlus: 100, hr: 1,  sb: 7,  kRate: 11.21, bbRate: 7.03,  errors: 7,  source: 'CPBL 2025' },
  { name: '范國宸',  team: '富邦悍將', position: '1B',    role: 'B', avg: 0.275, obp: 0.334, slg: 0.453, ops: 0.787, opsPlus: 125, hr: 13, sb: 1,  kRate: 19.84, bbRate: 8.70,  errors: 2,  source: 'CPBL 2025' },
  { name: '張育成',  team: '富邦悍將', position: '3B',    role: 'B', avg: 0.356, obp: 0.435, slg: 0.603, ops: 1.038, opsPlus: 221, hr: 4,  sb: 3,  kRate: 14.12, bbRate: 11.76, errors: 3,  source: 'CPBL 2026 current' },
  // ---- v1.14 補充 ----
  { name: '王威晨',  team: '中信兄弟', position: '3B/2B', role: 'B', avg: 0.302, obp: 0.371, slg: 0.378, ops: 0.749, opsPlus: 120, hr: 2,  sb: 18, kRate: 10.10, bbRate: 9.20,  errors: 6,  source: 'CPBL 2024' },
  { name: '岳東華',  team: '中信兄弟', position: '2B/SS', role: 'B', avg: 0.290, obp: 0.354, slg: 0.398, ops: 0.752, opsPlus: 122, hr: 5,  sb: 9,  kRate: 12.40, bbRate: 8.20,  errors: 5,  source: 'CPBL 2024' },
  { name: '林立',    team: '樂天桃猿', position: 'CF/LF', role: 'B', avg: 0.318, obp: 0.380, slg: 0.471, ops: 0.851, opsPlus: 150, hr: 9,  sb: 15, kRate: 13.50, bbRate: 7.80,  errors: 4,  source: 'CPBL 2024' },
  { name: '林子偉',  team: '中信兄弟', position: 'SS/2B', role: 'B', avg: 0.281, obp: 0.355, slg: 0.402, ops: 0.757, opsPlus: 124, hr: 6,  sb: 12, kRate: 16.20, bbRate: 9.30,  errors: 5,  source: 'CPBL 2024' },
  { name: '林靖凱',  team: '統一7-ELEVEn獅', position: 'SS', role: 'B', avg: 0.286, obp: 0.358, slg: 0.395, ops: 0.753, opsPlus: 122, hr: 4,  sb: 22, kRate: 14.90, bbRate: 9.10, errors: 6,  source: 'CPBL 2024' },
  { name: '陳重羽',  team: '中信兄弟', position: 'CF',    role: 'B', avg: 0.295, obp: 0.348, slg: 0.412, ops: 0.760, opsPlus: 124, hr: 4,  sb: 13, kRate: 13.10, bbRate: 7.40,  errors: 4,  source: 'CPBL 2024' },
  { name: '蘇緯達',  team: '富邦悍將', position: 'LF/1B', role: 'B', avg: 0.284, obp: 0.344, slg: 0.466, ops: 0.810, opsPlus: 138, hr: 14, sb: 1,  kRate: 19.00, bbRate: 7.80,  errors: 4,  source: 'CPBL 2024' },
  { name: '張閔勛',  team: '中信兄弟', position: 'C',     role: 'B', avg: 0.270, obp: 0.330, slg: 0.388, ops: 0.718, opsPlus: 110, hr: 6,  sb: 0,  kRate: 16.50, bbRate: 7.60,  errors: 7,  source: 'CPBL 2024' },
  { name: '高國麟',  team: '樂天桃猿', position: '3B/1B', role: 'B', avg: 0.288, obp: 0.346, slg: 0.452, ops: 0.798, opsPlus: 132, hr: 12, sb: 3,  kRate: 18.20, bbRate: 7.20,  errors: 6,  source: 'CPBL 2024' },
  { name: '鄭浩均',  team: '富邦悍將', position: 'C/1B',  role: 'B', avg: 0.272, obp: 0.330, slg: 0.396, ops: 0.726, opsPlus: 112, hr: 8,  sb: 0,  kRate: 17.50, bbRate: 7.00,  errors: 8,  source: 'CPBL 2024' }
];


// ---------- 本地投手（CPBL 2025／2026 數據近似值） ----------
// position 欄位用來區分 'SP'（先發）或 'RP'（中繼／後援）
// 遊戲會根據此欄位設定 pitcherRole，影響球員的體力上限、登板頻率與恢復時間
const CPBL_PITCHER_STATS_2025 = [
  { name: '羅戈',     team: '中信兄弟', position: 'SP', role: 'P', era: 1.84, whip: 1.04, fip: 2.159, k9: 8.17, kRate: 22.83, bbRate: 5.63, ip: 156, starts: 25, source: 'CPBL 2025', throws: 'R' },
  { name: '後勁',     team: '台鋼雄鷹', position: 'SP', role: 'P', era: 1.89, whip: 1.14, fip: 2.840, k9: 6.44, kRate: 17.93, bbRate: 6.25, ip: 152, starts: 25, source: 'CPBL 2025', throws: 'R' },
  { name: '菲力士',   team: '統一7-ELEVEn獅', position: 'SP', role: 'P', era: 1.91, whip: 1.06, fip: 2.809, k9: 6.71, kRate: 18.85, bbRate: 6.75, ip: 127, starts: 21, source: 'CPBL 2025', throws: 'R' },
  { name: '威能帝',   team: '樂天桃猿', position: 'SP', role: 'P', era: 2.01, whip: 0.91, fip: 2.080, k9: 8.89, kRate: 25.34, bbRate: 4.83, ip: 170, starts: 26, source: 'CPBL 2025', throws: 'R' },
  { name: '艾速特',   team: '台鋼雄鷹', position: 'SP', role: 'P', era: 2.23, whip: 1.09, fip: 2.856, k9: 7.90, kRate: 21.99, bbRate: 5.32, ip: 141, starts: 25, source: 'CPBL 2025', throws: 'L' },
  { name: '魔神龍',   team: '樂天桃猿', position: 'SP', role: 'P', era: 2.51, whip: 1.08, fip: 2.934, k9: 5.58, kRate: 15.41, bbRate: 4.87, ip: 158, starts: 25, source: 'CPBL 2025', throws: 'R' },
  { name: '鋼龍',     team: '味全龍',   position: 'SP', role: 'P', era: 2.77, whip: 1.18, fip: 2.874, k9: 7.40, kRate: 19.93, bbRate: 6.64, ip: 146, starts: 24, source: 'CPBL 2025', throws: 'R' },
  { name: '魔力藍',   team: '富邦悍將', position: 'SP', role: 'P', era: 2.98, whip: 1.25, fip: 3.019, k9: 7.19, kRate: 19.04, bbRate: 7.55, ip: 139, starts: 23, source: 'CPBL 2025', throws: 'R' },
  { name: '布雷克',   team: '統一7-ELEVEn獅', position: 'SP', role: 'P', era: 4.13, whip: 1.31, fip: 3.030, k9: 6.57, kRate: 17.18, bbRate: 4.63, ip: 122, starts: 21, source: 'CPBL 2025', throws: 'R' },
  // ---- v1.14 補充先發 ----
  { name: '古林睿煬', team: '統一7-ELEVEn獅', position: 'SP', role: 'P', era: 2.65, whip: 1.10, fip: 2.950, k9: 8.30, kRate: 21.50, bbRate: 6.00, ip: 145, starts: 24, source: 'CPBL 2024', throws: 'R' },
  { name: '徐若熙',   team: '味全龍',   position: 'SP', role: 'P', era: 2.10, whip: 0.98, fip: 2.450, k9: 9.50, kRate: 26.10, bbRate: 5.20, ip: 130, starts: 22, source: 'CPBL 2024', throws: 'R' },
  { name: '江國豪',   team: '中信兄弟', position: 'SP', role: 'P', era: 3.40, whip: 1.28, fip: 3.350, k9: 7.10, kRate: 18.20, bbRate: 7.20, ip: 115, starts: 20, source: 'CPBL 2024', throws: 'R' },
  // ---- 本地後援 ----
  { name: '林詩翔',   team: '台鋼雄鷹', position: 'RP', role: 'P', era: 1.92, whip: 1.10, fip: 3.243, k9: 7.67, kRate: 21.05, bbRate: 8.33, ip: 56, starts: 0,  source: 'CPBL 2025', throws: 'R' },
  { name: '陳禹勳',   team: '樂天桃猿', position: 'RP', role: 'P', era: 2.55, whip: 1.16, fip: 3.180, k9: 8.50, kRate: 22.10, bbRate: 6.80, ip: 60, starts: 0,  source: 'CPBL 2024', throws: 'R' },
  { name: '黃子鵬',   team: '樂天桃猿', position: 'RP', role: 'P', era: 2.80, whip: 1.20, fip: 3.250, k9: 7.20, kRate: 19.40, bbRate: 6.50, ip: 55, starts: 0,  source: 'CPBL 2024', throws: 'R' },
  { name: '翁瑋均',   team: '中信兄弟', position: 'RP', role: 'P', era: 3.10, whip: 1.30, fip: 3.500, k9: 7.80, kRate: 20.20, bbRate: 8.30, ip: 50, starts: 0,  source: 'CPBL 2024', throws: 'R' },
  { name: '王玉譜',   team: '中信兄弟', position: 'RP', role: 'P', era: 2.65, whip: 1.18, fip: 3.300, k9: 8.10, kRate: 21.00, bbRate: 7.20, ip: 52, starts: 0,  source: 'CPBL 2024', throws: 'L' },
  { name: '宋家豪',   team: '富邦悍將', position: 'RP', role: 'P', era: 2.40, whip: 1.10, fip: 3.000, k9: 9.20, kRate: 24.50, bbRate: 6.40, ip: 58, starts: 0,  source: 'CPBL 2024', throws: 'R' },
  { name: '黃恩賜',   team: '富邦悍將', position: 'RP', role: 'P', era: 3.30, whip: 1.32, fip: 3.600, k9: 6.90, kRate: 18.80, bbRate: 9.10, ip: 48, starts: 0,  source: 'CPBL 2024', throws: 'R' },
  { name: '陳柏清',   team: '味全龍',   position: 'RP', role: 'P', era: 2.90, whip: 1.25, fip: 3.400, k9: 7.50, kRate: 19.80, bbRate: 7.50, ip: 54, starts: 0,  source: 'CPBL 2024', throws: 'L' }
];


// ---------- 國際巨星（抽卡用） ----------
// abilities 內的數值會直接套用到球員（不再經過數據反推），所以可以自由調整。
// physical 是用來給雷達圖與舊版體力／力量計算使用，跟 abilities 保持一致就好。
const INTERNATIONAL_STAR_CANDIDATES = [
  { name: '亞倫・賈吉',   englishName: 'Aaron Judge',           nickname: '法官',     role: 'B', position: 'RF',    team: 'MLB', bats: 'R', throws: 'R',
    abilities: { contact: 84, power: 99, speed: 64, fielding: 83, arm: 94, discipline: 92, clutch: 90 },
    physical:  { velocity: 94, power: 99, control: 84, speed: 64 },
    traits: ['力量打者', '紀律性'] },
  { name: '大谷翔平',     englishName: 'Shohei Ohtani',         nickname: '二刀流神獸', role: 'T', position: 'SP/DH', team: 'MLB', bats: 'L', throws: 'R',
    abilities: { contact: 86, power: 99, speed: 88, fielding: 72, arm: 98, discipline: 84, clutch: 93, velocity: 99, control: 83, breaking: 94, stamina: 89 },
    physical:  { velocity: 99, power: 99, control: 86, speed: 88 },
    traits: ['傳奇打者', '精英投手'] },
  { name: '穆奇・貝茲',   englishName: 'Mookie Betts',          nickname: '全能保齡球王', role: 'B', position: 'RF/2B', team: 'MLB', bats: 'R', throws: 'R',
    abilities: { contact: 88, power: 83, speed: 84, fielding: 95, arm: 87, discipline: 90, clutch: 87 },
    physical:  { velocity: 87, power: 83, control: 88, speed: 84 },
    traits: ['紀律性', '守備職人'] },
  { name: '胡安・索托',   englishName: 'Juan Soto',             nickname: '保送魔王', role: 'B', position: 'LF',    team: 'MLB', bats: 'L', throws: 'L',
    abilities: { contact: 90, power: 94, speed: 58, fielding: 68, arm: 76, discipline: 99, clutch: 91 },
    physical:  { velocity: 76, power: 94, control: 90, speed: 58 },
    traits: ['力量打者', '紀律性', '選球眼'] },
  { name: '小葛雷諾',     englishName: 'Vladimir Guerrero Jr.', nickname: '暴力甜甜圈', role: 'B', position: '1B',  team: 'MLB', bats: 'R', throws: 'R',
    abilities: { contact: 87, power: 93, speed: 52, fielding: 72, arm: 78, discipline: 80, clutch: 84 },
    physical:  { velocity: 78, power: 93, control: 87, speed: 52 },
    traits: ['力量打者'] },
  { name: '達比修有',     englishName: 'Yu Darvish',            nickname: '混球博士', role: 'P', position: 'SP',    team: 'MLB', bats: 'R', throws: 'R',
    abilities: { velocity: 88, control: 87, breaking: 96, stamina: 80, fielding: 77, discipline: 74 },
    physical:  { velocity: 88, power: 50, control: 87, speed: 60 },
    traits: ['精英投手'] },
  { name: '山本由伸',     englishName: 'Yoshinobu Yamamoto',    nickname: '山本總舵主', role: 'P', position: 'SP',  team: 'MLB', bats: 'R', throws: 'R',
    abilities: { velocity: 92, control: 93, breaking: 95, stamina: 88, fielding: 80, discipline: 76 },
    physical:  { velocity: 92, power: 48, control: 93, speed: 63 },
    traits: ['精英投手', '王牌'] },
  { name: '佐佐木朗希',   englishName: 'Roki Sasaki',           nickname: '令和怪物', role: 'P', position: 'SP',    team: 'MLB', bats: 'R', throws: 'R',
    abilities: { velocity: 99, control: 78, breaking: 92, stamina: 76, fielding: 74, discipline: 70 },
    physical:  { velocity: 99, power: 45, control: 78, speed: 66 },
    traits: ['精英投手'] },
  { name: '吉田正尚',     englishName: 'Masataka Yoshida',      nickname: '肌肉吉田', role: 'B', position: 'LF/DH', team: 'MLB', bats: 'L', throws: 'R',
    abilities: { contact: 88, power: 78, speed: 58, fielding: 65, arm: 70, discipline: 87, clutch: 85 },
    physical:  { velocity: 70, power: 78, control: 88, speed: 58 },
    traits: ['關鍵時刻打者'] },
  // ---- v1.14 新增 ----
  { name: '羅納德・艾庫尼亞 Jr.', englishName: 'Ronald Acuña Jr.', nickname: '颶風小子', role: 'B', position: 'RF', team: 'MLB', bats: 'R', throws: 'R',
    abilities: { contact: 89, power: 92, speed: 95, fielding: 84, arm: 90, discipline: 82, clutch: 89 },
    physical:  { velocity: 90, power: 92, control: 89, speed: 95 },
    traits: ['力量打者', '盜壘好手'] },
  { name: '法蘭西斯科・林多', englishName: 'Francisco Lindor', nickname: '微笑游擊', role: 'B', position: 'SS',    team: 'MLB', bats: 'B', throws: 'R',
    abilities: { contact: 85, power: 84, speed: 82, fielding: 94, arm: 90, discipline: 84, clutch: 86 },
    physical:  { velocity: 90, power: 84, control: 85, speed: 82 },
    traits: ['守備職人', '對左強'] },
  { name: '科比・布萊森', englishName: 'Corbin Burnes',         nickname: '滑球之王', role: 'P', position: 'SP',    team: 'MLB', bats: 'R', throws: 'R',
    abilities: { velocity: 90, control: 91, breaking: 95, stamina: 87, fielding: 78, discipline: 76 },
    physical:  { velocity: 90, power: 48, control: 91, speed: 60 },
    traits: ['精英投手', '滾地球投手'] },
  { name: '達文・威廉斯',   englishName: 'Devin Williams',       nickname: '空氣斷氣',  role: 'P', position: 'RP',    team: 'MLB', bats: 'R', throws: 'R',
    abilities: { velocity: 91, control: 85, breaking: 96, stamina: 60, fielding: 75, discipline: 74 },
    physical:  { velocity: 91, power: 45, control: 85, speed: 58 },
    traits: ['精英投手', '王牌'] },
  { name: '艾梅特・西恩',   englishName: 'Emmet Sheehan',        nickname: '加州黑魔',  role: 'P', position: 'SP',    team: 'MLB', bats: 'R', throws: 'R',
    abilities: { velocity: 88, control: 80, breaking: 86, stamina: 78, fielding: 72, discipline: 72 },
    physical:  { velocity: 88, power: 45, control: 80, speed: 58 },
    traits: ['精英投手'] },
  { name: '鈴木一朗 II',  englishName: 'Ichiro II',             nickname: '小一朗',   role: 'B', position: 'CF',    team: 'NPB', bats: 'L', throws: 'R',
    abilities: { contact: 96, power: 62, speed: 92, fielding: 92, arm: 90, discipline: 88, clutch: 80 },
    physical:  { velocity: 90, power: 62, control: 96, speed: 92 },
    traits: ['紀律性', '盜壘好手', '守備職人'] },
  { name: '李正厚',       englishName: 'Jung Hoo Lee',           nickname: '草地騎士', role: 'B', position: 'CF',    team: 'MLB', bats: 'L', throws: 'L',
    abilities: { contact: 90, power: 70, speed: 85, fielding: 88, arm: 80, discipline: 87, clutch: 84 },
    physical:  { velocity: 80, power: 70, control: 90, speed: 85 },
    traits: ['紀律性', '關鍵時刻打者'] },
  { name: '布萊斯・哈波', englishName: 'Bryce Harper',           nickname: '鬼神超人', role: 'B', position: '1B/RF', team: 'MLB', bats: 'L', throws: 'R',
    abilities: { contact: 84, power: 92, speed: 70, fielding: 78, arm: 85, discipline: 88, clutch: 88 },
    physical:  { velocity: 85, power: 92, control: 84, speed: 70 },
    traits: ['力量打者', '關鍵時刻打者'] },
  { name: '城福斯特',     englishName: 'Castle Forster',         nickname: '城牆鎖門', role: 'P', position: 'RP',    team: 'MLB', bats: 'R', throws: 'R',
    abilities: { velocity: 95, control: 78, breaking: 86, stamina: 55, fielding: 72, discipline: 70 },
    physical:  { velocity: 95, power: 45, control: 78, speed: 58 },
    traits: ['精英投手'] }
];


// ---------- 傳奇英雄（碎片商店兌換） ----------
// 抽到重複球員會獲得碎片，達到指定數量即可在擴張中心的「碎片商店」兌換
// 這些英雄是遊戲原創的虛構角色，能力值刻意做高
const LEGENDARY_HERO_CANDIDATES = [
  { name: '雷霆・歐文',   nickname: '雷神之槌', shardCost: 30, role: 'B', position: 'RF',    team: '傳奇隊', bats: 'R', throws: 'R',
    abilities: { contact: 92, power: 99, speed: 80, fielding: 88, arm: 96, discipline: 90, clutch: 95 },
    physical:  { velocity: 96, power: 99, control: 92, speed: 80 },
    traits: ['傳奇打者', '力量打者', '怪力', '大心臟'] },
  { name: '冰刃・桐生',   nickname: '無聲狙擊', shardCost: 28, role: 'P', position: 'SP',    team: '傳奇隊', bats: 'R', throws: 'L',
    abilities: { velocity: 95, control: 96, breaking: 98, stamina: 95, fielding: 84, discipline: 90 },
    physical:  { velocity: 95, power: 50, control: 96, speed: 65 },
    traits: ['精英投手', '王牌', '滾地球投手'] },
  { name: '光速・赤羽',   nickname: '逆風奔馳', shardCost: 25, role: 'B', position: 'CF',    team: '傳奇隊', bats: 'B', throws: 'R',
    abilities: { contact: 95, power: 70, speed: 99, fielding: 97, arm: 92, discipline: 92, clutch: 88 },
    physical:  { velocity: 92, power: 70, control: 95, speed: 99 },
    traits: ['紀律性', '盜壘好手', '守備職人'] },
  { name: '岩壁・大門',   nickname: '人形萬里長城', shardCost: 22, role: 'B', position: 'C', team: '傳奇隊', bats: 'R', throws: 'R',
    abilities: { contact: 88, power: 95, speed: 50, fielding: 99, arm: 99, discipline: 86, clutch: 91 },
    physical:  { velocity: 99, power: 95, control: 88, speed: 50 },
    traits: ['守備職人', '大心臟', '怪力'] },
  { name: '迷霧・霧島',   nickname: '七色魔球', shardCost: 30, role: 'P', position: 'SP',    team: '傳奇隊', bats: 'L', throws: 'R',
    abilities: { velocity: 88, control: 99, breaking: 99, stamina: 92, fielding: 86, discipline: 95 },
    physical:  { velocity: 88, power: 48, control: 99, speed: 65 },
    traits: ['精英投手', '王牌'] },
  { name: '黃金・羅倫斯', nickname: '黃金球棒', shardCost: 26, role: 'B', position: '3B/1B', team: '傳奇隊', bats: 'L', throws: 'R',
    abilities: { contact: 93, power: 96, speed: 65, fielding: 86, arm: 90, discipline: 88, clutch: 94 },
    physical:  { velocity: 90, power: 96, control: 93, speed: 65 },
    traits: ['傳奇打者', '力量打者', '低球打'] },
  { name: '閃電・伊澤',   nickname: '雙刀流再臨', shardCost: 40, role: 'T', position: 'SP/CF', team: '傳奇隊', bats: 'L', throws: 'R',
    abilities: { contact: 94, power: 96, speed: 90, fielding: 88, arm: 95, discipline: 88, clutch: 92, velocity: 96, control: 90, breaking: 92, stamina: 90 },
    physical:  { velocity: 96, power: 96, control: 94, speed: 90 },
    traits: ['傳奇打者', '精英投手', '王牌'] },
  { name: '鋼鐵・卡爾森', nickname: '深夜終結者', shardCost: 18, role: 'P', position: 'RP',  team: '傳奇隊', bats: 'R', throws: 'R',
    abilities: { velocity: 99, control: 88, breaking: 92, stamina: 70, fielding: 80, discipline: 82 },
    physical:  { velocity: 99, power: 50, control: 88, speed: 62 },
    traits: ['精英投手', '王牌'] }
];


// ---------- 教練團 ----------
// id 不要重複，遊戲靠它識別當前任命的教練
// bonus 是顯示用文字；後面的 hitting / pitching / defense / recovery / heat
// 才是真正觸發到遊戲計算的加成數值
const COACHES_DATA = [
  { id: 'hitting',      name: '打擊教練', bonus: '巧打/長打 +2',         hitting: 2,  heat: 0 },
  { id: 'pitching',     name: '投手教練', bonus: '控球/球威 +2',         pitching: 2, heat: 0 },
  { id: 'defense',      name: '守備教練', bonus: '守備 +3',              defense: 3,  heat: 0 },
  { id: 'conditioning', name: '體能教練', bonus: '恢復力 +6，傷病風險下降', recovery: 6, heat: 0 },
  { id: 'marketing',    name: '人氣教練', bonus: '球場熱度 +8',          heat: 8 }
];


// ---------- 第七隊初始陣容 ----------
// fielders：九守備位置一定要齊全（要列入一軍打線的野手）
// bench：候補野手（也會直接在一軍，但不會自動排進先發打線）
// rotation：5 位先發投手（依序輪值）
// bullpen：5 位後援投手
//
// 名字必須和 CPBL_BATTER_STATS_2025 / CPBL_PITCHER_STATS_2025 裡寫的完全一樣
// 如果名字找不到，遊戲會自動從同位置補一位
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


// 暴露給 window，game.js 載入時可直接引用
if (typeof window !== 'undefined') {
  window.CPBL_BATTER_STATS_2025      = CPBL_BATTER_STATS_2025;
  window.CPBL_PITCHER_STATS_2025     = CPBL_PITCHER_STATS_2025;
  window.INTERNATIONAL_STAR_CANDIDATES = INTERNATIONAL_STAR_CANDIDATES;
  window.LEGENDARY_HERO_CANDIDATES   = LEGENDARY_HERO_CANDIDATES;
  window.COACHES_DATA                = COACHES_DATA;
  window.INITIAL_ROSTER_SPEC         = INITIAL_ROSTER_SPEC;
}
