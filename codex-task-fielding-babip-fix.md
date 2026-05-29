# Codex 任務：修復守備引擎反轉 BABIP bug

## 任務目標

修正 `fielding-engine.js` 中的幾何設計問題，讓「強打者拿到合理 BABIP（~.30-.35）、弱打者拿到合理 BABIP（~.25-.28）」，而不是目前的反轉狀態。

修完後跑 `tools/sim-tester.html` 驗證指標，並把改動寫入 `投打對決修正書v1.1.md` §10。

---

## 專案背景（你不需要讀全部，但要知道存在）

這是一個 CPBL 棒球管理遊戲（純 JS、瀏覽器原生）。專案根目錄是 `files-mentioned-by-the-user-game-2/`。

### 與本任務相關的引擎模組
1. `pitch-engine.js` — 投打對決物理核心（輸出 ev、launchAngle、sprayAngle 等進場球資料）
2. `baseball-physics-engine.js` — 純物理計算（球路、距離、hangTime）
3. **`fielding-engine.js`** — 守備判定（這次主要要動的檔案）
4. `baserunning-engine.js` — 跑壘判定（不要動）

### 測試工具
- `tools/sim-tester.html` — 瀏覽器工具，跑 99 位 CPBL 真實打者 × 每人 300 PA vs 中位投手，匯出 CSV
- `tools/smoke-test-engines.js` — 基本煙霧測試

### 規則書（重要）
- `投打對決修正書v1.1.md` §9 詳述了 BABIP 反轉 bug 的診斷過程跟根因，**請先讀完 §9 再開始**

---

## 問題敘述（必讀）

### 現象
sim-tester 跑出來的個別打者 BABIP 跟現實**完全反轉**：

| 球員 | abilities | real AVG | sim AVG | sim BABIP |
|---|---|---:|---:|---:|
| 張育成 | contact=73, power=82 | .299 | .204 | **.225** ⚠️ 太低 |
| 林安可 | contact=71, power=82 | .291 | .189 | **.219** ⚠️ 太低 |
| 林泓弦 | contact=45, power=46 | .207 | .301 | **.383** ⚠️ 太高 |
| 許哲晏 | contact=48, power=59 | .230 | .306 | **.400** ⚠️ 太高 |

整體 BABIP 平均 .345 看似可接受，是強弱兩端互相抵消的結果。AVG R² 僅 0.18、SLG R² 僅 0.17。

### 根因（已診斷完成，不要重新追查）

問題出在 `fielding-engine.js:4-14` 的守備員預設站位：
```
P:(0,18)    1B:(30,30)   2B:(18,48)
C:(0,-2)    3B:(-30,30)  SS:(-18,48)
LF:(-50,80) CF:(0,94)    RF:(50,80)
```

**幾何問題**：
- 內野手處理範圍 ≤ y=52m（`infieldLimitM=52`）
- 外野手預設站位 y=80m（LF/RF）、94m（CF）
- **52 ~ 80m 是「無人區」**

**結果**：
- 弱打者短飛球（EV ~116 km/h, LA ~18°）落點 60m → 無人區 → bloop hit
- 強打者硬飛球（EV ~148 km/h, LA ~28°）落點 95m → 深守備員等到 → 接殺
- `fielding-engine.js:436` 的 `routineAirBonus +0.22~0.34` 對所有 fly 都給獎勵，加劇強打硬飛球被接殺

---

## 修正範圍

### 要動的檔案
- **`fielding-engine.js`** 主要動
- `投打對決修正書v1.1.md` 新增 §10（紀錄這次修改）

### 不要動的檔案
- `pitch-engine.js`（已校準完成）
- `baseball-physics-engine.js`（物理層正確）
- `data.js`（球員資料）
- `game.js`（整合層）

---

## 修正內容

實作以下兩個改動，**兩個一起做**（不要分階段）：

### 修正 A：縮小無人區（移動外野手站位）

在 `fielding-engine.js:4-14`，把 `POSITIONS` 修改：

```js
const POSITIONS = {
  P:  { x: 0,   y: 18 },
  C:  { x: 0,   y: -2 },
  "1B": { x: 30,  y: 30 },
  "2B": { x: 18,  y: 48 },
  "3B": { x: -30, y: 30 },
  SS: { x: -18, y: 48 },
  LF: { x: -50, y: 72 },   // 從 80 改 72
  CF: { x: 0,   y: 86 },   // 從 94 改 86
  RF: { x: 50,  y: 72 }    // 從 80 改 72
};
```

**理由**：把外野手向前移 8m，無人區從 (52, 80) 縮小到 (52, 72)，弱打者的 60m 短飛球進入外野手 reach 範圍。

### 修正 B：依 hangTime 給外野手 reach 動態調整

`fielding-engine.js:434-439` 目前的邏輯：
```js
if (ballInfo.ballType === "fly") {
  const wallRatio = ballInfo.preciseWallDistM > 0 ? ballInfo.preciseDistM / ballInfo.preciseWallDistM : 0.8;
  const routineAirBonus = wallRatio < 0.78 ? 0.34 : wallRatio < 0.9 ? 0.22 : 0.08;
  const hangBonus = clamp((ballInfo.hangTimeSec - 3) * 0.12, 0, 0.18);
  reachChance = clamp(reachChance + routineAirBonus + hangBonus, 0.04, 0.98);
}
```

問題：`routineAirBonus` 對所有 fly 都給正獎勵，沒有對「短 hangTime 硬飛球」做懲罰。

改為：
```js
if (ballInfo.ballType === "fly") {
  const wallRatio = ballInfo.preciseWallDistM > 0 ? ballInfo.preciseDistM / ballInfo.preciseWallDistM : 0.8;
  // routineAirBonus 縮減：原本 0.34 / 0.22 / 0.08 改為 0.22 / 0.14 / 0.04
  // 理由：原本對所有 fly 過度獎勵守備員，包含硬飛球
  const routineAirBonus = wallRatio < 0.78 ? 0.22 : wallRatio < 0.9 ? 0.14 : 0.04;

  // hangTime 動態調整：< 3s 給懲罰（球太快趕不上）、> 4s 給更大獎勵（routine play）
  // 真實 hangTime 範圍 2-6 秒。EV 高 + LA 25-30 → hangTime ~3 秒。EV 低 + LA 30-35 → hangTime ~5 秒。
  let hangAdjust;
  if (ballInfo.hangTimeSec < 3) {
    hangAdjust = -(3 - ballInfo.hangTimeSec) * 0.15;   // 每短 1 秒扣 0.15
  } else if (ballInfo.hangTimeSec > 4) {
    hangAdjust = clamp((ballInfo.hangTimeSec - 4) * 0.14, 0, 0.20);  // 每長 1 秒加 0.14，上限 0.20
  } else {
    hangAdjust = 0;
  }

  reachChance = clamp(reachChance + routineAirBonus + hangAdjust, 0.04, 0.98);
}
```

**預期效果**：
- 強打硬飛球（hangTime ~3s, wallRatio ~0.95）：原本 reach 飽和 0.98 → 新 reach 約 0.80-0.85（會逃出去更多）
- 弱打短飛球（hangTime ~3s, wallRatio ~0.6）：原本 reach 0.02-0.10 → 新 reach 上升到 0.30-0.45（因外野手前移）
- 平凡高飛球（hangTime > 4s）：仍然 routine 接殺

---

## 驗證流程

### Step 1: 結構性檢查
- 確認 `fielding-engine.js` 仍能正常 import
- 確認 `tools/smoke-test-engines.js` 跑得過（不要破壞 smoke test）

### Step 2: 跑 sim-tester（使用者手動，不是你跑）
告訴使用者：
1. 開瀏覽器、Ctrl+F5 強制刷新 `tools/sim-tester.html`
2. 上傳 `data.js`
3. 跑批次測試（99 打者 × 300 PA）
4. 匯出 CSV 給你看

### Step 3: 驗收標準

下面這些數字會比較，**重點看 R² 跟個別球員的 BABIP 是否回到合理範圍**，不要只看平均：

| 指標 | (5) 修前 | 預期修後 | 接受範圍 |
|---|---:|---:|---|
| AVG 平均 | .256 | .250 - .270 | ±0.015 內就行（會略升因為強打多了，但 BABIP 整體下降可能抵消）|
| K% 平均 | 24.2 | 不變 | 不要動 K%（不在這次範圍）|
| BB% 平均 | 6.8 | 不變 | 不要動 BB% |
| Chase Rate | 29.6 | 不變 | 不要動 chase |
| BABIP 平均 | .345 | **.30 - .32** | 必須下降 |
| AVG R² | 0.18 | **≥ 0.35** | 必須改善 |
| SLG R² | 0.17 | **≥ 0.35** | 必須改善 |
| 張育成 BABIP | .225 | **≥ .30** | 強打者要回升 |
| 林泓弦 BABIP | .383 | **≤ .30** | 弱打者要下降 |
| 林安可 BABIP | .219 | **≥ .30** | 強打者要回升 |
| 許哲晏 BABIP | .400 | **≤ .30** | 弱打者要下降 |

如果不達標，回報具體哪幾個球員仍偏差大，但**不要再加更多參數調整**（不要堆出新的補丁），讓使用者決定下一步。

### Step 4: 紀錄改動

修完並驗收通過後，在 `投打對決修正書v1.1.md` 結尾加上：

```markdown
## 10. 2026-05-XX 守備引擎反轉 BABIP 修復（v2.0）

### 10.1 修改內容
（簡述 A、B 兩個修正、實際 code diff、為什麼這樣選）

### 10.2 驗證結果
（修前修後對照表、個別球員 BABIP 對照、AVG/SLG R² 比較）

### 10.3 下一步
（如果還有殘留問題，列在這裡；如果完全達標，註明 v2.0 校準完成）
```

---

## 不要做的事

1. **不要動 pitch-engine.js**：已經校準到平均達標，動了就要重來。
2. **不要動 baseball-physics-engine.js**：物理計算層是對的，hangTime / distance 公式不要改。
3. **不要新增其他守備員位置**：保持 9 個守備員。
4. **不要為了達標而把 reachChance 公式整個重寫**：先試 A+B，如果不夠再回報，不要自己亂加 if-else 補丁。
5. **不要動 sim-tester.html 的 mock fielder 設定**（fielding=78, speed=78, arm=78）。這次的目標是讓引擎本身對，不是讓 sim-tester 看起來對。
6. **不要試圖改變 K%/BB%/Chase rate**。它們已經對了。
7. **不要為了強打者表現好就把 isHR 門檻調低**。會破壞物理。

---

## 安全提醒

- 改 `POSITIONS` 物件的值會連鎖影響所有用到 `entry.start` 的地方（`evaluateCandidate`、`playPointFor` 等）。確認沒有別處 hardcoded y=80 或 y=94 之類的值。如果有，要一起改。
- `fielding-engine.js:392` 的 `outfieldPickupM = Math.max(infieldLimit, 52) + 8 = 60`。這個是地滾球外野手的接球點。修正 A 之後不影響這個，但如果你想統一處理也可以考慮。
- 任何改 `clamp` 的上下限要小心，特別是 `reachChance` 的 0.04/0.98 floor/ceiling。

---

## 完成定義（Definition of Done）

- [ ] 修正 A：`POSITIONS` 已更新（LF/RF y=72, CF y=86）
- [ ] 修正 B：`fielding-engine.js:434-439` 已重寫（routineAirBonus 縮減 + hangAdjust 動態化）
- [ ] `tools/smoke-test-engines.js` 跑得過
- [ ] sim-tester 結果達到驗收標準（特別是 AVG R² ≥ 0.35、4 位指標球員的 BABIP 都回到合理範圍）
- [ ] `投打對決修正書v1.1.md` §10 寫好，附修前修後對照
