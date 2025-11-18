import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, handleCors } from '../utils/response.js';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      // Get comprehensive statistics
      const [
        totalStats,
        readStats,
        priorityStats,
        categoryStats,
        sentimentStats,
        timeStats,
        accountStats,
        attachmentStats,
      ] = await Promise.all([
        // Total counts
        query(
          `SELECT
            COUNT(*) as total_emails,
            COUNT(*) FILTER (WHERE is_read = false) as unread_count,
            COUNT(*) FILTER (WHERE is_starred = true) as starred_count,
            COUNT(*) FILTER (WHERE is_archived = true) as archived_count,
            COUNT(*) FILTER (WHERE has_attachments = true) as with_attachments_count
          FROM emails WHERE user_id = $1`,
          [user.id]
        ),

        // Read/Unread breakdown
        query(
          `SELECT
            is_read,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
          FROM emails
          WHERE user_id = $1
          GROUP BY is_read`,
          [user.id]
        ),

        // Priority distribution
        query(
          `SELECT
            priority,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
          FROM emails
          WHERE user_id = $1 AND priority IS NOT NULL
          GROUP BY priority
          ORDER BY
            CASE priority
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              WHEN 'low' THEN 4
            END`,
          [user.id]
        ),

        // Category distribution
        query(
          `SELECT
            category,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
          FROM emails
          WHERE user_id = $1 AND category IS NOT NULL
          GROUP BY category
          ORDER BY count DESC`,
          [user.id]
        ),

        // Sentiment distribution
        query(
          `SELECT
            sentiment,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
          FROM emails
          WHERE user_id = $1 AND sentiment IS NOT NULL
          GROUP BY sentiment
          ORDER BY count DESC`,
          [user.id]
        ),

        // Emails by time of day
        query(
          `SELECT
            EXTRACT(HOUR FROM received_at) as hour,
            COUNT(*) as count
          FROM emails
          WHERE user_id = $1
          GROUP BY hour
          ORDER BY hour`,
          [user.id]
        ),

        // Emails by account
        query(
          `SELECT
            ea.email_address,
            ea.provider,
            COUNT(e.id) as count
          FROM email_accounts ea
          LEFT JOIN emails e ON e.account_id = ea.id
          WHERE ea.user_id = $1
          GROUP BY ea.id, ea.email_address, ea.provider
          ORDER BY count DESC`,
          [user.id]
        ),

        // Attachment statistics
        query(
          `SELECT
            AVG(CASE WHEN has_attachments THEN 1 ELSE 0 END) * 100 as attachment_percentage,
            COUNT(*) FILTER (WHERE has_attachments = true) as emails_with_attachments
          FROM emails
          WHERE user_id = $1`,
          [user.id]
        ),
      ]);

      // Average response time (if we track sent emails)
      const responseTimeResult = await query(
        `SELECT
          AVG(
            EXTRACT(EPOCH FROM (sent_at - received_at)) / 3600
          ) as avg_response_hours
        FROM email_drafts
        WHERE user_id = $1 AND status = 'sent' AND received_at IS NOT NULL`,
        [user.id]
      );

      // Busiest day of week
      const busiestDayResult = await query(
        `SELECT
          TO_CHAR(received_at, 'Day') as day_name,
          EXTRACT(DOW FROM received_at) as day_num,
          COUNT(*) as count
        FROM emails
        WHERE user_id = $1
        GROUP BY day_name, day_num
        ORDER BY count DESC
        LIMIT 1`,
        [user.id]
      );

      // AI analysis statistics
      const aiStatsResult = await query(
        `SELECT
          COUNT(*) FILTER (WHERE ai_summary IS NOT NULL) as analyzed_count,
          AVG(confidence_score) FILTER (WHERE confidence_score IS NOT NULL) as avg_confidence,
          COUNT(*) FILTER (WHERE array_length(action_items, 1) > 0) as emails_with_actions,
          COUNT(*) FILTER (WHERE array_length(key_points, 1) > 0) as emails_with_keypoints
        FROM emails
        WHERE user_id = $1`,
        [user.id]
      );

      return success(res, {
        overview: {
          total_emails: parseInt(totalStats.rows[0].total_emails),
          unread_count: parseInt(totalStats.rows[0].unread_count),
          starred_count: parseInt(totalStats.rows[0].starred_count),
          archived_count: parseInt(totalStats.rows[0].archived_count),
          with_attachments_count: parseInt(totalStats.rows[0].with_attachments_count),
          read_percentage: totalStats.rows[0].total_emails > 0
            ? parseFloat(((parseInt(totalStats.rows[0].total_emails) - parseInt(totalStats.rows[0].unread_count)) / parseInt(totalStats.rows[0].total_emails) * 100).toFixed(2))
            : 0,
        },
        by_priority: priorityStats.rows.map(row => ({
          priority: row.priority,
          count: parseInt(row.count),
          percentage: parseFloat(row.percentage),
        })),
        by_category: categoryStats.rows.map(row => ({
          category: row.category,
          count: parseInt(row.count),
          percentage: parseFloat(row.percentage),
        })),
        by_sentiment: sentimentStats.rows.map(row => ({
          sentiment: row.sentiment,
          count: parseInt(row.count),
          percentage: parseFloat(row.percentage),
        })),
        by_hour: timeStats.rows.map(row => ({
          hour: parseInt(row.hour),
          count: parseInt(row.count),
        })),
        by_account: accountStats.rows.map(row => ({
          email: row.email_address,
          provider: row.provider,
          count: parseInt(row.count),
        })),
        ai_analysis: {
          analyzed_count: parseInt(aiStatsResult.rows[0].analyzed_count),
          avg_confidence: parseFloat(aiStatsResult.rows[0].avg_confidence || 0).toFixed(2),
          emails_with_actions: parseInt(aiStatsResult.rows[0].emails_with_actions),
          emails_with_keypoints: parseInt(aiStatsResult.rows[0].emails_with_keypoints),
        },
        insights: {
          busiest_day: busiestDayResult.rows[0] ? {
            day: busiestDayResult.rows[0].day_name.trim(),
            count: parseInt(busiestDayResult.rows[0].count),
          } : null,
          avg_response_hours: responseTimeResult.rows[0].avg_response_hours
            ? parseFloat(responseTimeResult.rows[0].avg_response_hours).toFixed(2)
            : null,
          attachment_percentage: parseFloat(attachmentStats.rows[0].attachment_percentage || 0).toFixed(2),
        },
      });

    } catch (err) {
      console.error('Email statistics error:', err);
      return error(res, 'Failed to fetch statistics');
    }
  }

  return error(res, 'Method not allowed', 405);
}
