'use strict';
/**
 * battle-scene.js — v2.0
 * 投打對決主視覺 Canvas — 像素風 2.5D 重製版
 *
 * 三個視角狀態（依規則書 §11.9）：
 *   - 'pitching'  : 我方守備（投手丘後方視角看本壘）
 *   - 'batting'   : 我方進攻（打者後方視角看投手）
 *   - 'fielding'  : 球進場後守備俯視（全場斜俯瞰）
 *
 * 圖層架構：
 *   L0 background  天空、外野牆、看台、廣告板
 *   L1 field       草地、紅土、本壘板、壘包、界線
 *   L2 chars-mid   遠景角色（捕手、打者、投手依視角）
 *   L3 overlay     好球帶框、瞄準格、軌跡虛線
 *   L4 chars-fore  前景大角色
 *   L5 ball        棒球
 *   L6 vfx         結果泡泡、特效
 *   L7 hud         canvas 內最小 HUD（規則書 §11.9.5：HUD 不可遮擋本壘區）
 *
 * 設計準則（規則書 §11.11）：
 *   - 粗黑外框、低解析大色塊、硬邊像素、少量階梯狀高光
 *   - 角色比例 Q 版：頭大、身體短、四肢簡化、輪廓厚重
 *   - 不抗鋸齒、所有座標 PX() 對齊整數
 */
(function (global) {

  /* ════════════════════════════════════════════════════════════════
     §1 PALETTE — 像素配色（依參考圖萃取，限定色數）
     ════════════════════════════════════════════════════════════════ */
  const PAL = {
    sky_top:    '#0a1428',
    sky_mid:    '#1c2c50',
    sky_horizon:'#3a4870',

    stand_bg:   '#1a2540',
    stand_rail: '#5a6890',
    crowd_r:    '#a83838',
    crowd_b:    '#3868a8',
    crowd_g:    '#3a7848',
    crowd_y:    '#c8a838',
    crowd_dark: '#2a3450',

    wall:       '#1e2438',
    wall_top:   '#3a4060',
    sign_red:   '#b83828',
    sign_yel:   '#d8b830',
    sign_grn:   '#3a8048',
    sign_blu:   '#3060b8',
    sign_text:  '#f0f0e0',

    grass_a:    '#2e6020',
    grass_b:    '#3a7028',
    grass_c:    '#46802c',
    grass_line: '#5a9038',

    dirt_a:     '#7a4a28',
    dirt_b:     '#9a6038',
    dirt_c:     '#b87848',

    line:       '#f0f0e8',
    plate_white:'#f0f0e8',
    plate_edge: '#c0c0b8',

    home_cap:   '#1a2c5c',
    home_shirt: '#2a458a',
    home_shirt_d:'#1a2c5c',
    home_pant:  '#e8e0c8',
    home_belt:  '#1a1a1a',
    home_sock:  '#1a2c5c',

    away_cap:   '#8c1818',
    away_shirt: '#b82828',
    away_shirt_d:'#8c1818',
    away_pant:  '#e8e0c8',
    away_belt:  '#1a1a1a',
    away_sock:  '#8c1818',

    skin:       '#e0a880',
    skin_shade: '#a07050',
    hair:       '#1a1a1a',
    glove:      '#683818',
    glove_d:    '#3a1808',
    bat:        '#a87038',
    bat_d:      '#683018',
    helmet_red: '#c82828',
    helmet_blue:'#2a458a',

    ump_shirt:  '#181820',
    ump_mask:   '#0a0a0a',
    ump_pad:    '#3a3a48',

    ball:       '#f8f8e8',
    ball_seam:  '#b83838',
    ball_shadow:'rgba(0,0,0,0.35)',

    zone_line:  '#ffffff',
    zone_fill:  'rgba(255,255,255,0.06)',
    aim_strike: 'rgba(102,232,170,0.22)',
    aim_outer:  'rgba(255,160,80,0.18)',

    hud_bg:     'rgba(8,12,24,0.78)',
    hud_border: '#3a4870',
    hud_text:   '#f0f0e8',
    hud_dim:    '#9098a8',
    hud_warn:   '#fbbf24',
    hud_good:   '#4ade80',
    hud_bad:    '#ef4444',

    black:      '#000000',
    white:      '#ffffff',
    outline:    '#0a0c14',
  };

  /* ════════════════════════════════════════════════════════════════
     §2 PIXEL HELPERS
     ════════════════════════════════════════════════════════════════ */
  const PX = Math.round;

  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(PX(x), PX(y), PX(w), PX(h));
  }

  function block(ctx, x, y, w, h, fill, outline = PAL.outline, lw = 2) {
    if (outline && lw > 0) {
      ctx.fillStyle = outline;
      ctx.fillRect(PX(x), PX(y), PX(w), PX(h));
      ctx.fillStyle = fill;
      ctx.fillRect(PX(x + lw), PX(y + lw), PX(w - lw * 2), PX(h - lw * 2));
    } else {
      ctx.fillStyle = fill;
      ctx.fillRect(PX(x), PX(y), PX(w), PX(h));
    }
  }

  function text(ctx, str, x, y, color, size = 10, align = 'left', weight = 'bold') {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px "DotGothic16", "JetBrains Mono", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillText(str, PX(x), PX(y));
  }

  /* ════════════════════════════════════════════════════════════════
     §3 SPRITE LIBRARY — Q 版像素角色
     ════════════════════════════════════════════════════════════════ */
  function teamColors(team) {
    if (team === 'away') {
      return {
        cap: PAL.away_cap, shirt: PAL.away_shirt, shirtD: PAL.away_shirt_d,
        pant: PAL.away_pant, belt: PAL.away_belt, sock: PAL.away_sock,
        helmet: PAL.helmet_red,
      };
    }
    return {
      cap: PAL.home_cap, shirt: PAL.home_shirt, shirtD: PAL.home_shirt_d,
      pant: PAL.home_pant, belt: PAL.home_belt, sock: PAL.home_sock,
      helmet: PAL.helmet_blue,
    };
  }

  /** 投手 sprite */
  function drawPitcher(ctx, cx, cy, s, opts = {}) {
    const C = teamColors(opts.team || 'home');
    const flip = opts.facing === 'left' ? -1 : 1;
    const phase = opts.phase || 'set';
    const u = s;

    ctx.save();
    ctx.translate(PX(cx), PX(cy));
    ctx.scale(flip, 1);

    // 影子
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 * u, 3 * u, 0, 0, Math.PI * 2);
    ctx.fill();

    // 腿（windup 抬腿）
    if (phase === 'windup') {
      block(ctx, -5 * u, -16 * u, 6 * u, 16 * u, C.pant, PAL.outline, 1);
      rect(ctx, -5 * u, -3 * u, 6 * u, 3 * u, C.sock);
      rect(ctx, -6 * u, -1 * u, 8 * u, 2 * u, PAL.outline);
      block(ctx, 2 * u, -18 * u, 5 * u, 5 * u, C.pant, PAL.outline, 1);
      block(ctx, 4 * u, -22 * u, 5 * u, 8 * u, C.pant, PAL.outline, 1);
    } else {
      block(ctx, -6 * u, -16 * u, 5 * u, 16 * u, C.pant, PAL.outline, 1);
      block(ctx,  1 * u, -16 * u, 5 * u, 16 * u, C.pant, PAL.outline, 1);
      rect(ctx, -6 * u, -3 * u, 5 * u, 3 * u, C.sock);
      rect(ctx,  1 * u, -3 * u, 5 * u, 3 * u, C.sock);
      rect(ctx, -7 * u, -1 * u, 7 * u, 2 * u, PAL.outline);
      rect(ctx,  0 * u, -1 * u, 7 * u, 2 * u, PAL.outline);
    }

    // 身體
    block(ctx, -8 * u, -28 * u, 16 * u, 14 * u, C.shirt, PAL.outline, 1);
    rect(ctx, -8 * u, -22 * u, 16 * u, 2 * u, C.shirtD);

    // 手套臂
    if (phase === 'windup') {
      block(ctx, -12 * u, -36 * u, 5 * u, 8 * u, C.shirt, PAL.outline, 1);
      block(ctx, -14 * u, -42 * u, 7 * u, 7 * u, PAL.glove, PAL.glove_d, 1);
    } else {
      block(ctx, -12 * u, -26 * u, 5 * u, 10 * u, C.shirt, PAL.outline, 1);
      block(ctx, -14 * u, -22 * u, 7 * u, 7 * u, PAL.glove, PAL.glove_d, 1);
    }

    // 投球臂 + 球
    if (phase === 'windup') {
      block(ctx, 7 * u, -36 * u, 5 * u, 10 * u, C.shirt, PAL.outline, 1);
      block(ctx, 10 * u, -40 * u, 4 * u, 7 * u, PAL.skin, PAL.outline, 1);
      rect(ctx, 12 * u, -42 * u, 4 * u, 4 * u, PAL.ball);
      rect(ctx, 13 * u, -41 * u, 2 * u, 1 * u, PAL.ball_seam);
    } else {
      block(ctx, 7 * u, -26 * u, 5 * u, 10 * u, C.shirt, PAL.outline, 1);
      block(ctx, 9 * u, -18 * u, 4 * u, 5 * u, PAL.skin, PAL.outline, 1);
    }

    // 脖子
    rect(ctx, -2 * u, -30 * u, 4 * u, 3 * u, PAL.skin);

    // 頭
    block(ctx, -7 * u, -42 * u, 14 * u, 12 * u, PAL.skin, PAL.outline, 1);
    rect(ctx, -4 * u, -37 * u, 2 * u, 2 * u, PAL.outline);
    rect(ctx,  2 * u, -37 * u, 2 * u, 2 * u, PAL.outline);
    rect(ctx, -2 * u, -33 * u, 4 * u, 1 * u, PAL.outline);

    // 帽
    block(ctx, -8 * u, -46 * u, 16 * u, 5 * u, C.cap, PAL.outline, 1);
    block(ctx, -10 * u, -42 * u, 9 * u, 2 * u, C.cap, PAL.outline, 1);
    rect(ctx, -2 * u, -45 * u, 4 * u, 3 * u, PAL.white);

    // 背號
    if (opts.number != null) {
      ctx.save();
      ctx.scale(flip, 1);
      text(ctx, String(opts.number), 0, -22 * u, PAL.white, Math.max(7, 8 * u), 'center');
      ctx.restore();
    }

    ctx.restore();
  }

  /** 打者 sprite */
  function drawBatter(ctx, cx, cy, s, opts = {}) {
    const C = teamColors(opts.team || 'away');
    const flip = opts.facing === 'left' ? -1 : 1;
    const phase = opts.phase || 'ready';
    const u = s;

    ctx.save();
    ctx.translate(PX(cx), PX(cy));
    ctx.scale(flip, 1);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 * u, 3 * u, 0, 0, Math.PI * 2);
    ctx.fill();

    // 腿
    block(ctx, -6 * u, -16 * u, 5 * u, 16 * u, C.pant, PAL.outline, 1);
    block(ctx,  1 * u, -16 * u, 5 * u, 16 * u, C.pant, PAL.outline, 1);
    rect(ctx, -6 * u, -3 * u, 5 * u, 3 * u, C.sock);
    rect(ctx,  1 * u, -3 * u, 5 * u, 3 * u, C.sock);
    rect(ctx, -7 * u, -1 * u, 7 * u, 2 * u, PAL.outline);
    rect(ctx,  0 * u, -1 * u, 7 * u, 2 * u, PAL.outline);

    // 身體
    block(ctx, -8 * u, -28 * u, 16 * u, 14 * u, C.shirt, PAL.outline, 1);
    rect(ctx, -8 * u, -22 * u, 16 * u, 2 * u, C.shirtD);

    // 手臂 + 球棒
    if (phase === 'swing') {
      block(ctx, 6 * u, -26 * u, 6 * u, 4 * u, C.shirt, PAL.outline, 1);
      block(ctx, 10 * u, -24 * u, 4 * u, 4 * u, PAL.skin, PAL.outline, 1);
      block(ctx, 13 * u, -25 * u, 18 * u, 3 * u, PAL.bat, PAL.bat_d, 1);
    } else {
      block(ctx, 6 * u, -32 * u, 5 * u, 6 * u, C.shirt, PAL.outline, 1);
      block(ctx, 8 * u, -38 * u, 4 * u, 8 * u, PAL.skin, PAL.outline, 1);
      ctx.save();
      ctx.translate(PX(10 * u), PX(-40 * u));
      ctx.rotate(-Math.PI / 3.5);
      block(ctx, 0, -3 * u, 24 * u, 4 * u, PAL.bat, PAL.bat_d, 1);
      ctx.restore();
    }

    // 脖子
    rect(ctx, -2 * u, -30 * u, 4 * u, 3 * u, PAL.skin);

    // 頭
    block(ctx, -7 * u, -42 * u, 14 * u, 12 * u, PAL.skin, PAL.outline, 1);
    rect(ctx, -4 * u, -37 * u, 2 * u, 2 * u, PAL.outline);
    rect(ctx,  2 * u, -37 * u, 2 * u, 2 * u, PAL.outline);
    rect(ctx, -2 * u, -33 * u, 4 * u, 1 * u, PAL.outline);

    // 頭盔
    block(ctx, -8 * u, -46 * u, 16 * u, 6 * u, C.helmet, PAL.outline, 1);
    block(ctx, -9 * u, -41 * u, 3 * u, 4 * u, C.helmet, PAL.outline, 1);
    rect(ctx, -5 * u, -45 * u, 2 * u, 2 * u, PAL.white);

    if (opts.number != null) {
      ctx.save();
      ctx.scale(flip, 1);
      text(ctx, String(opts.number), 0, -22 * u, PAL.white, Math.max(7, 8 * u), 'center');
      ctx.restore();
    }

    ctx.restore();
  }

  /** 捕手 sprite */
  function drawCatcher(ctx, cx, cy, s, opts = {}) {
    const C = teamColors(opts.team || 'home');
    const u = s;
    ctx.save();
    ctx.translate(PX(cx), PX(cy));

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 * u, 3 * u, 0, 0, Math.PI * 2);
    ctx.fill();

    block(ctx, -10 * u, -10 * u, 8 * u, 10 * u, C.pant, PAL.outline, 1);
    block(ctx,  2 * u, -10 * u, 8 * u, 10 * u, C.pant, PAL.outline, 1);
    rect(ctx, -10 * u, -2 * u, 8 * u, 2 * u, PAL.outline);
    rect(ctx,  2 * u, -2 * u, 8 * u, 2 * u, PAL.outline);

    // 護腿
    rect(ctx, -10 * u, -10 * u, 8 * u, 4 * u, PAL.line);
    rect(ctx,  2 * u, -10 * u, 8 * u, 4 * u, PAL.line);

    // 身體
    block(ctx, -9 * u, -22 * u, 18 * u, 12 * u, C.shirt, PAL.outline, 1);
    rect(ctx, -7 * u, -20 * u, 14 * u, 9 * u, PAL.ump_pad);

    // 手套
    block(ctx, -14 * u, -18 * u, 7 * u, 7 * u, PAL.glove, PAL.glove_d, 1);

    // 頭
    block(ctx, -6 * u, -32 * u, 12 * u, 10 * u, PAL.skin, PAL.outline, 1);

    // 面罩
    block(ctx, -7 * u, -34 * u, 14 * u, 12 * u, PAL.ump_mask, PAL.outline, 1);
    for (let i = -5; i <= 5; i += 2) {
      rect(ctx, i * u, -33 * u, 1 * u, 10 * u, '#3a3a48');
    }

    ctx.restore();
  }

  /** 主審 sprite */
  function drawUmpire(ctx, cx, cy, s) {
    const u = s;
    ctx.save();
    ctx.translate(PX(cx), PX(cy));

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 0, 9 * u, 2 * u, 0, 0, Math.PI * 2); ctx.fill();

    block(ctx, -5 * u, -14 * u, 4 * u, 14 * u, PAL.ump_shirt, PAL.outline, 1);
    block(ctx,  1 * u, -14 * u, 4 * u, 14 * u, PAL.ump_shirt, PAL.outline, 1);
    rect(ctx, -6 * u, -1 * u, 5 * u, 2 * u, PAL.outline);
    rect(ctx,  0 * u, -1 * u, 5 * u, 2 * u, PAL.outline);

    block(ctx, -7 * u, -28 * u, 14 * u, 14 * u, PAL.ump_shirt, PAL.outline, 1);
    rect(ctx, -6 * u, -26 * u, 12 * u, 11 * u, PAL.ump_pad);

    block(ctx, -6 * u, -38 * u, 12 * u, 10 * u, PAL.skin, PAL.outline, 1);
    block(ctx, -7 * u, -40 * u, 14 * u, 12 * u, PAL.ump_mask, PAL.outline, 1);
    for (let i = -5; i <= 5; i += 2) {
      rect(ctx, i * u, -39 * u, 1 * u, 10 * u, '#3a3a48');
    }

    ctx.restore();
  }

  /** 守備員 sprite（俯視較小） */
  function drawFielder(ctx, cx, cy, s, opts = {}) {
    const customRenderer = global.GameAnimationAssets?.drawFielder;
    if (typeof customRenderer === 'function') {
      const handled = customRenderer(ctx, {
        x: cx,
        y: cy,
        scale: s,
        state: opts.state || 'idle',
        team: opts.team || 'home',
        position: opts.position || opts.label || '',
        label: opts.label || '',
        player: opts.player || null,
        selected: Boolean(opts.selected)
      });
      if (handled) return;
    }

    const C = teamColors(opts.team || 'home');
    const u = s;
    ctx.save();
    ctx.translate(PX(cx), PX(cy));

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 0, 7 * u, 2 * u, 0, 0, Math.PI * 2); ctx.fill();

    block(ctx, -4 * u, -10 * u, 3 * u, 10 * u, C.pant, PAL.outline, 1);
    block(ctx,  1 * u, -10 * u, 3 * u, 10 * u, C.pant, PAL.outline, 1);
    rect(ctx, -4 * u, -1 * u, 3 * u, 1 * u, PAL.outline);
    rect(ctx,  1 * u, -1 * u, 3 * u, 1 * u, PAL.outline);

    block(ctx, -5 * u, -20 * u, 10 * u, 10 * u, C.shirt, PAL.outline, 1);
    rect(ctx, -5 * u, -16 * u, 10 * u, 1 * u, C.shirtD);

    block(ctx, -8 * u, -16 * u, 4 * u, 4 * u, PAL.glove, PAL.glove_d, 1);

    block(ctx, -4 * u, -28 * u, 8 * u, 8 * u, PAL.skin, PAL.outline, 1);
    block(ctx, -5 * u, -30 * u, 10 * u, 4 * u, C.cap, PAL.outline, 1);
    block(ctx, -7 * u, -28 * u, 5 * u, 2 * u, C.cap, PAL.outline, 1);

    if (opts.label) {
      text(ctx, opts.label, 0, -38 * u, PAL.hud_text, 9, 'center');
    }

    ctx.restore();
  }

  /** 棒球 */
  function drawBall(ctx, cx, cy, r) {
    const x = PX(cx), y = PX(cy), R = Math.max(2, PX(r));
    ctx.fillStyle = PAL.ball_shadow;
    ctx.beginPath(); ctx.arc(x, y + 1, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PAL.ball;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PAL.ball_seam;
    ctx.lineWidth = Math.max(1, R / 4);
    ctx.beginPath(); ctx.arc(x, y, R * 0.7, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R * 0.7, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    ctx.strokeStyle = PAL.outline;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
  }

  /** 本壘板 */
  function drawHomePlate(ctx, cx, cy, w, h) {
    ctx.fillStyle = PAL.outline;
    ctx.beginPath();
    ctx.moveTo(PX(cx - w / 2 - 1), PX(cy - h / 2 - 1));
    ctx.lineTo(PX(cx + w / 2 + 1), PX(cy - h / 2 - 1));
    ctx.lineTo(PX(cx + w / 2 + 1), PX(cy));
    ctx.lineTo(PX(cx), PX(cy + h / 2 + 1));
    ctx.lineTo(PX(cx - w / 2 - 1), PX(cy));
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = PAL.plate_white;
    ctx.beginPath();
    ctx.moveTo(PX(cx - w / 2), PX(cy - h / 2));
    ctx.lineTo(PX(cx + w / 2), PX(cy - h / 2));
    ctx.lineTo(PX(cx + w / 2), PX(cy));
    ctx.lineTo(PX(cx), PX(cy + h / 2));
    ctx.lineTo(PX(cx - w / 2), PX(cy));
    ctx.closePath(); ctx.fill();
  }

  /* ════════════════════════════════════════════════════════════════
     §4 BACKGROUND LAYERS
     ════════════════════════════════════════════════════════════════ */
  function drawSky(ctx, W, H, horizonY) {
    const g = ctx.createLinearGradient(0, 0, 0, horizonY);
    g.addColorStop(0, PAL.sky_top);
    g.addColorStop(0.7, PAL.sky_mid);
    g.addColorStop(1, PAL.sky_horizon);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, horizonY);

    // 體育館燈
    ctx.fillStyle = 'rgba(255,255,200,0.7)';
    for (let i = 0; i < 18; i++) {
      const x = (i * 53) % W;
      const y = ((i * 31) % 40) + 4;
      ctx.fillRect(PX(x), PX(y), 2, 2);
    }
  }

  function drawCrowd(ctx, x, y, w, h) {
    rect(ctx, x, y, w, h, PAL.stand_bg);
    const cs = [PAL.crowd_r, PAL.crowd_b, PAL.crowd_g, PAL.crowd_y, PAL.crowd_dark];
    const pxs = 4;
    const rows = Math.max(3, PX(h / 4));
    for (let r = 0; r < rows; r++) {
      const ry = y + r * (h / rows);
      for (let cx = x; cx < x + w; cx += pxs) {
        rect(ctx, cx + 1, ry, 2, 2, PAL.crowd_dark);
        const c = cs[(PX(cx) * 13 + r * 7) % cs.length];
        rect(ctx, cx, ry + 2, 3, 2, c);
      }
    }
    rect(ctx, x, y, w, 1, PAL.stand_rail);
    rect(ctx, x, y + h - 1, w, 1, PAL.stand_rail);
  }

  function drawWallWithSigns(ctx, x, y, w, h) {
    rect(ctx, x, y, w, h, PAL.wall);
    rect(ctx, x, y, w, 2, PAL.wall_top);

    const signs = [
      { c: PAL.sign_red,  t: 'NCCU'  },
      { c: PAL.sign_yel,  t: 'PIXEL' },
      { c: PAL.sign_grn,  t: 'WiFi'  },
      { c: PAL.sign_blu,  t: 'POWER' },
      { c: PAL.sign_red,  t: 'GO!'   },
    ];
    const sw = Math.floor(w / signs.length);
    signs.forEach((s, i) => {
      const sx = x + i * sw + 4;
      const sy = y + 3;
      const sH = h - 6;
      block(ctx, sx, sy, sw - 8, sH, s.c, PAL.outline, 1);
      const fs = Math.max(7, Math.min(11, Math.round(sH * 0.5)));
      text(ctx, s.t, sx + (sw - 8) / 2, sy + sH / 2 - fs / 2, PAL.sign_text, fs, 'center');
    });
  }

  /* ════════════════════════════════════════════════════════════════
     §5 OVERLAY — 好球帶 / 軌跡
     ════════════════════════════════════════════════════════════════ */
  function drawStrikeZoneFrame(ctx, x, y, w, h, opts = {}) {
    rect(ctx, x, y, w, h, PAL.zone_fill);
    ctx.strokeStyle = PAL.zone_line;
    ctx.lineWidth = 2;
    ctx.strokeRect(PX(x) + 0.5, PX(y) + 0.5, PX(w), PX(h));
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(PX(x) + 2.5, PX(y) + 2.5, PX(w) - 4, PX(h) - 4);

    if (opts.hitPoint) {
      const { px, py, isStrike } = opts.hitPoint;
      ctx.fillStyle = isStrike ? PAL.aim_strike : PAL.aim_outer;
      ctx.beginPath();
      ctx.arc(PX(px), PX(py), Math.max(8, w * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPitchTrail(ctx, sx, sy, ex, ey, progress) {
    const dots = 8;
    const visible = Math.floor(progress * dots);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < visible; i++) {
      const t = (i + 0.5) / dots;
      const x = sx + (ex - sx) * t;
      const y = sy + (ey - sy) * t;
      const r = 1.5 + i * 0.15;
      ctx.beginPath(); ctx.arc(PX(x), PX(y), r, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ════════════════════════════════════════════════════════════════
     §6 IN-CANVAS HUD
     ════════════════════════════════════════════════════════════════ */
  const OUTCOME_TEXT = {
    strike: '好球！', ball: '壞球', swing_miss: '揮空！',
    foul: '界外', foul_with_two_strikes: '兩好界外',
    in_play: '打出！', strikeout: '三振！', walk: '四壞保送',
    called_strike: '看見好球',
    '一壘安打': '一壘安打！', '二壘安打': '二壘安打！',
    '三壘安打': '三壘安打！', '全壘打': 'HOME RUN！',
    '三振出局': '三振！', '滾地球出局': '滾地出局',
    '高飛球出局': '高飛出局', '四壞球': '四壞保送',
  };

  function drawOutcomeBubble(ctx, cx, cy, txt, color) {
    const t = OUTCOME_TEXT[txt] || txt;
    if (!t) return;
    ctx.font = 'bold 18px "DotGothic16", "JetBrains Mono", monospace';
    const tw = ctx.measureText(t).width;
    const padX = 12;
    const w = tw + padX * 2;
    const h = 28;
    const x = cx - w / 2, y = cy - h;
    rect(ctx, x + 2, y + 3, w, h, 'rgba(0,0,0,0.5)');
    block(ctx, x, y, w, h, color || PAL.outline, PAL.white, 2);
    ctx.fillStyle = PAL.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t, PX(cx), PX(y + h / 2));
  }

  function fieldingOutcomeLabel(code) {
    const map = {
      home_run: '全壘打',
      net_out: '天網出局',
      net_double: '天網二壘打',
      error: '失誤',
      double_play: '雙殺',
      ground_out: '滾地出局',
      popup_out: '高飛出局',
      fly_out: '接殺',
      hit: '安打',
      foul: '界外'
    };
    return map[code] || code || '';
  }

  function drawViewBadge(ctx, x, y, txt, color) {
    const w = 78, h = 18;
    block(ctx, x, y, w, h, PAL.hud_bg, color, 1);
    text(ctx, txt, x + w / 2, y + 4, color || PAL.hud_text, 10, 'center');
  }

  /* ════════════════════════════════════════════════════════════════
     §7 VIEW: PITCHING — 我方守備視角（Phase 1 重點）
     ════════════════════════════════════════════════════════════════ */
  function drawPitchingView(ctx, W, H, scene) {
    /* L0: 天空 */
    const horizonY = H * 0.32;
    drawSky(ctx, W, H, horizonY);

    /* L0b: 看台 + 外野牆 */
    drawCrowd(ctx, 0, horizonY - 12, W, H * 0.18);
    drawWallWithSigns(ctx, 0, horizonY + H * 0.06, W, H * 0.08);

    /* L1: 草地（漸層 + 條紋） */
    const grassTop = horizonY + H * 0.14;
    const gg = ctx.createLinearGradient(0, grassTop, 0, H);
    gg.addColorStop(0, PAL.grass_a);
    gg.addColorStop(0.5, PAL.grass_b);
    gg.addColorStop(1, PAL.grass_c);
    ctx.fillStyle = gg;
    ctx.fillRect(0, grassTop, W, H - grassTop);

    ctx.globalAlpha = 0.13;
    for (let i = 0; i < 7; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = PAL.grass_line;
        const t1 = i / 7, t2 = (i + 1) / 7;
        const y1 = grassTop + (H - grassTop) * t1;
        const y2 = grassTop + (H - grassTop) * t2;
        ctx.fillRect(0, y1, W, y2 - y1);
      }
    }
    ctx.globalAlpha = 1;

    /* L1b: 投手丘 */
    const moundCx = W * 0.5;
    const moundCy = H * 0.78;
    ctx.fillStyle = PAL.dirt_a;
    ctx.beginPath();
    ctx.ellipse(PX(moundCx), PX(moundCy), W * 0.18, H * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.dirt_b;
    ctx.beginPath();
    ctx.ellipse(PX(moundCx), PX(moundCy - 2), W * 0.16, H * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    rect(ctx, moundCx - 12, moundCy - 4, 24, 3, PAL.line);

    /* L1c: 本壘紅土 */
    const plateCx = W * 0.5;
    const plateCy = horizonY + H * 0.22;
    ctx.fillStyle = PAL.dirt_b;
    ctx.beginPath();
    ctx.moveTo(W * 0.42, plateCy - 6);
    ctx.lineTo(W * 0.58, plateCy - 6);
    ctx.lineTo(W * 0.62, plateCy + 14);
    ctx.lineTo(W * 0.38, plateCy + 14);
    ctx.closePath();
    ctx.fill();

    /* L2: 中景角色 */
    const farScale = Math.max(0.55, Math.min(0.85, W / 900));
    drawCatcher(ctx, plateCx, plateCy + 8, farScale * 0.7, { team: 'home' });
    drawUmpire(ctx, plateCx + 2, plateCy - 4, farScale * 0.7);
    drawBatter(ctx, plateCx + 28 * farScale, plateCy + 6, farScale * 0.75, {
      team: 'away',
      phase: 'ready',
      number: scene._batterNumber,
    });

    /* L3: 好球帶框 */
    const zoneW = Math.min(70, W * 0.085);
    const zoneH = zoneW;
    const zoneX = plateCx - zoneW / 2;
    const zoneY = plateCy - zoneH - 4;

    let hitPoint = null;
    if (scene._lastCtx?.finalPosition && scene._ballProgress >= 0.95) {
      const fp = scene._lastCtx.finalPosition;
      const cm2px = zoneW / 45;
      const px = plateCx + fp.x * cm2px;
      const py = (zoneY + zoneH / 2) - fp.y * cm2px;
      hitPoint = { px, py, isStrike: scene._lastCtx.isStrike };
    }
    drawStrikeZoneFrame(ctx, zoneX, zoneY, zoneW, zoneH, { hitPoint });

    /* L4: 前景投手 */
    const pitcherScale = Math.max(1.6, Math.min(2.6, W / 480));
    const pitcherPhase = scene._ballProgress > 0 && scene._ballProgress < 0.4
      ? 'windup' : 'set';
    drawPitcher(ctx, moundCx, moundCy + 6, pitcherScale, {
      team: 'home',
      phase: pitcherPhase,
      number: scene._pitcherNumber,
    });

    /* L5: 球的動畫 */
    if (scene._ballProgress > 0 && scene._ballProgress <= 1) {
      const p = easeOutQuad(Math.max(0, (scene._ballProgress - 0.3) / 0.7));
      const sx = moundCx + 16 * pitcherScale;
      const sy = moundCy - 42 * pitcherScale;
      const ex = hitPoint ? hitPoint.px : plateCx;
      const ey = hitPoint ? hitPoint.py : zoneY + zoneH / 2;
      const bx = sx + (ex - sx) * p;
      const by = sy + (ey - sy) * p - Math.sin(p * Math.PI) * 6;
      const r = 4 + (1 - p) * 3;
      drawPitchTrail(ctx, sx, sy, bx, by, p);
      drawBall(ctx, bx, by, r);
    }

    /* L6: 結果泡泡 */
    if (scene._outcomeFlash && scene._outcomeFlash.alpha > 0) {
      const f = scene._outcomeFlash;
      ctx.globalAlpha = f.alpha;
      drawOutcomeBubble(ctx, plateCx, plateCy - zoneH - 18, f.text, f.color);
      ctx.globalAlpha = 1;
    }

    /* L7: 視角標籤 */
    drawViewBadge(ctx, 10, H - 24, '守備視角', PAL.hud_good);
  }

  /* ════════════════════════════════════════════════════════════════
     §8 VIEW: BATTING — 我方進攻視角（Phase 2 才細修）
     ════════════════════════════════════════════════════════════════ */
  function drawBattingView(ctx, W, H, scene) {
    const horizonY = H * 0.28;
    drawSky(ctx, W, H, horizonY);
    drawCrowd(ctx, 0, horizonY - 10, W, H * 0.14);
    drawWallWithSigns(ctx, 0, horizonY + H * 0.04, W, H * 0.07);

    const grassTop = horizonY + H * 0.11;
    const gg = ctx.createLinearGradient(0, grassTop, 0, H);
    gg.addColorStop(0, PAL.grass_a);
    gg.addColorStop(1, PAL.grass_c);
    ctx.fillStyle = gg;
    ctx.fillRect(0, grassTop, W, H - grassTop);

    const moundCx = W * 0.5;
    const moundCy = H * 0.5;
    ctx.fillStyle = PAL.dirt_a;
    ctx.beginPath();
    ctx.ellipse(PX(moundCx), PX(moundCy), W * 0.1, H * 0.025, 0, 0, Math.PI * 2);
    ctx.fill();

    const farScale = Math.max(0.7, Math.min(1.1, W / 700));
    const pitcherPhase = scene._ballProgress > 0 && scene._ballProgress < 0.4 ? 'windup' : 'set';
    drawPitcher(ctx, moundCx, moundCy + 2, farScale, {
      team: 'away', phase: pitcherPhase,
      number: scene._opponentPitcherNumber,
    });

    const plateCx = W * 0.5;
    const plateCy = H * 0.86;
    ctx.fillStyle = PAL.dirt_b;
    ctx.beginPath();
    ctx.moveTo(W * 0.1, H);
    ctx.lineTo(W * 0.9, H);
    ctx.lineTo(W * 0.68, plateCy - 30);
    ctx.lineTo(W * 0.32, plateCy - 30);
    ctx.closePath();
    ctx.fill();

    const zoneW = Math.min(140, W * 0.18);
    const zoneH = zoneW;
    const zoneX = plateCx - zoneW / 2;
    const zoneY = plateCy - zoneH - 30;
    drawStrikeZoneFrame(ctx, zoneX, zoneY, zoneW, zoneH);

    // 3x3 隔線
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const xp = zoneX + zoneW * i / 3;
      const yp = zoneY + zoneH * i / 3;
      ctx.beginPath(); ctx.moveTo(xp, zoneY + 2); ctx.lineTo(xp, zoneY + zoneH - 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(zoneX + 2, yp); ctx.lineTo(zoneX + zoneW - 2, yp); ctx.stroke();
    }

    drawHomePlate(ctx, plateCx, plateCy, W * 0.06, 14);

    const batterScale = Math.max(1.4, Math.min(2.4, W / 500));
    drawBatter(ctx, plateCx - 50 * batterScale, plateCy + 8, batterScale, {
      team: 'home',
      phase: scene._batterSwingPhase || 'ready',
      number: scene._batterNumber,
    });

    if (scene._ballProgress > 0 && scene._ballProgress <= 1) {
      const p = easeInQuad(Math.max(0, (scene._ballProgress - 0.3) / 0.7));
      const sx = moundCx + 8 * farScale;
      const sy = moundCy - 14 * farScale;
      let ex = plateCx, ey = zoneY + zoneH / 2;
      if (scene._lastCtx?.finalPosition) {
        const fp = scene._lastCtx.finalPosition;
        const cm2px = zoneW / 45;
        ex = plateCx + fp.x * cm2px;
        ey = (zoneY + zoneH / 2) - fp.y * cm2px;
      }
      const bx = sx + (ex - sx) * p;
      const by = sy + (ey - sy) * p;
      const r = 3 + p * 5;
      drawPitchTrail(ctx, sx, sy, bx, by, p);
      drawBall(ctx, bx, by, r);
    }

    if (scene._outcomeFlash && scene._outcomeFlash.alpha > 0) {
      const f = scene._outcomeFlash;
      ctx.globalAlpha = f.alpha;
      drawOutcomeBubble(ctx, plateCx, zoneY - 20, f.text, f.color);
      ctx.globalAlpha = 1;
    }

    drawViewBadge(ctx, 10, H - 24, '進攻視角', PAL.hud_warn);
  }

  /* ════════════════════════════════════════════════════════════════
     §9 VIEW: FIELDING — 守備俯視（Phase 3 才細修）
     ════════════════════════════════════════════════════════════════ */
  function drawFieldingView(ctx, W, H, scene) {
    const horizonY = H * 0.06;
    rect(ctx, 0, 0, W, horizonY, PAL.sky_mid);

    const gg = ctx.createLinearGradient(0, horizonY, 0, H);
    gg.addColorStop(0, PAL.grass_a);
    gg.addColorStop(0.5, PAL.grass_b);
    gg.addColorStop(1, PAL.grass_c);
    ctx.fillStyle = gg;
    ctx.fillRect(0, horizonY, W, H - horizonY);

    const fcx = W * 0.5;
    const fcy = H * 0.65;
    const infieldR = Math.min(W * 0.35, H * 0.4);
    ctx.fillStyle = PAL.dirt_a;
    ctx.beginPath();
    ctx.moveTo(fcx, fcy + infieldR);
    ctx.lineTo(fcx + infieldR, fcy);
    ctx.lineTo(fcx, fcy - infieldR);
    ctx.lineTo(fcx - infieldR, fcy);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = PAL.grass_b;
    ctx.beginPath();
    ctx.moveTo(fcx, fcy + infieldR * 0.65);
    ctx.lineTo(fcx + infieldR * 0.65, fcy);
    ctx.lineTo(fcx, fcy - infieldR * 0.65);
    ctx.lineTo(fcx - infieldR * 0.65, fcy);
    ctx.closePath(); ctx.fill();

    const bases = [
      { x: fcx, y: fcy + infieldR },
      { x: fcx + infieldR, y: fcy },
      { x: fcx, y: fcy - infieldR },
      { x: fcx - infieldR, y: fcy },
    ];
    const baseScreens = {
      home: bases[0],
      '1B': bases[1],
      '2B': bases[2],
      '3B': bases[3]
    };
    bases.forEach((b, i) => {
      if (i === 0) drawHomePlate(ctx, b.x, b.y, 14, 14);
      else block(ctx, b.x - 7, b.y - 7, 14, 14, PAL.plate_white, PAL.outline, 1);
    });

    const homePoint = bases[0];
    const enginePositions = (typeof FieldingEngine !== 'undefined' && FieldingEngine.POSITIONS) || {
      P:  { x: 0,   y: 18 },
      C:  { x: 0,   y: -2 },
      '1B': { x: 30,  y: 30 },
      '2B': { x: 18,  y: 48 },
      '3B': { x: -30, y: 30 },
      SS: { x: -18, y: 48 },
      LF: { x: -58, y: 86 },
      CF: { x: 0,   y: 102 },
      RF: { x: 58,  y: 86 }
    };
    const mapFieldPoint = (point = { x: 0, y: 0 }) => {
      const scaleX = infieldR * 1.05 / 58;
      const scaleY = infieldR * 2.05 / 105;
      return {
        x: fcx + (point.x || 0) * scaleX,
        y: homePoint.y - (point.y || 0) * scaleY
      };
    };
    const mapTimelinePoint = (point, baseName = null) => {
      if (baseName && baseScreens[baseName]) return baseScreens[baseName];
      return mapFieldPoint(point);
    };
    const moundPoint = mapFieldPoint(enginePositions.P);

    ctx.fillStyle = PAL.dirt_b;
    ctx.beginPath();
    ctx.ellipse(PX(moundPoint.x), PX(moundPoint.y), 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    rect(ctx, moundPoint.x - 6, moundPoint.y - 1, 12, 2, PAL.line);

    ctx.strokeStyle = PAL.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(homePoint.x, homePoint.y);
    ctx.lineTo(fcx + infieldR * 1.4, fcy - infieldR * 0.4);
    ctx.moveTo(homePoint.x, homePoint.y);
    ctx.lineTo(fcx - infieldR * 1.4, fcy - infieldR * 0.4);
    ctx.stroke();

    const positions = ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF']
      .map(label => ({ label, ...mapFieldPoint(enginePositions[label]) }));
    const positionsByLabel = Object.fromEntries(positions.map(p => [p.label, p]));

    const ipctx = scene._lastInPlay || scene.game?.lastInPlayContext;
    const selected = ipctx?.fielding?.selected || null;
    const ballInfo = ipctx?.ballInfo || null;
    const playResult = ipctx?.playResult || null;
    const events = ipctx?.visualTimeline?.events || [];
    const ballArrives = events.find(e => e.type === 'ball_arrives') || null;
    const fielderArrives = events.find(e => e.type === 'fielder_arrives') || null;
    const runnerStarts = events.filter(e => e.type === 'runner_start');
    const throwStarts = events.filter(e => e.type === 'throw_start');
    const now = performance.now();
    const animT = scene._fieldingDurationMs
      ? Math.max(0, Math.min(1, (now - scene._fieldingStartTime) / scene._fieldingDurationMs))
      : 1;
    const timelineSec = (ipctx?.visualTimeline?.durationSec || ballInfo?.hangTimeSec || 2.2) * animT;
    const ballTargetPoint = ballArrives?.point || ballInfo?.landingPoint || selected?.playPoint || null;
    const ballTargetAt = ballArrives?.at || ballInfo?.hangTimeSec || ipctx?.visualTimeline?.durationSec || 2.2;
    const landingScreen = ballTargetPoint ? mapFieldPoint(ballTargetPoint) : null;
    const ballTravelT = ballTargetAt
      ? Math.max(0, Math.min(1, timelineSec / ballTargetAt))
      : animT;
    const easedBallT = easeOutQuad(ballTravelT);

    if (landingScreen) {
      ctx.strokeStyle = 'rgba(255,255,255,0.52)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(homePoint.x, homePoint.y);
      const midX = homePoint.x + (landingScreen.x - homePoint.x) * 0.5;
      const midY = homePoint.y + (landingScreen.y - homePoint.y) * 0.5 - infieldR * 0.34;
      ctx.quadraticCurveTo(midX, midY, landingScreen.x, landingScreen.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = PAL.hud_warn;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(PX(landingScreen.x), PX(landingScreen.y), 9, 0, Math.PI * 2);
      ctx.stroke();
      text(ctx, `${ballInfo.dist_m || ''}m`, landingScreen.x + 12, landingScreen.y - 12, PAL.hud_warn, 10);
      if (selected) {
        const action = playResult?.code === 'hit' || playResult?.code === 'net_double' ? '追球' : '處理';
        text(ctx, `${selected.position} ${action}`, landingScreen.x + 12, landingScreen.y + 4, PAL.plate_white, 10);
      }
    }

    runnerStarts.forEach(startEvent => {
      const finishEvent = events.find(e =>
        (e.type === 'runner_arrives' || e.type === 'runner_out')
        && e.runner === startEvent.runner
        && e.base === startEvent.toBase
        && e.at >= startEvent.at
      );
      const from = mapTimelinePoint(startEvent.point, startEvent.fromBase);
      const to = mapTimelinePoint(finishEvent?.point || startEvent.targetPoint, startEvent.toBase);
      ctx.strokeStyle = 'rgba(96,165,250,0.48)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.setLineDash([]);

      if (timelineSec >= startEvent.at) {
        const arriveAt = finishEvent?.at || (startEvent.at + 1);
        const runnerT = Math.max(0, Math.min(1, (timelineSec - startEvent.at) / Math.max(0.1, arriveAt - startEvent.at)));
        const easedRunner = easeOutQuad(runnerT);
        const runnerX = from.x + (to.x - from.x) * easedRunner;
        const runnerY = from.y + (to.y - from.y) * easedRunner;
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(PX(runnerX), PX(runnerY), 4, 0, Math.PI * 2);
        ctx.fill();
        if (finishEvent?.type === 'runner_out' && runnerT >= 1) {
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(PX(runnerX), PX(runnerY), 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(PX(runnerX - 4), PX(runnerY - 4));
          ctx.lineTo(PX(runnerX + 4), PX(runnerY + 4));
          ctx.moveTo(PX(runnerX + 4), PX(runnerY - 4));
          ctx.lineTo(PX(runnerX - 4), PX(runnerY + 4));
          ctx.stroke();
        }
      }
    });

    throwStarts.forEach(startEvent => {
      const arriveEvent = events.find(e =>
        e.type === 'throw_arrives'
        && e.toBase === startEvent.toBase
        && e.at >= startEvent.at
      );
      const from = mapTimelinePoint(startEvent.point);
      const to = mapTimelinePoint(arriveEvent?.point || startEvent.targetPoint, startEvent.toBase);
      ctx.strokeStyle = 'rgba(248,113,113,0.58)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 2]);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.setLineDash([]);

      if (timelineSec >= startEvent.at) {
        const arriveAt = arriveEvent?.at || (startEvent.at + 0.8);
        const throwT = Math.max(0, Math.min(1, (timelineSec - startEvent.at) / Math.max(0.1, arriveAt - startEvent.at)));
        const ballX = from.x + (to.x - from.x) * throwT;
        const ballY = from.y + (to.y - from.y) * throwT - Math.sin(Math.PI * throwT) * 10;
        drawBall(ctx, ballX, ballY, 3);
      }
    });

    let fielderScreen = null;
    if (selected) {
      const start = positionsByLabel[selected.position] || positionsByLabel.CF;
      const target = mapFieldPoint(fielderArrives?.point || selected.playPoint || ballTargetPoint);
      const fielderArrivalAt = fielderArrives?.at || selected.arrivalSec || ballTargetAt;
      const fielderT = fielderArrivalAt
        ? Math.max(0, Math.min(1, timelineSec / fielderArrivalAt))
        : animT;
      fielderScreen = {
        x: start.x + (target.x - start.x) * easeOutQuad(fielderT),
        y: start.y + (target.y - start.y) * easeOutQuad(fielderT)
      };
      ctx.strokeStyle = 'rgba(251,191,36,0.62)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const fielderScale = Math.max(0.5, Math.min(0.85, W / 700));
    positions.forEach(p => {
      if (selected && p.label === selected.position) return;
      drawFielder(ctx, p.x, p.y, fielderScale, { team: 'home', label: p.label, position: p.label, state: 'idle' });
    });

    if (fielderScreen && selected) {
      const fielderState = ballTravelT < 0.92 ? 'run' : playResult?.code === 'hit' ? 'miss' : 'field';
      drawFielder(ctx, fielderScreen.x, fielderScreen.y, fielderScale * 1.08, {
        team: 'home',
        label: selected.position,
        position: selected.position,
        player: selected.player || null,
        selected: true,
        state: fielderState
      });
    }

    if (landingScreen) {
      const liftRatio = ballInfo?.ballType === 'ground' ? 0.03 : ballInfo?.ballType === 'liner' ? 0.14 : 0.28;
      const arcLift = Math.sin(Math.PI * ballTravelT) * infieldR * liftRatio;
      const ballX = homePoint.x + (landingScreen.x - homePoint.x) * easedBallT;
      const ballY = homePoint.y + (landingScreen.y - homePoint.y) * easedBallT - arcLift;
      drawBall(ctx, ballX, ballY, Math.max(3, 5 - ballTravelT * 1.5));
    }

    if (playResult) {
      const label = fieldingOutcomeLabel(playResult.code);
      const bubbleColor = playResult.code === 'hit' || playResult.code === 'home_run' || playResult.code === 'net_double'
        ? '#4ade80'
        : playResult.code === 'error'
          ? '#ef4444'
          : PAL.hud_warn;
      drawOutcomeBubble(ctx, W * 0.5, Math.max(48, H * 0.18), label, bubbleColor);
    }

    drawViewBadge(ctx, 10, H - 24, '守備俯視', PAL.hud_warn);
  }

  /* ════════════════════════════════════════════════════════════════
     §10 EASING
     ════════════════════════════════════════════════════════════════ */
  function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }
  function easeInQuad(t) { return t * t; }

  /* ════════════════════════════════════════════════════════════════
     §11 BATTLE SCENE 主類別
     ════════════════════════════════════════════════════════════════ */
  class BattleScene {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.game = null;

      this._view = 'idle';
      this._viewTimer = 0;
      this._lastCtx = null;
      this._lastInPlay = null;
      this._ballProgress = -1;
      this._fieldingStartTime = 0;
      this._fieldingDurationMs = 2200;
      this._batterSwingPhase = 'ready';
      this._outcomeFlash = null;
      this._animId = null;

      this._pitcherNumber = 18;
      this._batterNumber = 7;
      this._opponentPitcherNumber = 11;
    }

    attach(containerId, game) {
      const container = document.getElementById(containerId);
      if (!container || this.canvas) return;

      this.game = game;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'battle-canvas';
      this.canvas.style.cssText =
        'display:block;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges;';
      container.appendChild(this.canvas);

      this._resize();
      this._onResize = () => this._resize();
      window.addEventListener('resize', this._onResize);

      if (!game._battleSceneHooked) {
        const self = this;
        const orig = game.updateUI.bind(game);
        game.updateUI = function () {
          const r = orig();
          self._onGameUpdate();
          return r;
        };
        game._battleSceneHooked = true;
      }

      this._onGameUpdate();
    }

    detach() {
      if (this._animId) cancelAnimationFrame(this._animId);
      if (this._onResize) window.removeEventListener('resize', this._onResize);
      if (this.canvas?.parentElement) this.canvas.parentElement.removeChild(this.canvas);
      this.canvas = null; this.ctx = null;
    }

    _resize() {
      const c = this.canvas; if (!c || !c.parentElement) return;
      const rect = c.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(rect.width || 480, 320);
      const h = Math.max(rect.height || 300, 220);
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.scale(dpr, dpr);
      this.ctx = ctx;
      this._W = w; this._H = h; this._dpr = dpr;
      this._draw();
    }

    _onGameUpdate() {
      const g = this.game; if (!g) return;

      try {
        const matchup = typeof g.getCurrentMatchup === 'function'
          ? g.getCurrentMatchup() : { pitcher: g.pitcher, batter: g.batter };
        if (matchup?.pitcher?.uniformNo != null) this._pitcherNumber = matchup.pitcher.uniformNo;
        if (matchup?.batter?.uniformNo != null)  this._batterNumber  = matchup.batter.uniformNo;
      } catch (_) {}

      const pctx = g.lastPitchContext;
      if (pctx && pctx !== this._lastCtx) {
        this._lastCtx = pctx;
        this._view = g.currentHalf === 'top' ? 'pitching' : 'batting';
        this._startPitchAnim(pctx);
      }

      const ipctx = g.lastInPlayContext;
      if (ipctx && ipctx !== this._lastInPlay) {
        this._lastInPlay = ipctx;
        this._view = 'fielding';
        const durationSec = ipctx.visualTimeline?.durationSec || ipctx.ballInfo?.hangTimeSec || 2.2;
        this._fieldingStartTime = performance.now();
        this._fieldingDurationMs = Math.max(1600, Math.min(4200, durationSec * 950));
        this._viewTimer = this._fieldingStartTime + this._fieldingDurationMs + 900;
      }

      if (this._view === 'idle' && g.pitcher && g.batter) {
        this._view = g.currentHalf === 'top' ? 'pitching' : 'batting';
      }

      this._draw();
      this._ensureAnimLoop();
    }

    _startPitchAnim(pctx) {
      this._ballProgress = 0;
      this._batterSwingPhase = 'ready';

      const out = pctx.pitchOutcome || (pctx.isStrike ? '好球' : '壞球');
      let color = PAL.hud_dim;
      if (out === 'called_strike' || out === 'strike') color = '#fbbf24';
      else if (out === 'ball') color = '#60a5fa';
      else if (out === 'swing_miss') color = '#ef4444';
      else if (out === 'in_play' || out === '一壘安打' || out === '二壘安打' || out === '三壘安打') color = '#4ade80';
      else if (out === '全壘打') color = '#ec4899';
      else if (out === 'strikeout' || out === '三振出局') color = '#ef4444';

      if (pctx.didSwing) {
        setTimeout(() => { this._batterSwingPhase = 'swing'; this._draw(); }, 580);
        setTimeout(() => { this._batterSwingPhase = 'follow'; this._draw(); }, 760);
      }

      setTimeout(() => {
        this._outcomeFlash = { text: out, color, alpha: 0, fadeStart: performance.now() + 1200 };
        this._ensureAnimLoop();
      }, 720);
    }

    _ensureAnimLoop() {
      if (this._animId) return;
      const self = this;
      let t0 = performance.now();
      const step = (now) => {
        const dt = (now - t0) / 1000;
        t0 = now;
        let needNext = false;

        if (self._ballProgress >= 0 && self._ballProgress < 1) {
          self._ballProgress += dt * 1.2;
          if (self._ballProgress >= 1) self._ballProgress = 1;
          needNext = true;
        }

        if (self._outcomeFlash) {
          const f = self._outcomeFlash;
          if (now < f.fadeStart) {
            f.alpha = Math.min(1, f.alpha + dt * 4);
            needNext = true;
          } else {
            f.alpha -= dt * 1.5;
            if (f.alpha <= 0) self._outcomeFlash = null;
            else needNext = true;
          }
        }

        if (self._view === 'fielding' && self._viewTimer && now <= self._viewTimer) {
          needNext = true;
        }

        if (self._view === 'fielding' && self._viewTimer && now > self._viewTimer) {
          const g = self.game;
          self._view = g?.currentHalf === 'top' ? 'pitching' : 'batting';
          self._viewTimer = 0;
          needNext = true;
        }

        self._draw();
        if (needNext) self._animId = requestAnimationFrame(step);
        else self._animId = null;
      };
      self._animId = requestAnimationFrame(step);
    }

    _draw() {
      const ctx = this.ctx; if (!ctx) return;
      const W = this._W || 480, H = this._H || 300;
      ctx.clearRect(0, 0, W, H);

      switch (this._view) {
        case 'pitching':  drawPitchingView(ctx, W, H, this); break;
        case 'batting':   drawBattingView(ctx, W, H, this);  break;
        case 'fielding':  drawFieldingView(ctx, W, H, this); break;
        default:          this._drawIdle(ctx, W, H);
      }
    }

    _drawIdle(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, PAL.sky_top); g.addColorStop(1, '#0e1a30');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(60,128,40,0.45)';
      ctx.beginPath();
      ctx.ellipse(W / 2, H * 0.65, W * 0.38, H * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '政大棒球 — 準備開始', W / 2, H * 0.45, PAL.hud_warn, Math.round(W * 0.035), 'center');
    }
  }

  /* ════════════════════════════════════════════════════════════════
     §12 EXPORT
     ════════════════════════════════════════════════════════════════ */
  global.BattleScene = BattleScene;

})(typeof window !== 'undefined' ? window : globalThis);
