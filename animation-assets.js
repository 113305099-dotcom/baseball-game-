"use strict";

(function attachAnimationAssets(global) {
  const STATES = ["idle", "run", "field", "miss"];

  const FIELDING_SPRITE_MANIFEST = {
    version: 1,
    renderer: "procedural_pixel",
    states: Object.fromEntries(STATES.map(state => [state, { frames: 1, fallback: true }]))
  };

  const PALETTE = {
    outline: "#10151f",
    shadow: "rgba(0,0,0,0.34)",
    skin: "#f4c58a",
    skinDark: "#b8794f",
    glove: "#8b5a2b",
    gloveDark: "#4a2e18",
    home: { cap: "#101827", shirt: "#f8fafc", shirtDark: "#cbd5e1", pants: "#111827", accent: "#fbbf24" },
    away: { cap: "#7f1d1d", shirt: "#fee2e2", shirtDark: "#fca5a5", pants: "#1f2937", accent: "#60a5fa" }
  };

  function px(value) {
    return Math.round(value) + 0.5;
  }

  function rect(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(px(x), px(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }

  function block(ctx, x, y, w, h, fill, stroke = PALETTE.outline) {
    rect(ctx, x, y, w, h, fill);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(px(x), px(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }

  function teamColors(team) {
    return team === "away" ? PALETTE.away : PALETTE.home;
  }

  function poseFor(state) {
    if (state === "run") {
      return { bodyLean: -1.5, leftLeg: -2.5, rightLeg: 2.5, gloveX: -9, gloveY: -17, armX: 6, armY: -16 };
    }
    if (state === "field") {
      return { bodyLean: 0, leftLeg: -3, rightLeg: 3, gloveX: -11, gloveY: -8, armX: 5, armY: -10 };
    }
    if (state === "miss") {
      return { bodyLean: 1.5, leftLeg: -1, rightLeg: 2, gloveX: -12, gloveY: -21, armX: 8, armY: -12 };
    }
    return { bodyLean: 0, leftLeg: -1.6, rightLeg: 1.6, gloveX: -8, gloveY: -15, armX: 5, armY: -15 };
  }

  function drawLabel(ctx, actor, scale) {
    if (!actor.label && !actor.position) return;
    ctx.font = `${Math.max(8, Math.round(9 * scale))}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.72)";
    ctx.strokeText(actor.label || actor.position, 0, -36 * scale);
    ctx.fillStyle = "#fef3c7";
    ctx.fillText(actor.label || actor.position, 0, -36 * scale);
  }

  function drawFielder(ctx, actor = {}) {
    const scale = Number(actor.scale) || 1;
    const colors = teamColors(actor.team);
    const pose = poseFor(actor.state || "idle");

    ctx.save();
    ctx.translate(px(actor.x || 0), px(actor.y || 0));

    ctx.fillStyle = PALETTE.shadow;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5 * scale, 2.4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    if (actor.selected) {
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = Math.max(1.5, 2 * scale);
      ctx.beginPath();
      ctx.arc(0, -11 * scale, 16 * scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    block(ctx, (-4 + pose.leftLeg) * scale, -10 * scale, 3.4 * scale, 10 * scale, colors.pants);
    block(ctx, (1 + pose.rightLeg) * scale, -10 * scale, 3.4 * scale, 10 * scale, colors.pants);
    block(ctx, (-5 + pose.bodyLean) * scale, -21 * scale, 10 * scale, 11 * scale, colors.shirt);
    rect(ctx, (-5 + pose.bodyLean) * scale, -16 * scale, 10 * scale, 1.5 * scale, colors.shirtDark);

    block(ctx, pose.gloveX * scale, pose.gloveY * scale, 5 * scale, 5 * scale, PALETTE.glove, PALETTE.gloveDark);
    block(ctx, pose.armX * scale, pose.armY * scale, 3 * scale, 6 * scale, colors.shirtDark);

    block(ctx, (-4 + pose.bodyLean) * scale, -29 * scale, 8 * scale, 8 * scale, PALETTE.skin);
    rect(ctx, (-3 + pose.bodyLean) * scale, -24 * scale, 6 * scale, 1 * scale, PALETTE.skinDark);
    block(ctx, (-5 + pose.bodyLean) * scale, -31 * scale, 10 * scale, 4 * scale, colors.cap);
    rect(ctx, (-8 + pose.bodyLean) * scale, -28 * scale, 5 * scale, 2 * scale, colors.cap);

    drawLabel(ctx, actor, scale);
    ctx.restore();
    return true;
  }

  global.FIELDING_SPRITE_MANIFEST = FIELDING_SPRITE_MANIFEST;
  global.GameAnimationAssets = {
    ...(global.GameAnimationAssets || {}),
    FIELDING_SPRITE_MANIFEST,
    drawFielder
  };
})(typeof window !== "undefined" ? window : globalThis);
