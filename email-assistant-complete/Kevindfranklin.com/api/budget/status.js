import { authenticate } from '../middleware/auth.js';
import { query } from '../../db/connection.js';
import { success, error, handleCors } from '../utils/response.js';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'GET') {
    return error(res, 'Method not allowed', 405);
  }

  const user = await authenticate(req, res);
  if (!user) return;

  try {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get budget status
    const budgetResults = await query(
      `SELECT * FROM budget_usage WHERE user_id = $1 AND period_start = $2`,
      [user.id, periodStart]
    );

    let budget;

    if (!budgetResults || budgetResults.length === 0) {
      // Create budget entry for current month
      const newBudget = await query(
        `INSERT INTO budget_usage (user_id, period_start, period_end, budget_limit_cents)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [user.id, periodStart, periodEnd, parseInt(process.env.DEFAULT_MONTHLY_BUDGET_CENTS) || 1000]
      );
      budget = newBudget[0];
    } else {
      budget = budgetResults[0];
    }

    // Get recent API usage
    const recentUsage = await query(
      `SELECT api_provider, operation, tokens_input, tokens_output, cost_cents, created_at
       FROM api_usage_logs
       WHERE user_id = $1 AND created_at >= $2
       ORDER BY created_at DESC
       LIMIT 20`,
      [user.id, periodStart]
    );

    const percentUsed = budget.budget_limit_cents > 0
      ? Math.round((budget.estimated_cost_cents / budget.budget_limit_cents) * 100)
      : 0;

    return success(res, {
      budget: {
        periodStart: budget.period_start,
        periodEnd: budget.period_end,
        apiCallsTotal: budget.api_calls_total,
        apiCallsClaude: budget.api_calls_claude,
        tokensInput: budget.tokens_input,
        tokensOutput: budget.tokens_output,
        estimatedCostCents: budget.estimated_cost_cents,
        budgetLimitCents: budget.budget_limit_cents,
        percentUsed,
        isPaused: budget.is_paused,
        alertsSent: budget.alerts_sent,
      },
      recentUsage,
    });

  } catch (err) {
    console.error('Get budget status error:', err);
    return error(res, 'Failed to fetch budget status');
  }
}
