import { authenticate } from '../middleware/auth.js';
import { query } from '../../db/connection.js';
import { success, error, handleCors } from '../utils/response.js';
import { validatePaginationParams } from '../utils/validators.js';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'GET') {
    return error(res, 'Method not allowed', 405);
  }

  const user = await authenticate(req, res);
  if (!user) return;

  try {
    const {
      page = 1,
      limit = 50,
      priority,
      category,
      is_read,
      is_starred,
      search,
      account_id,
    } = req.query;

    const pagination = validatePaginationParams(page, limit);

    // Build dynamic query
    let conditions = ['e.user_id = $1', 'e.is_deleted = false'];
    let params = [user.id];
    let paramIndex = 2;

    if (priority) {
      conditions.push(`e.priority_level = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    if (category) {
      conditions.push(`e.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (is_read !== undefined) {
      conditions.push(`e.is_read = $${paramIndex}`);
      params.push(is_read === 'true');
      paramIndex++;
    }

    if (is_starred !== undefined) {
      conditions.push(`e.is_starred = $${paramIndex}`);
      params.push(is_starred === 'true');
      paramIndex++;
    }

    if (account_id) {
      conditions.push(`e.email_account_id = $${paramIndex}`);
      params.push(account_id);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(e.subject ILIKE $${paramIndex} OR e.from_address ILIKE $${paramIndex} OR e.body_text ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM emails e WHERE ${whereClause}`,
      params
    );

    const total = parseInt(countResult[0].count);

    // Get emails
    const emails = await query(
      `SELECT e.*, ea.email_address as account_email, ea.provider
       FROM emails e
       JOIN email_accounts ea ON e.email_account_id = ea.id
       WHERE ${whereClause}
       ORDER BY e.received_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pagination.limit, pagination.offset]
    );

    return success(res, {
      emails,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });

  } catch (err) {
    console.error('List emails error:', err);
    return error(res, 'Failed to fetch emails');
  }
}
