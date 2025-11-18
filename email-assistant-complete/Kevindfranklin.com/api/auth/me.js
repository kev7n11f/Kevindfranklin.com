import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
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
    // Get email accounts count
    const accountsResult = await query(
      'SELECT COUNT(*) as count FROM email_accounts WHERE user_id = $1 AND is_active = true',
      [user.id]
    );

    const emailAccountsCount = parseInt(accountsResult[0]?.count || 0);

    // Get unread emails count
    const unreadResult = await query(
      'SELECT COUNT(*) as count FROM emails WHERE user_id = $1 AND is_read = false AND is_deleted = false',
      [user.id]
    );

    const unreadCount = parseInt(unreadResult[0]?.count || 0);

    // Get current budget usage
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const budgetResult = await query(
      `SELECT api_calls_total, estimated_cost_cents, budget_limit_cents, is_paused
       FROM budget_usage
       WHERE user_id = $1 AND period_start = $2`,
      [user.id, periodStart]
    );

    const budget = budgetResult[0] || {
      api_calls_total: 0,
      estimated_cost_cents: 0,
      budget_limit_cents: 1000,
      is_paused: false,
    };

    return success(res, {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        settings: user.settings,
      },
      stats: {
        emailAccountsCount,
        unreadCount,
      },
      budget: {
        apiCalls: budget.api_calls_total,
        estimatedCost: budget.estimated_cost_cents,
        budgetLimit: budget.budget_limit_cents,
        isPaused: budget.is_paused,
        percentUsed: Math.round((budget.estimated_cost_cents / budget.budget_limit_cents) * 100),
      },
    });

  } catch (err) {
    console.error('Get user error:', err);
    return error(res, 'Failed to fetch user data');
  }
}
