// story-intro.js — v3.23：主線劇情序章 UI（第一次進入遊戲時播放）
// 投影片式呈現 STORY_DATA.INTRO_CHAPTERS 各段。
// 完成後設定 game.storylineIntroShown = true，並存檔。
(function (global) {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function ensureModal() {
    let modal = document.getElementById('story-intro-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'story-intro-modal';
    modal.className = 'modal hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="modal-box story-modal-box">
        <div class="story-frame">
          <div class="story-tag" id="story-tag"></div>
          <h2 class="story-title" id="story-title"></h2>
          <div class="story-narrator" id="story-narrator"></div>
          <div class="story-text" id="story-text"></div>
          <div class="story-footer">
            <div class="story-progress" id="story-progress"></div>
            <div class="story-actions">
              <button class="story-skip" id="story-skip-btn" type="button">跳過序章</button>
              <button class="story-next" id="story-next-btn" type="button">繼續 ▸</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function renderChapter(modal, chapters, idx) {
    const ch = chapters[idx];
    if (!ch) return;
    modal.querySelector('#story-tag').textContent = ch.sceneTag || '';
    modal.querySelector('#story-title').textContent = ch.title || '';
    modal.querySelector('#story-narrator').textContent = ch.narrator ? `【${ch.narrator}】` : '';
    const textEl = modal.querySelector('#story-text');
    textEl.innerHTML = (ch.text || []).map(line =>
      `<p class="story-line">${escapeHtml(line)}</p>`
    ).join('');
    const progressEl = modal.querySelector('#story-progress');
    progressEl.textContent = `${idx + 1} / ${chapters.length}`;
    const nextBtn = modal.querySelector('#story-next-btn');
    nextBtn.textContent = idx === chapters.length - 1 ? '開始挑戰 ▶' : '繼續 ▸';
  }

  function close(modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  function playIntro(game, onFinish) {
    const chapters = global.STORY_DATA?.INTRO_CHAPTERS || [];
    if (!chapters.length) { if (onFinish) onFinish(); return; }
    const modal = ensureModal();
    let idx = 0;
    renderChapter(modal, chapters, idx);
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const nextBtn = modal.querySelector('#story-next-btn');
    const skipBtn = modal.querySelector('#story-skip-btn');

    const finish = () => {
      close(modal);
      if (game) {
        game.storylineIntroShown = true;
        try { game.saveManager?.save(game); } catch (e) {}
      }
      if (onFinish) onFinish();
    };

    nextBtn.onclick = () => {
      idx++;
      if (idx >= chapters.length) return finish();
      renderChapter(modal, chapters, idx);
    };
    skipBtn.onclick = () => finish();
  }

  // 在遊戲啟動後呼叫；若已看過則不再播放
  function autoPlayIfNeeded(game) {
    if (!game) return;
    // v4.1 Phase 4：序章結束後接新手教學；若序章已看過則直接視需要啟動教學
    const startTutorial = () => {
      if (global.TutorialSystem && typeof global.TutorialSystem.autoStartIfNeeded === 'function') {
        global.TutorialSystem.autoStartIfNeeded(game);
      }
    };
    if (game.storylineIntroShown) {
      requestAnimationFrame(startTutorial);
      return;
    }
    // 延遲一個動畫幀，讓 UI 渲染完成
    requestAnimationFrame(() => playIntro(game, startTutorial));
  }

  global.StoryIntro = { playIntro, autoPlayIfNeeded };
})(typeof window !== 'undefined' ? window : globalThis);
