require('dotenv').config();
const admin = require('firebase-admin');

if (!process.env.FIREBASE_PROJECT_ID) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

// Ensure we don't init twice
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

// 20 rich fake users across all 5 ranks
const fakeUsers = [
    // Rank 5 — Masters (2000–3000 EXP, all quests)
    { userId: "seed_001", displayName: "Merlin_The_Coder", rank: 5, totalExp: 2950, completedQuests: ["l1_q1", "l1_q2", "l1_q3", "l2_q1", "l2_q2", "l2_q3", "l3_q1", "l3_q2", "l3_q3", "l4_q1", "l4_q2", "l5_q1"] },
    { userId: "seed_002", displayName: "AlgorithmOracle", rank: 5, totalExp: 2600, completedQuests: ["l1_q1", "l1_q2", "l2_q2", "l3_q1", "l4_q1", "l4_q3", "l5_q1", "l5_q2"] },
    { userId: "seed_003", displayName: "RecursionRuler", rank: 5, totalExp: 2200, completedQuests: ["l1_q3", "l2_q1", "l2_q3", "l3_q2", "l4_q2", "l5_q3"] },

    // Rank 4 — Adepts (1000–2000 EXP)
    { userId: "seed_004", displayName: "ByteKnight", rank: 4, totalExp: 1800, completedQuests: ["l1_q1", "l1_q2", "l2_q1", "l3_q1", "l3_q3", "l4_q2"] },
    { userId: "seed_005", displayName: "SyntaxSorcerer", rank: 4, totalExp: 1650, completedQuests: ["l1_q3", "l2_q2", "l3_q2", "l4_q3"] },
    { userId: "seed_006", displayName: "PointerPaladin", rank: 4, totalExp: 1200, completedQuests: ["l1_q1", "l2_q3", "l4_q1", "l4_q2"] },
    { userId: "seed_007", displayName: "HashingHero", rank: 4, totalExp: 1050, completedQuests: ["l1_q2", "l2_q1", "l3_q3", "l4_q3"] },

    // Rank 3 — Journeymen (500–1000 EXP)
    { userId: "seed_008", displayName: "LoopLegend", rank: 3, totalExp: 900, completedQuests: ["l1_q1", "l1_q2", "l2_q1", "l2_q3"] },
    { userId: "seed_009", displayName: "ArrayArcher", rank: 3, totalExp: 850, completedQuests: ["l1_q3", "l2_q2", "l3_q1"] },
    { userId: "seed_010", displayName: "StackStrider", rank: 3, totalExp: 700, completedQuests: ["l1_q1", "l2_q1", "l3_q2"] },
    { userId: "seed_011", displayName: "TreeTraverser", rank: 3, totalExp: 600, completedQuests: ["l1_q2", "l3_q3"] },

    // Rank 2 — Apprentices (200–500 EXP)
    { userId: "seed_012", displayName: "VariableVanguard", rank: 2, totalExp: 450, completedQuests: ["l1_q1", "l1_q2", "l2_q1"] },
    { userId: "seed_013", displayName: "DevDruid", rank: 2, totalExp: 350, completedQuests: ["l1_q2", "l1_q3", "l2_q3"] },
    { userId: "seed_014", displayName: "LambdaLancer", rank: 2, totalExp: 300, completedQuests: ["l1_q1", "l2_q2"] },
    { userId: "seed_015", displayName: "BooleanBard", rank: 2, totalExp: 250, completedQuests: ["l1_q3", "l2_q1"] },

    // Rank 1 — Novices (50–200 EXP)
    { userId: "seed_016", displayName: "ScriptSquire", rank: 1, totalExp: 150, completedQuests: ["l1_q1", "l1_q2", "l1_q3"] },
    { userId: "seed_017", displayName: "NoviceNinja", rank: 1, totalExp: 100, completedQuests: ["l1_q1", "l1_q2"] },
    { userId: "seed_018", displayName: "ConsoleCleric", rank: 1, totalExp: 50, completedQuests: ["l1_q1"] },
    { userId: "seed_019", displayName: "DebugDancer", rank: 1, totalExp: 50, completedQuests: ["l1_q2"] },
    { userId: "seed_020", displayName: "PrintPrince", rank: 1, totalExp: 50, completedQuests: ["l1_q3"] },
];

async function seedLeaderboard() {
    try {
        console.log(`Seeding ${fakeUsers.length} users into 'leaderboard' and 'users' collections...`);

        // Firestore batch supports max 500 ops; split into chunks of 40 (2 writes per user = 80)
        const CHUNK = 40;
        let total = 0;

        for (let i = 0; i < fakeUsers.length; i += CHUNK) {
            const chunk = fakeUsers.slice(i, i + CHUNK);
            const batch = db.batch();

            for (const u of chunk) {
                // Leaderboard doc
                const lbRef = db.collection('leaderboard').doc(u.userId);
                batch.set(lbRef, {
                    userId: u.userId,
                    displayName: u.displayName,
                    rank: u.rank,
                    totalExp: u.totalExp,
                    completedQuests: u.completedQuests,
                    questsDoneCount: u.completedQuests.length,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Users doc (so the rest of the backend works)
                const userRef = db.collection('users').doc(u.userId);
                batch.set(userRef, {
                    userId: u.userId,
                    displayName: u.displayName,
                    email: `${u.userId}@fake.codeguild`,
                    rank: u.rank,
                    totalExp: u.totalExp,
                    completedQuests: u.completedQuests.map(q => ({
                        questId: q,
                        score: 80,
                        expEarned: 50,
                        submittedAt: admin.firestore.Timestamp.now(),
                    })),
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                total++;
            }

            await batch.commit();
            console.log(`  Committed chunk (${Math.min(i + CHUNK, fakeUsers.length)}/${fakeUsers.length})`);
        }

        console.log(`✅ Seeded ${total} users successfully!`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err.message);
        process.exit(1);
    }
}

seedLeaderboard();
