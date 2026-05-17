/**
 * pitch-visualizer.js  v1.0
 *
 * Canvas 投球軌跡視覺化（§16.3.3、§15.8）
 *
 * 功能：
 *   1. 繪製 9x9 接球區 + 3x3 好球帶 + 5x5 投手瞄準區。
 *   2. 每球結束後讀取 game.lastPitchContext，動畫顯示：
 *        原始瞄準點（◇）→ 控球偏差後位置（•）→ 最終落點（●）
 *   3. 打者目標九宮格以半透明紫色遮罩標示。
 *   4. 最終落點顏色：綠色＝好球、橘色＝壞球、紅色＝暴投。
 *   5. 右側資訊欄即時顯示球速、球種、球威等級、策略。
 *
 * 使用方式：
 *   // index.html 守備分頁加入：
 *   // <div id="pitch-viz-container"></div>
 *
 *   // inline script 最後加入：
 *   const pitchViz = new PitchVisualizer();
 *   pitchViz.attach('pitch-viz-container', game);
 *
 *   // game.updateUI 被覆寫後自動呼叫 pitchViz.update()，無需手動呼叫。
 */
(function (global) {
  "use strict";

  // ── 設計常數（對應 §17.2，公分座標系）────────────────────────────────
  const GEO = {
    gridHalf:   67.5,   // 9x9 接球區半徑
    strikeHalf: 22.5,   // 好球帶半徑
    aimHalf:    37.5,   // 5x5 瞄準區半徑
    cellSize:   15,     // 每格 15cm
    ballR:      3.6,    // 棒球半徑
    totalRange: 135     // 整個 9x9 對角範圍（畫布座標）
  };

  // 好球帶 3x3 各格的中心（捕手視角，x 右正，y 上正）
  const ZONE_CENTERS = [
    { x: -15, y:  15 }, { x: 0, y:  15 }, { x: 15, y:  15 },
    { x: -15, y:   0 }, { x: 0, y:   0 }, { x: 15, y:   0 },
    { x: -15, y: -15 }, { x: 0, y: -15 }, { x: 15, y: -15 }
  ];

  const STUFF_GRADE_LABEL = { S: 'S', A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' };
  const EFFORT_LABEL = { full: '全力 🔥', normal: '普通', easy: '輕鬆 💧' };

  // ── 色盤（配合 style.css 的 CSS 變數值）────────────────────────────
  const COLOR = {
    bg:          '#0a0e1a',
    panelBg:     '#111827',
    gridLine:    'rgba(148,163,184,0.18)',
    strikeZone:  'rgba(59,130,246,0.12)',
    strikeFrame: '#3b82f6',
    aimZone:     'rgba(100,116,139,0.08)',
    aimFrame:    'rgba(100,116,139,0.35)',
    targetZone:  'rgba(168,85,247,0.20)',
    targetFrame: '#a855f7',
    // 軌跡
    aimDot:      '#94a3b8',
    missDot:     '#fbbf24',
    strikeHit:   '#4ade80',
    ballHit:     '#fb923c',
    wildHit:     '#ef4444',
    trailLine:   'rgba(251,191,36,0.45)',
    // 文字
    textPrimary: '#e5edf7',
    textMuted:   '#9aa9bc',
    textFaint:   '#4b5563'
  };

  // ── PitchVisualizer ────────────────────────────────────────────────

  class PitchVisualizer {
    constructor() {
      this.container  = null;
      this.canvas     = null;
      this.ctx        = null;
      this.infoPanel  = null;
      this.game       = null;
      this._animId    = null;
      this._pitchHistory = [];   // 保留最近 N 球（留影）
      this._maxHistory   = 6;
      this._currentAnim  = null; // 當前動畫狀態
      this._bound_onUpdate = this._onGameUpdate.bind(this);
    }

    // ── 掛載 ────────────────────────────────────────────────────────

    attach(containerId, game) {
      const container = document.getElementById(containerId);
      if (!container) {
        console.warn(`[PitchVisualizer] 找不到容器 #${containerId}`);
        return this;
      }
      this.container = container;
      this.game      = game;
      this._buildDOM(container);
      this._hookGameUpdate(game);
      this._drawIdle();
      return this;
    }

    detach() {
      if (this._animId) cancelAnimationFrame(this._animId);
      if (this.game && this.game._pitchVizHook) {
        this.game.updateUI = this.game._pitchVizHook.original;
        delete this.game._pitchVizHook;
      }
      this.game = null;
    }

    // ── DOM 建構 ────────────────────────────────────────────────────

    _buildDOM(container) {
      container.innerHTML = '';
      container.style.cssText = [
        'display:flex', 'gap:10px', 'align-items:flex-start',
        'padding:10px', 'background:#0d1424', 'border-radius:10px',
        'border:1px solid rgba(148,163,184,0.14)'
      ].join(';');

      // Canvas
      this.canvas = document.createElement('canvas');
      this.canvas.width  = 220;
      this.canvas.height = 240;
      this.canvas.style.cssText = 'border-radius:6px;flex-shrink:0;';
      this.canvas.setAttribute('aria-label', '投球落點視覺化');
      container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');

      // 右側資訊欄
      this.infoPanel = document.createElement('div');
      this.infoPanel.style.cssText = [
        'flex:1', 'min-width:0', 'display:flex', 'flex-direction:column',
        'gap:6px', 'padding:4px 2px'
      ].join(';');
      container.appendChild(this.infoPanel);

      this._renderIdleInfo();
    }

    // ── 掛鉤 game.updateUI ──────────────────────────────────────────

    _hookGameUpdate(game) {
      if (!game || typeof game.updateUI !== 'function') return;
      const original = game.updateUI.bind(game);
      const viz = this;
      game.updateUI = function () {
        const result = original();
        viz._onGameUpdate();
        return result;
      };
      game._pitchVizHook = { original };
    }

    _onGameUpdate() {
      const ctx = this.game?.lastPitchContext;
      if (!ctx || !ctx.finalPosition) return;
      this._playAnimation(ctx);
    }

    // ── 動畫流程 ────────────────────────────────────────────────────

    _playAnimation(ctx) {
      if (this._animId) cancelAnimationFrame(this._animId);

      // 加入歷史（留影）
      this._pitchHistory.push(ctx);
      if (this._pitchHistory.length > this._maxHistory) this._pitchHistory.shift();

      const startTime  = performance.now();
      const totalMs    = 520;   // 整個動畫時長
      const phases = [
        { label: 'aim',   endFrac: 0.0  },  // 起點（立即出現）
        { label: 'miss',  endFrac: 0.42 },  // 飛向控球偏差後位置
        { label: 'final', endFrac: 1.0  }   // 飛向最終落點
      ];

      const viz = this;
      function tick(now) {
        const frac = Math.min((now - startTime) / totalMs, 1);
        viz._drawFrame(ctx, frac);
        if (frac < 1) {
          viz._animId = requestAnimationFrame(tick);
        } else {
          viz._animId = null;
          viz._renderPitchInfo(ctx);
        }
      }
      this._animId = requestAnimationFrame(tick);
      this._renderPitchInfo(ctx);
    }

    // ── 繪製一幀 ────────────────────────────────────────────────────

    _drawFrame(ctx, frac) {
      const cv  = this.canvas;
      const c   = this.ctx;
      const W   = cv.width;
      const H   = cv.height;

      // 預留邊距與座標映射
      const margin = { top: 22, right: 14, bottom: 28, left: 14 };
      const drawW  = W - margin.left - margin.right;
      const drawH  = H - margin.top  - margin.bottom;

      // cm → canvas px
      const toX = (cmX) => margin.left + drawW * (cmX + GEO.gridHalf) / (GEO.gridHalf * 2);
      const toY = (cmY) => margin.top  + drawH * (GEO.gridHalf - cmY) / (GEO.gridHalf * 2);

      // 清底
      c.fillStyle = COLOR.bg;
      c.fillRect(0, 0, W, H);

      // ── 背景層 ──────────────────────────────────────────────────

      // 標題
      c.fillStyle = COLOR.textMuted;
      c.font = '600 9px "Noto Sans TC",sans-serif';
      c.textAlign = 'center';
      c.fillText('捕 手 視 角　 接 球 區', W / 2, 13);

      // 9x9 外框
      this._drawRect(c, toX(-GEO.gridHalf), toY(GEO.gridHalf),
        toX(GEO.gridHalf) - toX(-GEO.gridHalf),
        toY(-GEO.gridHalf) - toY(GEO.gridHalf),
        { stroke: COLOR.gridLine, lineWidth: 1 });

      // 9x9 格線
      c.strokeStyle = COLOR.gridLine;
      c.lineWidth   = 0.5;
      for (let i = 1; i < 9; i++) {
        const xPx = toX(-GEO.gridHalf + i * GEO.cellSize);
        const yPx = toY(-GEO.gridHalf + i * GEO.cellSize);
        c.beginPath(); c.moveTo(xPx, toY(GEO.gridHalf));  c.lineTo(xPx, toY(-GEO.gridHalf)); c.stroke();
        c.beginPath(); c.moveTo(toX(-GEO.gridHalf), yPx); c.lineTo(toX(GEO.gridHalf), yPx);   c.stroke();
      }

      // 5x5 瞄準區（虛線框）
      c.setLineDash([3, 3]);
      this._drawRect(c, toX(-GEO.aimHalf), toY(GEO.aimHalf),
        toX(GEO.aimHalf) - toX(-GEO.aimHalf),
        toY(-GEO.aimHalf) - toY(GEO.aimHalf),
        { stroke: COLOR.aimFrame, lineWidth: 0.8 });
      c.setLineDash([]);

      // 3x3 好球帶（填色 + 框線）
      this._drawRect(c, toX(-GEO.strikeHalf), toY(GEO.strikeHalf),
        toX(GEO.strikeHalf) - toX(-GEO.strikeHalf),
        toY(-GEO.strikeHalf) - toY(GEO.strikeHalf),
        { fill: COLOR.strikeZone, stroke: COLOR.strikeFrame, lineWidth: 1.5 });

      // 打者目標九宮格（半透明紫色遮罩）
      const targetIdx = ctx.targetZoneIndex;
      if (Number.isFinite(targetIdx) && targetIdx >= 0 && targetIdx < 9) {
        const tz = ZONE_CENTERS[targetIdx];
        this._drawRect(c,
          toX(tz.x - GEO.cellSize / 2), toY(tz.y + GEO.cellSize / 2),
          toX(tz.x + GEO.cellSize / 2) - toX(tz.x - GEO.cellSize / 2),
          toY(tz.y - GEO.cellSize / 2) - toY(tz.y + GEO.cellSize / 2),
          { fill: COLOR.targetZone, stroke: COLOR.targetFrame, lineWidth: 1.2 });
      }

      // 歷史留影（舊的落點，淡色）
      for (let h = 0; h < this._pitchHistory.length - 1; h++) {
        const ph = this._pitchHistory[h];
        const alpha = 0.08 + (h / this._pitchHistory.length) * 0.20;
        const col = ph.isWildPitch ? COLOR.wildHit : (ph.isStrike ? COLOR.strikeHit : COLOR.ballHit);
        this._drawDot(c, toX(ph.finalPosition.x), toY(ph.finalPosition.y),
          3.5, col, alpha);
      }

      // ── 動畫軌跡 ────────────────────────────────────────────────
      const aimPx   = { x: toX(ctx.originalTarget.x), y: toY(ctx.originalTarget.y) };
      const missPx  = { x: toX(ctx.postMiss.x),        y: toY(ctx.postMiss.y)       };
      const finalPx = { x: toX(ctx.finalPosition.x),   y: toY(ctx.finalPosition.y)  };

      const PHASE1 = 0.42;  // aim → miss
      const PHASE2 = 1.00;  // miss → final

      // 原始瞄準點（菱形）
      this._drawDiamond(c, aimPx.x, aimPx.y, 4, COLOR.aimDot, frac > 0 ? 0.8 : 0);

      if (frac <= PHASE1) {
        // 第一段：aim → miss
        const t = frac / PHASE1;
        const curX = aimPx.x + (missPx.x - aimPx.x) * this._easeOut(t);
        const curY = aimPx.y + (missPx.y - aimPx.y) * this._easeOut(t);
        // 軌跡線
        c.strokeStyle = COLOR.trailLine;
        c.lineWidth   = 1;
        c.beginPath(); c.moveTo(aimPx.x, aimPx.y); c.lineTo(curX, curY); c.stroke();
        // 移動中的球
        this._drawBall(c, curX, curY, 4.5, COLOR.missDot, 0.9);
      } else {
        // 第一段完整
        c.strokeStyle = COLOR.trailLine;
        c.lineWidth   = 1;
        c.beginPath(); c.moveTo(aimPx.x, aimPx.y); c.lineTo(missPx.x, missPx.y); c.stroke();
        // miss 落點（小圓）
        this._drawDot(c, missPx.x, missPx.y, 3, COLOR.missDot, 0.65);

        // 第二段：miss → final
        const t2  = (frac - PHASE1) / (PHASE2 - PHASE1);
        const curX = missPx.x + (finalPx.x - missPx.x) * this._easeOut(t2);
        const curY = missPx.y + (finalPx.y - missPx.y) * this._easeOut(t2);
        c.strokeStyle = 'rgba(255,255,255,0.18)';
        c.lineWidth   = 1;
        c.beginPath(); c.moveTo(missPx.x, missPx.y); c.lineTo(curX, curY); c.stroke();

        if (frac >= 1) {
          // 最終落點（大圓 + 光暈）
          const hitColor = ctx.isWildPitch ? COLOR.wildHit : (ctx.isStrike ? COLOR.strikeHit : COLOR.ballHit);
          this._drawGlow(c, finalPx.x, finalPx.y, 10, hitColor);
          this._drawBall(c, finalPx.x, finalPx.y, 5.5, hitColor, 1);
        } else {
          this._drawBall(c, curX, curY, 4.5, '#ffffff', 0.9);
        }
      }

      // 底部軸標示
      c.fillStyle   = COLOR.textFaint;
      c.font        = '8px "Noto Sans TC",sans-serif';
      c.textAlign   = 'left';
      c.fillText('外角', toX(-GEO.gridHalf) + 2, H - 8);
      c.textAlign   = 'right';
      c.fillText('內角', toX(GEO.gridHalf) - 2, H - 8);
      c.textAlign   = 'center';
      c.fillText('好球帶', toX(0), H - 8);
    }

    _drawIdle() {
      const cv = this.canvas;
      const c  = this.ctx;
      // 清底 + 閒置訊息
      c.fillStyle = COLOR.bg;
      c.fillRect(0, 0, cv.width, cv.height);
      this._drawFrame({ originalTarget:{x:0,y:0}, postMiss:{x:0,y:0},
        finalPosition:{x:0,y:0}, isStrike:true, isWildPitch:false,
        targetZoneIndex:4 }, 0);
      c.fillStyle   = COLOR.textMuted;
      c.font        = '11px "Noto Sans TC",sans-serif';
      c.textAlign   = 'center';
      c.fillText('等待第一球…', cv.width / 2, cv.height / 2 + 4);
    }

    // ── 資訊欄 ──────────────────────────────────────────────────────

    _renderPitchInfo(ctx) {
      if (!this.infoPanel) return;
      const isWild   = ctx.isWildPitch;
      const isStrike = ctx.isStrike;
      const outcome  = isWild   ? '暴投 🔴'
                     : isStrike ? '好球 🟢'
                     :            '壞球 🟠';

      const stuffColor = { S:'#f59e0b', A:'#10b981', B:'#60a5fa', C:'#94a3b8', D:'#f97316', E:'#ef4444' };
      const gradeColor = stuffColor[ctx.stuffGrade] || '#94a3b8';

      const swings    = ctx.perceivedStrike !== undefined;
      const perceived = ctx.perceivedStrike ? '打者認知好球' : '打者認知壞球';

      const rows = [
        ['結果',   `<strong style="color:${isWild?'#ef4444':isStrike?'#4ade80':'#fb923c'}">${outcome}</strong>`],
        ['球速',   `${ctx.speedKmh ?? '--'} <small>km/h</small>`],
        ['球種',   ctx.pitchType  ?? '--'],
        ['球威',   `<span style="color:${gradeColor};font-weight:700">${ctx.stuffGrade ?? '-'}</span>  <small>(${Math.round(ctx.stuffScore ?? 0)})</small>`],
        ['出力',   EFFORT_LABEL[ctx.effortLevel] ?? ctx.effortLevel ?? '--'],
        ['策略',   ctx.strategy ?? '--'],
        ['判讀',   perceived],
      ];

      if (ctx.finalPosition) {
        const fp = ctx.finalPosition;
        rows.push(['落點', `(${fp.x.toFixed(1)}, ${fp.y.toFixed(1)}) cm`]);
      }

      this.infoPanel.innerHTML = `
        <div style="font-size:.68rem;font-weight:700;color:#64748b;letter-spacing:.06em;margin-bottom:2px">
          PITCH INFO
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:.72rem">
          ${rows.map(([label, val]) => `
            <tr>
              <td style="color:#64748b;padding:2px 6px 2px 0;white-space:nowrap">${label}</td>
              <td style="color:#e5edf7;padding:2px 0">${val}</td>
            </tr>
          `).join('')}
        </table>
        <div style="margin-top:6px;font-size:.65rem;color:#4b5563">
          ◇ 瞄準　• 偏差後　● 最終落點
        </div>`;
    }

    _renderIdleInfo() {
      if (!this.infoPanel) return;
      this.infoPanel.innerHTML = `
        <div style="font-size:.68rem;font-weight:700;color:#4b5563;letter-spacing:.06em">PITCH INFO</div>
        <div style="font-size:.72rem;color:#4b5563;margin-top:8px">
          投出第一球後<br>此處顯示落點資訊
        </div>`;
    }

    // ── 繪製工具函式 ────────────────────────────────────────────────

    _drawRect(c, x, y, w, h, opts = {}) {
      if (opts.fill) { c.fillStyle = opts.fill; c.fillRect(x, y, w, h); }
      if (opts.stroke) {
        c.strokeStyle = opts.stroke;
        c.lineWidth   = opts.lineWidth || 1;
        c.strokeRect(x, y, w, h);
      }
    }

    _drawDot(c, x, y, r, color, alpha = 1) {
      c.save();
      c.globalAlpha = alpha;
      c.fillStyle   = color;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    _drawBall(c, x, y, r, color, alpha = 1) {
      c.save();
      c.globalAlpha = alpha;
      // 球體漸層
      const grad = c.createRadialGradient(x - r * 0.28, y - r * 0.28, 0, x, y, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, color);
      grad.addColorStop(1, this._darken(color));
      c.fillStyle = grad;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      // 邊框
      c.strokeStyle = 'rgba(255,255,255,0.3)';
      c.lineWidth   = 0.5;
      c.stroke();
      c.restore();
    }

    _drawGlow(c, x, y, r, color) {
      const grad = c.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, color + '55');
      grad.addColorStop(1, color + '00');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }

    _drawDiamond(c, x, y, r, color, alpha = 1) {
      c.save();
      c.globalAlpha = alpha;
      c.fillStyle   = color;
      c.beginPath();
      c.moveTo(x,     y - r);
      c.lineTo(x + r, y);
      c.lineTo(x,     y + r);
      c.lineTo(x - r, y);
      c.closePath();
      c.fill();
      c.restore();
    }

    _darken(hex) {
      // 簡單暗化（只處理 #rrggbb 格式）
      const n = parseInt(hex.slice(1), 16);
      const r = Math.max(0, ((n >> 16) & 0xff) - 50);
      const g = Math.max(0, ((n >>  8) & 0xff) - 50);
      const b = Math.max(0, ( n        & 0xff) - 50);
      return `rgb(${r},${g},${b})`;
    }

    _easeOut(t) { return 1 - Math.pow(1 - t, 2); }
  }

  // ── 公開 ─────────────────────────────────────────────────────────
  global.PitchVisualizer = PitchVisualizer;

})(typeof window !== "undefined" ? window : globalThis);
