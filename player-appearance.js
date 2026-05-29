/**
 * player-appearance.js
 *
 * 每位球員的外觀參數。
 * 從球員照片萃取特徵，對應到 battle-scene.js 的繪圖參數。
 *
 * 參數說明：
 *   skinColor   膚色（hex）
 *   skinShade   膚色陰影（hex）
 *   eyeHeight   眼睛高度：1=細長單眼皮  2=一般  3=大眼
 *   hasBrow     粗眉毛：true/false
 *   bodyWidth   體型寬度：0.8=精實  1.0=一般  1.2=壯碩
 *   legLength   腿長比例：0.9=矮  1.0=一般  1.1=高挑
 *   faceShape   臉型：'oval'=瓜子臉  'round'=圓臉  'square'=方臉
 *   glasses     眼鏡：false  'round'  'rect'
 *   beard       鬍子：null  'stubble'  'goatee'
 *   batArm      打擊慣用手：'left' / 'right'
 *   throwArm    投球慣用手：'left' / 'right'
 */

/* ─── 膚色預設值 ──────────────────────────────────── */
const SKIN = {
  light:  { color: '#f0c8a0', shade: '#c09070' },
  medium: { color: '#e0a880', shade: '#a07050' }, // 預設
  tan:    { color: '#c89060', shade: '#906040' },
  dark:   { color: '#a87048', shade: '#785030' },
};

/* ─── 球員外觀資料庫 ─────────────────────────────── */
const PLAYER_APPEARANCE_DATA = {

  /* ═══════ 已完成分析 ═══════ */

  '吳念庭': {
    ...SKIN.tan,
    eyeHeight: 1,      // 細長單眼皮
    hasBrow:   false,
    bodyWidth: 0.88,   // 精實外野手身材
    legLength: 1.08,   // 高挑
    faceShape: 'oval',
    glasses:   false,
    beard:     null,
    batArm:    'left',
    throwArm:  'right',
  },

  '林安可': {
    ...SKIN.medium,
    eyeHeight: 2,
    hasBrow:   false,
    bodyWidth: 1.1,
    legLength: 1.05,
    faceShape: 'oval',
    glasses:   false,
    beard:     null,
    batArm:    'left',
    throwArm:  'left',
  },

  '朱育賢': {
    ...SKIN.medium,
    eyeHeight: 2,
    hasBrow:   false,
    bodyWidth: 1.2,
    legLength: 1.08,
    faceShape: 'round',
    glasses:   false,
    beard:     null,
    batArm:    'left',
    throwArm:  'left',
  },

  '許基宏': {
    ...SKIN.medium,
    eyeHeight: 1,
    hasBrow:   false,
    bodyWidth: 1.15,
    legLength: 1.0,
    faceShape: 'round',
    glasses:   false,
    beard:     null,
    batArm:    'left',
    throwArm:  'right',
  },

  '陳晨威': {
    ...SKIN.tan,
    eyeHeight: 2,
    hasBrow:   true,   // 濃眉
    bodyWidth: 1.0,
    legLength: 1.0,
    faceShape: 'square',
    glasses:   false,
    beard:     'stubble',
    batArm:    'right',
    throwArm:  'right',
  },

  /* ═══════ 其餘球員使用公版預設 ═══════ */
  // 待照片分析後逐步填入
};

/* ─── 公版預設外觀 ────────────────────────────────── */
const DEFAULT_APPEARANCE = {
  ...SKIN.medium,
  eyeHeight: 2,
  hasBrow:   false,
  bodyWidth: 1.0,
  legLength: 1.0,
  faceShape: 'oval',
  glasses:   false,
  beard:     null,
  batArm:    'right',
  throwArm:  'right',
};

/* ─── 查詢函式 ────────────────────────────────────── */
function getPlayerAppearance(name) {
  return Object.assign({}, DEFAULT_APPEARANCE, PLAYER_APPEARANCE_DATA[name] || {});
}

/* ─── 匯出 ────────────────────────────────────────── */
if (typeof window !== 'undefined') {
  window.getPlayerAppearance = getPlayerAppearance;
  window.PLAYER_APPEARANCE_DATA = PLAYER_APPEARANCE_DATA;
}
if (typeof module !== 'undefined') {
  module.exports = { getPlayerAppearance, PLAYER_APPEARANCE_DATA, DEFAULT_APPEARANCE };
}
