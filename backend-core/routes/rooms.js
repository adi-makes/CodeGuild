const express = require('express');
const router = express.Router();
const quests = require('../data/quests.json');

router.post('/create', async (req, res) => {
    try {
        const { userId } = req.body;
        const { db } = req.getFirebase();

        // Pick a random quest
        const randomQuest = quests[Math.floor(Math.random() * quests.length)];

        // Generate a 6-character room code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const roomRef = await db.collection('rooms').add({
            code,
            creatorId: userId,
            joinerId: null,
            questId: randomQuest.id,
            status: 'waiting',
            winnerId: null,
            createdAt: new Date().toISOString()
        });

        res.json({ id: roomRef.id, code, questId: randomQuest.id, status: 'waiting', creatorId: userId });
    } catch (err) {
        console.error('[rooms/create]', err);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

router.post('/join', async (req, res) => {
    try {
        const { userId, code } = req.body;
        const { db } = req.getFirebase();

        const snapshot = await db.collection('rooms')
            .where('code', '==', code.toUpperCase())
            .where('status', '==', 'waiting')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Room not found or already full' });
        }

        const roomDoc = snapshot.docs[0];
        const roomData = roomDoc.data();

        if (roomData.creatorId === userId) {
            return res.status(400).json({ error: 'Cannot join your own room' });
        }

        await roomDoc.ref.update({
            joinerId: userId,
            status: 'started'
        });

        res.json({ id: roomDoc.id, ...roomData, joinerId: userId, status: 'started' });
    } catch (err) {
        console.error('[rooms/join]', err);
        res.status(500).json({ error: 'Failed to join room' });
    }
});

router.get('/status/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { db } = req.getFirebase();

        const doc = await db.collection('rooms').doc(roomId).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json({ id: doc.id, ...doc.data() });
    } catch (err) {
        console.error('[rooms/status]', err);
        res.status(500).json({ error: 'Failed to fetch room status' });
    }
});

const axios = require('axios');
const quests = require('../data/quests.json');
const { calculateExpEarned } = require('../config/scoring');
const { getRankForExp } = require('../config/ranks');

const BACKEND_AI_URL = process.env.BACKEND_AI_URL || 'http://localhost:3002';

// Helper for AI evaluation (reusing logic from submit.js)
async function evaluateSubmission(db, admin, userId, questId, code) {
    const quest = quests.find(q => q.id === questId);
    if (!quest) throw new Error('Quest not found');

    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error('User not found');
    const userData = userSnap.data();

    // Call AI
    const aiResponse = await axios.post(`${BACKEND_AI_URL}/api/evaluate`, { questId, code }, { timeout: 30000 });
    const evalResult = aiResponse.data;
    const { score, feedback, flags } = evalResult;
    const { expEarned, accepted } = calculateExpEarned(score, quest.expReward);

    const newTotalExp = userData.totalExp + expEarned;
    const newRank = getRankForExp(newTotalExp);

    // Update user
    await userRef.update({
        totalExp: newTotalExp,
        rank: newRank,
        completedQuests: admin.firestore.FieldValue.arrayUnion({
            questId,
            score,
            expEarned,
            submittedAt: admin.firestore.Timestamp.now(),
        }),
    });

    return { score, feedback, flags, expEarned, accepted, newTotalExp, newRank };
}

router.post('/submit-code', async (req, res) => {
    try {
        const { roomId, userId, code } = req.body;
        const { db, admin } = req.getFirebase();

        const roomRef = db.collection('rooms').doc(roomId);
        const doc = await roomRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'Room not found' });

        const data = doc.data();
        if (data.status === 'finished' || data.status === 'cancelled') {
            return res.status(400).json({ error: 'Battle already ended' });
        }

        const updateData = {};
        if (data.creatorId === userId) {
            updateData.creatorCode = code;
            updateData.creatorFinished = true;
        } else if (data.joinerId === userId) {
            updateData.joinerCode = code;
            updateData.joinerFinished = true;
        } else {
            return res.status(403).json({ error: 'User not in room' });
        }

        await roomRef.update(updateData);

        // Check if both finished
        const updatedDoc = await roomRef.get();
        const updatedData = updatedDoc.data();
        if (updatedData.creatorFinished && updatedData.joinerFinished) {
            // BOTH SUBMITTED -> TRIGGER AI EVALUATION
            console.log(`[rooms] Triggering joint evaluation for room ${roomId}`);

            try {
                const [creatorRes, joinerRes] = await Promise.all([
                    evaluateSubmission(db, admin, updatedData.creatorId, updatedData.questId, updatedData.creatorCode),
                    evaluateSubmission(db, admin, updatedData.joinerId, updatedData.questId, updatedData.joinerCode)
                ]);

                let winnerId = null;
                if (creatorRes.score > joinerRes.score) winnerId = updatedData.creatorId;
                else if (joinerRes.score > creatorRes.score) winnerId = updatedData.joinerId;

                await roomRef.update({
                    status: 'finished',
                    winnerId,
                    creatorResult: creatorRes,
                    joinerResult: joinerRes
                });
            } catch (evalErr) {
                console.error('[rooms/evaluate-all]', evalErr);
                // Even if evaluation fails, mark as finished to avoid infinite wait? 
                // Better to just keep it as started for retry? For now, mark as error.
                await roomRef.update({ status: 'finished', error: 'AI Evaluation failed' });
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('[rooms/submit-code]', err);
        res.status(500).json({ error: 'Failed to submit code' });
    }
});

router.post('/quit-battle', async (req, res) => {
    try {
        const { roomId, userId } = req.body;
        const { db } = req.getFirebase();
        const roomRef = db.collection('rooms').doc(roomId);
        await roomRef.update({ status: 'cancelled', quitterId: userId });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to quit battle' });
    }
});

module.exports = router;
