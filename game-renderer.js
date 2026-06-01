(function (global) {
  "use strict";

  /**
   * game-renderer.js  v2.0
   *
   * 重構要點（§16.3.2）：
   *   1. GameUIRenderer 改為薄代理層，把實際渲染委派給 CompositeGameRenderer。
   *   2. 若 game-renderer-modules.js 已載入，就使用 CompositeGameRenderer；
   *      否則 fallback 到原本的自包含實作（向後相容）。
   *   3. 全域 helper（createPixelPortrait 等）透過 DepRegistry 注入，
   *      不再直接讀 window.xxx（但仍保留 window 讀取作為預設）。
   *   4. 外部 API 不變：GameUIRenderer.render(game) 依然有效。
   */

  // ─────────────────────────────────────────────
  // 向後相容 fallback（若 game-renderer-modules.js 未載入）
  // ─────────────────────────────────────────────

  /**
   * 精簡版 GameUIRenderer：在 CompositeGameRenderer 不可用時使用。
   * 邏輯與舊版完全相同，只作為安全網。
   */
  class GameUIRendererLegacy {
    constructor(doc = global.document) {
      this.doc = doc;
    }

    getElement(id) { return this.doc ? this.doc.getElementById(id) : null; }
    setText(id, value) { const el = this.getElement(id); if (el) el.textContent = value; }

    // v4.2a+4.2b：播放日誌渲染（向後相容舊格式 + 新格式分類/雙人播報）
    _renderPlayLog(log) {
      const icons = { hr:'💣 ', hit:'🏏 ', double:'⚡ ', triple:'🔥 ', k:'❌ ', bb:'🟡 ', out:'⬛ ', error:'💥 ', sb:'🏃 ', run:'⬆ ', tension:'⚠ ', system:'' };
      const entries = log.slice(-20).reverse();
      return entries.map((entry, i) => {
        if (typeof entry === 'string') {
          return `<p class="log-entry log-system log-slide-in" style="animation-delay:${i * 0.02}s">${entry}</p>`;
        }
        const type = entry.type || 'system';
        const level = entry.level || 'normal';
        const animClass = (i === 0 && level === 'highlight') ? 'log-pop' : 'log-slide-in';
        const typeClass = `log-${type}`;
        const levelClass = (level === 'highlight') ? 'log-highlight' : '';
        const icon = icons[type] || '';

        if (entry.lines && Array.isArray(entry.lines)) {
          const linesHtml = entry.lines.map(l => {
            const cls = `broadcast-${l.speaker}`;
            const label = l.speaker === 'caster' ? '蔡兄' : '鍾sir';
            return `<span class="${cls}">【${label}】${l.text}</span>`;
          }).join('\n');
          return `<div class="log-entry ${typeClass} ${levelClass} ${animClass} log-broadcast" style="animation-delay:${i * 0.03}s">${linesHtml}</div>`;
        }
        return `<p class="log-entry ${typeClass} ${levelClass} ${animClass}" style="animation-delay:${i * 0.02}s">${icon}${entry.text || entry}</p>`;
      }).join('');
    }

    render(game) {
      if (!this.doc || !game) return;
      const matchup      = game.getCurrentMatchup();
      const activePitcher = matchup.pitcher;
      const logDiv = this.getElement('play-log');
      if (logDiv) {
        logDiv.innerHTML = this._renderPlayLog(game.log);
      }
      this.setText('inning',         game.inning);
      this.setText('half',           game.currentHalf === 'top' ? i18n.top : i18n.bottom);
      this.setText('outs',           game.outs);
      this.setText('balls',          game.balls);
      this.setText('strikes',        game.strikes);
      this.setText('runners',        game.getRunnersText());
      this.setText('weather',        game.weather);
      this.setText('mana',           activePitcher?.state?.mana ?? 0);
      this.setText('currency',       game.currency);
      this.setText('score-player',   game.playerScore);
      this.setText('score-opponent', game.opponentScore);
      this.updateClassicScoreboard(game, matchup);
      this.setText('season-record',  game.seasonManager?.record   ?? '');
      this.setText('upcoming-match', game.seasonManager?.currentMatch ?? '');
      this.setText('season-length',  game.seasonManager?.seasonLength ?? '');
      this.setText('current-tactic', game.getGameSituationLabel());

      const matchupText = this.getElement('matchup-text');
      if (matchupText) matchupText.textContent = `${matchup.offenseLabel}進攻 / ${matchup.defenseLabel}守備`;
      const pitcherText = this.getElement('current-pitcher');
      if (pitcherText) pitcherText.textContent = `${matchup.pitcher.name} (${matchup.pitcher.getPositionLabel()})`;
      const batterText  = this.getElement('current-batter');
      if (batterText)  batterText.textContent  = `${matchup.batter.name} (${matchup.batter.getPositionLabel()})`;
      const crowdText   = this.getElement('crowd-energy');
      if (crowdText)   crowdText.textContent   = game.getCrowdEnergy();
      const eventText   = this.getElement('season-event');
      if (eventText) {
        eventText.textContent = game.currentSeasonEvent
          ? `${game.currentSeasonEvent.title}：${game.currentSeasonEvent.text}`
          : '尚無事件';
      }
      const autoToggle = this.getElement('auto-toggle');
      if (autoToggle) autoToggle.textContent = game.autoSimEnabled ? '全場自動：進行中' : '全場自動';

      const cardsDiv = this.getElement('cards');
      if (cardsDiv) {
        cardsDiv.innerHTML = game.cardManager.hand.map((card, i) => (
          `<button onclick="activateCard(${i})" class="bg-purple-500 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs mr-2 mb-2">
            ${card.name} (${card.cost} ${i18n.mana})
          </button>`
        )).join('');
      }

      this.updateDiamondUI(game);
      if (typeof global.updateDiamondRunners === 'function') global.updateDiamondRunners();
      this.updateOpponentUI(game);
      this.updateBullpenUI(game);
      this.updateRosterUI(game);
      const shardChip = this.getElement('shard-count');
      if (shardChip) shardChip.textContent = game.playerShards || 0;
    }

    updateDiamondUI(game) {
      let container = this.getElement('diamond-container');
      if (!container) {
        const gameTab = this.getElement('game-tab');
        if (!gameTab) return;
        container = this.doc.createElement('div');
        container.id = 'diamond-container';
        container.className = 'baseball-diamond';
        gameTab.insertBefore(container, gameTab.firstChild);
      }
      const svg = container.querySelector('svg');
      if (svg) container.removeChild(svg);
      if (typeof global.createDiamondSVG === 'function') container.appendChild(global.createDiamondSVG());
    }

    updateRosterUI(game) {
      const rosterDiv = this.getElement('roster-gallery');
      if (!rosterDiv) return;
      const cardMajorCount = game.roster.players.filter(p => p.level !== 'minor').length;
      const renderRosterCard = ({ p, i }) => {
        const rank = p.getRank();
        const isPitcher = p.canPitch() && p.role === 'P';
        const lineupSpot = game.playerBattingOrder.indexOf(i);
        const assignedPos = game.getAssignedPosition(i);
        const staminaPct = Math.max(0, Math.min(100, Math.round((p.state.stamina / Math.max(1, p.maxStamina)) * 100)));
        const staminaState = staminaPct < 30 ? 'danger' : staminaPct < 60 ? 'warning' : 'safe';
        const roleTag = isPitcher ? (p.pitcherRole === 'SP' ? '先發投手' : '後援投手') : p.getPositionLabel();
        const restTag = isPitcher && p.idealRest ? `休 ${p.daysOfRest ?? 0}/${p.idealRest()}${p.isOverworked?.() ? ' 警戒' : ''}` : '';
        const statPairs = isPitcher
          ? [['球速', p.abilities.velocity], ['控球', p.abilities.control], ['變化', p.abilities.breaking], ['球威', p.abilities.stuff]]
          : [['巧打', p.abilities.contact],  ['長打', p.abilities.power],   ['走力', p.abilities.speed],   ['守備', p.abilities.fielding]];
        const traitMarkup = (p.traits || []).slice(0, 3).map(trait => `<span class="trait-pill trait-${getTraitTier(trait)}">${trait}</span>`).join('') || '<span class="trait-pill">標準型</span>';
        const bio = (global.PLAYER_BIOS && global.PLAYER_BIOS[p.name]) || '';
        return `
          <article class="trading-card roster-card ${p.level === 'minor' ? 'minor-card' : ''}">
            <div class="card-rank-badge badge-${rank.toLowerCase()}">${rank}</div>
            <div class="roster-card-art">${createPixelPortrait(p, 84)}</div>
            <div class="card-name">${p.name}</div>
            <div class="card-meta">
              <span>${roleTag}</span><span>${p.team}</span>
              ${lineupSpot >= 0  ? `<span>第 ${lineupSpot + 1} 棒</span>` : ''}
              ${assignedPos      ? `<span>守 ${POSITION_LABELS[assignedPos] || assignedPos}</span>` : ''}
              ${restTag          ? `<span>${restTag}</span>` : ''}
            </div>
            ${bio ? `<p class="roster-card-bio">${bio}</p>` : ''}
            <div class="detail-traits roster-card-traits">${traitMarkup}</div>
            <div class="card-stats roster-card-stats">
              ${statPairs.map(([label, value]) => `
                <div class="card-stat-item">
                  <span>${label}</span><strong>${clampInt(value)}</strong>
                  <div class="stat-meter"><i style="width:${clampInt(value,0,99)}%"></i></div>
                </div>`).join('')}
            </div>
            <div class="stamina-line"><span>體力 ${clampInt(p.state.stamina)}/${p.maxStamina}</span><strong>${staminaPct}%</strong></div>
            <div class="meter ${staminaState}"><span style="width:${staminaPct}%"></span></div>
            <div class="card-buttons roster-card-actions">
              <button class="card-btn card-btn-detail" onclick="openPlayerDetail(${i})">詳細</button>
              ${p.canPitch() && p.level !== 'minor' ? `<button class="card-btn" onclick="setActivePitcher(${i})">登板</button>` : ''}
              ${p.canBat()   && p.level !== 'minor' ? `<button class="card-btn card-btn-batter" onclick="setActiveBatter(${i})">指定打者</button>` : ''}
              <button class="card-btn card-btn-level" onclick="togglePlayerLevel(${i})">${p.level === 'minor' ? '升一軍' : '下二軍'}</button>
            </div>
          </article>`;
      };
      const majorCards = game.roster.players.map((p, i) => ({ p, i })).filter(({ p }) => p.level !== 'minor');
      const minorCards = game.roster.players.map((p, i) => ({ p, i })).filter(({ p }) => p.level === 'minor');
      rosterDiv.innerHTML = `
        <div class="roster-sections card-mode">
          <section class="roster-section major-section">
            <header><h3>一軍卡牌牆 <span class="roster-count">${cardMajorCount} / ${game.majorRosterLimit}</span></h3></header>
            <div class="roster-section-cards">${majorCards.map(renderRosterCard).join('')}</div>
          </section>
          <section class="roster-section minor-section">
            <header><h3>二軍與培養名單 <span class="roster-count">${minorCards.length}</span></h3></header>
            <div class="roster-section-cards">${minorCards.map(renderRosterCard).join('') || '<p class="pregame-note">目前沒有二軍球員。</p>'}</div>
          </section>
        </div>`;
    }

    updateOpponentUI(game) {
      const lineupDiv   = this.getElement('opponent-lineup');
      const upcomingDiv = this.getElement('upcoming-batters');
      const playerLineupDiv = this.getElement('player-lineup');
      if (!lineupDiv || !upcomingDiv) return;
      if (!game.opponentTeam) { lineupDiv.innerHTML = '<p>No opponent loaded.</p>'; upcomingDiv.innerHTML = ''; return; }
      const oppOrder   = game.opponentTeam.battingOrder;
      const oppCurrent = game.opponentTeam.nextBatterIndex;
      const oppWindow  = [0, 1, 2].map(off => {
        const idx = (oppCurrent + off) % oppOrder.length;
        return { player: oppOrder[idx], orderIndex: idx, isCurrent: off === 0 };
      });
      lineupDiv.innerHTML = `<h4 class="font-bold">${game.opponentTeam.name}</h4>` + oppWindow.map(({ player, orderIndex, isCurrent }) => {
        const cls   = isCurrent ? 'font-bold text-blue-700 lineup-current' : 'lineup-upcoming';
        const label = isCurrent ? '⚾ 當前' : `+${oppWindow.findIndex(x => x.orderIndex === orderIndex)}`;
        return `<p class="${cls}"><span class="lineup-tag">${label}</span> ${orderIndex + 1}. ${player.name} (${player.getRank()})</p>`;
      }).join('');
      upcomingDiv.innerHTML = game.opponentTeam.getUpcomingBatters().map(p => `<p>${p.name} (${p.getRank()})</p>`).join('');
      if (playerLineupDiv) {
        const myCurrent = game.playerNextBatterIndex;
        playerLineupDiv.innerHTML = [0, 1, 2].map(off => {
          const idx = (myCurrent + off) % game.playerBattingOrder.length;
          const playerIndex = game.playerBattingOrder[idx];
          const player = game.roster.players[playerIndex];
          const isCurrent = off === 0 && game.currentHalf === 'bottom';
          const cls    = isCurrent ? 'font-bold text-blue-700 lineup-current' : 'lineup-upcoming';
          const label  = off === 0 ? '⚾ 當前' : `+${off}`;
          const assigned = game.getAssignedPosition(playerIndex) || 'DH';
          return `<p class="${cls}"><span class="lineup-tag">${label}</span> ${idx + 1}. ${player.name} (${POSITION_LABELS[assigned] || assigned})</p>`;
        }).join('');
      }
    }

    updateBullpenUI(game) {
      const bullpenDiv = this.getElement('bullpen');
      if (!bullpenDiv) return;
      const pitchers = game.roster.players.map((p, i) => ({ p, i })).filter(({ p }) => p.canPitch() && p.level !== 'minor');
      const renderRow = ({ p, i }) => {
        const ideal  = p.idealRest ? p.idealRest() : 0;
        const rest   = p.daysOfRest ?? 0;
        const tired  = p.isOverworked && p.isOverworked();
        const restTag = ideal ? `休 ${rest}/${ideal}${tired ? ' ⚠' : ''}` : '';
        const roleTag = p.pitcherRole === 'SP' ? '先發' : p.pitcherRole === 'RP' ? '後援' : '投手';
        return `<div class="bullpen-row ${tired ? 'tired' : ''}">
          <div><strong>${p.name}</strong><small>${roleTag}・體 ${clampInt(p.state.stamina)}/${p.maxStamina}・${restTag}</small></div>
          <button onclick="bringInReliever(${i})" class="bullpen-btn">登板</button>
        </div>`;
      };
      const sps = pitchers.filter(x => x.p.pitcherRole === 'SP');
      const rps = pitchers.filter(x => x.p.pitcherRole === 'RP');
      bullpenDiv.innerHTML =
        `<h4 class="bullpen-section">先發輪值</h4>` +
        (sps.length ? sps.map(renderRow).join('') : '<p class="pregame-note">無先發投手</p>') +
        `<h4 class="bullpen-section">後援牛棚</h4>` +
        (rps.length ? rps.map(renderRow).join('') : '<p class="pregame-note">無後援投手</p>');
    }

    updateClassicScoreboard(game, matchup = game.getCurrentMatchup()) {
      const board = this.getElement('classic-scoreboard');
      if (!board) return;
      this.setText('board-batter',      matchup?.batter?.name ?? '--');
      this.setText('board-ball',        game.balls);
      this.setText('board-strike',      game.strikes);
      this.setText('board-out',         game.outs);
      this.setText('board-visitor-name', (game.currentOpponent ?? 'VISITOR').slice(0, 8));
      this.setText('board-home-name',   'HOME');
      this.setText('line-visitor-r',    game.opponentScore);
      this.setText('line-home-r',       game.playerScore);
      this.setText('line-visitor-h',    game.opponentHits  || 0);
      this.setText('line-home-h',       game.playerHits    || 0);
      this.setText('line-visitor-e',    game.opponentErrors || 0);
      this.setText('line-home-e',       game.playerErrors  || 0);
      for (let n = 1; n <= 9; n++) {
        this.setText(`line-visitor-${n}`, game.getLineScoreValue('opponent', n));
        this.setText(`line-home-${n}`,    game.getLineScoreValue('player',   n));
      }
    }
  }

  // ─────────────────────────────────────────────
  // 主要匯出：GameUIRenderer（代理層）
  // ─────────────────────────────────────────────

  class GameUIRenderer {
    constructor(doc = global.document) {
      // 優先使用 CompositeGameRenderer（來自 game-renderer-modules.js）
      if (typeof global.CompositeGameRenderer !== 'undefined') {
        this._impl = new global.CompositeGameRenderer(doc);
        this._usingComposite = true;
      } else {
        // Fallback：自包含舊版
        this._impl = new GameUIRendererLegacy(doc);
        this._usingComposite = false;
        if (typeof console !== 'undefined') {
          console.info('[GameUIRenderer] game-renderer-modules.js 未載入，使用 legacy 模式。');
        }
      }
    }

    render(game)                          { return this._impl.render(game); }
    updateClassicScoreboard(game, matchup){ return this._impl.updateClassicScoreboard(game, matchup); }
    updateDiamondUI(game)                 { return this._impl.updateDiamondUI(game); }
    updateOpponentUI(game)                { return this._impl.updateOpponentUI(game); }
    updateBullpenUI(game)                 { return this._impl.updateBullpenUI(game); }
    updateRosterUI(game)                  { return this._impl.updateRosterUI(game); }

    /**
     * 允許在執行期注入自訂依賴（僅在 CompositeGameRenderer 模式下有效）
     */
    registerDep(name, fn) {
      if (this._usingComposite && typeof this._impl.registerDep === 'function') {
        this._impl.registerDep(name, fn);
      }
      return this;
    }

    /** 向下相容：讓 game.js 可以讀到 doc */
    get doc() { return this._impl.doc || this._impl._deps?.call('doc'); }
  }

  global.GameUIRenderer = GameUIRenderer;

})(typeof window !== "undefined" ? window : globalThis);
