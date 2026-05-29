// commentary.js — v3.23：從 game.js 拆分的旁白生成模組，串接 commentary-data.js
(function (global) {
  "use strict";

  // 舊版內建模板（fallback，避免 commentary-data 沒載入）
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

  class CommentaryGenerator {
    constructor() {
      // 仍保留 this.templates 以維持舊 API
      this.templates = FALLBACK_TEMPLATES;
    }

    // 主入口：依事件取得旁白
    // outcome: 'homeRun' | 'strikeout' | 'single' | 'double' | ...
    // player: 球員物件（用於判定特性 → subcategory）
    // cardActive: 是否啟用了魔法卡（影分身等）
    // extra: 額外上下文 ─ { walkoff: true, doublePlay: true, situation: 'basesLoaded' ... }
    generateCommentary(outcome, player, cardActive = false, extra = {}) {
      // 1. 卡片特效優先（影分身）
      if (cardActive && outcome === 'flyOut') {
        return this.pickFromLibrary('greatPlay', 'default') || '影分身的神守備！';
      }

      // 2. 依特性挑分類
      const subcategory = this.pickSubcategory(outcome, player, extra);

      // 3. 從 commentary-data.js 抽
      const fromLibrary = this.pickFromLibrary(outcome, subcategory, extra);
      if (fromLibrary) return fromLibrary;

      // 4. fallback
      const fb = FALLBACK_TEMPLATES[outcome]?.default || [];
      return fb[Math.floor(Math.random() * fb.length)] || '';
    }

    pickFromLibrary(category, subcategory, vars = {}) {
      if (typeof global.pickCommentaryFromLibrary === 'function') {
        const text = global.pickCommentaryFromLibrary(category, subcategory, vars);
        if (text) return text;
        // 若該 subcategory 沒命中，退回 default
        if (subcategory !== 'default') {
          return global.pickCommentaryFromLibrary(category, 'default', vars);
        }
      }
      return '';
    }

    // 依 player 特性 / 情境決定要用哪個 subcategory
    pickSubcategory(outcome, player, extra = {}) {
      // 情境優先
      if (extra.walkoff) return 'walkoff';
      if (extra.grandSlam) return 'grandSlam';
      if (extra.doublePlay && outcome === 'groundOut') return 'doublePlay';
      if (extra.sacrificeFly && outcome === 'flyOut') return 'sacrificeFly';
      if (extra.deepFly && outcome === 'flyOut') return 'deepFly';
      if (extra.crisis && outcome === 'strikeout') return 'crisis';
      if (extra.tape && outcome === 'homeRun') return 'tape';

      // 看著三振
      if (extra.looking && outcome === 'strikeout') return 'lookingStrike';

      // v3.25：天賦（顯示用）+ 特質（加成用）都納入旁白觸發條件
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

    randomFromArray(arr) {
      if (!Array.isArray(arr) || !arr.length) return '';
      return arr[Math.floor(Math.random() * arr.length)];
    }

    // 報紙頭版標題（依分差）
    generateHeadline(playerScore, opponentScore, mvpPlayer) {
      const diff = playerScore - opponentScore;
      const params = global.GAME_PARAMS?.newspaper?.headlines || {};
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
})(typeof window !== 'undefined' ? window : globalThis);
