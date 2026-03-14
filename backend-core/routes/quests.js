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

/**
 * GET /api/quests/daily
 * Returns a consistent quest for today with triple EXP reward
 */
router.get('/daily', (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const seed = today.split('-').reduce((sum, val) => sum + parseInt(val, 10), 0);
        const dailyIndex = seed % quests.length;
        const quest = quests[dailyIndex];

        // Return with isDaily flag and boosted reward
        return res.json({
            ...quest,
            isDaily: true,
            expReward: quest.expReward * 3
        });
    } catch (err) {
        console.error('[quests/daily]', err);
        res.status(500).json({ error: 'Failed to fetch daily quest' });
    }
});

module.exports = router;
