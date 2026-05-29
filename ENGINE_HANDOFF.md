# Engine Handoff

## Read First

- `PROJECT_OVERVIEW.md`: project summary, module map, and safe modification guide.
- `v3_19-更新書.md`: latest cycle changelog for coach hold/send decisions, close-play slide events, and debug coverage.
- `v3_18-更新書.md`: previous cycle changelog for sacrifice flies, tag-up runner plans, air-out throw challenges, and v3.18 regression coverage.
- `v3_17-更新書.md`: latest cycle changelog for final ball handling points, multi-fielder chase routes, throw timing fixes, slower fielding presentation, and concise broadcast copy.
- `v3_16-更新書.md`: latest cycle changelog for surface physics, outfield throw decisions, runner-vs-throw challenges, and v3.16 smoke coverage.
- `v3_15-更新書.md`: latest cycle changelog for ground-ball physics, infield-through handling, broadcast/animation consistency, and art integration guidance.
- `v3_14-更新書.md`: previous cycle changelog for baserunning movement plans, shared `advanceResult`, relay scoring, and smoke-test hardening.
- `v3_13-更新書.md`: previous cycle changelog for double-play timeline, debug snapshot, and smoke-test hardening.
- `v3_12-更新書.md`: previous cycle changelog for timeline/debug/test work.
- `v3_11-更新書.md`: module split changelog, completed work, unresolved items, and next recommendations.
- `投打對決模型規則書.md`: full design rules and long-form system spec.

## Current Module Boundaries

- `engine.js`: runtime host, action dispatch, auto simulation loop.
- `pitch-engine.js`: pure single-pitch model. It owns pitch location, batter swing decision, contact split, and in-play seed output.
- `pitch-result-applier.js`: stateful early-result applier. It owns balls, called strikes, swing misses, fouls, walks, strikeouts, wild pitches, related commentary, and count reset.
- `fielding-engine.js`: pure in-play model. It owns landing estimate, hang time, final handling point, surface-aware ground-ball bounce/friction, flight drag profile, fielder selection, reach/handling chance, double-play chance, sacrifice-fly/tag-up runner plans, outfield throw decisions, runner-vs-throw challenges, and visual timeline seed. Double plays emit a force throw to 2B, a relay throw to 1B, and matching `runner_out` events.
- `defense-state-builder.js`: defensive state adapter. It converts the current roster, lineup, defensive assignments, opponent batting order, and stadium selection into the data shape consumed by `fielding-engine.js`.
- `baserunning-engine.js`: pure runner advancement model. It owns walk, hit, extra-base, and home-run base movement with generic advancement odds. It returns `movements` plus `decisions`, exposes runner travel timing, and can remove a challenged runner so state updates and `visualTimeline` use the same advancement plan. Air-out tag-ups reuse the same timing helpers.
- `in-play-result-applier.js`: stateful result applier. It owns the final branch from `playResult` into outs, runners, score, concise broadcast commentary, XP, and count reset. For in-play advancement, pass `playResult.advanceResult` into `game.advanceRunners()` to avoid second random rolls, including on `fly_out` tag-ups. It now narrates runner coach send/hold choices when useful.
- `game.js`: stateful coordinator. It applies stamina and counts, then delegates pitch, fielding, baserunning, and in-play result application to focused modules.
- `game-renderer-modules.js` and `game-renderer.js`: scoreboard, HUD, roster, lineup, bullpen, and base display rendering.
- `animation-assets.js`: fielding sprite hook and first procedural `FIELDING_SPRITE_MANIFEST`. It owns `GameAnimationAssets.drawFielder(ctx, actor)` so visual assets can evolve without touching outcome engines.
- `battle-scene.js`, `pitch-visualizer.js`, `batter-visualizer.js`: visual presentation only. They should read `game.lastPitchContext` and `game.lastInPlayContext`, not decide outcomes. For fielding, `fielding.selected` is the final handler; `fielding.primaryAttempt` and `visualTimeline` fielder route events drive missed/chasing movement.
- `engine-debug-panel.js`: optional browser debug overlay for recent pitch, in-play result, selected fielder, first attempt, surface profile, fielder routes, runner AI decisions, slide events, throw decisions, candidate summaries, throws, runner outs, and `visualTimeline` event summaries. It also exposes `GameDebugPanel.snapshot()`.
- `tools/smoke-test-engines.js`: Node smoke test for defense filling, fielder choice, ground-out and double-play timeline order, baserunning errors, pitch-result application, and `index.html` script order.
- `tools/browser-smoke-test.js`: Chrome/Edge smoke test for browser boot, debug panel, visualizer canvas creation, nonblank BattleScene drawing, and a forced double-play `visualTimeline`.
- Art hook: `window.GameAnimationAssets.drawFielder(ctx, actor)` is now loaded before `battle-scene.js`. `actor` includes `x`, `y`, `scale`, `state`, `team`, `position`, `label`, `player`, and `selected`.

## Generic Data Defaults

- Batter heat maps default to neutral `contact/power/eye = 0` per 3x3 zone.
- Batted-ball mix defaults to `GB 42% / LD 22% / FB 30% / PU 6%`.
- `fielding-engine.js` uses generic fielder coordinates and ability-derived speed/reaction until real tracking data exists.
- Ground balls include `ballInfo.groundProfile` with surface key, first bounce distance/time, rolling speed, friction, stop distance, and stop time.
- Non-ground contact includes `ballInfo.flightProfile` with horizontal/vertical speed, vacuum distance, drag scale, wind scale, apex, and air drag.
- `ballInfo.surface` summarizes the active material profile from `FIELD_SURFACE_PHYSICS`, `stadium.surfacePhysicsKey`, and optional `stadium.surfacePhysics`.
- Ground-ball candidates include `ballArrivalSpeedKmh`, `ballPathPhase`, and `ballReachedPoint`; hard grounders can pass the pitcher if the reaction window is too short.
- If a grounder gets through the infield, `fielding.primaryAttempt` records the missed first attempt while `fielding.selected` records the outfielder who finally handles the ball.
- For through-infield hits, `visualTimeline.ball_arrives` points to the final handler's pickup point, not the first infield bounce point.
- Deep `fly_out` results can carry `advanceResult`, `airOutAdvance`, and `throwDecision` so sacrifice flies and tag-ups animate through the same timeline path as hits.
- `baserunning-engine.js` preserves the current simple advancement odds, but now exposes shared runner travel timing for visual events and outfield throw challenges.
- `playResult.advanceResult` is the shared advancement plan for hits, errors, home runs, and wall doubles.
- `advanceResult.movements` powers `runner_start` and `runner_arrives` timeline events for existing runners and the batter runner.
- `advanceResult.decisions` records coach `send` / `hold` choices for extra-base attempts and air-out tag-ups.
- `advanceResult.outsOnBases` records outfield throws that retire advancing runners; `game.advanceRunners()` applies those outs after applying the shared runner state. A runner who reaches the target base before the throw/tag is safe.
- `advanceResult.movements[].startAtSec` is used for tag-up timing so runners leave after the catch, not on contact.
- `playResult.throwDecision` records the target runner/base, direct or relay route, runner arrival, ball/tag arrival, margin, safe chance, outcome, and optional close-play slide metadata.
- `visualTimeline.ball_arrives` is result-aware: outs/errors point to the selected fielder's actual `playPoint`, while hits handled by an outfielder point to the final pickup point.
- `visualTimeline.events` now includes simplified fielder, runner, throw, slide, and out events: `fielder_start`, `fielder_arrives`, `runner_start`, `runner_arrives`, `runner_slide`, `runner_out`, `throw_start`, and `throw_arrives`.
- Double-play `visualTimeline` currently uses `sequence: "force"` for the first throw and `sequence: "relay"` for the second throw.
- Double-play relay fielders are chosen from reasonable infield candidates using fielding, arm, distance, and position responsibility scoring. The chosen fielder is recorded in `playResult.relay`.
- Outfield hit throws may use `sequence: "direct"`, `sequence: "relay_cutoff"`, and `sequence: "relay_throw"`.
- Defense construction fills missing player fielding slots from the active batting order so the fielding engine always has real candidates beyond the pitcher.

## Next Safe Refactor Targets

- Split helper utilities and legacy constants out of `game.js` once the result appliers are stable.
- Replace inline scene scripts in `index.html` with small scene modules.
- Expand runner-vs-throw decisions beyond the current outfield challenge pass, especially rundowns, return-to-base decisions, and a playable third-base coach UI.
- Expand browser-level smoke tests from boot/fielding checks into real multi-inning UI interaction checks.
- Replace the first procedural fielding sprite manifest with real PNG frame manifests for idle/run/field/miss states.

## Design Rule

Outcome is decided before animation. Visual modules should only animate the already resolved `playResult` and `visualTimeline`.
