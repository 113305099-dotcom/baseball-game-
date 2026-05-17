# Project Overview

專案名稱：政大棒球征服世界  
目前版本週期：v3.13  
更新日期：2026-05-17

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

v3.11 到 v3.13 的重點不是增加新玩法，而是把大型 `game.js` 的投打與場內球核心拆成可維護的模組，並讓判定結果、守備動畫、debug 資料走同一條時間軸。

## 啟動方式

主要入口：

- `index.html`

主要腳本載入順序：

1. `engine.js`
2. `pitch-engine.js`
3. `fielding-engine.js`
4. `baserunning-engine.js`
5. `defense-state-builder.js`
6. `pitch-result-applier.js`
7. `in-play-result-applier.js`
8. `game-renderer-modules.js`
9. `game-renderer.js`
10. `game.js`
11. `pitch-visualizer.js`
12. `batter-visualizer.js`
13. `battle-scene.js`
14. `engine-debug-panel.js`

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
5. `InPlayResultApplier` 套用分數、出局、跑者、XP、旁白。
6. `BattleScene` 讀 `lastInPlayContext` 做動畫。
7. `GameDebugPanel` 可選擇性顯示最近一次引擎資料。

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

純投球與打擊前段引擎。

負責：

- 投球落點。
- 好壞球判定。
- 打者是否揮棒。
- 揮空、接觸、界外、進場球分流。
- heat map 對接觸與力量的修正。
- 產生 `lastPitchContext` 與 `inPlay` 種子資料。

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

它的輸出會交給 `FieldingEngine.resolveInPlay()`。

### `fielding-engine.js`

純守備與場內球判定引擎。

負責：

- 擊球距離、落點、飛行時間。
- 守備員候選。
- 守備範圍與成功率。
- 接球、失誤、安打、雙殺、全壘打牆面判定。
- 產生 `playResult` 與 `visualTimeline`。

重要規則：

- 守備結果由此模組決定。
- 動畫必須吃 `visualTimeline`，不能自己猜。
- 雙殺目前會產生「先封殺二壘、再轉傳一壘」的序列事件。

### `baserunning-engine.js`

純跑壘推進模組。

負責：

- 保送推進。
- 一壘安打、二壘安打、三壘安打、全壘打。
- 失誤上壘。
- 得分數。
- 是否記安打。

目前仍是簡化版，尚未完整時間軸化。

### `in-play-result-applier.js`

場內球結果套用器。

負責：

- 根據 `playResult.code` 改變遊戲狀態。
- 安打、出局、失誤、雙殺、牆面球、全壘打。
- 跑者、出局數、分數、旁白、XP、球數重置。

### `battle-scene.js`

主要對決畫面。

負責：

- 投球、打擊、守備視覺演出。
- 讀取 `game.lastPitchContext`。
- 讀取 `game.lastInPlayContext`。
- 使用 `visualTimeline` 畫球與守備員。
- 使用 `runner_start`、`runner_arrives`、`runner_out`、`throw_start`、`throw_arrives` 畫簡化跑壘與傳球。

它不應決定結果。

未來素材接點：

- 可定義 `window.GameAnimationAssets.drawFielder(ctx, actor)` 替換守備員方塊圖。
- `actor.state` 目前可能是 `idle`、`run`、`field`、`miss`。

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
- 守備候選摘要。
- 傳球與跑者出局摘要。
- 擊球類型與距離。
- `visualTimeline` 事件清單。
- `GameDebugPanel.snapshot()` 可回傳最近一次投打與場內球資料，方便未來排查動畫和判定不一致。

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
- 外野球守備選擇。
- 失誤跑者推進。
- 未進場投球結果套用。
- `index.html` 主要引擎腳本載入順序。

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

### `visualTimeline`

動畫時間軸。

目前重要事件：

- `contact`
- `ball_arrives`
- `fielder_arrives`
- `runner_start`
- `runner_arrives`
- `runner_out`
- `throw_start`
- `throw_arrives`
- 終局事件，例如 `fly_out`、`hit`、`error`

規則：

- `ball_arrives.point` 是動畫球最終要到的位置。
- 出局與失誤會指向守備員實際處理點。
- 安打會指向球落點。
- 跑者與傳球事件目前是簡化時間軸，用於 debug 與後續動畫接軌。
- `double_play` 會包含 `throw_start/throw_arrives` 的 `force` 與 `relay` 序列，以及兩個 `runner_out` 事件。

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

未來若要支援傳球與滑壘，應擴充 `visualTimeline`，不要只在畫面層寫死動畫。

### 要換 PNG 或動畫

優先新增：

- `animation-assets.js`
- sprite manifest

推薦接點：

- `window.GameAnimationAssets.drawFielder(ctx, actor)`

不要改 `FieldingEngine` 來處理圖片。

## 尚未完成

- 真實球員資料庫。
- 正式 sprite manifest。
- 完整傳球、滑壘、跑者決策時間軸。v3.13 已補雙殺基本序列，但還不是完整跑壘 AI。
- 自動化瀏覽器測試。
- `tools/smoke-test-engines.js` 目前涵蓋核心引擎與 `index.html` 靜態載入順序，尚未涵蓋完整 UI 互動。
- `game.js` 的賽季、WBC、管理系統仍可繼續拆分。
- 旁白資料仍在 `game.js`，未獨立成文字資料模組。

## 目前建議接手順序

1. 先讀 `ENGINE_HANDOFF.md`。
2. 再讀本檔。
3. 如果要理解規則細節，再讀 `投打對決模型規則書.md`。
4. 若要改投打，從 `pitch-engine.js` 開始。
5. 若要改守備，從 `fielding-engine.js` 與 `defense-state-builder.js` 開始。
6. 若要改畫面，從 `battle-scene.js` 與 `GameAnimationAssets` hook 開始。
