// =====================================================================
// tutorial-system.js — v4.1 Phase 4 新手教學（互動導覽）
// 自含 IIFE，需在 game.js 之前載入。提供 window.TutorialSystem。
// 聚光遮罩 + 步驟提示 + 下一步/跳過；完成後發黃金棒球並寫 tutorialCompleted。
// =====================================================================
(function (global) {
  'use strict';

  // 導覽步驟：center=置中說明；sel=高亮目標；scene=先切到該場景
  const STEPS = [
    { center: true, title: '歡迎來到政大棒球征服世界！', text: '這個快速導覽帶你認識核心畫面與操作。隨時可按「跳過」。' },
    { scene: 'lobby', sel: '#currency', title: '資金', text: '「資金」用於經營：訓練、聘僱、升級，以及抽「本土現役球員」。' },
    { scene: 'lobby', sel: '#gold-baseball', title: '黃金棒球', text: '高級貨幣，用來抽「海外池」與「教練池」。靠任務成就、賽後表現、賽季里程碑取得，不能用資金換。' },
    { scene: 'lobby', sel: '[data-scene="shop"]', title: '擴張中心（抽卡）', text: '用資金抽本土球員、用黃金棒球抽海外球星與教練。' },
    { scene: 'lobby', sel: '[data-scene="roster"]', title: '球隊管理（養成）', text: '球員三條養成軌：經驗升級、球員卡、碎片品階。教練放上一軍可加對應能力值。' },
    { scene: 'lobby', sel: '[data-scene="pregame"]', title: '準備出賽', text: '排好打序與先發投手後即可開打。' },
    { scene: 'match', sel: '.battle-canvas-wrap', title: '比賽主畫面', text: '復古映像管電視風格。局數、比數、好壞球、壘包都在畫面右下的「比賽狀態欄」。' },
    { scene: 'match', sel: '#duel-start', title: '對決開始', text: '先設定好球種、瞄準、出力，再按「對決開始」才會出手；鎖定牽制時則改執行牽制。' },
    { scene: 'match', sel: '#throttle', title: '出力搖桿', text: '像油門一樣上下拉：越紅，球速與變化越強、越耗體力，紅區還可能失控暴投。' },
    { scene: 'match', sel: '.knob[data-knob="pitch-type"]', title: '球種旋鈕', text: '懸停或點擊展開扇形，選實際要投的球路（四縫線、滑球、曲球…）。打擊時則是打擊策略與三段鎖定條。' },
    { scene: 'match', sel: '#knob-auto', title: '全自動開關', text: '想快轉就打開「全自動」，會一路模擬到比賽結束。' },
    { center: true, title: '導覽完成！', text: '送你 100 顆黃金棒球當見面禮，去抽幾張好卡，開始征服世界吧！', reward: 100 }
  ];

  let idx = 0;
  let running = false;
  let theGame = null;
  let dom = null;

  function injectStyle() {
    if (document.getElementById('tutorial-style')) return;
    const s = document.createElement('style');
    s.id = 'tutorial-style';
    s.textContent = `
      #tut-blocker { position: fixed; inset: 0; z-index: 9000; background: transparent; }
      #tut-spot { position: fixed; z-index: 9001; border-radius: 12px; pointer-events: none;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 3px #4ade80, 0 0 22px rgba(74,222,128,0.6);
        transition: top .25s, left .25s, width .25s, height .25s, opacity .2s; }
      #tut-tip { position: fixed; z-index: 9002; max-width: 320px;
        background: linear-gradient(180deg,#0f2417,#0a1a10); border: 2px solid #4ade80;
        border-radius: 12px; padding: 14px 16px; color: #e2e8f0;
        box-shadow: 0 14px 40px rgba(0,0,0,0.7); font-size: .82rem; line-height: 1.5; }
      #tut-tip h4 { margin: 0 0 6px; color: #4ade80; font-size: .95rem; font-weight: 800; }
      #tut-tip .tut-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; gap: 10px; }
      #tut-tip .tut-progress { font-size: .68rem; color: #94a3b8; }
      #tut-tip .tut-btns { display: flex; gap: 8px; }
      #tut-tip button { border-radius: 8px; padding: 6px 12px; font-weight: 700; cursor: pointer; font-size: .76rem; border: 1px solid transparent; }
      #tut-next { background: #16a34a; color: #fff; }
      #tut-next:hover { filter: brightness(1.1); }
      #tut-skip { background: transparent; color: #94a3b8; border-color: rgba(148,163,184,0.4); }
      #tut-skip:hover { color: #e2e8f0; }
    `;
    document.head.appendChild(s);
  }

  function build() {
    injectStyle();
    const blocker = document.createElement('div');
    blocker.id = 'tut-blocker';
    const spot = document.createElement('div');
    spot.id = 'tut-spot';
    const tip = document.createElement('div');
    tip.id = 'tut-tip';
    tip.innerHTML = `
      <h4 id="tut-title"></h4>
      <div id="tut-text"></div>
      <div class="tut-actions">
        <span class="tut-progress" id="tut-progress"></span>
        <span class="tut-btns">
          <button id="tut-skip" type="button">跳過</button>
          <button id="tut-next" type="button">下一步 ▶</button>
        </span>
      </div>`;
    document.body.appendChild(blocker);
    document.body.appendChild(spot);
    document.body.appendChild(tip);
    tip.querySelector('#tut-next').addEventListener('click', next);
    tip.querySelector('#tut-skip').addEventListener('click', () => finish(true));
    dom = { blocker, spot, tip };
  }

  function teardown() {
    if (!dom) return;
    [dom.blocker, dom.spot, dom.tip].forEach(el => { if (el && el.parentNode) el.parentNode.removeChild(el); });
    dom = null;
  }

  function placeFor(step) {
    const spot = dom.spot, tip = dom.tip;
    const target = step.center ? null : document.querySelector(step.sel);
    const vw = window.innerWidth, vh = window.innerHeight;
    if (target && target.offsetParent !== null) {
      const r = target.getBoundingClientRect();
      const pad = 6;
      spot.style.opacity = '1';
      spot.style.top = (r.top - pad) + 'px';
      spot.style.left = (r.left - pad) + 'px';
      spot.style.width = (r.width + pad * 2) + 'px';
      spot.style.height = (r.height + pad * 2) + 'px';
      // tip 放在目標下方，空間不足則放上方/左側，最後夾進視窗
      tip.style.visibility = 'hidden';
      tip.style.left = '0px'; tip.style.top = '0px';
      const tr = tip.getBoundingClientRect();
      let left = Math.min(Math.max(8, r.left), vw - tr.width - 8);
      let top = r.bottom + 12;
      if (top + tr.height > vh - 8) top = Math.max(8, r.top - tr.height - 12);
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
      tip.style.visibility = 'visible';
    } else {
      // 置中（或目標不可見時的後備）
      spot.style.opacity = '0';
      spot.style.width = '0px'; spot.style.height = '0px';
      tip.style.visibility = 'hidden';
      const tr = tip.getBoundingClientRect();
      tip.style.left = Math.round((vw - tr.width) / 2) + 'px';
      tip.style.top = Math.round((vh - tr.height) / 2) + 'px';
      tip.style.visibility = 'visible';
    }
  }

  function showStep(i) {
    const step = STEPS[i];
    if (!step) return finish(false);
    dom.tip.querySelector('#tut-title').textContent = step.title || '';
    dom.tip.querySelector('#tut-text').textContent = step.text || '';
    dom.tip.querySelector('#tut-progress').textContent = `${i + 1} / ${STEPS.length}`;
    dom.tip.querySelector('#tut-next').textContent = (i === STEPS.length - 1) ? '完成 ✓' : '下一步 ▶';
    const needScene = step.scene && typeof global.changeScene === 'function';
    if (needScene) {
      try { global.changeScene(step.scene); } catch (e) {}
      setTimeout(() => placeFor(step), 360);
    } else {
      setTimeout(() => placeFor(step), 30);
    }
  }

  function next() {
    idx++;
    if (idx >= STEPS.length) return finish(false);
    showStep(idx);
  }

  function finish(skipped) {
    if (!running) return;
    running = false;
    const last = STEPS[STEPS.length - 1];
    if (!skipped && theGame && last && last.reward && typeof theGame.grantGoldBaseball === 'function') {
      theGame.grantGoldBaseball(last.reward, '完成新手教學');
    }
    if (theGame) {
      theGame.tutorialCompleted = true;
      try { theGame.saveManager && theGame.saveManager.save(theGame); } catch (e) {}
    }
    teardown();
  }

  function start(game) {
    if (running) return;
    theGame = game || global.game || null;
    running = true;
    idx = 0;
    build();
    showStep(0);
  }

  function isCompleted(game) {
    const g = game || global.game;
    return !!(g && g.tutorialCompleted);
  }

  function autoStartIfNeeded(game) {
    const g = game || global.game;
    if (!g || g.tutorialCompleted) return;
    start(g);
  }

  global.TutorialSystem = { start, isCompleted, autoStartIfNeeded };
})(typeof window !== 'undefined' ? window : globalThis);
