import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { error, handleCors } from '../utils/response.js';

const MAX_EXPORT_LIMIT = 10000;

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const {
      format = 'json', // json or csv
      priority,
      category,
      is_read,
      date_from,
      date_to,
      limit = 1000, // Max emails to export
    } = req.query;

    try {
      // Build WHERE clause
      const conditions = ['e.user_id = $1'];
      const params = [user.id];
      let paramIndex = 2;

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

      if (is_read !== undefined && is_read !== '') {
        conditions.push(`e.is_read = $${paramIndex}`);
        params.push(is_read === 'true');
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

      const whereClause = conditions.join(' AND ');
      const limitNum = Math.min(parseInt(limit), MAX_EXPORT_LIMIT);

      // Get emails
      const result = await query(
        `SELECT
          e.id,
          e.subject,
          e.from_email,
          e.from_name,
          e.to_recipients,
          e.cc_recipients,
          e.body_text,
          e.preview,
          e.received_at,
          e.is_read,
          e.is_starred,
          e.priority,
          e.category,
          e.sentiment,
          e.has_attachments,
          e.ai_summary,
          e.key_points,
          e.action_items,
          e.confidence_score,
          e.created_at
        FROM emails e
        WHERE ${whereClause}
        ORDER BY e.received_at DESC
        LIMIT $${paramIndex}`,
        [...params, limitNum]
      );

      const emails = result.rows;

      if (format === 'csv') {
        // Generate CSV
        const csvHeader = [
          'ID',
          'Subject',
          'From Name',
          'From Email',
          'To',
          'CC',
          'Preview',
          'Received At',
          'Is Read',
          'Is Starred',
          'Priority',
          'Category',
          'Sentiment',
          'Has Attachments',
          'AI Summary',
          'Key Points',
          'Action Items',
          'Confidence Score',
        ].join(',');

        const csvRows = emails.map(email => {
          const escapeCsv = (field) => {
            if (field === null || field === undefined) return '';
            const str = String(field).replace(/"/g, '""');
            return `"${str}"`;
          };

          return [
            escapeCsv(email.id),
            escapeCsv(email.subject),
            escapeCsv(email.from_name),
            escapeCsv(email.from_email),
            escapeCsv(JSON.stringify(email.to_recipients)),
            escapeCsv(JSON.stringify(email.cc_recipients)),
            escapeCsv(email.preview),
            escapeCsv(email.received_at),
            escapeCsv(email.is_read),
            escapeCsv(email.is_starred),
            escapeCsv(email.priority),
            escapeCsv(email.category),
            escapeCsv(email.sentiment),
            escapeCsv(email.has_attachments),
            escapeCsv(email.ai_summary),
            escapeCsv(JSON.stringify(email.key_points)),
            escapeCsv(JSON.stringify(email.action_items)),
            escapeCsv(email.confidence_score),
          ].join(',');
        });

        const csv = [csvHeader, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="emails-export-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.status(200).send(csv);

      } else {
        // Return JSON
        const jsonData = {
          exported_at: new Date().toISOString(),
          total_count: emails.length,
          filters: { priority, category, is_read, date_from, date_to },
          emails: emails.map(email => ({
            id: email.id,
            subject: email.subject,
            from: {
              name: email.from_name,
              email: email.from_email,
            },
            to: email.to_recipients,
            cc: email.cc_recipients,
            body_text: email.body_text,
            preview: email.preview,
            received_at: email.received_at,
            is_read: email.is_read,
            is_starred: email.is_starred,
            priority: email.priority,
            category: email.category,
            sentiment: email.sentiment,
            has_attachments: email.has_attachments,
            ai_analysis: {
              summary: email.ai_summary,
              key_points: email.key_points,
              action_items: email.action_items,
              confidence_score: email.confidence_score,
            },
            created_at: email.created_at,
          })),
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="emails-export-${new Date().toISOString().split('T')[0]}.json"`);
        return res.status(200).json(jsonData);
      }

    } catch (err) {
      console.error('Email export error:', err);
      return error(res, 'Export failed');
    }
  }

  return error(res, 'Method not allowed', 405);
}
