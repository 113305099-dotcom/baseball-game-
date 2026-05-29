# 政大棒球征服世界 — UI 與美術設計交接文件 v1.1
> 建立日期：2026-05-18  
> 目的：讓下一個 AI 無縫接軌，不需要重新解釋背景，直接從這裡繼續工作。

---

## 一、專案位置與入口

| 項目 | 路徑 |
|------|------|
| 遊戲根目錄 | `C:\Users\user\Documents\Codex\2026-05-11\files-mentioned-by-the-user-game-2\` |
| 入口 | `index.html` |
| 遊戲版本 | v3.17 |
| 美術設計文件 | `art-assets\sprite-generation-prompts.md`（v3，本次工作的主文件） |

---

## 二、引擎架構速覽（不需深讀，備查用）

```
pitch-engine.js
  → pitch-result-applier.js
    → fielding-engine.js
      → baserunning-engine.js
        → in-play-result-applier.js

battle-scene.js        ← Canvas 動畫層（目前全用程式碼畫矩形）
game-renderer.js       ← HTML UI 渲染
player-appearance.js   ← 球員外觀參數（膚色/眼型/鬍子等，供程式繪圖用）
data.js                ← 球員統計數據、球隊資料
```

**關鍵 Hook（sprite 接入點）：**
```javascript
window.GameAnimationAssets.drawFielder(ctx, actor)
```
目前保留但未使用。當 PNG sprite 生成完成後，在 `battle-scene.js` 接入此函式取代程式繪圖。

---

## 三、美術現況總覽

### 3.1 唯一認可的目標風格

`art-assets\ui\` 中的三張圖是**唯一目標風格來源**，所有美術決策以這三張為準：

| 檔案 | 用途 |
|------|------|
| `ui_batting_offense_concept_v1.png` | 投打近景 UI（打者視角） |
| `ui_pitching_defense_approved_v1.png` | 投球 UI（投手視角） |
| `ui_fielding_overview_approved_v1.png` | 守備俯視 UI |

風格：**パワプロ（Power Pro Baseball）Q版 chibi 像素風**
- 大圓頭、小身體（頭身比約 1:1.5）
- 清晰黑色外框，硬像素邊緣，無抗鋸齒
- 夜景球場（投打近景）/ 日景俯視（守備）

### 3.2 不使用的素材（已確認不符風格）

| 路徑 | 狀態 |
|------|------|
| `art-assets\production\backgrounds\` | 不是目標風格，不使用 |
| `art-assets\production\characters\chibi-baseball-sprite-style-sheet.png` | 不是目標風格 |
| `art-assets\production\portraits\pixel\` | 已有全 43 人的像素頭像，但風格不同，**不用於 battle-scene** |
| `art-assets\production\portraits\redrawn\` | 同上，不使用 |
| `art-assets\batch-007-early-2000s-pc-pixel-baseball\` | 早期嘗試，不使用 |

### 3.3 可用的素材

| 路徑 | 內容 |
|------|------|
| `art-assets\production\portraits\source\p001.jpg ~ p043.jpg` | **43 位球員的真實照片**，用作 AI 生成臉部參考 |
| `C:\Users\user\.codex\generated_images\019e3910-d05b-77f0-bbf4-6888657fb5f2\` | **吳念庭 sprite 成品**（2 張 PNG），是目前唯一完成的 battle sprite |
| `C:\Users\user\Downloads\zrZe6I-i1j8.gif` | 風格基準 A（PIXEL ANIMATION 高品質 chibi） |
| `C:\Users\user\Downloads\images.jpg` | 風格基準 B（chibi 像素角色組） |
| `C:\Users\user\OneDrive\圖片\螢幕擷取畫面\螢幕擷取畫面 2026-05-18 110113.png` | 風格基準 C（棒球像素人物正面站姿） |

---

## 四、Sprite 生成規格（最終確認版）

### 4.1 姿勢規則

**所有 sprite 正面朝向鏡頭（front-facing）。**

遊戲邏輯：
- 打者軀幹垂直於投手丘↔本壘連線，從側邊攝影機視角看 → 正面朝鏡頭
- 投手面向本壘方向 → 同樣正面朝鏡頭
- 兩人互相面對，但對遊戲攝影機都是正面

| 角色 | 姿勢描述 |
|------|---------|
| 右打者（待機） | 正面站，球棒斜舉右肩，頭盔護蓋在**左耳** |
| 左打者（待機） | 正面站，球棒斜舉左肩，頭盔護蓋在**右耳** |
| 右投手（待投） | 正面站，手套在**左手**，舉在胸前 |
| 左投手（待投） | 正面站，手套在**右手**，舉在胸前 |

### 4.2 左打球員（10人）

p001 吳念庭、p002 林安可、p007 朱育賢、p008 許基宏、p009 王博玄、p010 郭天信、p017 王威晨、p018 岳東華、p020 林子偉、p023 蘇緯達

### 4.3 左投球員（3人）

p030 艾速特（Eric Stout）、p033 魔力藍（Shawn Morimando）、p043 陳柏清

### 4.4 特殊外觀球員（必須注意）

| 球員 | ID | 特殊特徵 |
|------|----|---------|
| 魔鷹 | p005 | 201cm/117kg，全隊最巨，Q版也要明顯高大 |
| 布雷克 | p034 | 203cm/113kg，幾乎與魔鷹同等巨大，非瘦高型 |
| 吉力吉撈鞏冠 | p012 | 帽沿兩側綁彩色珠子細辮，最關鍵識別特徵 |
| 張育成 | p016 | 帽沿垂出 dreadlocks 細編辮 |
| 鋼龍（Drew Gagnon） | p032 | 超濃密紅橘色大鬍子（最大特徵） |
| 艾速特（Eric Stout） | p030 | 濃密深棕色大鬍子（full beard） |
| 林立 | p019 | 左鼻翼有小鼻釘（必須可見） |
| 陳禹勳 | p039 | 鼻翼旁臉頰有黑痣（必須可見） |
| 古林睿煬/徐若熙/翁瑋均/黃恩賜 | p035/036/041/042 | 帽下垂出長髮（到肩） |
| 蘇緯達 | p023 | 長髮＋壯碩圓潤（左打） |
| 黃恩賜 | p042 | 長髮＋185cm/110kg 圓潤壯碩 |

---

## 五、ChatGPT Sprite 生成工作流程

### 5.1 開始新對話時的設定

**每次對話上傳（只需一次）：**
1. `C:\Users\user\Downloads\zrZe6I-i1j8.gif`（風格基準 A）
2. `C:\Users\user\Downloads\images.jpg`（風格基準 B）
3. `C:\Users\user\OneDrive\圖片\螢幕擷取畫面\螢幕擷取畫面 2026-05-18 110113.png`（風格基準 C，棒球正面人物）

**貼上首次設定指令：**
```
我要生成棒球遊戲的像素藝術角色 sprite。
風格目標：Q版 chibi 比例、大圓頭小身體、
清晰黑色外框像素線條、硬像素邊緣（無抗鋸齒）、透明背景。
品質參考：如附上的 PIXEL ANIMATION 範例圖（高品質 chibi 像素角色）。

每次我會上傳：① 真實球員照片（臉部外觀參考）
請根據照片的臉部特徵（臉型、眼睛大小、膚色、鬍子、配件等），
生成符合以下規格的 sprite。

重要姿勢規則：
- 所有角色「正面朝向鏡頭」（front-facing）
- 打者：正面站姿，打擊頭盔，球棒斜舉於肩上（右打在右肩，左打在左肩）
- 投手：正面站姿，球帽（非頭盔），手套舉在胸前
- 左投手手套在右手；右投手手套在左手
```

### 5.2 每位球員的生成步驟

1. 上傳 `art-assets\production\portraits\source\pXXX.jpg`（球員照片）
2. 貼上 `art-assets\sprite-generation-prompts.md` 中對應球員的指令
3. 儲存結果，命名：`pXXX_姓名_ready.png`

### 5.3 吳念庭（p001）的特殊狀態

吳念庭 sprite **已有成品**，但需修正後再當作風格基準：

**問題：** 身體角度偏 3/4 側面，非完全正面  
**修正指令（上傳現有 sprite + 三張風格參考圖後貼）：**

```
Refine this existing pixel art baseball sprite.

KEEP: face design, navy blue #14 uniform, chibi proportions, transparent background.

CHANGE:
1. Body: Rotate to face viewer DIRECTLY (full front-facing, eliminate the 3/4 angle)
2. Pixel style: Harder pixel edges, flat shading like the PIXEL ANIMATION reference — reduce smooth gradients
3. Left-handed stance: He bats LEFT-HANDED. Bat raised over LEFT shoulder (bat tilts from right-to-upper-left from our view). Helmet ear guard on RIGHT ear.

Output: transparent background, same size, hard pixel art style.
```

修正完成後，**新的吳念庭 sprite 成為其餘 42 位球員的風格基準**。

---

## 六、外籍球員英文本名對照

| 中文暱稱 | 英文本名 | 國籍 | 身材 | 特徵 |
|---------|---------|------|------|------|
| 魔鷹 | Steven Moya | 多明尼加 | 201cm/117kg | 山羊鬍＋鬍渣，耳釘，項鍊 |
| 羅戈 | Nivaldo Rodríguez | 委內瑞拉 | 185cm/97kg | 全臉鬍渣，脖子刺青 |
| 後勁 | Bradin Hagens | 美國 | 190cm/95kg | 紅棕色鬍渣，藍灰眼睛，多條項鍊 |
| 威能帝 | Pedro Fernández | 多明尼加 | 183cm/79kg | 山羊鬍，偏精瘦（非壯碩） |
| 艾速特 | Eric Stout | 美國 | 190cm/92kg | 濃密深棕大鬍子（full beard），**左投** |
| 魔神龍 | Marcelo Martínez | 墨西哥 | 188cm/98kg | 全臉黑色大鬍子，項鍊 |
| 鋼龍 | Drew Gagnon | 美國 | 193cm/97kg | 超濃密**紅橘色**大鬍子（最大特徵） |
| 魔力藍 | Shawn Morimando | 美國 | 185cm/92kg | 整齊黑鬍子，親切笑容，**左投** |
| 布雷克 | Brock Dykxhoorn | 加拿大 | 203cm/113kg | 無鬍或短鬍，**極高大壯碩**（非瘦型） |

---

## 七、程式碼需要的後續工作（Sprite 生成完後）

當 PNG sprite 全部生成完畢，Claude Code 需要做以下修改：

### 7.1 修改 `battle-scene.js`

**目標：** 把 `drawBatter()` 和 `drawPitcher()` 函式從程式碼繪圖改成 `ctx.drawImage()` 載入 PNG。

**接入點：**
```javascript
// 目前
function drawBatter(ctx, x, y, scale, opts) {
  // ... 大量 rect() 程式碼
}

// 改成
function drawBatter(ctx, x, y, scale, opts) {
  const sprite = GameAnimationAssets.getBatterSprite(opts.name, opts.phase);
  if (sprite) {
    ctx.drawImage(sprite, x, y, spriteW * scale, spriteH * scale);
    return;
  }
  // fallback: 原本的 rect() 繪圖
}
```

### 7.2 建立 `sprite-loader.js`

新建一個檔案，負責：
1. 預載入所有 43 位球員的 sprite PNG
2. 提供 `getBatterSprite(name, phase)` 和 `getPitcherSprite(name, phase)` 函式
3. 掛載到 `window.GameAnimationAssets`
4. 在 `index.html` 中於 `battle-scene.js` 之前載入

### 7.3 修改 `index.html`

加入 sprite-loader.js：
```html
<script src="player-appearance.js"></script>
<script src="sprite-loader.js"></script>   <!-- 新增 -->
<script src="battle-scene.js"></script>
```

---

## 八、目前進度總覽

| 工作項目 | 狀態 |
|---------|------|
| 43 位球員 sprite 生成指令 | ✅ 完成（`sprite-generation-prompts.md` v3） |
| 球員身高體重資料 | ✅ 全部完成 |
| 外籍球員英文本名 | ✅ 全部確認 |
| 左打/左投確認 | ✅ 完成 |
| `player-appearance.js` | ✅ 已建立（林安可/朱育賢/許基宏 左打已修正） |
| 吳念庭 sprite | ⚠️ 已生成，**需修正** 為全正面朝鏡頭後作為風格基準 |
| p002–p043 sprite 生成 | ❌ 未開始（等吳念庭修正版確認後批量生成） |
| battle-scene.js 接入 PNG | ❌ 未開始（等 sprite 完成） |
| 投打近景背景 PNG | ❌ 未開始 |
| 守備俯視背景 PNG | ❌ 未開始 |

---

## 九、注意事項（給下一個 AI）

1. **不要修改遊戲引擎邏輯**（pitch-engine.js 等），這次工作只涉及美術層
2. **不要使用** `art-assets\production\` 中的舊素材（背景/人物已確認不是目標風格）
3. `player-appearance.js` 目前控制程式碼繪圖的外觀，sprite 接入後會逐漸被取代，但不要刪除（保留 fallback）
4. 所有打擊/投球 sprite 都是**正面朝鏡頭**，不是側面
5. 左打者球棒在**左肩**（從觀看者角度），頭盔護蓋在**右耳**
6. 左投手手套在**右手**（從觀看者角度）
7. 第一優先任務：讓使用者先修正吳念庭 sprite → 確認風格後才開始生成其他人
