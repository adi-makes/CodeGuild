require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const evaluateRoutes = require('./routes/evaluate');
app.use('/api/evaluate', evaluateRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'backend-ai' }));

app.use((err, _req, res, _next) => {
    console.error('[backend-ai error]', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`[backend-ai] Running on http://localhost:${PORT}`);
});
