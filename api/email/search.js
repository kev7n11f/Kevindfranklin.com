import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, handleCors } from '../utils/response.js';

const MAX_RESULTS_PER_PAGE = 100;

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const {
      q = '', // Search query
      priority,
      category,
      sentiment,
      is_read,
      is_starred,
      has_attachments,
      date_from,
      date_to,
      page = 1,
      limit = 50,
    } = req.query;

    try {
      const pageNum = parseInt(page);
      const limitNum = Math.min(parseInt(limit), MAX_RESULTS_PER_PAGE);
      const offset = (pageNum - 1) * limitNum;

      // Build WHERE clause
      const conditions = ['e.user_id = $1'];
      const params = [user.id];
      let paramIndex = 2;

      // Full-text search across multiple fields
      if (q && q.trim()) {
        conditions.push(`(
          e.subject ILIKE $${paramIndex} OR
          e.from_email ILIKE $${paramIndex} OR
          e.from_name ILIKE $${paramIndex} OR
          e.body_text ILIKE $${paramIndex} OR
          e.preview ILIKE $${paramIndex}
        )`);
        params.push(`%${q.trim()}%`);
        paramIndex++;
      }

      // Filters
      if (priority) {
        conditions.push(`e.priority = $${paramIndex}`);
        params.push(priority);
        paramIndex++;
      }

      if (category) {
        conditions.push(`e.category = $${paramIndex}`);
        params.push(category);
        paramIndex++;
      }

      if (sentiment) {
        conditions.push(`e.sentiment = $${paramIndex}`);
        params.push(sentiment);
        paramIndex++;
      }

      if (is_read !== undefined && is_read !== '') {
        conditions.push(`e.is_read = $${paramIndex}`);
        params.push(is_read === 'true');
        paramIndex++;
      }

      if (is_starred !== undefined && is_starred !== '') {
        conditions.push(`e.is_starred = $${paramIndex}`);
        params.push(is_starred === 'true');
        paramIndex++;
      }

      if (has_attachments !== undefined && has_attachments !== '') {
        conditions.push(`e.has_attachments = $${paramIndex}`);
        params.push(has_attachments === 'true');
        paramIndex++;
      }

      if (date_from) {
        conditions.push(`e.received_at >= $${paramIndex}`);
        params.push(date_from);
        paramIndex++;
      }

      if (date_to) {
        conditions.push(`e.received_at <= $${paramIndex}`);
        params.push(date_to);
        paramIndex++;
      }

      // Don't include archived emails unless explicitly searching for them
      conditions.push('(e.is_archived = false OR e.is_archived IS NULL)');

      const whereClause = conditions.join(' AND ');

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM emails e WHERE ${whereClause}`,
        params
      );

      const totalCount = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalCount / limitNum);

      // Get emails with pagination
      const emailsResult = await query(
        `SELECT
          e.id,
          e.subject,
          e.from_email,
          e.from_name,
          e.preview,
          e.received_at,
          e.is_read,
          e.is_starred,
          e.priority,
          e.category,
          e.sentiment,
          e.has_attachments,
          e.ai_summary,
          e.confidence_score
        FROM emails e
        WHERE ${whereClause}
        ORDER BY e.received_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limitNum, offset]
      );

      // Format response
      const emails = emailsResult.rows.map(email => ({
        id: email.id,
        subject: email.subject,
        from: email.from_name || email.from_email,
        fromEmail: email.from_email,
        preview: email.preview,
        receivedAt: email.received_at,
        isRead: email.is_read,
        isStarred: email.is_starred,
        priority: email.priority,
        category: email.category,
        sentiment: email.sentiment,
        hasAttachments: email.has_attachments,
        aiSummary: email.ai_summary,
        confidenceScore: email.confidence_score,
      }));

      return success(res, {
        emails,
        pagination: {
          current_page: pageNum,
          total_pages: totalPages,
          total_count: totalCount,
          per_page: limitNum,
          has_next: pageNum < totalPages,
          has_prev: pageNum > 1,
        },
        search_query: q,
        filters: {
          priority,
          category,
          sentiment,
          is_read,
          is_starred,
          has_attachments,
          date_from,
          date_to,
        },
      });

    } catch (err) {
      console.error('Email search error:', err);
      return error(res, 'Search failed');
    }
  }

  return error(res, 'Method not allowed', 405);
}
