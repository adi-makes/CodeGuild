const RANKS = [
  { rank: 1, name: 'Novice',      minExp: 0    },
  { rank: 2, name: 'Apprentice',  minExp: 200  },
  { rank: 3, name: 'Journeyman',  minExp: 500  },
  { rank: 4, name: 'Adept',       minExp: 1000 },
  { rank: 5, name: 'Master',      minExp: 2000 },
];

/**
 * Calculate the rank for a given totalExp value.
 * @param {number} totalExp
 * @returns {number} rank (1-5)
 */
function getRankForExp(totalExp) {
  let currentRank = 1;
  for (const r of RANKS) {
    if (totalExp >= r.minExp) {
      currentRank = r.rank;
    }
  }
  return currentRank;
}

/**
 * Get rank info object for a given rank number.
 * @param {number} rank
 * @returns {{ rank: number, name: string, minExp: number }}
 */
function getRankInfo(rank) {
  return RANKS.find(r => r.rank === rank) || RANKS[0];
}

/**
 * Get exp required for the next rank, or null if at max rank.
 * @param {number} rank
 * @returns {number|null}
 */
function getNextRankExp(rank) {
  const next = RANKS.find(r => r.rank === rank + 1);
  return next ? next.minExp : null;
}

module.exports = { RANKS, getRankForExp, getRankInfo, getNextRankExp };
