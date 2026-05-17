/**
 * batter-visualizer.js  v1.0
 *
 * 打擊端 Canvas 視覺化模組（進攻分頁專用）
 *
 * ══════════════════════════════════════════════════════════════════════════
 * 渲染層次架構（所有 Canvas 視覺模組共用此規範，見規則書 §18）
 *
 *   Layer 0  BG      背景填充（純色 / 漸層）
 *   Layer 1  FIELD   場地標記（好球帶框、格線、座標軸說明）
 *   Layer 2  SPRITE  球員 chibi 像素小人（由 SpriteManager 管理）
 *   Layer 3  BALL    球體與軌跡動畫（requestAnimationFrame 緩動）
 *   Layer 4  UI      HUD 標示（目標九宮格遮罩、結果標籤、留影點）
 *
 *   每幀繪製順序：0 → 1 → 2 → 3 → 4（後者覆蓋前者）。
 *   背景與場地（Layer 0–1）每幀重繪；Sprite（Layer 2）依動作狀態繪製；
 *   球（Layer 3）依動畫進度 frac ∈ [0,1] 插值；UI（Layer 4）最後疊上。
 *
 * ══════════════════════════════════════════════════════════════════════════
 * 球員 Sprite 規格（給未來 AI 的製作指引，見規則書 §18.2）
 *
 *   原始畫布尺寸 : 32 × 48 px（透明背景 PNG）
 *   顯示放大     : ×2  →  64 × 96 px（Canvas drawImage + imageSmoothingEnabled=false）
 *   調色盤（SPRITE_PALETTE，共 8 色，不可超出此範圍）：
 *     深藍球衣  #1e2d5a   白色球褲  #f5f0e8
 *     紅色標誌  #cc2222   膚色      #e8b87a
 *     暗棕陰影  #7a4a2a   黑色輪廓  #111111
 *     手套棕    #a0522d   球棒棕    #6b3a2a
 *   動作與帧數：
 *     idle   1帧   靜止待機
 *     ready  2帧   蓄力準備（打者舉棒）
 *     swing  4帧   揮棒動作
 *     watch  1帧   看球（未出棒）
 *   檔名格式  : {role}-{action}-f{n}.png  (n 從 1 起)
 *   存放路徑  : art-assets/production/characters/{role}/
 *
 *   新角色製作流程（給接手 AI 的 SOP）：
 *     1. 用 32×48 透明畫布，依 SPRITE_PALETTE 繪製各動作各帧。
 *     2. 存到 art-assets/production/characters/{role}/ 資料夾。
 *     3. 在 SPRITE_MANIFEST（本檔頂部）加入對應路徑。
 *     4. SpriteManager 自動載入；BatterVisualizer 不需任何修改。
 *
 * ══════════════════════════════════════════════════════════════════════════
 * 使用方式：
 *   // index.html 進攻分頁加入：
 *   // <div id="batter-viz-container"></div>
 *
 *   // inline script 末尾：
 *   const batterViz = new BatterVisualizer();
 *   batterViz.attach('batter-viz-container', game);
 *   // 之後每次 game.updateUI() 呼叫時自動觸發重繪。
 */
(function (global) {
  "use strict";

  // ════════════════════════════════════════════════════════════════════════
  // SPRITE_PALETTE — 所有球員 Sprite 必須使用此 8 色色組（見規則書 §18.2）
  // ════════════════════════════════════════════════════════════════════════
  const SPRITE_PALETTE = {
    uniform: '#1e2d5a',
    pants:   '#f5f0e8',
    accent:  '#cc2222',
    skin:    '#e8b87a',
    shadow:  '#7a4a2a',
    outline: '#111111',
    glove:   '#a0522d',
    bat:     '#6b3a2a'
  };

  // ════════════════════════════════════════════════════════════════════════
  // SPRITE_MANIFEST — 球員 Sprite 資源路徑（見規則書 §18.3）
  //
  // 格式：
  //   { [role]: { [action]: url | url[] } }
  //
  // 若檔案不存在，SpriteManager 自動 fallback 到程序化 placeholder，
  // 遊戲不會崩潰。檔案就位後立即生效，不需修改其他程式碼。
  // ════════════════════════════════════════════════════════════════════════
  const SPRITE_MANIFEST = {
    batter: {
      idle:  'art-assets/production/characters/batter/batter-idle-f1.png',
      watch: 'art-assets/production/characters/batter/batter-idle-f1.png',
      ready: [
        'art-assets/production/characters/batter/batter-ready-f1.png',
        'art-assets/production/characters/batter/batter-ready-f2.png'
      ],
      swing: [
        'art-assets/production/characters/batter/batter-swing-f1.png',
        'art-assets/production/characters/batter/batter-swing-f2.png',
        'art-assets/production/characters/batter/batter-swing-f3.png',
        'art-assets/production/characters/batter/batter-swing-f4.png'
      ]
    }
    // 後續新增角色：pitcher / catcher / fielder / runner
    // 依相同格式在此加入，SpriteManager 不需修改
  };

  // ════════════════════════════════════════════════════════════════════════
  // 場地幾何常數（與 pitch-visualizer.js、pitch-engine.js 完全一致）
  // ════════════════════════════════════════════════════════════════════════
  const GEO = {
    gridHalf:   67.5,
    strikeHalf: 22.5,
    cellSize:   15,
    ballR:      3.6,
    totalRange: 135
  };

  // 好球帶 3×3 各格中心（cm，捕手視角）
  const ZONE_CENTERS = [
    { x: -15, y:  15 }, { x: 0, y:  15 }, { x: 15, y:  15 },
    { x: -15, y:   0 }, { x: 0, y:   0 }, { x: 15, y:   0 },
    { x: -15, y: -15 }, { x: 0, y: -15 }, { x: 15, y: -15 }
  ];

  // 結果標籤映射
  const OUTCOME_LABEL = {
    swing_miss:            '揮空 ✕',
    foul:                  '界外球',
    foul_with_two_strikes: '界外球',
    in_play:               '進場 ✓',
    called_strike:         '好球（看）',
    strikeout:             '三振',
    ball:                  '壞球',
    walk:                  '四壞保送',
    wild_pitch_ball:       '暴投'
  };

  // 打擊端專用色盤（暖色調，區別於 pitch-viz 的冷色調）
  const COLOR = {
    bg:           '#0a0e1a',
    spriteBg:     'rgba(10,20,40,0.6)',
    strikeZone:   'rgba(251,191,36,0.10)',
    strikeFrame:  '#fbbf24',
    gridLine:     'rgba(148,163,184,0.15)',
    targetZone:   'rgba(251,191,36,0.26)',
    targetFrame:  '#f59e0b',
    // 結果顏色
    whiff:        '#ef4444',
    foul:         '#fbbf24',
    inPlay:       '#4ade80',
    calledStrike: '#fb923c',
    ball:         '#60a5fa',
    wild:         '#a855f7',
    // 文字
    textPrimary:  '#e5edf7',
    textMuted:    '#9aa9bc',
    textFaint:    '#4b5563',
    // 面板頭顏色（暖琥珀）
    panelHeader:  '#92400e',
    panelBorder:  'rgba(251,191,36,0.18)'
  };

  // ════════════════════════════════════════════════════════════════════════
  // SpriteManager — Layer 2 管理器
  //
  // 職責：載入 Sprite PNG、切換動作帧、繪製到 Canvas。
  // 無任何遊戲邏輯依賴，可單獨測試。
  // ════════════════════════════════════════════════════════════════════════
  class SpriteManager {
    constructor(manifest, palette) {
      this._manifest = manifest;
      this._palette  = palette;
      this._cache    = {};
      this._role     = null;
      this._action   = 'idle';
      this._frame    = 0;
    }

    /** 預載指定角色全部帧（不阻塞） */
    preload(role) {
      const spec = this._manifest[role];
      if (!spec) return;
      this._role = role;
      Object.values(spec).flat().forEach(url => {
        if (this._cache[url]) return;
        const img = new Image();
        img.src = url;
        this._cache[url] = img;
      });
    }

    /** 設定動作與帧 */
    setAction(action, frame = 0) {
      this._action = action;
      this._frame  = frame;
    }

    /**
     * 繪製 Sprite（Layer 2）
     * @param {CanvasRenderingContext2D} c
     * @param {number} cx   角色水平中心 (canvas px)
     * @param {number} cy   角色腳底 (canvas px)
     * @param {number} scale  預設 2（32×48 → 64×96 px）
     */
    draw(c, cx, cy, scale = 2) {
      const spec = this._manifest[this._role];
      if (spec) {
        const frames = spec[this._action] ?? spec.idle;
        const url = Array.isArray(frames) ? frames[this._frame % frames.length] : frames;
        const img = this._cache[url];
        if (img && img.complete && img.naturalWidth > 0) {
          const dw = 32 * scale;
          const dh = 48 * scale;
          c.save();
          c.imageSmoothingEnabled = false;   // 保持像素銳利，不插值
          c.drawImage(img, cx - dw / 2, cy - dh, dw, dh);
          c.restore();
          return;
        }
      }
      // PNG 尚未就位 → 程序化 placeholder
      this._drawPlaceholder(c, cx, cy, scale);
    }

    // ── 程序化 placeholder（依 SPRITE_PALETTE，視覺上與真實 Sprite 相同規格）──
    _drawPlaceholder(c, cx, cy, scale) {
      const s  = scale;
      const p  = this._palette;
      const ac = this._action;

      c.save();

      // ── Layer 順序：從後往前繪製（球棒 → 腳 → 身 → 頭 → 帽）──

      // 球棒（揮棒時傾斜）
      const batAngle = ac === 'swing' ? -(0.3 + this._frame * 0.25) : -0.1;
      c.save();
      c.translate(cx + s * 5, cy - s * 28);
      c.rotate(batAngle);
      c.fillStyle = p.bat;
      c.fillRect(-s * 1.5, -s * 20, s * 3, s * 22);
      c.restore();

      // 球鞋
      c.fillStyle = p.outline;
      c.fillRect(cx - s * 8, cy - s * 4, s * 7,  s * 4);
      c.fillRect(cx + s * 1, cy - s * 4, s * 8,  s * 4);

      // 球褲（白）
      c.fillStyle = p.pants;
      c.fillRect(cx - s * 7, cy - s * 16, s * 14, s * 12);

      // 線條（褲管）
      c.fillStyle = p.shadow;
      c.fillRect(cx - s * 1, cy - s * 16, s * 2, s * 12);

      // 球衣（深藍）
      c.fillStyle = p.uniform;
      c.fillRect(cx - s * 8, cy - s * 32, s * 16, s * 16);

      // 號碼（紅色裝飾）
      c.fillStyle = p.accent;
      c.fillRect(cx - s * 3, cy - s * 30, s * 6, s * 7);

      // 手套手臂
      c.fillStyle = p.glove;
      c.fillRect(cx - s * 12, cy - s * 28, s * 6, s * 5);

      // 頭（膚色）
      c.fillStyle = p.skin;
      c.beginPath();
      c.arc(cx, cy - s * 40, s * 8, 0, Math.PI * 2);
      c.fill();

      // 球帽（深藍）
      c.fillStyle = p.uniform;
      c.beginPath();
      c.ellipse(cx, cy - s * 45, s * 9, s * 4.5, 0, Math.PI, 0);
      c.fill();
      // 帽沿
      c.fillRect(cx - s * 11, cy - s * 42, s * 22, s * 2);
      // 帽標（紅）
      c.fillStyle = p.accent;
      c.fillRect(cx - s * 2, cy - s * 48, s * 4, s * 3);

      c.restore();
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // BatterVisualizer — 主視覺類別
  // ════════════════════════════════════════════════════════════════════════
  class BatterVisualizer {
    constructor() {
      this.container  = null;
      this.canvas     = null;
      this.ctx        = null;
      this.infoPanel  = null;
      this.game       = null;
      this._animId    = null;
      this._history   = [];
      this._maxHistory = 6;
      this._sprite    = new SpriteManager(SPRITE_MANIFEST, SPRITE_PALETTE);
      this._spriteFrame = 0;
      this._spriteAnimId = null;
    }

    // ── 掛載 ─────────────────────────────────────────────────────────────

    attach(containerId, game) {
      const container = document.getElementById(containerId);
      if (!container) {
        console.warn(`[BatterVisualizer] 找不到容器 #${containerId}`);
        return this;
      }
      this.container = container;
      this.game      = game;
      this._sprite.preload('batter');
      this._buildDOM(container);
      this._hookGameUpdate(game);
      this._drawIdle();
      return this;
    }

    detach() {
      if (this._animId) cancelAnimationFrame(this._animId);
      if (this._spriteAnimId) cancelAnimationFrame(this._spriteAnimId);
      if (this.game && this.game._batterVizHook) {
        this.game.updateUI = this.game._batterVizHook.original;
        delete this.game._batterVizHook;
      }
      this.game = null;
    }

    // ── DOM 建構 ─────────────────────────────────────────────────────────

    _buildDOM(container) {
      container.innerHTML = '';
      container.style.cssText = [
        'display:flex', 'gap:10px', 'align-items:flex-start',
        'padding:10px', `background:#0d1424`, 'border-radius:10px',
        `border:1px solid ${COLOR.panelBorder}`
      ].join(';');

      // Canvas（Layer 0–4 共用）
      this.canvas = document.createElement('canvas');
      this.canvas.width  = 220;
      this.canvas.height = 240;
      this.canvas.style.cssText = 'border-radius:6px;flex-shrink:0;';
      this.canvas.setAttribute('aria-label', '打擊視覺化');
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

    // ── 掛鉤 game.updateUI（避免覆蓋既有鉤子，以 chain 方式串接）─────────

    _hookGameUpdate(game) {
      if (!game || typeof game.updateUI !== 'function') return;
      if (game._batterVizHook) return;   // 防止重複掛鉤
      const original = game.updateUI.bind(game);
      const viz = this;
      game.updateUI = function () {
        const result = original();
        viz._onGameUpdate();
        return result;
      };
      game._batterVizHook = { original };
    }

    _onGameUpdate() {
      const ctx = this.game?.lastPitchContext;
      if (!ctx || !ctx.finalPosition) return;
      this._playAnimation(ctx);
    }

    // ── 動畫主流程 ────────────────────────────────────────────────────────

    _playAnimation(ctx) {
      if (this._animId) cancelAnimationFrame(this._animId);
      if (this._spriteAnimId) cancelAnimationFrame(this._spriteAnimId);

      this._history.push(ctx);
      if (this._history.length > this._maxHistory) this._history.shift();

      const startTime = performance.now();
      const totalMs   = 580;
      const viz = this;

      // 決定 Sprite 動作
      const swung = ctx.didSwing === true;
      this._sprite.setAction(swung ? 'swing' : 'watch', 0);

      // Sprite 帧切換動畫（僅揮棒時）
      if (swung) this._animateSpriteFrames(4, 110);

      function tick(now) {
        const frac = Math.min((now - startTime) / totalMs, 1);
        viz._drawFrame(ctx, frac);
        if (frac < 1) {
          viz._animId = requestAnimationFrame(tick);
        } else {
          viz._animId = null;
          viz._renderBatterInfo(ctx);
        }
      }
      this._animId = requestAnimationFrame(tick);
      this._renderBatterInfo(ctx);
    }

    /** 依序播放 Sprite 帧（每 msPerFrame 毫秒換一帧） */
    _animateSpriteFrames(totalFrames, msPerFrame) {
      let frame = 0;
      const viz = this;
      const start = performance.now();
      function step(now) {
        const elapsed = now - start;
        const nextFrame = Math.floor(elapsed / msPerFrame);
        if (nextFrame !== frame && nextFrame < totalFrames) {
          frame = nextFrame;
          viz._sprite.setAction('swing', frame);
        }
        if (nextFrame < totalFrames) {
          viz._spriteAnimId = requestAnimationFrame(step);
        } else {
          viz._sprite.setAction('idle', 0);
          viz._spriteAnimId = null;
        }
      }
      this._spriteAnimId = requestAnimationFrame(step);
    }

    // ── 繪製一幀（Layer 0 → 4）────────────────────────────────────────────

    _drawFrame(ctx, frac) {
      const cv = this.canvas;
      const c  = this.ctx;
      const W  = cv.width;
      const H  = cv.height;

      // 左側 Sprite 區寬度
      const SPRITE_ZONE_W = 58;
      const margin = { top: 22, right: 12, bottom: 28, left: SPRITE_ZONE_W + 6 };
      const drawW  = W - margin.left - margin.right;
      const drawH  = H - margin.top  - margin.bottom;

      // cm → canvas px（好球帶視角）
      const toX = (cmX) => margin.left + drawW * (cmX + GEO.gridHalf) / (GEO.gridHalf * 2);
      const toY = (cmY) => margin.top  + drawH * (GEO.gridHalf - cmY) / (GEO.gridHalf * 2);

      // ── Layer 0 BG ───────────────────────────────────────────────────
      c.fillStyle = COLOR.bg;
      c.fillRect(0, 0, W, H);

      // ── Layer 0 Sprite 背景區 ─────────────────────────────────────────
      c.fillStyle = COLOR.spriteBg;
      c.fillRect(0, 0, SPRITE_ZONE_W, H);
      c.strokeStyle = 'rgba(251,191,36,0.12)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(SPRITE_ZONE_W, 0);
      c.lineTo(SPRITE_ZONE_W, H);
      c.stroke();

      // ── Layer 1 FIELD：標題 ──────────────────────────────────────────
      c.fillStyle = COLOR.textMuted;
      c.font = '600 8.5px "Noto Sans TC",sans-serif';
      c.textAlign = 'center';
      c.fillText('打 者 視 角　好 球 帶', margin.left + drawW / 2, 14);

      // ── Layer 1 FIELD：格線（9×9 淡化） ─────────────────────────────
      c.strokeStyle = COLOR.gridLine;
      c.lineWidth   = 0.4;
      for (let i = 0; i <= 9; i++) {
        const xPx = toX(-GEO.gridHalf + i * GEO.cellSize);
        const yPx = toY(-GEO.gridHalf + i * GEO.cellSize);
        c.beginPath(); c.moveTo(xPx, toY(GEO.gridHalf));  c.lineTo(xPx, toY(-GEO.gridHalf)); c.stroke();
        c.beginPath(); c.moveTo(toX(-GEO.gridHalf), yPx); c.lineTo(toX(GEO.gridHalf),  yPx); c.stroke();
      }

      // ── Layer 1 FIELD：3×3 好球帶（琥珀框）───────────────────────────
      const szX = toX(-GEO.strikeHalf);
      const szY = toY( GEO.strikeHalf);
      const szW = toX( GEO.strikeHalf) - szX;
      const szH = toY(-GEO.strikeHalf) - szY;
      c.fillStyle = COLOR.strikeZone;
      c.fillRect(szX, szY, szW, szH);
      c.strokeStyle = COLOR.strikeFrame;
      c.lineWidth   = 1.8;
      c.strokeRect(szX, szY, szW, szH);

      // ── Layer 4 UI：目標九宮格（琥珀遮罩）───────────────────────────
      const targetIdx = ctx.targetZoneIndex;
      if (Number.isFinite(targetIdx) && targetIdx >= 0 && targetIdx < 9) {
        const tz = ZONE_CENTERS[targetIdx];
        const tx = toX(tz.x - GEO.cellSize / 2);
        const ty = toY(tz.y + GEO.cellSize / 2);
        const tw = toX(tz.x + GEO.cellSize / 2) - tx;
        const th = toY(tz.y - GEO.cellSize / 2) - ty;
        c.fillStyle   = COLOR.targetZone;
        c.fillRect(tx, ty, tw, th);
        c.strokeStyle = COLOR.targetFrame;
        c.lineWidth   = 1.5;
        c.strokeRect(tx, ty, tw, th);
      }

      // ── Layer 4 UI：歷史留影 ──────────────────────────────────────────
      for (let h = 0; h < this._history.length - 1; h++) {
        const ph  = this._history[h];
        const col = this._resultColor(ph);
        const alpha = 0.05 + (h / this._history.length) * 0.14;
        this._drawDot(c, toX(ph.finalPosition.x), toY(ph.finalPosition.y), 3.5, col, alpha);
      }

      // ── Layer 3 BALL：投球飛行動畫 ───────────────────────────────────
      // 球從 Canvas 頂部中心（投手方向）飛向最終落點
      const finalPx = { x: toX(ctx.finalPosition.x), y: toY(ctx.finalPosition.y) };
      const startPx = { x: margin.left + drawW / 2, y: margin.top - 8 };
      const ease    = this._easeOut(frac);
      const curX    = startPx.x + (finalPx.x - startPx.x) * ease;
      const curY    = startPx.y + (finalPx.y - startPx.y) * ease;
      const hitColor = this._resultColor(ctx);

      if (frac < 0.95) {
        // 軌跡線（虛線）
        c.strokeStyle = 'rgba(255,255,255,0.10)';
        c.lineWidth   = 1;
        c.setLineDash([3, 4]);
        c.beginPath(); c.moveTo(startPx.x, startPx.y); c.lineTo(curX, curY); c.stroke();
        c.setLineDash([]);
        // 移動中的球
        this._drawBall(c, curX, curY, 4.5, '#ffffff', 0.92);
      } else {
        // 最終落點：光暈 + 球
        this._drawGlow(c, finalPx.x, finalPx.y, 14, hitColor);
        this._drawBall(c, finalPx.x, finalPx.y, 5.5, hitColor, 1);

        // 出棒狀態標示
        const swung = ctx.didSwing === true;
        c.font = '700 9px "Noto Sans TC",sans-serif';
        c.textAlign = 'right';
        c.fillStyle = swung ? '#4ade80' : '#9aa9bc';
        c.fillText(swung ? '揮棒 ✓' : '未出棒 —', W - 4, H - 10);
      }

      // ── Layer 2 SPRITE：打者 chibi 小人 ──────────────────────────────
      const spriteCX = SPRITE_ZONE_W / 2;
      const spriteCY = H - 10;
      this._sprite.draw(c, spriteCX, spriteCY, 1.6);

      // ── Layer 1 FIELD：底部座標說明 ──────────────────────────────────
      c.fillStyle = COLOR.textFaint;
      c.font = '7.5px "Noto Sans TC",sans-serif';
      c.textAlign = 'left';
      c.fillText('外角', toX(-GEO.gridHalf) + 2, H - 8);
      c.textAlign = 'right';
      c.fillText('內角', toX(GEO.gridHalf) - 2, H - 8);
      c.textAlign = 'center';
      c.fillText('好球帶', toX(0), H - 8);
    }

    // ── 閒置畫面 ─────────────────────────────────────────────────────────

    _drawIdle() {
      const cv = this.canvas;
      const c  = this.ctx;
      c.fillStyle = COLOR.bg;
      c.fillRect(0, 0, cv.width, cv.height);
      this._drawFrame({
        finalPosition:  { x: 0, y: 0 },
        isStrike:        false,
        isWildPitch:     false,
        targetZoneIndex: 4,
        didSwing:        false
      }, 0);
      c.fillStyle = 'rgba(251,191,36,0.55)';
      c.font = '11px "Noto Sans TC",sans-serif';
      c.textAlign = 'center';
      c.fillText('等待投球…', cv.width / 2 + 16, cv.height / 2 + 4);
    }

    // ── 資訊欄 ────────────────────────────────────────────────────────────

    _renderBatterInfo(ctx) {
      if (!this.infoPanel || !ctx) return;
      const resultColor = this._resultColor(ctx);
      const outcome     = ctx.pitchOutcome ?? (ctx.isWildPitch ? 'wild_pitch_ball' : ctx.isStrike ? 'called_strike' : 'ball');
      const label       = OUTCOME_LABEL[outcome] ?? outcome;
      const score       = ctx.finalContactScore;
      const scoreColor  = typeof score === 'number'
        ? (score >= 70 ? '#4ade80' : score >= 45 ? '#fbbf24' : '#ef4444')
        : '#9aa9bc';

      const rows = [
        ['結果',    `<strong style="color:${resultColor}">${label}</strong>`],
        ['Contact', typeof score === 'number'
          ? `<span style="color:${scoreColor};font-weight:700">${score.toFixed(1)}</span>`
          : '<span style="color:#4b5563">—</span>'],
        ['策略',    ctx.strategy     ?? '—'],
        ['球速鎖',  ctx.velocityLock ?? '不鎖'],
        ['球速',    `${ctx.speedKmh ?? '—'} <small>km/h</small>`],
        ['球種',    ctx.pitchType    ?? '—'],
        ['球威',    `${ctx.stuffGrade ?? '—'} <small>(${Math.round(ctx.stuffScore ?? 0)})</small>`]
      ];

      this.infoPanel.innerHTML = `
        <div style="font-size:.67rem;font-weight:700;color:${COLOR.panelHeader};letter-spacing:.07em;margin-bottom:2px">
          BAT INFO
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:.72rem">
          ${rows.map(([label, val]) => `
            <tr>
              <td style="color:#64748b;padding:2px 5px 2px 0;white-space:nowrap;font-size:.68rem">${label}</td>
              <td style="color:${COLOR.textPrimary};padding:2px 0">${val}</td>
            </tr>
          `).join('')}
        </table>
        <div style="margin-top:6px;font-size:.64rem;color:#4b5563;line-height:1.5">
          ● 落點　□ 目標區<br>琥珀框＝好球帶
        </div>`;
    }

    _renderIdleInfo() {
      if (!this.infoPanel) return;
      this.infoPanel.innerHTML = `
        <div style="font-size:.67rem;font-weight:700;color:${COLOR.panelHeader};letter-spacing:.07em">BAT INFO</div>
        <div style="font-size:.72rem;color:#4b5563;margin-top:8px;line-height:1.6">
          進攻時<br>投球後顯示<br>打擊資訊
        </div>`;
    }

    // ── 工具函式 ─────────────────────────────────────────────────────────

    _resultColor(ctx) {
      if (!ctx) return COLOR.ball;
      if (ctx.isWildPitch) return COLOR.wild;
      switch (ctx.pitchOutcome) {
        case 'swing_miss':
        case 'strikeout':            return COLOR.whiff;
        case 'foul':
        case 'foul_with_two_strikes': return COLOR.foul;
        case 'in_play':               return COLOR.inPlay;
        case 'called_strike':         return COLOR.calledStrike;
        case 'ball':
        case 'walk':
        case 'wild_pitch_ball':       return COLOR.ball;
      }
      return ctx.isStrike ? COLOR.calledStrike : COLOR.ball;
    }

    _drawDot(c, x, y, r, color, alpha = 1) {
      c.save();
      c.globalAlpha = alpha;
      c.fillStyle   = color;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    _drawBall(c, x, y, r, color, alpha = 1) {
      c.save();
      c.globalAlpha = alpha;
      const grad = c.createRadialGradient(x - r * 0.28, y - r * 0.28, 0, x, y, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, color);
      grad.addColorStop(1, this._darken(color));
      c.fillStyle = grad;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.28)';
      c.lineWidth   = 0.5;
      c.stroke();
      c.restore();
    }

    _drawGlow(c, x, y, r, color) {
      const grad = c.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, color + '60');
      grad.addColorStop(1, color + '00');
      c.fillStyle = grad;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }

    _darken(hex) {
      if (!hex || hex[0] !== '#' || hex.length !== 7) return hex;
      const n = parseInt(hex.slice(1), 16);
      const r = Math.max(0, ((n >> 16) & 0xff) - 55);
      const g = Math.max(0, ((n >>  8) & 0xff) - 55);
      const b = Math.max(0, ( n        & 0xff) - 55);
      return `rgb(${r},${g},${b})`;
    }

    _easeOut(t) { return 1 - Math.pow(1 - t, 2.2); }
  }

  // ── 公開 ─────────────────────────────────────────────────────────────────
  global.BatterVisualizer  = BatterVisualizer;
  global.SpriteManager     = SpriteManager;
  global.SPRITE_MANIFEST   = SPRITE_MANIFEST;
  global.SPRITE_PALETTE    = SPRITE_PALETTE;

})(typeof window !== 'undefined' ? window : globalThis);
