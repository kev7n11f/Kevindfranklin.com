import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, handleCors } from '../utils/response.js';

/**
 * Get analytics data
 * GET /api/analytics
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    return error(res, 'Method not allowed', 405);
  }

  try {
    const { range = '7d' } = req.query;

    // Calculate date range
    let dateFilter = '';
    const now = new Date();

    if (range !== 'all') {
      const days = parseInt(range.replace('d', ''));
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      dateFilter = `AND e.received_at >= '${startDate.toISOString()}'`;
    }

    // Overview stats
    const overviewResult = await query(`
      SELECT
        COUNT(*) as total_emails,
        COUNT(CASE WHEN ai_analyzed_at IS NOT NULL THEN 1 END) as ai_analyzed,
        COUNT(CASE WHEN is_starred = true THEN 1 END) as starred,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread
      FROM emails e
      WHERE e.user_id = $1 ${dateFilter}
    `, [user.id]);

    const overview = overviewResult[0] || {};

    // By category
    const categoryResult = await query(`
      SELECT
        category,
        COUNT(*) as count
      FROM emails e
      WHERE e.user_id = $1 ${dateFilter}
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `, [user.id]);

    // By priority
    const priorityResult = await query(`
      SELECT
        priority_level,
        COUNT(*) as count
      FROM emails e
      WHERE e.user_id = $1
        AND priority_level IS NOT NULL
        ${dateFilter}
      GROUP BY priority_level
      ORDER BY
        CASE priority_level
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `, [user.id]);

    // Top senders
    const sendersResult = await query(`
      SELECT
        from_address,
        from_name,
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
        MODE() WITHIN GROUP (ORDER BY priority_level) as avg_priority
      FROM emails e
      WHERE e.user_id = $1 ${dateFilter}
      GROUP BY from_address, from_name
      ORDER BY total DESC
      LIMIT 10
    `, [user.id]);

    // Daily activity
    const activityResult = await query(`
      SELECT
        DATE(received_at) as date,
        COUNT(*) as count
      FROM emails e
      WHERE e.user_id = $1 ${dateFilter}
      GROUP BY DATE(received_at)
      ORDER BY date DESC
      LIMIT 30
    `, [user.id]);

    return success(res, {
      overview: {
        totalEmails: parseInt(overview.total_emails) || 0,
        aiAnalyzed: parseInt(overview.ai_analyzed) || 0,
        starred: parseInt(overview.starred) || 0,
        unread: parseInt(overview.unread) || 0,
        avgResponseTime: '2h 15m', // Placeholder
      },
      byCategory: categoryResult,
      byPriority: priorityResult,
      topSenders: sendersResult,
      dailyActivity: activityResult.reverse(),
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return error(res, 'Failed to fetch analytics');
  }
}
