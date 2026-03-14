const express = require('express');
const router = express.Router();

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
 * POST /api/users/init
 */
router.post('/init', async (req, res) => {
    try {
        const { db, admin } = req.getFirebase();
        const decoded = await verifyToken(req, res);
        if (!decoded) return;

        const { uid, name, email } = decoded;
        const userRef = db.collection('users').doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            const newUser = {
                userId: uid,
                displayName: name || email || 'Adventurer',
                email: email || '',
                rank: 1,
                totalExp: 0,
                completedQuests: [],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await userRef.set(newUser);
            return res.status(201).json({ ...newUser, isNew: true });
        }

        return res.json({ ...userSnap.data(), isNew: false });
    } catch (err) {
        console.error('[users/init]', err.message);
        res.status(500).json({ error: err.message || 'Failed to initialize user' });
    }
});

/**
 * GET /api/users/leaderboard
 * Supports optional ?rank=1 to filter by rank level.
 * IMPORTANT: Must be before /:userId to avoid Express matching 'leaderboard' as a userId.
 * Fetches all docs and sorts/filters in memory to avoid composite index requirement.
 */
router.get('/leaderboard', async (req, res) => {
    try {
        const { db } = req.getFirebase();

        // Fetch all leaderboard docs without orderBy to avoid composite index
        const usersSnap = await db.collection('leaderboard').limit(100).get();

        let leaderboard = [];
        usersSnap.forEach(doc => {
            const data = doc.data();
            leaderboard.push({
                userId: data.userId,
                displayName: data.displayName,
                rank: data.rank,
                totalExp: data.totalExp || 0,
                completedQuests: data.completedQuests || [],
            });
        });

        // Filter by rank if provided
        if (req.query.rank) {
            const rank = parseInt(req.query.rank, 10);
            if (!isNaN(rank)) {
                leaderboard = leaderboard.filter(u => u.rank === rank);
            }
        }

        // Sort by totalExp descending in memory
        leaderboard.sort((a, b) => b.totalExp - a.totalExp);

        return res.json(leaderboard.slice(0, 50));
    } catch (err) {
        console.error('[users/leaderboard]', err.message);
        res.status(500).json({ error: err.message || 'Failed to fetch leaderboard' });
    }
});

/**
 * GET /api/users/:userId
 */
router.get('/:userId', async (req, res) => {
    try {
        const { db } = req.getFirebase();
        const { userId } = req.params;
        const userSnap = await db.collection('users').doc(userId).get();

        if (!userSnap.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json(userSnap.data());
    } catch (err) {
        console.error('[users/:userId]', err.message);
        res.status(500).json({ error: err.message || 'Failed to fetch user' });
    }
});



module.exports = router;
