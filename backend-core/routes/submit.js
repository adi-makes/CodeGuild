const express = require('express');
const router = express.Router();
const axios = require('axios');
const quests = require('../data/quests.json');
const { calculateExpEarned } = require('../config/scoring');
const { getRankForExp } = require('../config/ranks');

const BACKEND_AI_URL = process.env.BACKEND_AI_URL || 'http://localhost:3002';

/**
 * Helper: verify Firebase ID token from Authorization header
 */
async function verifyToken(req, res) {
    const { admin } = req.getFirebase();
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        res.status(401).json({ error: 'Missing auth token' });
        return null;
    }
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        return decoded;
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return null;
    }
}

/**
 * POST /api/submit
 */
router.post('/', async (req, res) => {
    try {
        const { db, admin } = req.getFirebase();
        const decoded = await verifyToken(req, res);
        if (!decoded) return;

        const { userId, questId, code } = req.body;
        if (!userId || !questId || !code) {
            return res.status(400).json({ error: 'userId, questId, and code are required' });
        }

        const quest = quests.find(q => q.id === questId);
        if (!quest) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userData = userSnap.data();

        if (userData.rank < quest.requiredRank) {
            return res.status(403).json({
                error: `This quest requires Rank ${quest.requiredRank}. You are Rank ${userData.rank}.`,
            });
        }

        // Forward to backend-ai for evaluation
        let evalResult;
        try {
            const aiResponse = await axios.post(`${BACKEND_AI_URL}/api/evaluate`, {
                questId,
                code,
            }, { timeout: 30000 });
            evalResult = aiResponse.data;
        } catch (aiErr) {
            console.error('[submit] backend-ai call failed:', aiErr.message);
            return res.status(502).json({ error: 'AI evaluation service unavailable. Please try again.' });
        }

        const { score, feedback, flags } = evalResult;
        const { expEarned, accepted } = calculateExpEarned(score, quest.expReward);

        const newTotalExp = userData.totalExp + expEarned;
        const newRank = getRankForExp(newTotalExp);

        const completedEntry = {
            questId,
            score,
            expEarned,
            submittedAt: admin.firestore.Timestamp.now(),
        };

        await userRef.update({
            totalExp: newTotalExp,
            rank: newRank,
            completedQuests: admin.firestore.FieldValue.arrayUnion(completedEntry),
        });

        return res.json({
            score,
            feedback,
            flags: flags || [],
            expEarned,
            accepted,
            newTotalExp,
            newRank,
        });
    } catch (err) {
        console.error('[submit]', err.message);
        res.status(500).json({ error: err.message || 'Submission failed. Please try again.' });
    }
});

module.exports = router;
