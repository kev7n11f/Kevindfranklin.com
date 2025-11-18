# API Reference

Complete API reference for the Email Assistant backend endpoints.

## Base URL

```
Production: https://your-domain.vercel.app/api
Development: http://localhost:3000/api (when running locally)
```

## Authentication

Most endpoints require JWT authentication via the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

Get a token by logging in via `/api/auth/login`.

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "full_name": "John Doe" // optional
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Response:** `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-11-18T12:00:00Z"
  }
}
```

**Errors:**
- `400 Bad Request`: Validation error or user already exists
- `500 Internal Server Error`: Server error

---

### Login

Authenticate and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "settings": {}
  }
}
```

**Errors:**
- `400 Bad Request`: Missing credentials
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Server error

---

### Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "settings": {
    "ai_enabled": true,
    "monthly_budget_cents": 1000
  },
  "created_at": "2024-11-18T12:00:00Z"
}
```

**Errors:**
- `401 Unauthorized`: Missing or invalid token

---

### Update Profile

Update user profile information.

**Endpoint:** `PATCH /api/auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "full_name": "Jane Doe",
  "password": "NewPassword123" // optional
}
```

**Response:** `200 OK`
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Doe"
  }
}
```

---

### Update Settings

Update user settings.

**Endpoint:** `PATCH /api/auth/settings`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "ai_enabled": false,
  "monthly_budget_cents": 2000,
  "notification_preferences": {
    "email": true,
    "push": false
  }
}
```

**Response:** `200 OK`
```json
{
  "message": "Settings updated successfully",
  "settings": {
    "ai_enabled": false,
    "monthly_budget_cents": 2000,
    "notification_preferences": {
      "email": true,
      "push": false
    }
  }
}
```

---

## Email Management

### List Emails

Get paginated list of emails.

**Endpoint:** `GET /api/email/list`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50, max: 100) - Items per page
- `priority` (string) - Filter by priority: critical, high, medium, low
- `category` (string) - Filter by category
- `is_read` (boolean) - Filter by read status
- `search` (string) - Search in subject/sender

**Example:**
```
GET /api/email/list?page=1&limit=20&priority=high&is_read=false
```

**Response:** `200 OK`
```json
{
  "emails": [
    {
      "id": "uuid",
      "subject": "Important Meeting",
      "from": "boss@company.com",
      "preview": "Please join the meeting at...",
      "received_at": "2024-11-18T10:00:00Z",
      "is_read": false,
      "is_starred": false,
      "priority": "high",
      "category": "work",
      "has_attachments": true
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_count": 200,
    "per_page": 20
  }
}
```

---

### Get Email

Get single email with full content.

**Endpoint:** `GET /api/email/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "subject": "Important Meeting",
  "from": "boss@company.com",
  "to": ["you@company.com"],
  "cc": [],
  "bcc": [],
  "body_text": "Plain text body...",
  "body_html": "<html>...</html>",
  "received_at": "2024-11-18T10:00:00Z",
  "is_read": true,
  "is_starred": false,
  "priority": "high",
  "category": "work",
  "sentiment": "neutral",
  "ai_summary": "Meeting scheduled for...",
  "key_points": ["Point 1", "Point 2"],
  "action_items": ["Task 1", "Task 2"],
  "confidence_score": 0.95,
  "has_attachments": true,
  "attachments": [
    {
      "filename": "document.pdf",
      "size": 102400,
      "content_type": "application/pdf"
    }
  ]
}
```

**Errors:**
- `404 Not Found`: Email not found
- `403 Forbidden`: Email belongs to another user

---

### Update Email

Update email properties (mark read, star, etc.).

**Endpoint:** `PATCH /api/email/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "is_read": true,
  "is_starred": false,
  "category": "work",
  "priority": "high"
}
```

**Response:** `200 OK`
```json
{
  "message": "Email updated successfully",
  "email": {
    "id": "uuid",
    "is_read": true,
    "is_starred": false,
    "category": "work",
    "priority": "high"
  }
}
```

---

### Delete Email

Delete an email.

**Endpoint:** `DELETE /api/email/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Email deleted successfully"
}
```

---

### Sync Emails

Trigger email sync for all connected accounts.

**Endpoint:** `POST /api/email/sync`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Email sync completed",
  "synced": 15,
  "accounts": [
    {
      "email": "user@gmail.com",
      "count": 10
    },
    {
      "email": "user@outlook.com",
      "count": 5
    }
  ]
}
```

---

## Email Accounts

### List Accounts

Get all connected email accounts.

**Endpoint:** `GET /api/email/accounts`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "accounts": [
    {
      "id": "uuid",
      "provider": "gmail",
      "email_address": "user@gmail.com",
      "display_name": "Personal Gmail",
      "is_active": true,
      "last_sync": "2024-11-18T12:00:00Z"
    }
  ]
}
```

---

### Connect IMAP Account

Connect a custom IMAP email account.

**Endpoint:** `POST /api/email/connect/imap`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "user@example.com",
  "display_name": "Work Email",
  "imap_host": "imap.example.com",
  "imap_port": 993,
  "imap_username": "user@example.com",
  "imap_password": "app-password",
  "smtp_host": "smtp.example.com",
  "smtp_port": 587,
  "smtp_username": "user@example.com",
  "smtp_password": "app-password"
}
```

**Response:** `201 Created`
```json
{
  "message": "IMAP account connected successfully",
  "account": {
    "id": "uuid",
    "provider": "imap",
    "email_address": "user@example.com",
    "display_name": "Work Email"
  }
}
```

---

### Connect Gmail (OAuth)

Initiate Gmail OAuth connection.

**Endpoint:** `POST /api/email/connect/gmail`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

**Flow:**
1. Redirect user to `auth_url`
2. User authorizes app
3. Google redirects to callback URL
4. Backend exchanges code for tokens
5. Account is connected

---

### Connect Outlook (OAuth)

Initiate Outlook OAuth connection.

**Endpoint:** `POST /api/email/connect/outlook`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=..."
}
```

---

### Delete Account

Remove a connected email account.

**Endpoint:** `DELETE /api/email/accounts/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Email account removed successfully"
}
```

---

## Drafts

### List Drafts

Get all email drafts.

**Endpoint:** `GET /api/drafts`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (string) - Filter by status: draft, sent, failed

**Response:** `200 OK`
```json
{
  "drafts": [
    {
      "id": "uuid",
      "original_email_id": "uuid",
      "subject": "Re: Important Meeting",
      "body": "Thank you for...",
      "tone": "professional",
      "confidence_score": 0.92,
      "status": "draft",
      "created_at": "2024-11-18T12:00:00Z"
    }
  ]
}
```

---

### Create Draft

Create a new email draft (AI or manual).

**Endpoint:** `POST /api/drafts/create`

**Headers:** `Authorization: Bearer <token>`

**Request Body (AI-generated):**
```json
{
  "email_id": "uuid",
  "tone": "professional", // professional, friendly, formal, casual
  "use_ai": true
}
```

**Request Body (Manual):**
```json
{
  "to": ["recipient@example.com"],
  "subject": "Meeting Follow-up",
  "body": "Thank you for the meeting...",
  "use_ai": false
}
```

**Response:** `201 Created`
```json
{
  "draft": {
    "id": "uuid",
    "subject": "Re: Important Meeting",
    "body": "AI-generated or manual content...",
    "tone": "professional",
    "confidence_score": 0.92,
    "status": "draft"
  }
}
```

---

### Update Draft

Edit a draft.

**Endpoint:** `PATCH /api/drafts/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "subject": "Updated Subject",
  "body": "Updated body...",
  "to": ["new@example.com"]
}
```

**Response:** `200 OK`
```json
{
  "message": "Draft updated successfully",
  "draft": {
    "id": "uuid",
    "subject": "Updated Subject",
    "body": "Updated body..."
  }
}
```

---

### Send Draft

Send a draft email.

**Endpoint:** `POST /api/drafts/:id/send`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Email sent successfully",
  "draft": {
    "id": "uuid",
    "status": "sent",
    "sent_at": "2024-11-18T12:30:00Z"
  }
}
```

**Errors:**
- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: SMTP error

---

### Delete Draft

Delete a draft.

**Endpoint:** `DELETE /api/drafts/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Draft deleted successfully"
}
```

---

## Rules & Automation

### List Rules

Get all automation rules.

**Endpoint:** `GET /api/rules`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "rules": [
    {
      "id": "uuid",
      "name": "Archive newsletters",
      "enabled": true,
      "conditions": [
        {
          "field": "category",
          "operator": "equals",
          "value": "newsletter"
        }
      ],
      "actions": [
        {
          "type": "archive",
          "value": null
        }
      ],
      "applied_count": 150,
      "created_at": "2024-11-01T00:00:00Z"
    }
  ]
}
```

---

### Create Rule

Create a new automation rule.

**Endpoint:** `POST /api/rules`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Mark urgent emails from boss",
  "enabled": true,
  "conditions": [
    {
      "field": "from",
      "operator": "contains",
      "value": "boss@company.com"
    }
  ],
  "actions": [
    {
      "type": "set_priority",
      "value": "critical"
    },
    {
      "type": "star",
      "value": null
    }
  ]
}
```

**Condition Fields:**
- `from`, `to`, `subject`, `body`
- `priority`, `category`, `sentiment`
- `is_read`, `is_starred`, `has_attachments`

**Operators:**
- `equals`, `contains`, `starts_with`, `ends_with`
- `greater_than`, `less_than`

**Action Types:**
- `set_category`, `set_priority`, `mark_read`
- `star`, `archive`, `delete`, `skip_ai_analysis`

**Response:** `201 Created`
```json
{
  "rule": {
    "id": "uuid",
    "name": "Mark urgent emails from boss",
    "enabled": true,
    "conditions": [...],
    "actions": [...]
  }
}
```

---

### Update Rule

Update an existing rule.

**Endpoint:** `PATCH /api/rules/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated rule name",
  "enabled": false,
  "conditions": [...],
  "actions": [...]
}
```

**Response:** `200 OK`
```json
{
  "message": "Rule updated successfully",
  "rule": {
    "id": "uuid",
    "name": "Updated rule name",
    "enabled": false
  }
}
```

---

### Delete Rule

Delete a rule.

**Endpoint:** `DELETE /api/rules/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Rule deleted successfully"
}
```

---

## Analytics

### Get Analytics

Get email analytics and insights.

**Endpoint:** `GET /api/analytics`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `range` (string) - Time range: 7d, 30d, 90d, all

**Response:** `200 OK`
```json
{
  "overview": {
    "total_emails": 1543,
    "unread_count": 23,
    "high_priority_count": 15,
    "ai_analyzed_count": 1200
  },
  "byCategory": [
    { "category": "work", "count": 850 },
    { "category": "personal", "count": 350 },
    { "category": "newsletter", "count": 200 }
  ],
  "byPriority": [
    { "priority": "critical", "count": 10 },
    { "priority": "high", "count": 120 },
    { "priority": "medium", "count": 800 },
    { "priority": "low", "count": 613 }
  ],
  "topSenders": [
    { "sender": "boss@company.com", "count": 45 },
    { "sender": "team@company.com", "count": 38 }
  ],
  "dailyActivity": [
    { "date": "2024-11-18", "count": 25 },
    { "date": "2024-11-17", "count": 30 }
  ]
}
```

---

## Notifications

### List Notifications

Get user notifications.

**Endpoint:** `GET /api/notifications`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `unread_only` (boolean) - Show only unread notifications

**Response:** `200 OK`
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "email",
      "title": "New high priority email",
      "message": "From boss@company.com",
      "is_read": false,
      "created_at": "2024-11-18T12:00:00Z",
      "metadata": {
        "email_id": "uuid"
      }
    }
  ],
  "unread_count": 5
}
```

---

### Mark Notification as Read

Mark a notification as read.

**Endpoint:** `PATCH /api/notifications/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "is_read": true
}
```

**Response:** `200 OK`
```json
{
  "message": "Notification updated successfully"
}
```

---

### Mark All as Read

Mark all notifications as read.

**Endpoint:** `POST /api/notifications/mark-all-read`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "All notifications marked as read",
  "count": 15
}
```

---

### Delete Notification

Delete a notification.

**Endpoint:** `DELETE /api/notifications/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Notification deleted successfully"
}
```

---

## Budget Management

### Get Budget Status

Get current budget usage and limits.

**Endpoint:** `GET /api/budget/status`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "current_period": {
    "start_date": "2024-11-01T00:00:00Z",
    "end_date": "2024-11-30T23:59:59Z"
  },
  "budget_limit_cents": 1000,
  "total_spent_cents": 342,
  "percent_used": 34.2,
  "remaining_cents": 658,
  "is_paused": false,
  "usage_by_day": [
    { "date": "2024-11-18", "amount_cents": 25 },
    { "date": "2024-11-17", "amount_cents": 18 }
  ],
  "breakdown": {
    "input_tokens": 125000,
    "output_tokens": 45000,
    "input_cost_cents": 375,
    "output_cost_cents": 675
  }
}
```

---

### Update Budget

Update budget settings.

**Endpoint:** `POST /api/budget/update`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "monthly_budget_cents": 2000,
  "auto_pause": true
}
```

**Response:** `200 OK`
```json
{
  "message": "Budget updated successfully",
  "budget": {
    "monthly_budget_cents": 2000,
    "auto_pause": true
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": ["Email is required", "Password must be at least 8 characters"]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

- **Default Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit info included in response headers
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Timestamp when limit resets

---

## Webhooks (Future)

Webhook support is planned for future releases:

- Email received
- Budget threshold reached
- Sync completed
- Rule triggered

---

## Changelog

- **v1.0.0** (2024-11-18): Initial API release

---

For more information, see:
- [Complete README](EMAIL_ASSISTANT_COMPLETE_README.md)
- [Quick Start Guide](QUICK_START.md)
- [Contributing Guidelines](CONTRIBUTING.md)
