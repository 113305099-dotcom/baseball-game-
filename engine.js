(function (global) {
  "use strict";

  class BaseballGameEngine {
    constructor(options = {}) {
      this.options = options;
      this.autoSimDelayMs = Number.isFinite(options.autoSimDelayMs) ? options.autoSimDelayMs : 50;
      this.GameClass = null;
      this.OpponentAIClass = null;
      this.resolveAtBat = null;
      this.resolveAtBatWithContext = null;
      this.i18n = options.i18n || {};
      this.game = null;
      this.autoSimTimer = null;
    }

    bootstrap(dependencies = {}) {
      this.GameClass = dependencies.GameClass || null;
      this.OpponentAIClass = dependencies.OpponentAIClass || null;
      this.resolveAtBat = dependencies.resolveAtBat || null;
      this.resolveAtBatWithContext = dependencies.resolveAtBatWithContext || null;
      this.i18n = dependencies.i18n || this.i18n || {};
      return this;
    }

    requireGame() {
      if (!this.game) {
        throw new Error("BaseballGameEngine has not been started.");
      }
      return this.game;
    }

    getGame() {
      return this.game;
    }

    start() {
      if (!this.GameClass || (!this.resolveAtBat && !this.resolveAtBatWithContext)) {
        throw new Error("BaseballGameEngine dependencies are incomplete.");
      }

      this.stopAutoSim({ skipRender: true });

      const nextGame = new this.GameClass();
      nextGame.engine = this;
      nextGame.opponentAI = this.OpponentAIClass ? new this.OpponentAIClass(nextGame) : null;

      if (nextGame.saveManager && typeof nextGame.saveManager.load === "function") {
        nextGame.saveManager.load(nextGame);
      }

      this.game = nextGame;
      this.syncGlobals();

      // 注意：故意不在這裡呼叫 nextGame.updateUI()。
      // 因為呼叫者（game.js 的 initializeGameRuntime）會用
      //   game = gameEngine.start();
      // 來賦值給 game.js 模組級的 `let game`。
      // 如果在 start() 內就呼叫 updateUI()，渲染流程會碰到
      // `Player.getRank()` → 讀取 `game.statMapper`，但此時 `game` 還是 null，
      // 造成 TypeError，連帶讓 game.js 的後續初始化全部炸掉。
      // 把第一次 updateUI() 留給呼叫者，等賦值完成後再執行。
      return nextGame;
    }

    syncGlobals() {
      if (!global) return;
      global.gameEngine = this;
      if (this.game) {
        global.game = this.game;
      }
    }

    dispatch(action, payload = {}) {
      const game = this.requireGame();

      switch (action) {
        case "pitch.normal":
          return this.performPitch({ burnLife: false, auto: false });
        case "pitch.magic":
          return this.performPitch({ burnLife: true, auto: false });
        case "game.auto.toggle":
          return game.autoSimEnabled ? this.stopAutoSim() : this.startAutoSim();
        case "game.weather.toggle":
          game.weather = game.weather === this.i18n.sunny ? this.i18n.rainy : this.i18n.sunny;
          game.addToLog(`${this.i18n.weatherChanged} ${game.weather}`);
          game.updateUI();
          return game.weather;
        case "game.pickoff":
          return game.attemptPickoff();
        case "game.steal":
          return game.attemptSteal();
        case "game.baserunning.cycle":
          return game.cycleBaserunningMode();
        case "game.draw.local":
          return game.drawPlayer("local");
        case "game.draw.international":
          return game.drawPlayer("international");
        default:
          throw new Error(`Unknown engine action: ${action}`);
      }
    }

    performPitch({ burnLife = false, auto = false } = {}) {
      const game = this.requireGame();
      if (game.opponentAI && typeof game.opponentAI.decide === "function") {
        game.opponentAI.decide();
      }

      const matchup = typeof game.getCurrentMatchup === "function"
        ? game.getCurrentMatchup()
        : { pitcher: game.pitcher, batter: game.batter };

      const outcome = this.resolveAtBatWithContext
        ? this.resolveAtBatWithContext(game, matchup.pitcher, matchup.batter, burnLife)
        : this.resolveAtBat(matchup.pitcher, matchup.batter, burnLife);
      const prefix = auto ? this.i18n.autoSimOutcome : this.i18n.outcome;
      const suffix = auto ? "" : "!";
      if (prefix && typeof game.addToLog === "function") {
        game.addToLog(`${prefix} ${outcome}${suffix}`);
      }
      return outcome;
    }

    startAutoSim() {
      const game = this.requireGame();
      this.stopAutoSim({ skipRender: true });
      game.autoSimEnabled = true;
      game.updateUI();
      this.scheduleAutoSimStep(0);
      return true;
    }

    scheduleAutoSimStep(delay = this.autoSimDelayMs) {
      this.autoSimTimer = global.setTimeout(() => {
        this.autoSimTimer = null;
        this.runAutoSimStep();
      }, delay);
    }

    runAutoSimStep() {
      const game = this.requireGame();
      if (!game.autoSimEnabled) return;

      if (game.inning > 9) {
        this.stopAutoSim();
        return;
      }

      this.performPitch({ burnLife: false, auto: true });

      if (!game.autoSimEnabled || game.inning > 9) {
        this.stopAutoSim({ skipRender: true });
        return;
      }

      this.scheduleAutoSimStep();
    }

    stopAutoSim({ skipRender = false } = {}) {
      if (this.autoSimTimer) {
        global.clearTimeout(this.autoSimTimer);
        this.autoSimTimer = null;
      }

      if (this.game) {
        this.game.autoSimEnabled = false;
        if (!skipRender && typeof this.game.updateUI === "function") {
          this.game.updateUI();
        }
      }

      return false;
    }
  }

  global.BaseballGameEngine = BaseballGameEngine;
})(typeof window !== "undefined" ? window : globalThis);
