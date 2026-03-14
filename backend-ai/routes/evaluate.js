const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const quests = require('../data/quests.json');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const RANK_NAMES = {
    1: 'Novice',
    2: 'Apprentice',
    3: 'Journeyman',
    4: 'Adept',
    5: 'Master',
};

const DIFFICULTY_LABELS = {
    1: 'Beginner (very easy)',
    2: 'Easy',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert (very hard)',
};

/**
 * Build a rich, level-aware system prompt.
 */
function buildSystemInstruction(quest) {
    const rankName = RANK_NAMES[quest.requiredRank] || `Rank ${quest.requiredRank}`;
    const diffLabel = DIFFICULTY_LABELS[quest.difficulty] || `Difficulty ${quest.difficulty}`;

    return `You are a strict but fair code evaluator for a coding guild game platform.

CONTEXT:
- Quest Level: ${rankName} (Rank ${quest.requiredRank} of 5)
- Quest Difficulty: ${diffLabel} (${quest.difficulty}/5)
- Quest Title: "${quest.title}"

GRADING GUIDELINES based on difficulty:
- Rank 1 (Novice): Accept basic solutions, syntax errors should lower score but not disqualify.
- Rank 2 (Apprentice): Logic must be sound. Minor style issues are OK.
- Rank 3 (Journeyman): Code should be clean, correct, and handle edge cases.
- Rank 4 (Adept): Must handle edge cases, be efficient, and well-structured.
- Rank 5 (Master): Must be algorithmically correct, efficient, and nearly production-ready.

An ACCEPTED submission earns EXP in the game. Use score >= 60 as the threshold for acceptance.

Return ONLY a valid JSON object — no markdown, no backticks, no prose outside JSON. The JSON must have exactly these fields:
- score: integer 0-100
- feedback: string (2-3 sentences explaining the score, mention the level of the quest)
- flags: array of strings, each a specific issue (empty array if none)
- isCorrect: boolean (true if score >= 60)`;
}

/**
 * Call Gemini AI with the quest and user code.
 */
async function callGemini(quest, code) {
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: buildSystemInstruction(quest),
    });

    const userMessage = `Quest Description:
${quest.description}

Evaluation Criteria:
${quest.evaluationCriteria}

Submitted Code:
\`\`\`
${code}
\`\`\`

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
        try {
            parsed = await callGemini(quest, code);
        } catch (retryErr) {
            console.error('[evaluate] Retry also failed:', retryErr.message);
            return res.json({
                score: 0,
                feedback: 'Evaluation failed due to a service error. Please resubmit.',
                flags: [],
                isCorrect: false,
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
            isCorrect: false,
        });
    }

    const score = Math.min(100, Math.max(0, Math.round(parsed.score)));
    return res.json({
        score,
        feedback: parsed.feedback,
        flags: parsed.flags,
        isCorrect: parsed.isCorrect ?? score >= 60,
    });
});

module.exports = router;
