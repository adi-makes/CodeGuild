/**
 * Calculate exp earned from a score and a quest's expReward.
 * Score brackets:
 *   90-100 → 100% of expReward
 *   75-89  → 75%  of expReward
 *   60-74  → 50%  of expReward
 *   < 60   → 0 exp (rejected)
 *
 * @param {number} score      - integer 0-100 from AI
 * @param {number} expReward  - base exp value from quest
 * @returns {{ expEarned: number, accepted: boolean }}
 */
function calculateExpEarned(score, expReward) {
    if (score >= 90) {
        return { expEarned: Math.floor(expReward * 1.0), accepted: true };
    } else if (score >= 75) {
        return { expEarned: Math.floor(expReward * 0.75), accepted: true };
    } else if (score >= 60) {
        return { expEarned: Math.floor(expReward * 0.5), accepted: true };
    } else {
        return { expEarned: 0, accepted: false };
    }
}

module.exports = { calculateExpEarned };
