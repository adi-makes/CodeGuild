require('dotenv').config();
const admin = require('firebase-admin');

if (!process.env.FIREBASE_PROJECT_ID) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
});

const db = admin.firestore();

async function migrateUsersToLeaderboard() {
    try {
        console.log("Starting migration of existing users to the 'leaderboard' collection...");

        const usersSnap = await db.collection('users').get();
        if (usersSnap.empty) {
            console.log("No users found to migrate.");
            process.exit(0);
        }

        let migratedCount = 0;
        const batch = db.batch();

        usersSnap.forEach(doc => {
            const userData = doc.data();

            // Extract just what the leaderboard needs
            const leaderboardData = {
                userId: userData.userId,
                displayName: userData.displayName || 'Adventurer',
                rank: userData.rank || 1,
                totalExp: userData.totalExp || 0,
                // store an array of quest IDs
                completedQuests: (userData.completedQuests || []).map(q => q.questId || q),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            };

            const leaderboardRef = db.collection('leaderboard').doc(userData.userId);
            batch.set(leaderboardRef, leaderboardData, { merge: true });
            migratedCount++;
        });

        await batch.commit();
        console.log(`Successfully migrated ${migratedCount} users to the leaderboard collection!`);
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrateUsersToLeaderboard();
