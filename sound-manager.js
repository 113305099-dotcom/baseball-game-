// sound-manager.js — v4.2a：背景音樂 + 音效管理模組
// 使用 Web Audio API + <audio> 雙軌：BGM 用 <audio> 做無縫 loop，SFX 用 AudioContext 合成或短音檔
// 瀏覽器 autoplay 政策：必須在使用者點擊後才能啟動音訊 → init() 綁定首次互動
(function (global) {
  "use strict";

  // ────────────────── 設定 ──────────────────
  const AUDIO_DIR = "art-assets/audio/";

  // 場景對應的 BGM 設定（放在 art-assets/audio/ 下）
  // normGain: 音量正規化倍率，1.0=原始音量，>1 更大聲，<1 更小聲
  const BGM_MAP = {
    lobby:    { file: "bgm-lobby.mp3",    normGain: 1.0 },  // 大廳
    pregame:  { file: "bgm-pregame.mp3",  normGain: 1.0 },  // 準備頁
    match:    { file: "bgm-match.mp3",    normGain: 1.0 },  // 比賽中
    tension:  { file: "bgm-tension.mp3",  normGain: 1.0 },  // 關鍵時刻
    victory:  { file: "bgm-victory.mp3",  normGain: 1.0 },  // 賽後勝利
    menu:     { file: "bgm-lobby.mp3",    normGain: 1.0 }   // 選單（共用大廳）
  };

  // SFX 音效（先留空，後續用 Web Audio 合成或加音檔）
  const SFX_MAP = {
    hit:       null,  // 擊球聲
    strikeout: null,  // 三振
    homerun:   null,  // 全壘打
    catch:     null,  // 接球
    foul:      null,  // 界外
    cheer:     null,  // 觀眾歡呼
    ui_click:  null   // UI 點擊
  };

  // ────────────────── 內部狀態 ──────────────────
  let initialized = false;
  let bgmVolume    = 0.35;   // 0–1
  let sfxVolume    = 0.5;
  let muted        = false;
  let currentScene = null;
  let currentBgmAudio = null;
  let crossfadeTimer  = null;

  // 合成音效用 AudioContext（延遲初始化）
  let audioCtx = null;

  // ────────────────── 初始化 ──────────────────
  function init(options = {}) {
    if (initialized) return;
    bgmVolume = options.musicVolume ?? 0.35;
    sfxVolume = options.sfxVolume  ?? 0.5;
    muted     = options.muted       ?? false;

    // 從 localStorage 讀取音量設定
    try {
      const saved = JSON.parse(localStorage.getItem("nccu_audio_settings") || "{}");
      bgmVolume = saved.bgmVolume ?? bgmVolume;
      sfxVolume = saved.sfxVolume ?? sfxVolume;
      muted     = saved.muted      ?? muted;
    } catch (e) { /* ignore */ }

    initialized = true;
    console.log("[SoundManager] initialized", { bgmVolume, sfxVolume, muted });
  }

  function _ensureAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (global.AudioContext || global.webkitAudioContext)();
    }
    // 若 AudioContext 被瀏覽器暫停（autoplay 政策），恢復它
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // ────────────────── BGM ──────────────────
  function playBGM(scene) {
    if (!initialized) { console.warn("[SoundManager] not initialized, call init() first"); return; }
    if (scene === currentScene) return; // 同一場景不重播
    currentScene = scene;

    const cfg = BGM_MAP[scene];
    if (!cfg) { console.warn("[SoundManager] no BGM mapped for scene:", scene); return; }

    const src = AUDIO_DIR + cfg.file;

    // 停止舊的
    _stopCurrentBGM();

    // 建立新的 audio 元素
    const audio = new Audio(src);
    audio.loop   = true;
    audio.volume = muted ? 0 : Math.min(1, bgmVolume * cfg.normGain);
    audio.preload = "auto";

    audio.addEventListener("error", () => {
      // 檔案不存在時靜默（第一次用可能還沒放音檔）
      console.debug("[SoundManager] BGM file not found:", src, "(this is normal on first setup)");
    });

    audio.addEventListener("canplaythrough", () => {
      audio.play().catch(e => {
        console.debug("[SoundManager] autoplay blocked — will resume on next user gesture");
      });
    });

    currentBgmAudio = audio;

    // 嘗試播放
    audio.play().catch(e => {
      // autoplay 被擋 → 等下次使用者點擊時 _resumeAllAudio
    });
  }

  function _stopCurrentBGM() {
    if (crossfadeTimer) { clearTimeout(crossfadeTimer); crossfadeTimer = null; }
    if (currentBgmAudio) {
      currentBgmAudio.pause();
      currentBgmAudio.src = "";
      currentBgmAudio.load();
      currentBgmAudio = null;
    }
  }

  function crossfadeBGM(scene, durationMs = 1200) {
    if (!currentBgmAudio) { playBGM(scene); return; }

    // 漸弱舊的
    const oldAudio = currentBgmAudio;
    const oldVol   = muted ? 0 : bgmVolume;
    const steps    = Math.max(4, Math.floor(durationMs / 50));
    const stepMs   = durationMs / steps;
    let i = 0;

    crossfadeTimer = setInterval(() => {
      i++;
      const t = i / steps;
      oldAudio.volume = Math.max(0, oldVol * (1 - t));
      if (i >= steps) {
        clearInterval(crossfadeTimer);
        _stopCurrentBGM();
        playBGM(scene);
      }
    }, stepMs);
  }

  // ────────────────── SFX ──────────────────
  function playSFX(name) {
    if (!initialized || muted) return;
    // 先用合成音效，後續可改讀音檔
    const ctx = _ensureAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.value = sfxVolume * 0.6;
    masterGain.connect(ctx.destination);

    switch (name) {
      case "hit": {
        // 短白噪 burst（球棒擊球）
        const duration = 0.12;
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const t = i / ctx.sampleRate;
          data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.7;
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(masterGain);
        src.start(now);
        break;
      }
      case "catch": {
        // 低頻 thump（手套接球）
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
        const g = ctx.createGain();
        g.gain.setValueAtTime(sfxVolume * 0.5, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case "strikeout": {
        // 尖銳 sweep down
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);
        const g = ctx.createGain();
        g.gain.setValueAtTime(sfxVolume * 0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }
      case "homerun": {
        // 上升 sweep + 歡呼（noise burst）
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
        const g = ctx.createGain();
        g.gain.setValueAtTime(sfxVolume * 0.15, now);
        g.gain.linearRampToValueAtTime(sfxVolume * 0.3, now + 0.25);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.55);

        // 疊加 noise cheer
        const dur = 0.5;
        const bufSize = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          const t = i / ctx.sampleRate;
          d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 5) * 0.3;
        }
        const ns = ctx.createBufferSource();
        ns.buffer = buf;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(sfxVolume * 0.2, now + 0.1);
        ng.gain.exponentialRampToValueAtTime(0.001, now + dur);
        ns.connect(ng);
        ng.connect(ctx.destination);
        ns.start(now + 0.1);
        break;
      }
      case "foul": {
        // 短促 click
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = 600;
        const g = ctx.createGain();
        g.gain.setValueAtTime(sfxVolume * 0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      case "cheer": {
        // 觀眾歡呼（noise + 多頻）
        const dur = 0.8;
        const bufSize = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          const t = i / ctx.sampleRate;
          const env = Math.exp(-t * 3) * 0.35;
          d[i] = (Math.random() * 2 - 1) * env;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.value = sfxVolume * 0.5;
        src.connect(g);
        g.connect(ctx.destination);
        src.start(now);
        break;
      }
      case "ui_click": {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 800;
        const g = ctx.createGain();
        g.gain.setValueAtTime(sfxVolume * 0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }
      default:
        console.debug("[SoundManager] unknown SFX:", name);
    }
  }

  // ────────────────── 音量控制 ──────────────────
  function setMusicVolume(v) {
    bgmVolume = Math.max(0, Math.min(1, v));
    if (currentBgmAudio && !muted) {
      const cfg = BGM_MAP[currentScene] || { normGain: 1 };
      currentBgmAudio.volume = Math.min(1, bgmVolume * cfg.normGain);
    }
    _saveSettings();
  }

  function setSFXVolume(v) {
    sfxVolume = Math.max(0, Math.min(1, v));
    _saveSettings();
  }

  function toggleMute() {
    muted = !muted;
    if (currentBgmAudio) {
      const cfg = BGM_MAP[currentScene] || { normGain: 1 };
      currentBgmAudio.volume = muted ? 0 : Math.min(1, bgmVolume * cfg.normGain);
    }
    _saveSettings();
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function _saveSettings() {
    try {
      localStorage.setItem("nccu_audio_settings", JSON.stringify({
        bgmVolume, sfxVolume, muted
      }));
    } catch (e) { /* ignore */ }
  }

  // ────────────────── 輔助：恢復 autoplay 被擋的音訊 ──────────────────
  // 在 document 點擊/touch/keydown 後呼叫
  function _resumeAllAudio() {
    if (!initialized) return;
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    if (currentBgmAudio && currentBgmAudio.paused && currentBgmAudio.src) {
      currentBgmAudio.play().catch(e => {});
    }
  }

  // 監聽首次使用者互動以解鎖 autoplay
  function _setupAutoplayUnlock() {
    const unlock = () => {
      _resumeAllAudio();
    };
    document.addEventListener("click",      unlock, { once: false });
    document.addEventListener("touchstart", unlock, { once: false });
    document.addEventListener("keydown",    unlock, { once: false });
  }

  // ────────────────── 公開 API ──────────────────
  const SoundManager = {
    init,
    playBGM,
    crossfadeBGM,
    stopBGM: _stopCurrentBGM,
    playSFX,
    setMusicVolume,
    setSFXVolume,
    toggleMute,
    isMuted,
    get musicVolume() { return bgmVolume; },
    get sfxVolume()  { return sfxVolume; },
    get currentScene() { return currentScene; },

    // 方便外部綁定：當場景切換時自動播對應 BGM
    playSceneBGM(scene) {
      const mapped = {
        lobby: "lobby", pregame: "pregame", match: "match",
        offense: "match", defense: "match", tension: "tension",
        victory: "victory", menu: "menu"
      };
      playBGM(mapped[scene] || scene);
    }
  };

  // 自動設定 autoplay 解鎖
  if (typeof document !== "undefined") {
    _setupAutoplayUnlock();
  }

  global.SoundManager = SoundManager;
})(typeof window !== "undefined" ? window : globalThis);
