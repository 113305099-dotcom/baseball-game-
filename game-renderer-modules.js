/**
 * game-renderer-modules.js  v1.0
 *
 * 將 GameUIRenderer 拆成五個可獨立使用的子 renderer。
 * 依實作進度 §16.3 第二優先項目設計。
 *
 * 子模組：
 *   HudRenderer       — 球數 HUD、投打對決資訊列、策略狀態（原 render() 主體）
 *   ScoreboardRenderer — 古典記分板（原 updateClassicScoreboard()）
 *   DiamondRenderer    — 壘包菱形 SVG 容器管理（原 updateDiamondUI()）
 *   BullpenRenderer    — 牛棚列表（原 updateBullpenUI()）
 *   RosterRenderer     — 名單卡牌牆（原 updateRosterUI()）
 *
 * 設計原則：
 *   1. 每個子 renderer 只需知道自己負責的 DOM 區域，不依賴其他子 renderer。
 *   2. 全域 helper（createPixelPortrait、createDiamondSVG 等）透過 depRegistry 注入，
 *      不再直接讀 window.xxx，方便未來測試和模組化。
 *   3. 原本的 GameUIRenderer 依然存在，委派給各子 renderer，外部 API 不變。
 */
(function (global) {
  "use strict";

  // ─────────────────────────────────────────────
  // 依賴注入登記處
  // 避免直接讀 window.xxx，讓每個子 renderer 的依賴明確可見
  // ─────────────────────────────────────────────

  class DepRegistry {
    constructor() {
      this._deps = {};
    }

    register(name, fn) {
      this._deps[name] = fn;
      return this;
    }

    get(name) {
      return this._deps[name] || null;
    }

    call(name, ...args) {
      const fn = this._deps[name];
      if (typeof fn === 'function') return fn(...args);
      return null;
    }
  }

  /**
   * 預設從 window 上讀取所有先前全域函式。
   * 只要 game.js / game-renderer.js 先載入，這裡就可以找到它們。
   * 將來可以逐步替換為真正的模組 import。
   */
  function buildDefaultDepRegistry(doc = global.document) {
    const reg = new DepRegistry();
    const w = global;
    reg.register('createPixelPortrait',    (p, size) => w.createPixelPortrait?.(p, size)    ?? '');
    reg.register('createFallbackPixelPortrait', (p, s) => w.createFallbackPixelPortrait?.(p, s) ?? '');
    reg.register('createDiamondSVG',       ()         => w.createDiamondSVG?.()             ?? null);
    reg.register('updateDiamondRunners',   ()         => w.updateDiamondRunners?.());
    reg.register('clampInt',               (v, a, b)  => w.clampInt?.(v, a, b)              ?? 0);
    reg.register('getTraitTier',           (t)        => w.getTraitTier?.(t)                ?? 'blue');
    reg.register('POSITION_LABELS',        ()         => w.POSITION_LABELS                  ?? {});
    reg.register('PLAYER_BIOS',            ()         => w.PLAYER_BIOS                      ?? {});
    reg.register('i18n',                   ()         => w.i18n                             ?? {});
    reg.register('doc',                    ()         => doc);
    return reg;
  }

  // ─────────────────────────────────────────────
  // 基底類別（DOM 存取共用邏輯）
  // ─────────────────────────────────────────────

  class BaseSubRenderer {
    constructor(deps) {
      this.deps = deps || buildDefaultDepRegistry();
    }

    get doc() { return this.deps.call('doc') || global.document; }

    getElement(id) {
      return this.doc ? this.doc.getElementById(id) : null;
    }

    setText(id, value) {
      const el = this.getElement(id);
      if (el) el.textContent = value;
    }

    i18n() {
      return this.deps.call('i18n') || {};
    }
  }

  // ─────────────────────────────────────────────
  // §1  HudRenderer
  //     球數 HUD、投打資訊列、自動模擬按鈕、手牌
  // ─────────────────────────────────────────────

  class HudRenderer extends BaseSubRenderer {
    render(game) {
      if (!this.doc || !game) return;
      const matchup = game.getCurrentMatchup();
      const i18n    = this.i18n();

      // 播放日誌
      const logDiv = this.getElement('play-log');
      if (logDiv) {
        logDiv.innerHTML = game.log.slice(-20).reverse()
          .map(msg => `<p>${msg}</p>`).join('');
      }

      // 局數、球數
      this.setText('inning',  game.inning);
      this.setText('half',    game.currentHalf === 'top' ? i18n.top : i18n.bottom);
      this.setText('outs',    game.outs);
      this.setText('balls',   game.balls);
      this.setText('strikes', game.strikes);
      this.setText('runners', game.getRunnersText());
      this.setText('weather', game.weather);

      // 投手魔力、幣、分數
      this.setText('mana',           matchup.pitcher?.state?.mana ?? 0);
      this.setText('currency',       game.currency);
      this.setText('gold-baseball',  game.goldBaseball ?? 0);
      this.setText('score-player',   game.playerScore);
      this.setText('score-opponent', game.opponentScore);

      // 賽季資訊
      this.setText('season-record',  game.seasonManager?.record   ?? '');
      this.setText('upcoming-match', game.seasonManager?.currentMatch ?? '');
      this.setText('season-length',  game.seasonManager?.seasonLength ?? '');
      this.setText('current-tactic', game.getGameSituationLabel());

      // 投打對決標題列
      const matchupText = this.getElement('matchup-text');
      if (matchupText) {
        matchupText.textContent = `${matchup.offenseLabel}進攻 / ${matchup.defenseLabel}守備`;
      }

      const pitcherText = this.getElement('current-pitcher');
      if (pitcherText) {
        pitcherText.textContent =
          `${matchup.pitcher.name} (${matchup.pitcher.getPositionLabel()})`;
      }

      const batterText = this.getElement('current-batter');
      if (batterText) {
        batterText.textContent =
          `${matchup.batter.name} (${matchup.batter.getPositionLabel()})`;
      }

      // 觀眾能量、賽季事件
      const crowdText = this.getElement('crowd-energy');
      if (crowdText) crowdText.textContent = game.getCrowdEnergy();

      const eventText = this.getElement('season-event');
      if (eventText) {
        eventText.textContent = game.currentSeasonEvent
          ? `${game.currentSeasonEvent.title}：${game.currentSeasonEvent.text}`
          : '尚無事件';
      }

      // 自動模擬按鈕
      const autoToggle = this.getElement('auto-toggle');
      if (autoToggle) {
        autoToggle.textContent = game.autoSimEnabled ? '全場自動：進行中' : '全場自動';
      }

      // 手牌
      this._renderCards(game);

      // 碎片數
      const shardChip = this.getElement('shard-count');
      if (shardChip) shardChip.textContent = game.playerShards || 0;
    }

    _renderCards(game) {
      const cardsDiv = this.getElement('cards');
      if (!cardsDiv) return;
      const i18n = this.i18n();
      cardsDiv.innerHTML = game.cardManager.hand.map((card, i) => (
        `<button onclick="activateCard(${i})"
                 class="bg-purple-500 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs mr-2 mb-2">
          ${card.name} (${card.cost} ${i18n.mana})
        </button>`
      )).join('');
    }
  }

  // ─────────────────────────────────────────────
  // §2  ScoreboardRenderer
  //     古典記分板（9 局 + RHE）
  // ─────────────────────────────────────────────

  class ScoreboardRenderer extends BaseSubRenderer {
    render(game, matchup) {
      const board = this.getElement('classic-scoreboard');
      if (!board) return;

      const m = matchup || game.getCurrentMatchup();
      this.setText('board-batter',      m?.batter?.name ?? '--');
      this.setText('board-ball',        game.balls);
      this.setText('board-strike',      game.strikes);
      this.setText('board-out',         game.outs);
      this.setText('board-visitor-name', (game.currentOpponent ?? 'VISITOR').slice(0, 8));
      this.setText('board-home-name',   'HOME');
      this.setText('line-visitor-r',    game.opponentScore);
      this.setText('line-home-r',       game.playerScore);
      this.setText('line-visitor-h',    game.opponentHits  || 0);
      this.setText('line-home-h',       game.playerHits    || 0);
      this.setText('line-visitor-e',    game.opponentErrors|| 0);
      this.setText('line-home-e',       game.playerErrors  || 0);

      for (let n = 1; n <= 9; n++) {
        this.setText(`line-visitor-${n}`, game.getLineScoreValue('opponent', n));
        this.setText(`line-home-${n}`,    game.getLineScoreValue('player',   n));
      }
    }
  }

  // ─────────────────────────────────────────────
  // §3  DiamondRenderer
  //     壘包菱形 SVG 容器管理
  // ─────────────────────────────────────────────

  class DiamondRenderer extends BaseSubRenderer {
    render(game) {
      let container = this.getElement('diamond-container');
      if (!container) {
        const gameTab = this.getElement('game-tab');
        if (!gameTab) return;
        container = this.doc.createElement('div');
        container.id = 'diamond-container';
        container.className = 'baseball-diamond';
        gameTab.insertBefore(container, gameTab.firstChild);
      }

      // 重繪 SVG
      const oldSvg = container.querySelector('svg');
      if (oldSvg) container.removeChild(oldSvg);

      const newSvg = this.deps.call('createDiamondSVG');
      if (newSvg) container.appendChild(newSvg);

      // 更新跑者位置（仍依賴全域函式，待後續模組化）
      this.deps.call('updateDiamondRunners');
    }
  }

  // ─────────────────────────────────────────────
  // §4  BullpenRenderer
  //     牛棚列表
  // ─────────────────────────────────────────────

  class BullpenRenderer extends BaseSubRenderer {
    render(game) {
      const bullpenDiv = this.getElement('bullpen');
      if (!bullpenDiv) return;

      const pitchers = game.roster.players
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.canPitch() && p.level !== 'minor');

      const renderRow = ({ p, i }) => {
        const ideal   = p.idealRest ? p.idealRest() : 0;
        const rest    = p.daysOfRest ?? 0;
        const tired   = p.isOverworked && p.isOverworked();
        const restTag = ideal ? `休 ${rest}/${ideal}${tired ? ' ⚠' : ''}` : '';
        const roleTag = p.pitcherRole === 'SP' ? '先發' : p.pitcherRole === 'RP' ? '後援' : '投手';
        const clampInt = this.deps.call('clampInt') || (v => Math.max(0, Math.min(99, Math.round(v))));
        return `
          <div class="bullpen-row ${tired ? 'tired' : ''}">
            <div>
              <strong>${p.name}</strong>
              <small>${roleTag}・體 ${clampInt(p.state.stamina)}/${p.maxStamina}・${restTag}</small>
            </div>
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
  }

  // ─────────────────────────────────────────────
  // §5  RosterRenderer
  //     名單卡牌牆（一軍 + 二軍）
  // ─────────────────────────────────────────────

  class RosterRenderer extends BaseSubRenderer {
    render(game) {
      const rosterDiv = this.getElement('roster-gallery');
      if (!rosterDiv) return;

      const clampInt       = (...args) => this.deps.call('clampInt', ...args) ?? 0;
      const getTraitTier   = (t)       => this.deps.call('getTraitTier', t) ?? 'blue';
      const createPortrait = (p, s)    => this.deps.call('createPixelPortrait', p, s) ?? '';
      const posLabels      = this.deps.call('POSITION_LABELS') ?? {};
      const playerBios     = this.deps.call('PLAYER_BIOS') ?? {};

      const cardMajorCount = game.roster.players.filter(p => p.level !== 'minor').length;

      const renderCard = ({ p, i }) => {
        const rank        = p.getRank();
        const isPitcher   = p.canPitch() && p.role === 'P';
        const lineupSpot  = game.playerBattingOrder.indexOf(i);
        const assignedPos = game.getAssignedPosition(i);
        const staminaPct  = Math.max(0, Math.min(100, Math.round((p.state.stamina / Math.max(1, p.maxStamina)) * 100)));
        const staminaState= staminaPct < 30 ? 'danger' : staminaPct < 60 ? 'warning' : 'safe';
        const roleTag     = isPitcher ? (p.pitcherRole === 'SP' ? '先發投手' : '後援投手') : p.getPositionLabel();
        const restTag     = isPitcher && p.idealRest
          ? `休 ${p.daysOfRest ?? 0}/${p.idealRest()}${p.isOverworked?.() ? ' 警戒' : ''}`
          : '';
        const statPairs   = isPitcher
          ? [['球速', p.abilities.velocity], ['控球', p.abilities.control], ['變化', p.abilities.breaking], ['球威', p.abilities.stuff]]
          : [['巧打', p.abilities.contact],  ['長打', p.abilities.power],   ['走力', p.abilities.speed],   ['守備', p.abilities.fielding]];
        const traitMarkup = (p.traits || []).slice(0, 3)
          .map(t => `<span class="trait-pill trait-${getTraitTier(t)}">${t}</span>`).join('')
          || '<span class="trait-pill">標準型</span>';
        const bio = playerBios[p.name] ?? '';

        return `
          <article class="trading-card roster-card ${p.level === 'minor' ? 'minor-card' : ''}">
            <div class="card-rank-badge badge-${rank.toLowerCase()}">${rank}</div>
            <div class="roster-card-art">${createPortrait(p, 84)}</div>
            <div class="card-name">${p.name}</div>
            <div class="card-meta">
              <span>${roleTag}</span>
              <span>${p.team}</span>
              ${lineupSpot >= 0  ? `<span>第 ${lineupSpot + 1} 棒</span>` : ''}
              ${assignedPos      ? `<span>守 ${posLabels[assignedPos] || assignedPos}</span>` : ''}
              ${restTag          ? `<span>${restTag}</span>` : ''}
            </div>
            ${bio ? `<p class="roster-card-bio">${bio}</p>` : ''}
            <div class="detail-traits roster-card-traits">${traitMarkup}</div>
            <div class="card-stats roster-card-stats">
              ${statPairs.map(([label, value]) => `
                <div class="card-stat-item">
                  <span>${label}</span>
                  <strong>${clampInt(value)}</strong>
                  <div class="stat-meter"><i style="width:${clampInt(value, 0, 99)}%"></i></div>
                </div>
              `).join('')}
            </div>
            <div class="stamina-line">
              <span>體力 ${clampInt(p.state.stamina)}/${p.maxStamina}</span>
              <strong>${staminaPct}%</strong>
            </div>
            <div class="meter ${staminaState}"><span style="width:${staminaPct}%"></span></div>
            <div class="card-buttons roster-card-actions">
              <button class="card-btn card-btn-detail" onclick="openPlayerDetail(${i})">詳細</button>
              ${p.canPitch() && p.level !== 'minor' ? `<button class="card-btn" onclick="setActivePitcher(${i})">登板</button>` : ''}
              ${p.canBat()   && p.level !== 'minor' ? `<button class="card-btn card-btn-batter" onclick="setActiveBatter(${i})">指定打者</button>` : ''}
              <button class="card-btn card-btn-level" onclick="togglePlayerLevel(${i})">${p.level === 'minor' ? '升一軍' : '下二軍'}</button>
            </div>
          </article>`;
      };

      const allPlayers  = game.roster.players.map((p, i) => ({ p, i }));
      const majorCards  = allPlayers.filter(({ p }) => p.level !== 'minor');
      const minorCards  = allPlayers.filter(({ p }) => p.level === 'minor');

      rosterDiv.innerHTML = `
        <div class="roster-sections card-mode">
          <section class="roster-section major-section">
            <header>
              <h3>一軍卡牌牆 <span class="roster-count">${cardMajorCount} / ${game.majorRosterLimit}</span></h3>
              <p>可直接指定投手、打者與防守位置；守位下拉選單會與原位置球員互換。</p>
            </header>
            <div class="roster-section-cards">${majorCards.map(renderCard).join('')}</div>
          </section>
          <section class="roster-section minor-section">
            <header>
              <h3>二軍與培養名單 <span class="roster-count">${minorCards.length}</span></h3>
              <p>二軍球員先升上一軍後才能加入打線與守備。</p>
            </header>
            <div class="roster-section-cards">
              ${minorCards.map(renderCard).join('') || '<p class="pregame-note">目前沒有二軍球員。</p>'}
            </div>
          </section>
        </div>`;
    }
  }

  // ─────────────────────────────────────────────
  // §6  LineupRenderer（玩家 & 對手打序）
  //     從原本的 updateOpponentUI 拆出
  // ─────────────────────────────────────────────

  class LineupRenderer extends BaseSubRenderer {
    render(game) {
      const posLabels = this.deps.call('POSITION_LABELS') ?? {};
      this._renderOpponentLineup(game, posLabels);
      this._renderPlayerLineup(game, posLabels);
    }

    _renderOpponentLineup(game, posLabels) {
      const lineupDiv   = this.getElement('opponent-lineup');
      const upcomingDiv = this.getElement('upcoming-batters');
      if (!lineupDiv || !upcomingDiv) return;

      if (!game.opponentTeam) {
        lineupDiv.innerHTML = '<p>No opponent loaded.</p>';
        upcomingDiv.innerHTML = '';
        return;
      }

      const oppOrder   = game.opponentTeam.battingOrder;
      const oppCurrent = game.opponentTeam.nextBatterIndex;
      const oppWindow  = [0, 1, 2].map(off => {
        const idx = (oppCurrent + off) % oppOrder.length;
        return { player: oppOrder[idx], orderIndex: idx, isCurrent: off === 0 };
      });

      lineupDiv.innerHTML = `<h4 class="font-bold">${game.opponentTeam.name}</h4>`
        + oppWindow.map(({ player, orderIndex, isCurrent }) => {
          const cls   = isCurrent ? 'font-bold text-blue-700 lineup-current' : 'lineup-upcoming';
          const label = isCurrent ? '⚾ 當前' : `+${oppWindow.findIndex(x => x.orderIndex === orderIndex)}`;
          return `<p class="${cls}"><span class="lineup-tag">${label}</span> ${orderIndex + 1}. ${player.name} (${player.getRank()})</p>`;
        }).join('');

      upcomingDiv.innerHTML = game.opponentTeam.getUpcomingBatters()
        .map(p => `<p>${p.name} (${p.getRank()})</p>`).join('');
    }

    _renderPlayerLineup(game, posLabels) {
      const playerLineupDiv = this.getElement('player-lineup');
      if (!playerLineupDiv) return;

      const myCurrent = game.playerNextBatterIndex;
      const myWindow  = [0, 1, 2].map(off => ({
        idx: (myCurrent + off) % game.playerBattingOrder.length,
        off
      }));

      playerLineupDiv.innerHTML = myWindow.map(({ idx, off }) => {
        const playerIndex = game.playerBattingOrder[idx];
        const player      = game.roster.players[playerIndex];
        const isCurrent   = off === 0 && game.currentHalf === 'bottom';
        const cls         = isCurrent ? 'font-bold text-blue-700 lineup-current' : 'lineup-upcoming';
        const label       = off === 0 ? '⚾ 當前' : `+${off}`;
        const assigned    = game.getAssignedPosition(playerIndex) || 'DH';
        return `<p class="${cls}"><span class="lineup-tag">${label}</span> ${idx + 1}. ${player.name} (${posLabels[assigned] || assigned})</p>`;
      }).join('');
    }
  }

  // ─────────────────────────────────────────────
  // §7  CompositeGameRenderer
  //     協調所有子 renderer，取代原本 GameUIRenderer 的重量角色
  //     外部 API 與 GameUIRenderer 相容
  // ─────────────────────────────────────────────

  class CompositeGameRenderer {
    constructor(doc = global.document, deps = null) {
      const registry = deps || buildDefaultDepRegistry(doc);

      this.hud        = new HudRenderer(registry);
      this.scoreboard = new ScoreboardRenderer(registry);
      this.diamond    = new DiamondRenderer(registry);
      this.bullpen    = new BullpenRenderer(registry);
      this.roster     = new RosterRenderer(registry);
      this.lineup     = new LineupRenderer(registry);

      this._deps = registry;
    }

    /**
     * 主要渲染入口（與原本 GameUIRenderer.render 相容）
     */
    render(game) {
      if (!game) return;

      const matchup = game.getCurrentMatchup();

      this.hud.render(game);
      this.scoreboard.render(game, matchup);
      this.diamond.render(game);
      this.lineup.render(game);
      this.bullpen.render(game);
      this.roster.render(game);
    }

    /** 向後相容：原本 GameUIRenderer 的各個 update 方法 */
    updateClassicScoreboard(game, matchup) { this.scoreboard.render(game, matchup); }
    updateDiamondUI(game)  { this.diamond.render(game); }
    updateBullpenUI(game)  { this.bullpen.render(game); }
    updateRosterUI(game)   { this.roster.render(game); }
    updateOpponentUI(game) { this.lineup.render(game); }

    /**
     * 允許在執行期替換依賴（例如換成模組化版本的 createPixelPortrait）
     */
    registerDep(name, fn) {
      this._deps.register(name, fn);
      return this;
    }
  }

  // ─────────────────────────────────────────────
  // 公開 API
  // ─────────────────────────────────────────────

  global.GameRendererModules = {
    HudRenderer,
    ScoreboardRenderer,
    DiamondRenderer,
    BullpenRenderer,
    RosterRenderer,
    LineupRenderer,
    CompositeGameRenderer,
    buildDefaultDepRegistry
  };

  // 向後相容：讓 game.js 可以直接用 new CompositeGameRenderer() 換掉 GameUIRenderer
  global.CompositeGameRenderer = CompositeGameRenderer;

})(typeof window !== "undefined" ? window : globalThis);
