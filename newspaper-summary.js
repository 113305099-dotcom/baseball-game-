// newspaper-summary.js — v3.23：賽後旺來體育報紙頭版
// 取代舊版的 showMatchSummary 內容，改成像素風的報紙頭版排版。
// 使用既有的 #match-summary-modal，但把內部 HTML 完全重畫成報紙樣式。
(function (global) {
  "use strict";

  const PARAMS = () => global.GAME_PARAMS || {};

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function pick(arr, fallback = '') {
    if (!Array.isArray(arr) || !arr.length) return fallback;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // 依比分挑選頭版大標
  function pickHeadline(playerScore, opponentScore, ctx = {}) {
    const cfg = PARAMS().newspaper?.headlines || {};
    const diff = playerScore - opponentScore;
    if (ctx.walkoff) return pick(cfg.walkoff, '再見一擊！政大笑到最後');
    if (ctx.comeback) return pick(cfg.comeback, '驚天逆轉！政大反敗為勝');
    if (diff >= 6) return pick(cfg.bigWin, '一面倒！政大屠殺敵營');
    if (diff > 0) return pick(cfg.win, '政大力克強敵');
    if (diff === 0) return pick(cfg.tie, '鏖戰未分勝負 政大握平局');
    if (diff >= -2) return pick(cfg.close, '一分天堂 一分地獄');
    return pick(cfg.blowout, '苦吞慘敗 政大全面失守');
  }

  // 副標（lead paragraph）— 用 commentary-data 裡的 newspaperLead
  function pickLead(playerScore, opponentScore, ctx = {}) {
    const lib = global.COMMENTARY_LIBRARY?.newspaperLead || {};
    const diff = playerScore - opponentScore;
    let arr;
    if (ctx.walkoff) arr = lib.walkoff;
    else if (ctx.comeback) arr = lib.comeback;
    else if (diff >= 6) arr = lib.bigWin;
    else if (diff > 0) arr = lib.win;
    else if (diff === 0) arr = lib.tie;
    else if (diff >= -2) arr = lib.loss;
    else arr = lib.blowout;
    return pick(arr, '政大今日繳出值得回味的一戰。');
  }

  // 取得今日日期（依 game.currentYear 假冒）
  function formatIssue(game) {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const year = game?.currentYear || now.getFullYear();
    return `${year}年${m}月${d}日`;
  }

  function renderScoreboard(playerScore, opponentScore, opponentName, lineScore, playerHits, opponentHits, playerErrors, opponentErrors) {
    const inningNums = Array.from({ length: 9 }, (_, i) => `<th>${i + 1}</th>`).join('');
    const playerRow = Array.from({ length: 9 }, (_, i) => `<td>${lineScore?.player?.[i] || 0}</td>`).join('');
    const oppRow = Array.from({ length: 9 }, (_, i) => `<td>${lineScore?.opponent?.[i] || 0}</td>`).join('');
    return `
      <table class="newspaper-scoreboard">
        <thead><tr><th class="team">TEAM</th>${inningNums}<th>R</th><th>H</th><th>E</th></tr></thead>
        <tbody>
          <tr><td class="team-name">政大</td>${playerRow}<td class="run">${playerScore}</td><td>${playerHits}</td><td>${playerErrors}</td></tr>
          <tr><td class="team-name">${escapeHtml(opponentName)}</td>${oppRow}<td class="run">${opponentScore}</td><td>${opponentHits}</td><td>${opponentErrors}</td></tr>
        </tbody>
      </table>`;
  }

  function renderKeyEvents(matchStats) {
    const events = matchStats?.keyEvents || [];
    if (!events.length) {
      return '<div class="newspaper-events-empty">— 本場無重大紀錄事件 —</div>';
    }
    const halfLabel = h => h === 'bottom' ? '下' : '上';
    const items = events.slice(-6).map(e => `
      <li class="newspaper-event">
        <span class="inning-tag">${e.inning}局${halfLabel(e.half)}</span>
        <span class="event-text">${escapeHtml(e.txt)}</span>
      </li>`).join('');
    return `<ul class="newspaper-events">${items}</ul>`;
  }

  function renderStatsLine(matchStats, opponentName) {
    if (!matchStats) return '';
    return `
      <div class="newspaper-stats">
        <div class="stats-team">
          <span class="stats-team-name">政大</span>
          <span class="stats-line">HR ${matchStats.playerHR}　K ${matchStats.playerK}　BB ${matchStats.playerBB}</span>
        </div>
        <div class="stats-team">
          <span class="stats-team-name">${escapeHtml(opponentName)}</span>
          <span class="stats-line">HR ${matchStats.opponentHR}　K ${matchStats.opponentK}　BB ${matchStats.opponentBB}</span>
        </div>
      </div>`;
  }

  function renderMVP(mvp) {
    if (!mvp) return '';
    const traits = (mvp.traits || []).slice(0, 2).join('｜');
    return `
      <div class="newspaper-mvp">
        <div class="mvp-banner">★ 本場 MVP ★</div>
        <div class="mvp-name">${escapeHtml(mvp.name)}</div>
        <div class="mvp-stat">${escapeHtml(mvp.line || '')}</div>
        ${traits ? `<div class="mvp-traits">${escapeHtml(traits)}</div>` : ''}
      </div>`;
  }

  function renderRewards(rewards) {
    if (!rewards) return '';
    const moneyLine = `<li><span class="reward-icon">$</span><span>資金 +${rewards.money || 0}</span></li>`;
    const heatLine = rewards.heat ? `<li><span class="reward-icon">♨</span><span>球場熱度 +${rewards.heat}</span></li>` : '';
    const certLine = rewards.coachCerts ? `<li><span class="reward-icon">▲</span><span>教練證 ×${rewards.coachCerts}</span></li>` : '';
    const cardLines = (rewards.playerCards || []).map(c =>
      `<li><span class="reward-icon">■</span><span>球員卡：${escapeHtml(c.name)}</span></li>`
    ).join('');
    return `
      <div class="newspaper-rewards">
        <div class="rewards-title">▌ 本場獎勵</div>
        <ul class="rewards-list">${moneyLine}${heatLine}${certLine}${cardLines}</ul>
      </div>`;
  }

  // 主入口：產生報紙頭版 HTML 並注入 modal
  function renderNewspaperSummary(ctx) {
    const {
      result, playerScore, opponentScore,
      opponentName, lineScore, matchStats,
      playerHits, opponentHits, playerErrors, opponentErrors,
      mvp, rewards, standingsHTML,
      game
    } = ctx;
    const cfg = PARAMS().newspaper || {};
    const headline = pickHeadline(playerScore, opponentScore, ctx);
    const lead = pickLead(playerScore, opponentScore, ctx);
    const resultText = result === 'Win' ? '勝利' : result === 'Loss' ? '敗北' : '平局';
    const resultClass = result === 'Win' ? 'win' : result === 'Loss' ? 'loss' : 'tie';

    return `
      <article class="newspaper-front" data-result="${resultClass}">
        <header class="newspaper-masthead">
          <div class="masthead-left">
            <div class="paper-name">${escapeHtml(cfg.title || '旺來體育')}</div>
            <div class="paper-subtitle">${escapeHtml(cfg.subtitle || 'WANG-LAI SPORTS DAILY')}</div>
          </div>
          <div class="masthead-right">
            <div class="issue-date">${escapeHtml(formatIssue(game))}</div>
            <div class="issue-no">第 ${ (game?.seasonManager?.completedMatches || 0) + 1 } 期</div>
          </div>
        </header>

        <div class="newspaper-strap strap-${resultClass}">
          <span class="strap-label">${resultText}</span>
          <span class="strap-score">${playerScore} ─ ${opponentScore}</span>
          <span class="strap-opponent">vs ${escapeHtml(opponentName)}</span>
        </div>

        <h1 class="newspaper-headline">${escapeHtml(headline)}</h1>
        <p class="newspaper-lead">${escapeHtml(lead)}</p>

        <div class="newspaper-body">
          <section class="newspaper-col col-main">
            <h2 class="col-title">逐局戰況</h2>
            ${renderScoreboard(playerScore, opponentScore, opponentName, lineScore, playerHits, opponentHits, playerErrors, opponentErrors)}
            ${renderStatsLine(matchStats, opponentName)}
            <h2 class="col-title">關鍵事件</h2>
            ${renderKeyEvents(matchStats)}
          </section>
          <aside class="newspaper-col col-side">
            ${renderMVP(mvp)}
            ${renderRewards(rewards)}
          </aside>
        </div>

        ${standingsHTML ? `
          <section class="newspaper-standings">
            <h2 class="col-title">聯盟戰績</h2>
            <table class="newspaper-standings-table">
              <thead><tr><th>#</th><th>球隊</th><th>戰績</th><th>勝率</th><th>近況</th></tr></thead>
              <tbody>${standingsHTML}</tbody>
            </table>
          </section>
        ` : ''}

        <footer class="newspaper-footer">
          <span class="footer-tag">— 旺來體育 政大棒球版 / 像素特派員整理 —</span>
        </footer>
      </article>
    `;
  }

  function hideSummary() {
    const modal = document.getElementById('match-summary-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  function showNewspaperSummary(ctx) {
    const modal = document.getElementById('match-summary-modal');
    if (!modal) return;
    const box = modal.querySelector('.modal-box');
    if (!box) return;
    box.innerHTML = `
      <button class="modal-close" type="button" onclick="window.hideSummary()" aria-label="關閉">×</button>
      ${renderNewspaperSummary(ctx)}
    `;
    box.classList.add('newspaper-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  // 點擊 modal 背景也關閉 + Escape 鍵關閉
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function(e) {
      const modal = document.getElementById('match-summary-modal');
      if (modal && e.target === modal) hideSummary();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') hideSummary();
    });
  }

  global.NewspaperSummary = { renderNewspaperSummary, showNewspaperSummary, hideSummary };
  global.hideSummary = hideSummary;
})(typeof window !== 'undefined' ? window : globalThis);
