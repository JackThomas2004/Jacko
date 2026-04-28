/**
 * Jacko deck — 150 cards, identical values/colours to Skyjo.
 *
 * Distribution:
 *   -2 : 5    dark-blue
 *   -1 : 10   blue
 *    0 : 15   blue
 *   1–6: 10ea white
 *   7–8: 10ea yellow
 *  9–10: 10ea orange
 * 11–12: 10ea red
 */

function getColor(value) {
  if (value === -2) return 'dark-blue';
  if (value <= 0)  return 'blue';
  if (value <= 6)  return 'white';
  if (value <= 8)  return 'yellow';
  if (value <= 10) return 'orange';
  return 'red';
}

function createDeck() {
  const distribution = {
    '-2': 5,
    '-1': 10,
    '0':  15,
    '1':  10, '2': 10, '3': 10, '4': 10, '5': 10, '6': 10,
    '7':  10, '8': 10,
    '9':  10, '10': 10,
    '11': 10, '12': 10,
  };

  const deck = [];
  let id = 0;

  for (const [valStr, count] of Object.entries(distribution)) {
    const value = parseInt(valStr, 10);
    for (let i = 0; i < count; i++) {
      deck.push({ id: id++, value, color: getColor(value) });
    }
  }

  return deck;
}

/** Fisher-Yates shuffle — mutates and returns the array */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Deal 12 cards to each player as a 3-row × 4-col grid (all face-down).
 * Returns { grids: { [userId]: [[card,...],...]  }, remainingDeck }
 */
function dealCards(deck, playerIds) {
  const grids = {};
  let idx = 0;

  for (const userId of playerIds) {
    const grid = [];
    for (let row = 0; row < 3; row++) {
      const rowCards = [];
      for (let col = 0; col < 4; col++) {
        rowCards.push({ ...deck[idx++], faceUp: false });
      }
      grid.push(rowCards);
    }
    grids[userId] = grid;
  }

  return { grids, remainingDeck: deck.slice(idx) };
}

module.exports = { createDeck, shuffle, dealCards, getColor };
