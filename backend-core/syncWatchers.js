/**
 * syncWatchers.js
 * 
 * Sets up Firestore real-time listeners on `users` and `leaderboard` 
 * collections to ensure that changes to rank or totalExp in one 
 * collection are propagated to the other collection automatically.
 */

function startSyncWatchers(db) {
    let IS_SYNCING_USERS = false;
    let IS_SYNCING_LEADERBOARD = false;

    // Watch 'users' collection
    db.collection('users').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'modified' || change.type === 'added') {
                if (IS_SYNCING_LEADERBOARD) return; // Prevent infinite loop

                const data = change.doc.data();
                const userId = change.doc.id;

                if (!data || typeof data.totalExp !== 'number') return;

                try {
                    IS_SYNCING_USERS = true;
                    const lbRef = db.collection('leaderboard').doc(userId);
                    const lbSnap = await lbRef.get();

                    if (!lbSnap.exists) {
                        // Create basic leaderboard entry if missing
                        await lbRef.set({
                            userId: userId,
                            displayName: data.displayName || 'Adventurer',
                            rank: data.rank || 1,
                            totalExp: data.totalExp,
                            questsDoneCount: (data.completedQuests || []).length,
                            lastUpdated: new Date()
                        });
                    } else {
                        const lbData = lbSnap.data();
                        // Only sync if they differ
                        if (lbData.totalExp !== data.totalExp || lbData.rank !== data.rank) {
                            await lbRef.update({
                                totalExp: data.totalExp,
                                rank: data.rank,
                                lastUpdated: new Date()
                            });
                        }
                    }
                } catch (err) {
                    console.error('[syncWatchers] Error syncing from user to leaderboard:', err);
                } finally {
                    IS_SYNCING_USERS = false;
                }
            }
        });
    }, (err) => {
        console.error('[syncWatchers] Listen error on users:', err);
    });

    // Watch 'leaderboard' collection
    db.collection('leaderboard').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'modified') {
                if (IS_SYNCING_USERS) return; // Prevent infinite loop

                const data = change.doc.data();
                const userId = change.doc.id;

                if (!data || typeof data.totalExp !== 'number') return;

                try {
                    IS_SYNCING_LEADERBOARD = true;
                    const userRef = db.collection('users').doc(userId);
                    const userSnap = await userRef.get();

                    if (userSnap.exists) {
                        const userData = userSnap.data();

                        // Only sync if they differ
                        if (userData.totalExp !== data.totalExp || userData.rank !== data.rank) {
                            await userRef.update({
                                totalExp: data.totalExp,
                                rank: data.rank
                            });
                        }
                    }
                } catch (err) {
                    console.error('[syncWatchers] Error syncing from leaderboard to user:', err);
                } finally {
                    IS_SYNCING_LEADERBOARD = false;
                }
            }
        });
    }, (err) => {
        console.error('[syncWatchers] Listen error on leaderboard:', err);
    });

    console.log("Database Sync Watchers initialized.");
}

module.exports = { startSyncWatchers };
