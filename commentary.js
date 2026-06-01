// commentary.js — v4.2b：雙人播報 + 閒聊 + 冷笑話
// BroadcastGenerator: 新格式 [{speaker:'caster'|'color', text}, ...]
// CommentaryGenerator: 保留舊格式向下相容（純字串）
(function (global) {
  "use strict";

  // ────────────────── 舊版內建模板（fallback）──────────────────
  const FALLBACK_TEMPLATES = {
    homeRun: { default: ['全壘打！', '出去了！'] },
    strikeout: { default: ['三振！'] },
    single: { default: ['安打！'] },
    double: { default: ['二壘安打！'] },
    triple: { default: ['三壘安打！'] },
    groundOut: { default: ['滾地球出局。'] },
    flyOut: { default: ['高飛球接殺。'] },
    walk: { default: ['四壞球保送。'] },
    shadowClone: { default: ['影分身的神守備！'] }
  };

  // ────────────────── 模板變數填補 ──────────────────
  function fillTemplate(text, vars) {
    return String(text).replace(/\$\{(\w+)\}/g, (_, key) => {
      if (vars[key] != null) return vars[key];
      return '';
    });
  }

  function fillLines(lines, vars) {
    return lines.map(line => ({
      speaker: line.speaker,
      text: fillTemplate(line.text, vars)
    }));
  }

  // ═══════════════════════════════════════════════════════════
  // BroadcastGenerator — 雙人播報（v4.2b 主要 API）
  // ═══════════════════════════════════════════════════════════
  class BroadcastGenerator {
    constructor() {
      this.toldJokes = new Set();       // 已講過的笑話索引（跨場不重複）
      this.jokeCountThisGame = 0;       // 本場已講笑話數（上限 3）
      this.usedBanterIdx = new Set();   // 本場用過的閒聊索引（避免短期重複）
    }

    // 重置本場狀態（每場比賽開始時呼叫）
    resetForMatch() {
      this.jokeCountThisGame = 0;
      this.usedBanterIdx.clear();
    }

    // ── 主入口：產生事件播報對話 ──
    // outcome: 'homeRun' | 'strikeout' | 'single' | 'double' | ...
    // player: 球員物件
    // extra: { walkoff, grandSlam, doublePlay, sacrificeFly, deepFly, crisis, runners, ... }
    generateCall(outcome, player, extra = {}) {
      const vars = this._buildVars(outcome, player, extra);
      const subcategory = this._pickSub(outcome, player, extra);

      // 1. 試著從新 broadcast 格式抽取
      if (typeof global.pickBroadcastLines === 'function') {
        const entry = global.pickBroadcastLines(
          (global.BROADCAST || {})[outcome] || {},
          subcategory
        );
        if (entry && entry.lines) {
          return fillLines(entry.lines, vars);
        }
      }

      // 2. fallback：從舊 commentary-data 格式抽 → 單行主播詞
      const text = this._pickLegacy(outcome, subcategory, vars);
      if (text) {
        return [{ speaker: 'caster', text }];
      }

      // 3. 最終 fallback
      const fb = (FALLBACK_TEMPLATES[outcome] || {}).default || [];
      const fbText = fb.length ? fb[Math.floor(Math.random() * fb.length)] : '';
      return fbText ? [{ speaker: 'caster', text: fbText }] : [];
    }

    // ── 閒聊觸發 ──
    // tension: 0-10, half: 'top'|'bottom'（我方守備|我方進攻）
    maybeBanter(tension = 5, half = 'top') {
      // 高張力不閒聊
      if (tension >= 7) return null;

      // 觸發機率：張力越低機率越高
      const chance = tension <= 3 ? 0.20 : tension <= 5 ? 0.12 : 0.05;
      if (Math.random() > chance) return null;

      // 依攻守半局篩選話題池：進攻時全開／守備時排除對手分析類
      const allCategories = Object.keys(global.BANTER || {});
      const offenseOnly = ['opponentTalk']; // 對手投捕分析只在進攻半局有意義
      const categories = (half === 'bottom')
        ? allCategories
        : allCategories.filter(c => !offenseOnly.includes(c));
      if (!categories.length) return null;

      const cat = categories[Math.floor(Math.random() * categories.length)];
      const entry = (typeof global.pickBanterLines === 'function')
        ? global.pickBanterLines(cat)
        : null;

      if (!entry || !entry.lines) return null;

      // 避免重複（同一場比賽同一句話）
      const idx = categories.indexOf(cat) + '|' + JSON.stringify(entry.lines[0].text).slice(0, 40);
      if (this.usedBanterIdx.has(idx)) return null;
      this.usedBanterIdx.add(idx);

      const vars = this._buildVars('banter', null, {});
      return { type: 'banter', lines: fillLines(entry.lines, vars) };
    }

    // ── 冷笑話觸發 ──
    // 低張力時 5-8% 機率，每場最多 3 則，跨場不重複
    maybeDadJoke(tension = 5) {
      if (tension >= 7) return null;           // 高張力不講笑話
      if (this.jokeCountThisGame >= 3) return null; // 單場上限

      const chance = 0.06;
      if (Math.random() > chance) return null;

      const jokes = global.DAD_JOKES || [];
      if (!jokes.length) return null;

      // 排除本場或近期講過的（跨場不重複用 toldJokes Set）
      const available = [];
      for (let i = 0; i < jokes.length; i++) {
        if (!this.toldJokes.has(i)) available.push(i);
      }
      if (!available.length) {
        // 全部講過一輪了就清掉重來
        this.toldJokes.clear();
        for (let i = 0; i < jokes.length; i++) available.push(i);
      }

      const idx = available[Math.floor(Math.random() * available.length)];
      const entry = jokes[idx];
      if (!entry || !entry.lines) return null;

      this.toldJokes.add(idx);
      this.jokeCountThisGame++;

      const vars = this._buildVars('joke', null, {});
      return { type: 'joke', lines: fillLines(entry.lines, vars) };
    }

    // ── 換局播報 ──
    generateInningBreak(inningStr, teamName, scoreStr) {
      const vars = { inning: inningStr, team: teamName, score: scoreStr };
      const entry = global.pickBroadcastLines(
        (global.BROADCAST || {}).inningBreak || {},
        'default'
      );
      if (entry && entry.lines) return fillLines(entry.lines, vars);

      return [
        { speaker: 'caster', text: `═══ ${inningStr} 結束 ═══ ${teamName} ${scoreStr}` }
      ];
    }

    // ── 系統事件播報 ──
    generateSystemCall(type, varsExtra = {}) {
      const vars = this._buildVars(type, null, varsExtra);
      const entry = global.pickBroadcastLines(
        (global.BROADCAST || {})[type] || {},
        'default'
      );
      if (entry && entry.lines) return fillLines(entry.lines, vars);

      // fallback
      const fallbacks = {
        moundVisit: [{ speaker: 'caster', text: '教練團走上投手丘⋯⋯' }],
        pitchingChange: [{ speaker: 'caster', text: `投手更換：${vars.pitcher || '新投手'} 上場。` }]
      };
      return fallbacks[type] || [{ speaker: 'caster', text: '' }];
    }

    // ── 收集模板變數 ──
    _buildVars(outcome, player, extra = {}) {
      const g = (typeof globalThis.game !== 'undefined') ? globalThis.game : null;
      return {
        batter:   (player && player.name) || '',
        pitcher:  (extra.pitcherName) || (g && g.pitcher && g.pitcher.name) || '',
        distance: extra.distance || '',
        hrCount:  extra.hrCount || '',
        inning:   extra.inning || (g && g.inning ? `${g.inning}局${g.isTop ? '上' : '下'}` : ''),
        score:    extra.score || '',
        count:    extra.count || '',
        outs:     extra.outs != null ? extra.outs : '',
        team:     extra.team || '政大',
        stadium:  extra.stadium || (g && g.stadiumName) || '政大棒球場',
        avg:      extra.avg || '',
        era:      extra.era || '',
        runners:  extra.runners || '',
        weather:  extra.weather || '晴朗'
      };
    }

    // ── 子分類（與舊版邏輯一致）──
    _pickSub(outcome, player, extra = {}) {
      if (extra.walkoff) return 'walkoff';
      if (extra.grandSlam) return 'grandSlam';
      if (extra.doublePlay && outcome === 'groundOut') return 'doublePlay';
      if (extra.sacrificeFly && outcome === 'flyOut') return 'sacrificeFly';
      if (extra.deepFly && outcome === 'flyOut') return 'deepFly';
      if (extra.crisis && outcome === 'strikeout') return 'crisis';
      if (extra.tape && outcome === 'homeRun') return 'tape';
      if (extra.looking && outcome === 'strikeout') return 'lookingStrike';

      if (!player) return 'default';
      const talents = player.talents || [];
      const traits  = player.traits  || [];
      const has = t => talents.includes(t) || traits.includes(t);

      if (outcome === 'homeRun'   && (has('重砲手') || has('怪力') || has('巨人之力'))) return 'powerHitter';
      if (outcome === 'strikeout' && (has('火球男') || has('光速球') || has('絕對王牌'))) return 'elitePitcher';
      if (outcome === 'single'    && (has('大心臟') || has('最終兵器'))) return 'clutchHitter';
      if (outcome === 'single'    && has('快腿')) return 'bunt';
      if (outcome === 'walk'      && (has('選球眼') || has('綠繡眼'))) return 'disciplined';
      if (outcome === 'triple'    && (has('快腿') || has('閃電俠'))) return 'speed';

      return 'default';
    }

    // ── 從舊格式抽 ──
    _pickLegacy(category, subcategory, vars = {}) {
      if (typeof global.pickCommentaryFromLibrary === 'function') {
        const text = global.pickCommentaryFromLibrary(category, subcategory, vars);
        if (text) return text;
        if (subcategory !== 'default') {
          return global.pickCommentaryFromLibrary(category, 'default', vars);
        }
      }
      return '';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CommentaryGenerator — 舊版 API（向下相容）
  // ═══════════════════════════════════════════════════════════
  class CommentaryGenerator {
    constructor() {
      this.templates = FALLBACK_TEMPLATES;
      this._broadcast = new BroadcastGenerator();
    }

    // 舊版主入口：回傳純字串
    generateCommentary(outcome, player, cardActive = false, extra = {}) {
      // 卡片特效優先
      if (cardActive && outcome === 'flyOut') {
        return this.pickFromLibrary('greatPlay', 'default') || '影分身的神守備！';
      }

      // 先用新 broadcast 格式
      const lines = this._broadcast.generateCall(outcome, player, extra);
      if (lines && lines.length) {
        if (lines.length === 1) return lines[0].text;
        // 多行 → 合併（舊格式只用一行）
        return lines.map(l => `【${l.speaker === 'caster' ? '蔡兄' : '鍾sir'}】${l.text}`).join(' ');
      }

      // fallback
      const subcategory = this._broadcast._pickSub(outcome, player, extra);
      const fromLibrary = this.pickFromLibrary(outcome, subcategory, extra);
      if (fromLibrary) return fromLibrary;

      const fb = FALLBACK_TEMPLATES[outcome]?.default || [];
      return fb[Math.floor(Math.random() * fb.length)] || '';
    }

    // 從舊資料庫抽 → 回傳 HTML 字串（雙人播報感，最輕量 MVP）
    generateCommentaryHTML(outcome, player, cardActive = false, extra = {}) {
      const lines = this._broadcast.generateCall(outcome, player, extra);
      if (!lines || !lines.length) {
        const text = this.generateCommentary(outcome, player, cardActive, extra);
        return `<span class="broadcast-caster">${text}</span>`;
      }
      return lines.map(l =>
        `<span class="broadcast-${l.speaker}">【${l.speaker === 'caster' ? '蔡兄' : '鍾sir'}】${l.text}</span>`
      ).join('\n');
    }

    pickFromLibrary(category, subcategory, vars = {}) {
      if (typeof global.pickCommentaryFromLibrary === 'function') {
        const text = global.pickCommentaryFromLibrary(category, subcategory, vars);
        if (text) return text;
        if (subcategory !== 'default') {
          return global.pickCommentaryFromLibrary(category, 'default', vars);
        }
      }
      return '';
    }

    randomFromArray(arr) {
      if (!Array.isArray(arr) || !arr.length) return '';
      return arr[Math.floor(Math.random() * arr.length)];
    }

    generateHeadline(playerScore, opponentScore, mvpPlayer) {
      const diff = playerScore - opponentScore;
      const params = (global.GAME_PARAMS?.newspaper?.headlines) || {};
      let bucket;
      if (diff >= 5) bucket = params.bigWin;
      else if (diff > 0) bucket = params.win;
      else if (diff === 0) bucket = params.tie;
      else if (diff >= -2) bucket = params.close;
      else bucket = params.blowout || params.loss;
      const headline = (bucket && bucket.length) ? this.randomFromArray(bucket) : (
        diff > 0 ? `${mvpPlayer?.name || '政大'} 領軍 政大主場奪勝！` :
        diff < 0 ? `政大苦吞敗仗 待調整再起` : `${mvpPlayer?.name || '政大'} 力戰平手`
      );
      return `${headline} (${playerScore}-${opponentScore})`;
    }
  }

  global.CommentaryGenerator = CommentaryGenerator;
  global.BroadcastGenerator = BroadcastGenerator;
})(typeof window !== 'undefined' ? window : globalThis);
