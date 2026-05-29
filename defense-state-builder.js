(function (global) {
  "use strict";

  const FIELDING_POSITIONS = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];

  // 守備員預設座標（公尺，以本壘板為原點）
  // 與 fielding-engine.js 的 POSITIONS 保持同步
  const BASE_POSITIONS = {
    P:    { x: 0,    y: 18  },
    C:    { x: 0,    y: -2  },
    "1B": { x: 30,   y: 30  },
    "2B": { x: 18,   y: 48  },
    "3B": { x: -30,  y: 30  },
    SS:   { x: -18,  y: 48  },
    LF:   { x: -50,  y: 72  },
    CF:   { x: 0,    y: 86  },
    RF:   { x: 50,   y: 72  }
  };

  // 守備佈陣定義表
  // offsets 代表每個守位相對 BASE_POSITIONS 的 (dx, dy) 偏移（公尺）
  // fielding-engine.js 讀取 assignment.start，若存在則優先使用
  const DEFENSIVE_ALIGNMENTS = {
    standard: {
      label: "標準",
      description: "預設站位，適合一般情況",
      offsets: {}
    },
    bunt_defense: {
      label: "防短打",
      description: "內野前移，縮短滾地球與短打的處理距離",
      offsets: {
        "1B": { dx: 0, dy: -9  },
        "2B": { dx: 0, dy: -9  },
        "3B": { dx: 0, dy: -9  },
        "SS": { dx: 0, dy: -9  },
        "P":  { dx: 0, dy: -3  }
      }
    },
    double_play: {
      label: "雙殺佈陣",
      description: "二壘手與游擊手靠近二壘，加快雙殺轉傳銜接",
      offsets: {
        "2B": { dx: -5, dy: 6 },
        "SS": { dx:  5, dy: 6 }
      }
    },
    infield_in: {
      label: "內野趨前",
      description: "全內野極端前移，防止三壘跑者搶本壘得分",
      offsets: {
        "1B": { dx: 0,  dy: -16 },
        "2B": { dx: 0,  dy: -14 },
        "3B": { dx: 0,  dy: -16 },
        "SS": { dx: 0,  dy: -14 },
        "P":  { dx: 0,  dy: -3  }
      }
    },
    outfield_deep: {
      label: "外野深守",
      description: "外野手大幅後退，優先防止長打與全壘打",
      offsets: {
        "LF": { dx: 0, dy: 18 },
        "CF": { dx: 0, dy: 18 },
        "RF": { dx: 0, dy: 18 }
      }
    },
    outfield_in: {
      label: "外野前守",
      description: "外野手前移，防短安並阻止壘上跑者多進壘",
      offsets: {
        "LF": { dx: 0, dy: -10 },
        "CF": { dx: 0, dy: -10 },
        "RF": { dx: 0, dy: -10 }
      }
    }
  };

  function getCurrentStadium(gameRef) {
    if (typeof global.window === "undefined") return null;
    const id = gameRef?.currentStadiumId || global.window.HOME_STADIUM_ID || "nccu";
    return global.window.STADIUMS_DATA?.[id] || null;
  }

  function primaryPositions(player) {
    return typeof player?.getPrimaryPositions === "function"
      ? player.getPrimaryPositions()
      : String(player?.position || "").split("/");
  }

  function positionPenalty(player, position) {
    return typeof player?.getPositionPenalty === "function"
      ? player.getPositionPenalty(position)
      : 99;
  }

  function chooseFallbackFielder(position, playerIndexes, players, usedIndexes) {
    const direct = playerIndexes.find(index => {
      if (usedIndexes.has(index)) return false;
      const player = players?.[index];
      return player && primaryPositions(player).includes(position);
    });
    if (direct !== undefined) return direct;

    return playerIndexes
      .filter(index => !usedIndexes.has(index) && players?.[index])
      .sort((a, b) => positionPenalty(players[a], position) - positionPenalty(players[b], position))[0];
  }

  // 計算套用佈陣偏移後的守備員起始座標
  function shiftedStart(position, alignment) {
    const base = BASE_POSITIONS[position] || { x: 0, y: 55 };
    const off = alignment.offsets[position] || { dx: 0, dy: 0 };
    return { x: base.x + off.dx, y: base.y + off.dy };
  }

  function buildPlayerFieldingAssignments(gameRef, makeEntry) {
    const used = new Set();
    const filled = new Set();
    const players = gameRef.roster?.players || [];
    const battingOrder = Array.isArray(gameRef.playerBattingOrder) ? gameRef.playerBattingOrder : [];

    FIELDING_POSITIONS.forEach(position => {
      const playerIndex = gameRef.defensiveAssignments?.[position];
      const player = players[playerIndex];
      if (player && !used.has(playerIndex)) {
        makeEntry(position, player, playerIndex);
        used.add(playerIndex);
        filled.add(position);
      }
    });

    FIELDING_POSITIONS.forEach(position => {
      if (filled.has(position)) return;
      const playerIndex = chooseFallbackFielder(position, battingOrder, players, used);
      if (playerIndex !== undefined) {
        makeEntry(position, players[playerIndex], playerIndex);
        used.add(playerIndex);
        filled.add(position);
      }
    });
  }

  function buildOpponentFieldingAssignments(gameRef, makeEntry) {
    const order = gameRef.opponentTeam?.battingOrder || [];
    const used = new Set();

    FIELDING_POSITIONS.forEach((position, fallbackIndex) => {
      const directIndex = order.findIndex(player => !used.has(player) && primaryPositions(player).includes(position));
      const player = directIndex >= 0
        ? order[directIndex]
        : order.find(candidate => !used.has(candidate)) || order[fallbackIndex % Math.max(1, order.length)];
      if (player) {
        makeEntry(position, player);
        used.add(player);
      }
    });
  }

  // shiftKey: 守備佈陣識別碼，例如 'standard'、'bunt_defense'、'double_play' 等
  // 若 shiftKey 無效，自動退回 'standard'
  function buildDefenseState(gameRef, battingTeam, shiftKey) {
    const alignmentKey = Object.prototype.hasOwnProperty.call(DEFENSIVE_ALIGNMENTS, shiftKey || "standard")
      ? (shiftKey || "standard")
      : "standard";
    const alignment = DEFENSIVE_ALIGNMENTS[alignmentKey];

    const assignments = {};
    // makeEntry 透過閉包取用 alignment，對每個守位計算偏移後座標
    const makeEntry = (position, player, playerIndex = null) => {
      if (!player) return;
      assignments[position] = {
        position,
        player,
        playerIndex,
        start: shiftedStart(position, alignment)
      };
    };

    if (battingTeam === "opponent") {
      makeEntry("P", gameRef.roster?.activeLineup?.pitcher || gameRef.pitcher);
      buildPlayerFieldingAssignments(gameRef, makeEntry);
    } else {
      makeEntry("P", gameRef.opponentTeam?.pitcher);
      buildOpponentFieldingAssignments(gameRef, makeEntry);
    }

    return { assignments, shiftKey: alignmentKey };
  }

  global.DefenseStateBuilder = {
    FIELDING_POSITIONS,
    BASE_POSITIONS,
    DEFENSIVE_ALIGNMENTS,
    getCurrentStadium,
    buildDefenseState
  };
})(typeof window !== "undefined" ? window : globalThis);
