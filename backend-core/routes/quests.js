const express = require('express');
const router = express.Router();
const quests = require('../data/quests.json');

/**
 * GET /api/quests
 * Returns all quests, optionally filtered by ?rank=N (shows quests with requiredRank <= N)
 */
router.get('/', (req, res) => {
    try {
        const rankFilter = req.query.rank ? parseInt(req.query.rank, 10) : null;
        if (rankFilter !== null && isNaN(rankFilter)) {
            return res.status(400).json({ error: 'Invalid rank query parameter' });
        }

        const result = rankFilter
            ? quests.filter(q => q.requiredRank <= rankFilter)
            : quests;

        return res.json(result);
    } catch (err) {
        console.error('[quests/]', err);
        res.status(500).json({ error: 'Failed to fetch quests' });
    }
});

module.exports = router;
