(function (global) {
  "use strict";

  const FIELDING_POSITIONS = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];

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

  function buildDefenseState(gameRef, battingTeam) {
    const assignments = {};
    const makeEntry = (position, player, playerIndex = null) => {
      if (!player) return;
      assignments[position] = { position, player, playerIndex };
    };

    if (battingTeam === "opponent") {
      makeEntry("P", gameRef.roster?.activeLineup?.pitcher || gameRef.pitcher);
      buildPlayerFieldingAssignments(gameRef, makeEntry);
    } else {
      makeEntry("P", gameRef.opponentTeam?.pitcher);
      buildOpponentFieldingAssignments(gameRef, makeEntry);
    }

    return { assignments };
  }

  global.DefenseStateBuilder = {
    FIELDING_POSITIONS,
    getCurrentStadium,
    buildDefenseState
  };
})(typeof window !== "undefined" ? window : globalThis);
