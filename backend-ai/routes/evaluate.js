const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const quests = require('../data/quests.json');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `You are a strict but fair code evaluator for a coding guild platform.
You will receive a quest description, an evaluation rubric, and a code submission.
Evaluate the code and return ONLY a valid JSON object with no markdown, no backticks,
no explanation outside the JSON. The JSON must have exactly these fields:
- score: integer from 0 to 100
- feedback: string, 2-3 sentences explaining the score
- flags: array of strings, each describing a specific issue (empty array if none)`;

/**
 * Call Gemini and attempt to parse JSON from the response.
 * @param {object} quest
 * @param {string} code
 * @returns {Promise<{ score: number, feedback: string, flags: string[] }>}
 */
async function callGemini(quest, code) {
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
    });

    const userMessage = `Quest Title: ${quest.title}
Quest Description: ${quest.description}
Evaluation Criteria: ${quest.evaluationCriteria}
Submitted Code:
${code}

Evaluate this submission and return the JSON.`;

    const result = await model.generateContent(userMessage);
    const text = result.response.text().trim();

    // Strip markdown fences if present (defensive)
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned);
}

/**
 * POST /api/evaluate
 * Body: { questId, code }
 */
router.post('/', async (req, res) => {
    const { questId, code } = req.body;

    if (!questId || !code) {
        return res.status(400).json({ error: 'questId and code are required' });
    }

    const quest = quests.find(q => q.id === questId);
    if (!quest) {
        return res.status(404).json({ error: 'Quest not found' });
    }

    // First attempt
    let parsed;
    try {
        parsed = await callGemini(quest, code);
    } catch (err) {
        console.warn('[evaluate] First Gemini attempt failed:', err.message);
        // Retry once
        try {
            parsed = await callGemini(quest, code);
        } catch (retryErr) {
            console.error('[evaluate] Retry also failed:', retryErr.message);
            return res.json({
                score: 0,
                feedback: 'Evaluation failed due to a service error. Please resubmit.',
                flags: [],
            });
        }
    }

    // Validate parsed shape
    if (
        typeof parsed.score !== 'number' ||
        typeof parsed.feedback !== 'string' ||
        !Array.isArray(parsed.flags)
    ) {
        console.error('[evaluate] Malformed Gemini response:', parsed);
        return res.json({
            score: 0,
            feedback: 'Evaluation returned an unexpected format. Please resubmit.',
            flags: [],
        });
    }

    return res.json({
        score: Math.min(100, Math.max(0, Math.round(parsed.score))),
        feedback: parsed.feedback,
        flags: parsed.flags,
    });
});

module.exports = router;
