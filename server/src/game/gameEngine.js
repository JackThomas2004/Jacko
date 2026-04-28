/**
 * Jacko Game Engine
 * All pure functions — they receive the game state object, validate the action,
 * and return { newState, events } where events is an array of socket events to emit.
 * Redis persistence is handled by the socket handler layer, not here.
 */

const { v4: uuidv4 } = require('uuid');
const { createDeck, shuffle, dealCards } = require('./deck');

// ---------------------------------------------------------------------------
// State factory
// ---------------------------------------------------------------------------

/**
 * Create a fresh game state for a new round (or a brand new game).
 * @param {string} gameId
 * @param {string} lobbyId
 * @param {Array<{userId, username}>} players - in seat order
 * @param {Object} cumulativeScores - existing cumulative scores (empty for round 1)
 * @param {number} roundNumber
 */
function createGameState(gameId, lobbyId, players, cumulativeScores = {}, roundNumber = 1) {
  const deck = shuffle(createDeck());
  const playerIds = players.map((p) => p.userId);
  const { grids, remainingDeck } = dealCards(deck, playerIds);

  // Seed cumulative scores for new players
  const scores = {};
  for (const p of players) {
    scores[p.userId] = cumulativeScores[p.userId] ?? 0;
  }

  return {
    gameId,
    lobbyId,
    roundNumber,
    phase: 'initial_flip', // initial_flip | main | final_round | round_end
    players: players.map((p) => ({
      userId: p.userId,
      username: p.username,
      connected: true,
      initialFlipsDone: false, // true once they've flipped their 2 starting cards
    })),
    grids,                      // { [userId]: [[card,...], ...] }
    drawPile: remainingDeck,
    discardPile: [{ ...remainingDeck[0] }], // one card turned face-up to start
    currentPlayerIndex: 0,      // set properly after all initial flips
    drawnCard: null,            // card currently held in hand
    drawnFrom: null,            // 'deck' | 'discard'
    finalRoundTriggeredBy: null,
    finalRoundTurnsLeft: null,
    cumulativeScores: scores,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGrid(state, userId) {
  return state.grids[userId];
}

function currentPlayer(state) {
  return state.players[state.currentPlayerIndex];
}

function nextPlayerIndex(state) {
  return (state.currentPlayerIndex + 1) % state.players.length;
}

/** Count how many face-down cards a player has */
function faceDownCount(grid) {
  return grid.flat().filter((c) => !c.faceUp).length;
}

/**
 * Check each column (4 columns, 3 rows) for 3 identical face-up values.
 * Returns an array of column indices to remove.
 */
function getCompletedColumns(grid) {
  const toRemove = [];
  for (let col = 0; col < 4; col++) {
    const cards = [grid[0][col], grid[1][col], grid[2][col]];
    if (cards.every((c) => c.faceUp && c.value === cards[0].value)) {
      toRemove.push(col);
    }
  }
  return toRemove;
}

/** Remove completed columns from a grid — replaces their cards with null */
function removeColumns(grid, colIndices) {
  const newGrid = grid.map((row) => [...row]);
  for (const col of colIndices) {
    for (let row = 0; row < 3; row++) {
      newGrid[row][col] = null;
    }
  }
  return newGrid;
}

/** Sum of all non-null, face-up card values in a grid */
function scoreGrid(grid) {
  return grid.flat().filter(Boolean).reduce((sum, c) => sum + c.value, 0);
}

/** Flip all face-down cards face-up (used at round end) */
function revealAll(grid) {
  return grid.map((row) => row.map((c) => (c ? { ...c, faceUp: true } : null)));
}

/** Determine who goes first based on highest sum of flipped cards after initial flip */
function determineFirstPlayer(state) {
  let maxSum = -Infinity;
  let firstIdx = 0;
  state.players.forEach((p, idx) => {
    const faceUpCards = state.grids[p.userId].flat().filter((c) => c && c.faceUp);
    const sum = faceUpCards.reduce((s, c) => s + c.value, 0);
    if (sum > maxSum) {
      maxSum = sum;
      firstIdx = idx;
    }
  });
  return firstIdx;
}

// ---------------------------------------------------------------------------
// Action handlers — each returns { state, events[] }
// ---------------------------------------------------------------------------

/**
 * A player flips their 2 initial cards.
 * positions: [[row, col], [row, col]]
 */
function handleFlipInitialCards(state, userId, positions) {
  if (state.phase !== 'initial_flip') {
    return { error: 'Not in initial flip phase' };
  }
  const player = state.players.find((p) => p.userId === userId);
  if (!player) return { error: 'Player not found' };
  if (player.initialFlipsDone) return { error: 'Already flipped initial cards' };
  if (!Array.isArray(positions) || positions.length !== 2) {
    return { error: 'Must flip exactly 2 cards' };
  }

  const newState = deepClone(state);
  const grid = newState.grids[userId];

  for (const [row, col] of positions) {
    if (grid[row][col].faceUp) return { error: 'Card is already face-up' };
    grid[row][col].faceUp = true;
  }

  newState.players.find((p) => p.userId === userId).initialFlipsDone = true;

  const events = [
    {
      name: 'cards_flipped',
      data: {
        userId,
        positions,
        cards: positions.map(([r, c]) => grid[r][c]),
      },
    },
  ];

  // Check if everyone has flipped their initial cards
  const allDone = newState.players.every((p) => p.initialFlipsDone);
  if (allDone) {
    newState.phase = 'main';
    newState.currentPlayerIndex = determineFirstPlayer(newState);
    events.push({
      name: 'game_phase_started',
      data: { currentPlayerId: newState.players[newState.currentPlayerIndex].userId },
    });
  }

  return { state: newState, events };
}

/**
 * Current player draws the top card from the draw pile.
 */
function handleDrawFromDeck(state, userId) {
  if (state.phase !== 'main' && state.phase !== 'final_round') {
    return { error: 'Not in a drawable phase' };
  }
  if (currentPlayer(state).userId !== userId) return { error: 'Not your turn' };
  if (state.drawnCard) return { error: 'You already have a card in hand' };
  if (state.drawPile.length === 0) return { error: 'Draw pile is empty' };

  const newState = deepClone(state);
  const card = newState.drawPile.shift();
  newState.drawnCard = card;
  newState.drawnFrom = 'deck';

  return {
    state: newState,
    events: [{ name: 'turn_result', data: buildTurnPayload(newState) }],
  };
}

/**
 * Current player takes the top card from the discard pile.
 * They MUST then swap it with a grid card.
 */
function handleTakeFromDiscard(state, userId) {
  if (state.phase !== 'main' && state.phase !== 'final_round') {
    return { error: 'Not in a takeable phase' };
  }
  if (currentPlayer(state).userId !== userId) return { error: 'Not your turn' };
  if (state.drawnCard) return { error: 'You already have a card in hand' };
  if (state.discardPile.length === 0) return { error: 'Discard pile is empty' };

  const newState = deepClone(state);
  const card = newState.discardPile.pop();
  newState.drawnCard = card;
  newState.drawnFrom = 'discard';

  return {
    state: newState,
    events: [{ name: 'turn_result', data: buildTurnPayload(newState) }],
  };
}

/**
 * Current player swaps their drawn card with a grid card at [row, col].
 * The replaced card goes face-up on the discard pile.
 */
function handleSwapCard(state, userId, position) {
  if (!state.drawnCard) return { error: 'No card in hand' };
  if (currentPlayer(state).userId !== userId) return { error: 'Not your turn' };

  const [row, col] = position;
  const newState = deepClone(state);
  const grid = newState.grids[userId];

  if (!grid[row] || !grid[row][col]) return { error: 'Invalid position' };

  const replaced = grid[row][col];
  grid[row][col] = { ...newState.drawnCard, faceUp: true };
  newState.discardPile.push({ ...replaced, faceUp: true });
  newState.drawnCard = null;
  newState.drawnFrom = null;

  const events = [];

  // Check column completion
  const completedCols = getCompletedColumns(grid);
  if (completedCols.length > 0) {
    newState.grids[userId] = removeColumns(grid, completedCols);
    events.push({ name: 'column_removed', data: { userId, colIndices: completedCols } });
  }

  // Check if this player has no face-down cards left → trigger final round
  const result = checkFinalRound(newState, userId);
  Object.assign(newState, result.stateUpdates);
  events.push(...result.events);

  advanceTurn(newState, userId, events);

  events.push({ name: 'turn_result', data: buildTurnPayload(newState) });
  return { state: newState, events };
}

/**
 * Current player discards their drawn card (only allowed if drawn from deck),
 * then flips one of their face-down cards.
 */
function handleDiscardDrawnCard(state, userId) {
  if (!state.drawnCard) return { error: 'No card in hand' };
  if (state.drawnFrom !== 'deck') return { error: 'Cannot discard a card taken from the discard pile' };
  if (currentPlayer(state).userId !== userId) return { error: 'Not your turn' };

  const newState = deepClone(state);
  newState.discardPile.push({ ...newState.drawnCard, faceUp: true });
  newState.drawnCard = null;
  newState.drawnFrom = null;
  // Player must now call flip_facedown_card — we set a flag
  newState.mustFlip = userId;

  return {
    state: newState,
    events: [{ name: 'turn_result', data: buildTurnPayload(newState) }],
  };
}

/**
 * After discarding, the current player flips one of their face-down cards.
 */
function handleFlipFacedownCard(state, userId, position) {
  if (state.mustFlip !== userId) return { error: 'You must discard first before flipping' };
  if (currentPlayer(state).userId !== userId) return { error: 'Not your turn' };

  const [row, col] = position;
  const newState = deepClone(state);
  const grid = newState.grids[userId];

  if (!grid[row] || !grid[row][col]) return { error: 'Invalid position' };
  if (grid[row][col].faceUp) return { error: 'Card is already face-up' };

  grid[row][col] = { ...grid[row][col], faceUp: true };
  newState.mustFlip = null;

  const events = [];

  // Check column completion
  const completedCols = getCompletedColumns(grid);
  if (completedCols.length > 0) {
    newState.grids[userId] = removeColumns(grid, completedCols);
    events.push({ name: 'column_removed', data: { userId, colIndices: completedCols } });
  }

  // Check final round trigger
  const result = checkFinalRound(newState, userId);
  Object.assign(newState, result.stateUpdates);
  events.push(...result.events);

  advanceTurn(newState, userId, events);

  events.push({ name: 'turn_result', data: buildTurnPayload(newState) });
  return { state: newState, events };
}

// ---------------------------------------------------------------------------
// Final round + round end helpers
// ---------------------------------------------------------------------------

function checkFinalRound(state, userId) {
  const stateUpdates = {};
  const events = [];

  if (state.finalRoundTriggeredBy) return { stateUpdates, events }; // already triggered

  const grid = state.grids[userId];
  if (faceDownCount(grid) === 0) {
    stateUpdates.finalRoundTriggeredBy = userId;
    stateUpdates.finalRoundTurnsLeft = state.players.length - 1;
    stateUpdates.phase = 'final_round';
    events.push({ name: 'final_round_started', data: { triggeredByUserId: userId } });
  }

  return { stateUpdates, events };
}

/**
 * After a player's turn, either advance to the next player or end the round.
 * Mutates newState in place and pushes events.
 */
function advanceTurn(newState, userId, events) {
  if (newState.phase === 'final_round') {
    newState.finalRoundTurnsLeft -= 1;
    if (newState.finalRoundTurnsLeft <= 0) {
      endRound(newState, events);
      return;
    }
  }

  newState.currentPlayerIndex = nextPlayerIndex(newState);
}

function endRound(newState, events) {
  newState.phase = 'round_end';

  // Reveal all face-down cards
  for (const p of newState.players) {
    newState.grids[p.userId] = revealAll(newState.grids[p.userId]);
  }

  // Calculate round scores
  const roundScores = {};
  for (const p of newState.players) {
    roundScores[p.userId] = scoreGrid(newState.grids[p.userId]);
  }

  // Penalty: if the trigger player doesn't have the lowest score, double theirs
  const triggerUserId = newState.finalRoundTriggeredBy;
  if (triggerUserId) {
    const triggerScore = roundScores[triggerUserId];
    const othersMin = Math.min(
      ...Object.entries(roundScores)
        .filter(([uid]) => uid !== triggerUserId)
        .map(([, s]) => s)
    );
    if (triggerScore > othersMin) {
      roundScores[triggerUserId] *= 2;
    }
  }

  // Update cumulative scores
  for (const p of newState.players) {
    newState.cumulativeScores[p.userId] =
      (newState.cumulativeScores[p.userId] ?? 0) + roundScores[p.userId];
  }

  events.push({
    name: 'round_ended',
    data: {
      roundNumber: newState.roundNumber,
      roundScores,
      cumulativeScores: newState.cumulativeScores,
      grids: newState.grids,
    },
  });

  // Check if game is over (any player at 100+)
  const gameOver = Object.values(newState.cumulativeScores).some((s) => s >= 100);
  if (gameOver) {
    const winnerId = Object.entries(newState.cumulativeScores).sort(([, a], [, b]) => a - b)[0][0];
    newState.winnerId = winnerId;
    events.push({
      name: 'game_ended',
      data: {
        finalScores: newState.cumulativeScores,
        winnerId,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function buildTurnPayload(state) {
  return {
    phase: state.phase,
    currentPlayerId: state.players[state.currentPlayerIndex]?.userId ?? null,
    drawnCard: state.drawnCard,
    drawnFrom: state.drawnFrom,
    mustFlip: state.mustFlip ?? null,
    discardTopCard: state.discardPile[state.discardPile.length - 1] ?? null,
    drawPileCount: state.drawPile.length,
    grids: state.grids,
    cumulativeScores: state.cumulativeScores,
    finalRoundTriggeredBy: state.finalRoundTriggeredBy,
    finalRoundTurnsLeft: state.finalRoundTurnsLeft,
  };
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = {
  createGameState,
  handleFlipInitialCards,
  handleDrawFromDeck,
  handleTakeFromDiscard,
  handleSwapCard,
  handleDiscardDrawnCard,
  handleFlipFacedownCard,
  buildTurnPayload,
};
