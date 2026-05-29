# Project Overview

專案名稱：政大棒球征服世界  
目前版本週期：v3.25  
更新日期：2026-05-21

## 專案概述

這是一款以棒球經營、投打對決、球員養成、賽季推進與 WBC 目標為核心的瀏覽器遊戲。

目前遊戲已具備基本流程：

- 球隊與球員名單。
- 打序與守備安排。
- 投打對決。
- 安打、出局、保送、三振、失誤、雙殺、全壘打。
- 跑者推進與得分。
- 俯視守備動畫。
- 賽季、管理與部分劇情系統。

v3.11 到 v3.19 的重點不是增加新玩法，而是把大型 `game.js` 的投打、場內球與跑壘核心拆成可維護的模組，並讓判定結果、守備動畫、跑壘推進、外野回傳與 debug 資料走同一條時間軸。v3.18 把 `fly_out` 納入跑壘 AI，補上犧牲飛球、tag-up 推進與外野補傳挑戰；v3.19 則補上跑壘指導員 hold/send 決策、近距離滑壘事件與 debug 顯示。v3.20 實作守備佈陣系統。v3.21 完成旁白模組拆分（`commentary.js`）、守備佈陣 UI、對手佈陣 AI。v3.22 完成守備動畫 Bug 修正、先發投手保護、賽後回顧增強、對手投球傾向、UI 佈局改善。

**v3.23 為玩法擴充週期**：新增主線劇情序章（第一次進入遊戲播放）、旺來體育報紙頭版（取代舊賽後摘要）、轉播文案豐富化（網路梗）、後勤管理（取代防護中心，含二軍訓練/一軍訓練分投打守/恢復/行銷活動&啦啦隊/教練團）、球員養成三軌（經驗升級／球員卡升級／碎片品階）、賽後獎勵（資金/教練證/球員卡）、打者個人數據追蹤、對手佈陣 AI 依打者特性細化、可調參數集中於 `game-params.js`。

**v3.23 後續追加（2026-05-20）**：`tools/stat-mapper.html` CPBL 資料整合工具（瀏覽器版，2024-2026 三季 PA/BF 加權，輸出含三季快照 + 完整 advancedStats）；`pitch-engine.js` v1.1 接入四維進階數據（`swingByCount` → chaseProb 調整；`timing` → 球速鎖定修正精緻化；`plateDiscipline` → 四區 30% 歷史混合；`pitchTypeMatchup` → 球種 25% 歷史混合）。

**v3.24（2026-05-20）：NBA 2K 式能力值體系**：引入「分段線性 CPBL 校準」評分標尺（lo→45 / avg→60 / top→82，保留升級與更強聯盟空間至 100）。`stat-mapper.html` 升至 v3.0，每位球員輸出 `abilities` 物件（打者：contact / power / speed / fielding / arm / discipline / clutch / vsLeft / vsRight 等；投手：velocity / control / breaking / stamina / fielding / stuff / crisis 等），存入 `data.js`；`game.js` StatMapper 改為「讀取優先」——若 `stats.abilities` 已存在則直接回傳，否則 fallback 到動態公式。同步修正 `game-params.js` / `player-growth-system.js` 打者升級屬性名稱（`hitting→contact`、`eye→discipline`、`defense→fielding`），使升級系統與能力值欄位名稱一致。

**v3.25（2026-05-21）：升級體系統合 + 天賦/特質拆分 + UI/體力/投手特化補強**：

- **A 組 升級體系統合**：合併雙升級系統（game.js: awardPlayerXP 內部 levelUp 廢除，統一委派 PlayerGrowth），消除 RATING_STAT_CAP 與 PlayerGrowth.getAbilityCeiling 互斥的 ceiling 邏輯；引入字母評級顯示（S 90+ / A 80–89 / B 70–79 / C 60–69 / D 50–59 / E < 50）；能力 tooltip（17 個欄位的中文說明）滑鼠 hover 顯示；投手保送 XP 從 +3 修正為 -1。
- **B 組 天賦/特質拆分**：「從 abilities 統計推出的標籤」歸為「天賦」（純顯示，已反映在數值上不二次加成）；「透過品階解鎖、會實際加成」歸為「特質」（綠繡眼/巨人之力/光速球等新命名）。`PlayerGrowth.unlockTraitsByRank()` 每升一階自動檢查解鎖；現存檔載入時自動 migrate 舊 traits → talents。
- **C 組 後勤中心 UI**：`#logistics-tab` scope 廣譜 color 強制亮色，select option 補強對比，amber/teal 背景元素強制深色文字，解決使用者反映的「黑底黑字看不到」問題。
- **D 組 投手體力 5 級狀態**：龍精虎猛→懷疑人生 5 級文字 + 圖示 + 顏色 chip 取代數字進度條；非線性下降（0.50x ～ 2.20x decayMul）；各狀態對應 velocity/control/breaking 修正套用到投打對決。球路選擇改三框拖拉 UI（好球帶 22.5cm / 追打區 33.75cm / 無效區 38cm 同心矩形 + 可拖拉準星 + 3×3 微格快速點擊 + 觸控支援），pitch-engine 接受 `aimPosition` 連續座標。
- **E 組 下勾/側投投手特化**：`specialPitcherArmSlot` 對照表（黃子鵬、宋家豪、林岳谷、陳鴻文、倪福德、鄭凱文、江國謙），`estimateStuffScore` 套加成（下勾 +6、側投 +4 stuffScore），對打者套 vsRightContact / vsLeftContact 修正，模擬「出手點怪 → 球質難打」的真實表現。

## 啟動方式

主要入口：

- `index.html`

主要腳本載入順序：

1. `data.js`
2. `game-params.js`（v3.23）
3. `story-data.js`（v3.23）
4. `commentary-data.js`（v3.23）
5. `logistics-system.js`（v3.23）
6. `player-growth-system.js`（v3.23）
7. `rewards-system.js`（v3.23）
8. `newspaper-summary.js`（v3.23）
9. `story-intro.js`（v3.23）
10. `engine.js`
11. `pitch-engine.js`
12. `fielding-engine.js`
13. `baserunning-engine.js`
14. `defense-state-builder.js`
15. `pitch-result-applier.js`
16. `in-play-result-applier.js`
17. `game-renderer-modules.js`
18. `game-renderer.js`
19. `commentary.js`
20. `game.js`
21. `pitch-visualizer.js`
22. `batter-visualizer.js`
23. `player-appearance.js`
24. `animation-assets.js`
25. `battle-scene.js`
26. `engine-debug-panel.js`

> v3.23 新增的 8 個模組都用 IIFE 封裝，必須在 `game.js` 之前載入。

如果要測試，可以直接開啟 `index.html` 或執行 `open-game.bat`。

## 核心設計原則

本專案目前採用「機率樹與結果驅動的混血架構」。

規則：

- 投打判定先在後台決定。
- 場內球先由引擎決定落點、守備員與終局結果。
- 前端動畫只讀取已決定的 `playResult` 與 `visualTimeline`。
- 視覺層不得重新判定安打、出局或守備員。

簡單流程：

1. `PitchEngine` 產生單球結果。
2. `PitchResultApplier` 處理未進場結果。
3. `DefenseStateBuilder` 建立防守資料。
4. `FieldingEngine` 判定場內球。
5. `BaserunningEngine` 產生 `advanceResult` 與跑者 movement plan。
6. `InPlayResultApplier` 套用分數、出局、跑者、XP、旁白。
7. `BattleScene` 讀 `lastInPlayContext` 做動畫。
8. `GameDebugPanel` 可選擇性顯示最近一次引擎資料。

## 主要模組

### `game.js`

目前仍是最大檔案，但 v3.11 後它比較像協調器。

負責：

- 遊戲主狀態。
- 球員、隊伍、賽季與管理系統。
- stamina 與 burn life 等副作用。
- save / UI update。
- 串接各對決模組。

不應再新增大量投打判定邏輯到這裡。

### `pitch-engine.js`

純投球與打擊前段引擎（v1.1）。

負責：

- 投球落點（§17.4 截斷高斯控球偏差）。
- 好壞球判定。
- 打者是否揮棒（含 `swingByCount` 球數情境歷史攻擊率修正）。
- 揮空、接觸、界外、進場球分流。
- heatMap 對接觸與力量的修正（3×3 好球帶熱區）。
- `timing` 計時效率修正（fastLatePct / slowEarlyPct 等）。
- `plateDiscipline` 四區混合（core / edge / chase / invalid，30% 歷史比率）。
- `pitchTypeMatchup` 球種混合（FF/SI/FC/SL/CU/CH/FS，25% 歷史比率）。
- 產生 `lastPitchContext` 與 `inPlay` 種子資料。

輔助函式（已掛到公開 API）：`classifyPitchTypeCode()`、`classifyPlateZone()`、`classifyPitchSpeedGroup()`。

### `pitch-result-applier.js`

未進場結果套用器。

負責：

- 壞球。
- 看著好球。
- 暴投。
- 揮空。
- 界外。
- 保送。
- 三振。
- 相關球數、旁白、XP、跑者推進與打序推進。

### `defense-state-builder.js`

防守資料轉接器。

負責：

- 根據目前打序與守位建立守備名單。
- 補齊舊存檔或缺守位資料。
- 建立對手守備資料。
- 提供目前球場資料。
- v3.20 後，`buildDefenseState(gameRef, battingTeam, shiftKey)` 接受守備佈陣識別碼，對每個守位計算套用偏移後的 `start` 座標。
- 公開 `DEFENSIVE_ALIGNMENTS`（六種佈陣定義表）與 `BASE_POSITIONS`（守備員基準座標），供 UI 顯示佈陣按鈕。

它的輸出（含 `shiftKey`）會交給 `FieldingEngine.resolveInPlay()`。

### `fielding-engine.js`

純守備與場內球判定引擎。

負責：

- 擊球距離、落點、飛行時間。
- 滾地球第一彈跳、減速、摩擦與到點速度。
- 守備員候選。
- 守備範圍與成功率。
- 接球、失誤、安打、雙殺、全壘打牆面判定。
- 產生 `playResult` 與 `visualTimeline`。

重要規則：

- 守備結果由此模組決定。
- 動畫必須吃 `visualTimeline`，不能自己猜。
- 雙殺目前會產生「先封殺二壘、再轉傳一壘」的序列事件。
- 滾地球可能有 `fielding.primaryAttempt` 與 `fielding.selected`。前者是第一位嘗試攔球者，後者是最後處理球者。
- 打穿內野時，`fielding.selected` 會改成外野最後處理者，避免轉播與動畫顯示不同守備員。
- v3.16 後會讀取 `FIELD_SURFACE_PHYSICS` / `stadium.surfacePhysicsKey`，讓天然草、人工草、紅土混合與室內場地影響彈跳、摩擦、滾動距離與空氣阻力。
- 外野安打可能產生 `playResult.throwDecision`，包含直傳或中繼、目標壘包、跑者到壘時間、球到壘時間與安全/出局結果。
- v3.17 後，打穿內野的滾地球會把 `ball_arrives` 指到最後處理點，不再停在內野落地/第一彈跳位置。
- v3.17 後，沒接到球的守備員也會產生 `fielder_start` / `fielder_arrives` 追球事件，讓動畫能表現「有跑但追不到」。
- v3.18 後，深遠飛球可產生 `advanceResult`，讓三壘跑者 tag-up 回本壘、二壘跑者推進三壘，並交由同一套外野補傳邏輯判定安全或出局。
- v3.19 後，外野補傳的近距離攻防可產生 `throwDecision.slide` 與 `runner_slide` 事件，供 debug 和後續滑壘動畫接軌。

### `baserunning-engine.js`

純跑壘推進模組。

負責：

- 保送推進。
- 一壘安打、二壘安打、三壘安打、全壘打。
- 失誤上壘。
- 得分數。
- 是否記安打。
- 每位跑者的 `movements`，供狀態套用與 `visualTimeline` 共用。
- 每次多進壘的 `decisions`，記錄壘指導員放行或擋下的判斷。

目前仍是簡化版，但 v3.19 後安打、長打、全壘打、牆面二壘安打、失誤、犧牲飛球、外野回傳挑戰與高飛球停壘判斷已能共用跑壘計畫、跑者時間估算與 hold/send 決策資料。

### `in-play-result-applier.js`

場內球結果套用器。

負責：

- 根據 `playResult.code` 改變遊戲狀態。
- 安打、出局、失誤、雙殺、牆面球、全壘打。
- 跑者、壘上出局、出局數、分數、旁白、XP、球數重置。
- 使用 `playResult.advanceResult` 套用預先決定的跑壘推進，包含安打與高飛球 tag-up，避免視覺與實際狀態二次抽隨機。
- v3.19 後會輸出壘指導員放行、擋下、飛球深度不足停壘與補傳刺殺等簡短轉播文字。

### `battle-scene.js`

主要對決畫面。

負責：

- 投球、打擊、守備視覺演出。
- 讀取 `game.lastPitchContext`。
- 讀取 `game.lastInPlayContext`。
- 使用 `visualTimeline` 畫球與守備員。
- v3.17 後會依多個 `fielder_start` 事件畫出第一反應守備員與最後處理守備員的跑動。
- 使用 `runner_start`、`runner_arrives`、`runner_out`、`throw_start`、`throw_arrives` 畫簡化跑壘與傳球。

它不應決定結果。

未來素材接點：

- 可定義 `window.GameAnimationAssets.drawFielder(ctx, actor)` 替換守備員方塊圖。
- `actor.state` 目前可能是 `idle`、`run`、`field`、`miss`。

### `animation-assets.js`

守備動畫素材接點。

負責：

- 定義第一版 `FIELDING_SPRITE_MANIFEST`。
- 提供 `window.GameAnimationAssets.drawFielder(ctx, actor)`。
- 依 `idle`、`run`、`field`、`miss` 畫出可替換的程序化像素守備員。
- 未來若改接 PNG sprite sheet，應優先替換這個檔案，不要改守備判定引擎。

### `engine-debug-panel.js`

開發用 debug panel。

啟用方式：

- 網址加上 `?debug=1`。
- 或在瀏覽器按 `Ctrl+Shift+D`。
- 或設定 localStorage `nccuBaseballDebugPanel = 1`。

負責顯示：

- 最近一次投球摘要。
- 最近一次場內球結果。
- 選定守備員。
- 第一反應守備員與球到達速度。
- 守備候選摘要。
- 傳球與跑者出局摘要。
- 跑壘 AI hold/send 決策摘要。
- 近距離滑壘事件摘要。
- 擊球類型與距離。
- `visualTimeline` 事件清單。
- `GameDebugPanel.snapshot()` 可回傳最近一次投打與場內球資料，方便未來排查動畫和判定不一致。
- v3.19 後可透過 snapshot 檢查 `primaryAttempt`、`groundProfile`、`flightProfile`、`surface`、`throwDecision`、`runnerDecisions`、`slides`、`fielderRoutes`，以及安打與高飛球 tag-up 的跑者推進事件是否進入 `visualTimeline`。

### `tools/stat-mapper.html`

CPBL 球員資料整合工具（瀏覽器版，不需 Node.js / Python）。

使用方式：直接以瀏覽器開啟，上傳 `cpbl_players_2024-2026.json` + `data.js`，點「開始整合」，下載覆蓋遊戲根目錄的 `data.js`。

負責：

- 以 PA（打者）/ BF（投手）加權合併 2024、2025、2026 三季資料（權重 0.60 / 1.00 / 0.80）。
- 保留每位球員三季快照（`seasons.2024/2025/2026`）。
- 寫入完整 `advancedStats`：heatMap（3×3 PA 加權）、battedBall 衍生的 gbRate / ldRate / fbRate / popupRate / avgLaunchAngle、以及 2025-2026 合計切片的 plateDiscipline / swingByCount / timing / pitchTypeMatchup / foulSplit / situational / splits / spray / ballQuality / highlights。
- 輸出彩色 log 顯示命中 / 未命中 / 錯誤。

> `tools/stat-mapper.js`（Node.js 版）亦存在，邏輯相同，但需 Node 環境。

### `tools/smoke-test-engines.js`

Node 層回歸煙霧測試。

執行方式：

```bash
node tools/smoke-test-engines.js
```

修改核心引擎後應先跑這個腳本。

目前涵蓋：

- 防守資料補齊。
- 左側滾地球選擇游擊手。
- 一般滾地出局會產生打者在一壘出局事件。
- 雙殺時間軸的二壘封殺與一壘轉傳順序。
- 安打與長打的跑者 movement plan。
- 場內球二壘安打的 R2 / R3 得分時間軸。
- 雙殺補位轉傳的候選評分結果。
- 強襲滾地球穿越投手後由中外野手處理。
- 第一反應守備員與最後處理守備員都要進入動畫時間軸。
- 打穿內野後球的最後顯示點必須在內野外。
- 跑者先到壘時，外野回傳不能再判出局。
- 深遠飛球若有 tag-up，`advanceResult` 與 `throwDecision` 必須一起進 timeline。
- 跑壘指導員 hold/send 決策。
- 近距離補傳的 `runner_slide` 事件。
- 外野球守備選擇。
- 失誤跑者推進。
- 未進場投球結果套用。
- `index.html` 主要引擎腳本載入順序。

### `tools/browser-smoke-test.js`

瀏覽器層煙霧測試。

執行方式：

```bash
node tools/browser-smoke-test.js
```

目前涵蓋：

- 使用 Chrome 或 Edge 開啟 `index.html?debug=1`。
- 確認 `game`、`gameEngine` 與核心引擎模組在瀏覽器中初始化。
- 確認 `PitchVisualizer`、`BatterVisualizer`、`BattleScene` 的 Canvas 已建立且非空白。
- 強制產生一個雙殺守備時間軸，檢查 `throw_start`、`runner_out` 與 debug panel snapshot。
- 可選用 `--screenshot=path/to/file.png` 輸出瀏覽器截圖。

### `game-renderer.js` / `game-renderer-modules.js`

UI 渲染層。

負責：

- 計分板。
- 名單。
- 打序。
- 牛棚。
- 壘包顯示。
- 管理 UI。

## 重要狀態資料

### `game.lastPitchContext`

投球後的前端資料。

常見欄位：

- `pitch`
- `zone`
- `isStrike`
- `didSwing`
- `pitchOutcome`
- `finalContactScore`
- `hotZoneMod`

### `game.lastInPlayContext`

場內球後的前端資料。

常見欄位：

- `ballInfo`
- `fielding`
- `playResult`
- `visualTimeline`
- `evKmh`
- `launchAngleDeg`
- `sprayAngleDeg`

v3.16 後，場內球常見補充欄位：

- `ballInfo.groundProfile`
- `ballInfo.flightProfile`
- `ballInfo.surface`
- `fielding.primaryAttempt`
- `fielding.selected`
- `fielding.result.reason = "through_infield"`
- 候選守備員的 `ballArrivalSpeedKmh`

### `playResult`

場內球終局結果。

常見 `code`：

- `hit`
- `ground_out`
- `fly_out`
- `popup_out`
- `double_play`
- `error`
- `home_run`
- `net_out`
- `net_double`
- `foul`

v3.14 後，安打、失誤、全壘打與牆面二壘安打可能帶有：

- `advanceResult`
- `advanceResult.movements`
- `advanceResult.decisions`（壘指導員 hold/send 決策）
- `advanceResult.outsOnBases`（外野回傳或未來跑壘挑戰造成的壘上出局）
- `throwDecision`（外野回傳挑戰摘要）
- `throwDecision.slide`（近距離補傳攻防的滑壘提示）
- `airOutAdvance`（高飛球 catch time / depth 摘要）
- `relay`（雙殺轉傳補位摘要）
- `fielding.primaryAttempt`（若球先穿越內野）

### `visualTimeline`

動畫時間軸。

目前重要事件：

- `contact`
- `ball_arrives`
- `fielder_start`
- `fielder_arrives`
- `runner_start`
- `runner_arrives`
- `runner_slide`
- `runner_out`
- `throw_start`
- `throw_arrives`

補充：
- `advanceResult.movements[].startAtSec` 可讓 tag-up 跑者在接殺後才起跑，而不是從擊球瞬間就開始跑。
- 終局事件，例如 `fly_out`、`hit`、`error`

規則：

- `ball_arrives.point` 是動畫球最終要到的位置。
- 出局與失誤會指向守備員實際處理點。
- 安打會指向球落點。
- 跑者與傳球事件目前是簡化時間軸，用於 debug 與後續動畫接軌。
- `double_play` 會包含 `throw_start/throw_arrives` 的 `force` 與 `relay` 序列，以及兩個 `runner_out` 事件。
- 安打、長打、全壘打、牆面二壘安打與失誤會依 `advanceResult.movements` 產生 `runner_start/runner_arrives`。
- 近距離外野補傳可能會在到壘或出局前產生 `runner_slide`。
- 得分跑者的 `runner_arrives` 會帶有 `scored: true`。

## 如何安全修改

### 要改投打模型

優先看：

- `pitch-engine.js`
- `pitch-result-applier.js`
- `投打對決模型規則書.md`

不要直接把大量判定塞回 `game.js`。

### 要改守備模型

優先看：

- `fielding-engine.js`
- `defense-state-builder.js`
- `in-play-result-applier.js`

如果動畫與結果不一致，先檢查：

- `fielding.selected.position`
- `fielding.selected.playPoint`
- `visualTimeline.events`
- `battle-scene.js` 是否只讀 timeline。
- `engine-debug-panel.js` 是否顯示合理事件序列。

### 要改跑壘

優先看：

- `baserunning-engine.js`
- `fielding-engine.js` 的 `throwDecision`

未來若要支援完整滑壘動畫、夾殺與更細緻跑者 AI，應擴充 `advanceResult.movements`、`advanceResult.decisions` 與 `visualTimeline`，不要只在畫面層寫死動畫。

### 要換 PNG 或動畫

優先修改：

- `animation-assets.js`
- sprite manifest

推薦接點：

- `window.GameAnimationAssets.drawFielder(ctx, actor)`

不要改 `FieldingEngine` 來處理圖片。

## 尚未完成

### 資料面

- ~~data.js 需重新跑 stat-mapper~~ **已完成**：data.js 已包含 v3.24 預計算的 abilities 物件（371 處）。只有要換新球員 / 加新球季時才需要重跑。
- **補球員 meta**：守位 / bats / 身高體重 / 生日 / 照片 URL — 需從 CPBL 球員頁爬取，更新 `player-appearance.js` / `PLAYER_BIOS`。
- **補守備統計**：FLD% / E / A — 需從 CPBL 守備頁爬取，補 `abilities.fielding / arm`，讓守備引擎更精準。
- **newspaper-summary.js 接 highlights**：`advancedStats.highlights`（home_runs / top_ev / clutch_pas）已存在但尚未被報紙摘要讀取。

### 規則書 / 引擎面

- **投打對決規則書 §17.x 更新**：四區（core / edge / chase / invalid）系統已在引擎實作，規則書 §17.6 / §17.9 文字仍描述舊 9×9 catch zone，需同步。
- **引擎改造（討論中）**：foul 升一等公民（子類型 + 獨立公式）、timing window 維度、球種對應 contact / foul 修正。

### 美術 / UI

- 正式 PNG sprite sheet 與逐幀動畫素材（`sprite-generation-prompts.md` 已備齊 43 位球員描述）。
- 滑壘、夾殺、折返跑壘等進階跑壘情境。
- 雨天、濕度、風向與更多球場材質係數（v3.16 已加入基本場地材質）。
- 自動化瀏覽器測試擴充至完整 UI 互動與整局流程。
- `game.js` 的賽季、WBC 管理系統可繼續拆分。
- 對手投球傾向的球種名稱本地化（依投手真實球種代碼顯示中文名）。
- 手機板面（768px 以下）的 UI 進一步最佳化。
- 賽後旺來體育報紙的 PNG / Canvas「分享圖卡」匯出。
- 球員養成三軌的數值平衡（請依 playtest 結果調整 `game-params.js`）。

## 目前建議接手順序

1. 先讀 `ENGINE_HANDOFF.md`。
2. 再讀本檔。
3. 再讀 `v3_23-更新書.md`、`v3_22-更新書.md`、`v3_21-更新書.md`。
4. 如果要理解規則細節，再讀 `投打對決模型規則書.md`。
5. 若要**調整數值平衡**，先改 `game-params.js`（升級成本、教練加成、獎勵機率、報紙標題、品階曲線都在這裡）。
6. 若要**改劇情文本**，改 `story-data.js`（序章、賽季穿插、WBC 結局）。
7. 若要**改旁白文案**，改 `commentary-data.js`（新增情境陣列即可，不必動 `commentary.js`）。
8. 若要更新球員統計資料或能力值，先用 `tools/stat-mapper.html`（上傳 JSON + data.js → 下載覆蓋）。v3.24 起會一併輸出 `abilities` 物件，game.js 會讀取優先。
9. 若要調整能力值校準參數（CPBL avg=60、top=82 的分段線性），修改 `tools/stat-mapper.html` 中的 `piecewise()` 呼叫參數，再重新跑一次即可。
10. 若要改投打，從 `pitch-engine.js` 開始。四維進階數據（swingByCount / timing / plateDiscipline / pitchTypeMatchup）已接入，調整混合比率在 `ContactResolutionModule.resolve()` 內（目前 plateDiscipline 30%、pitchTypeMatchup 25%）。
11. 若要改守備，從 `fielding-engine.js` 與 `defense-state-builder.js` 開始。
12. 若要改跑壘，從 `baserunning-engine.js` 與 `playResult.advanceResult` 開始。
13. 若要改守備佈陣（玩家操作），從 `game.setDefensiveShift()` 與 `index.html` 的 `strategy-group-defensive-shift` 開始。
14. 若要改對手佈陣 AI，從 `OpponentAI.decide()` 開始（v3.23 已加入打者特性因素）。
15. 若要改畫面，從 `battle-scene.js` 與 `GameAnimationAssets` hook 開始。
16. 若要改後勤管理，從 `logistics-system.js` 與 `index.html` 的 `renderLogisticsScene()` 開始。
17. 若要改球員養成三軌，從 `player-growth-system.js` 開始（資料欄位、能力上限、升級邏輯）。
18. 若要改賽後摘要（旺來體育報紙），從 `newspaper-summary.js` 與 `style.css` 中 `.newspaper-*` 區塊開始。
19. 若要改賽後獎勵（資金 / 教練證 / 球員卡），從 `rewards-system.js` 與 `game-params.js` 的 `rewards` 區塊開始。
20. 若要改主線序章，從 `story-data.js` 的 `INTRO_CHAPTERS` 與 `story-intro.js` 開始。
21. 若要改字母評級門檻，改 `game-params.js` 的 `abilityGrades`（v3.25 新增）。
22. 若要新增天賦或特質，改 `game-params.js` 的 `talents` 和 `traits` 兩個陣列（v3.25 新增）。天賦純顯示；特質要在 game.js 4615+ 加 `traits.includes(...)` 加成才會生效。
23. 若要改升級邏輯，**統一改 `player-growth-system.js`**（v3.25 合併後 game.js 不再有 levelUp 內部實作）。
24. 若要新增下勾/側投投手，改 `game-params.js` 的 `specialPitcherArmSlot`（v3.25.4），加入「球員名 → 'submarine'/'sidearm'」鍵值即可，game.js 會自動套加成。
25. 若要調整投手體力 5 級狀態（範圍/能力修正/扣血倍率），改 `game-params.js` 的 `staminaStates`（v3.25.2）。
26. 若要改球路瞄準的拖拉範圍/微格佈局，改 `index.html` 中 `pitch-aim-zone` 區塊 + `style.css` 的 `.aim-frame.*`（v3.25.3）。
