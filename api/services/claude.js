import Anthropic from '@anthropic-ai/sdk';
import { query } from '../../db/connection.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20241022';
const MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS) || 4096;

// Pricing (in cents per 1M tokens) - Claude Sonnet 4.5
const PRICING = {
  input: 300, // $3.00 per 1M input tokens
  output: 1500, // $15.00 per 1M output tokens
};

/**
 * Calculate API cost in cents
 */
function calculateCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1000000) * PRICING.input;
  const outputCost = (outputTokens / 1000000) * PRICING.output;
  return Math.ceil(inputCost + outputCost);
}

/**
 * Log API usage to database
 */
async function logApiUsage(userId, emailId, operation, usage, success = true, error = null) {
  try {
    const costCents = calculateCost(usage.input_tokens, usage.output_tokens);

    // Log individual call
    await query(
      `INSERT INTO api_usage_logs
       (user_id, email_id, api_provider, operation, tokens_input, tokens_output, cost_cents, success, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        emailId,
        'claude',
        operation,
        usage.input_tokens,
        usage.output_tokens,
        costCents,
        success,
        error,
      ]
    );

    // Update budget tracking
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    await query(
      `UPDATE budget_usage
       SET api_calls_total = api_calls_total + 1,
           api_calls_claude = api_calls_claude + 1,
           tokens_input = tokens_input + $1,
           tokens_output = tokens_output + $2,
           estimated_cost_cents = estimated_cost_cents + $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4 AND period_start = $5`,
      [usage.input_tokens, usage.output_tokens, costCents, userId, periodStart]
    );

    return costCents;
  } catch (err) {
    console.error('Failed to log API usage:', err);
  }
}

/**
 * Check if user has budget remaining
 */
async function checkBudget(userId) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const budgetResults = await query(
    `SELECT estimated_cost_cents, budget_limit_cents, is_paused
     FROM budget_usage
     WHERE user_id = $1 AND period_start = $2`,
    [userId, periodStart]
  );

  if (!budgetResults || budgetResults.length === 0) {
    return { allowed: true, remaining: 1000 };
  }

  const budget = budgetResults[0];

  if (budget.is_paused) {
    return { allowed: false, remaining: 0, reason: 'Budget paused' };
  }

  const remaining = budget.budget_limit_cents - budget.estimated_cost_cents;

  return {
    allowed: remaining > 0,
    remaining,
    reason: remaining <= 0 ? 'Budget limit reached' : null,
  };
}

/**
 * Analyze email and generate priority, category, sentiment, summary
 */
export async function analyzeEmail(userId, email) {
  const budgetCheck = await checkBudget(userId);

  if (!budgetCheck.allowed) {
    throw new Error(budgetCheck.reason);
  }

  const prompt = `Analyze this email and provide a structured analysis:

**Email Details:**
- From: ${email.from_name || email.from_address}
- Subject: ${email.subject}
- Body: ${email.body_text?.slice(0, 5000) || ''}

**Task:**
1. Assign a priority score (1-100) and level (critical/high/medium/low)
2. Categorize the email (customer/work/personal/newsletter/automated/spam)
3. Determine sentiment (positive/neutral/negative/urgent)
4. Extract action items (tasks, deadlines, requests)
5. Generate a concise summary (1-2 sentences)
6. Suggest relevant tags

**Respond ONLY with valid JSON (no markdown, no code blocks):**
{
  "priority_score": number,
  "priority_level": "critical" | "high" | "medium" | "low",
  "category": string,
  "sentiment": string,
  "action_items": [{"task": string, "deadline": string | null}],
  "summary": string,
  "tags": [string]
}`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = message.content[0].text;

    // Parse JSON response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const jsonText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', response);
      throw new Error('Invalid AI response format');
    }

    // Log usage
    await logApiUsage(userId, email.id, 'analyze_email', message.usage, true, null);

    return analysis;

  } catch (error) {
    console.error('Claude analysis error:', error);
    await logApiUsage(userId, email.id, 'analyze_email', { input_tokens: 0, output_tokens: 0 }, false, error.message);
    throw error;
  }
}

/**
 * Generate draft reply for email
 */
export async function generateDraftReply(userId, email, context = {}) {
  const budgetCheck = await checkBudget(userId);

  if (!budgetCheck.allowed) {
    throw new Error(budgetCheck.reason);
  }

  const { tone = 'professional', instructions = '' } = context;

  const prompt = `Generate a professional email reply based on the following:

**Original Email:**
- From: ${email.from_name || email.from_address}
- Subject: ${email.subject}
- Body: ${email.body_text?.slice(0, 5000) || ''}

**Reply Instructions:**
- Tone: ${tone}
- Additional instructions: ${instructions || 'None'}

**Task:**
Generate a complete, ready-to-send email reply. Be helpful, professional, and address all points in the original email.

**Respond ONLY with valid JSON (no markdown, no code blocks):**
{
  "subject": "Re: ...",
  "body_text": "Plain text version of reply",
  "body_html": "<p>HTML version of reply</p>",
  "confidence_score": number (0.0-1.0),
  "notes": "Brief explanation of the reply approach"
}`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = message.content[0].text;

    // Parse JSON response
    let draft;
    try {
      const jsonText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      draft = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', response);
      throw new Error('Invalid AI response format');
    }

    // Log usage
    await logApiUsage(userId, email.id, 'generate_draft', message.usage, true, null);

    return draft;

  } catch (error) {
    console.error('Claude draft generation error:', error);
    await logApiUsage(userId, email.id, 'generate_draft', { input_tokens: 0, output_tokens: 0 }, false, error.message);
    throw error;
  }
}

/**
 * Generate category summary for multiple emails
 */
export async function generateCategorySummary(userId, emails, category) {
  const budgetCheck = await checkBudget(userId);

  if (!budgetCheck.allowed) {
    throw new Error(budgetCheck.reason);
  }

  const emailsList = emails
    .slice(0, 50) // Limit to 50 emails
    .map((e, i) => `${i + 1}. From: ${e.from_address} | Subject: ${e.subject}`)
    .join('\n');

  const prompt = `Generate a concise summary of these ${category} emails:

${emailsList}

**Task:**
Provide a brief overview highlighting:
1. Key themes and topics
2. Important senders
3. Urgent items requiring attention
4. Overall insights

Keep the summary to 3-4 sentences.

**Respond with plain text only (no JSON, no markdown):**`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const summary = message.content[0].text.trim();

    // Log usage (use first email id as representative)
    await logApiUsage(userId, emails[0]?.id || null, 'category_summary', message.usage, true, null);

    return summary;

  } catch (error) {
    console.error('Claude summary generation error:', error);
    await logApiUsage(userId, null, 'category_summary', { input_tokens: 0, output_tokens: 0 }, false, error.message);
    throw error;
  }
}

export default {
  analyzeEmail,
  generateDraftReply,
  generateCategorySummary,
  checkBudget,
};
