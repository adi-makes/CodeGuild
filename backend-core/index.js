require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { startSyncWatchers } = require('./syncWatchers');

// --- Express App ---
const app = express();

app.use(cors({
    origin: (origin, callback) => {
        // Allow any localhost origin (3000, 3001, 3003, etc.) or no origin (curl/Postman)
        if (!origin || origin.startsWith('http://localhost')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());

// --- Lazy Firebase Admin Init ---
let db = null;
let admin = null;

function getFirebase() {
    if (db) return { db, admin };

    const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
        throw new Error(
            'Firebase credentials missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env'
        );
    }

    if (!admin) {
        admin = require('firebase-admin');
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: FIREBASE_PROJECT_ID,
                    clientEmail: FIREBASE_CLIENT_EMAIL,
                    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
        }
        db = admin.firestore();
    }

    return { db, admin };
}

// --- Attach firebase getter to request ---
app.use((req, _res, next) => {
    req.getFirebase = getFirebase;
    next();
});

// --- Routes ---
const userRoutes = require('./routes/users');
const questRoutes = require('./routes/quests');
const submitRoutes = require('./routes/submit');
const roomRoutes = require('./routes/rooms');

app.use('/api/users', userRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/submit', submitRoutes);
app.use('/api/rooms', roomRoutes);

// --- Health check ---
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'backend-core' }));

// --- Global error handler ---
app.use((err, _req, res, _next) => {
    console.error('[backend-core error]', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`[backend-core] Running on http://localhost:${PORT}`);

    // Initialize DB watchers upon starting
    try {
        const { db } = getFirebase();
        startSyncWatchers(db);
    } catch (err) {
        console.warn('[backend-core] ⚠ Firebase credentials not set or invalid — cannot start watchers.');
    }
});
