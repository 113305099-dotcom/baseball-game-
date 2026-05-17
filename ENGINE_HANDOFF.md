# Engine Handoff

## Read First

- `PROJECT_OVERVIEW.md`: project summary, module map, and safe modification guide.
- `v3_13-更新書.md`: latest cycle changelog for double-play timeline, debug snapshot, and smoke-test hardening.
- `v3_12-更新書.md`: previous cycle changelog for timeline/debug/test work.
- `v3_11-更新書.md`: module split changelog, completed work, unresolved items, and next recommendations.
- `投打對決模型規則書.md`: full design rules and long-form system spec.

## Current Module Boundaries

- `engine.js`: runtime host, action dispatch, auto simulation loop.
- `pitch-engine.js`: pure single-pitch model. It owns pitch location, batter swing decision, contact split, and in-play seed output.
- `pitch-result-applier.js`: stateful early-result applier. It owns balls, called strikes, swing misses, fouls, walks, strikeouts, wild pitches, related commentary, and count reset.
- `fielding-engine.js`: pure in-play model. It owns landing estimate, hang time, fielder selection, reach/handling chance, double-play chance, and visual timeline seed. Double plays now emit a force throw to 2B, a relay throw to 1B, and matching `runner_out` events.
- `defense-state-builder.js`: defensive state adapter. It converts the current roster, lineup, defensive assignments, opponent batting order, and stadium selection into the data shape consumed by `fielding-engine.js`.
- `baserunning-engine.js`: pure runner advancement model. It owns walk, hit, extra-base, and home-run base movement with generic advancement odds.
- `in-play-result-applier.js`: stateful result applier. It owns the final branch from `playResult` into outs, runners, score, commentary, XP, and count reset.
- `game.js`: stateful coordinator. It applies stamina and counts, then delegates pitch, fielding, baserunning, and in-play result application to focused modules.
- `game-renderer-modules.js` and `game-renderer.js`: scoreboard, HUD, roster, lineup, bullpen, and base display rendering.
- `battle-scene.js`, `pitch-visualizer.js`, `batter-visualizer.js`: visual presentation only. They should read `game.lastPitchContext` and `game.lastInPlayContext`, not decide outcomes.
- `engine-debug-panel.js`: optional browser debug overlay for recent pitch, in-play result, selected fielder, candidate summaries, throws, runner outs, and `visualTimeline` event summaries. It also exposes `GameDebugPanel.snapshot()`.
- `tools/smoke-test-engines.js`: Node smoke test for defense filling, fielder choice, ground-out and double-play timeline order, baserunning errors, pitch-result application, and `index.html` script order.
- Optional art hook: define `window.GameAnimationAssets.drawFielder(ctx, actor)` to replace the blocky fallback fielder drawing. `actor` includes `x`, `y`, `scale`, `state`, `team`, `position`, `label`, `player`, and `selected`.

## Generic Data Defaults

- Batter heat maps default to neutral `contact/power/eye = 0` per 3x3 zone.
- Batted-ball mix defaults to `GB 42% / LD 22% / FB 30% / PU 6%`.
- `fielding-engine.js` uses generic fielder coordinates and ability-derived speed/reaction until real tracking data exists.
- `baserunning-engine.js` preserves the current simple advancement odds until runner/throw timing data is available, including one-base advancement on errors.
- `visualTimeline.ball_arrives` is result-aware: outs/errors point to the selected fielder's actual `playPoint`, while clean hits point to the ball landing point.
- `visualTimeline.events` now includes simplified runner, throw, and out events: `runner_start`, `runner_arrives`, `runner_out`, `throw_start`, and `throw_arrives`.
- Double-play `visualTimeline` currently uses `sequence: "force"` for the first throw and `sequence: "relay"` for the second throw.
- Defense construction fills missing player fielding slots from the active batting order so the fielding engine always has real candidates beyond the pitcher.

## Next Safe Refactor Targets

- Split helper utilities and legacy constants out of `game.js` once the result appliers are stable.
- Replace inline scene scripts in `index.html` with small scene modules.
- Model runner-vs-throw decisions beyond the current deterministic double-play timeline.
- Add browser-level smoke tests for `index.html` and the fielding/debug views.
- Add a dedicated sprite manifest for player idle/run/field/miss states using the `GameAnimationAssets.drawFielder` hook.

## Design Rule

Outcome is decided before animation. Visual modules should only animate the already resolved `playResult` and `visualTimeline`.
