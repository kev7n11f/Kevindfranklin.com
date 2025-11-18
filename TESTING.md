# Testing Guide

This document outlines the testing strategy and setup for the Email Assistant project.

## Testing Philosophy

The Email Assistant follows a pragmatic testing approach:
- **Critical paths**: Authentication, email sync, AI analysis
- **User interactions**: Form submissions, email operations
- **Edge cases**: Error handling, boundary conditions
- **Performance**: Load times, bundle sizes

## Testing Stack (Future Implementation)

### Recommended Tools

**Frontend Testing:**
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "jsdom": "^23.0.0"
  }
}
```

**Backend Testing:**
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@types/jest": "^29.5.0"
  }
}
```

## Test Structure

```
app/
├── src/
│   ├── components/
│   │   ├── EmailList.jsx
│   │   └── __tests__/
│   │       └── EmailList.test.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   └── __tests__/
│   │       └── Dashboard.test.jsx
│   └── utils/
│       ├── format.js
│       └── __tests__/
│           └── format.test.js

api/
├── auth/
│   ├── login.js
│   └── __tests__/
│       └── login.test.js
└── email/
    ├── list.js
    └── __tests__/
        └── list.test.js
```

## Sample Tests

### Frontend Component Test

```javascript
// app/src/components/__tests__/EmailList.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import EmailList from '../EmailList'

describe('EmailList', () => {
  const mockEmails = [
    { id: 1, subject: 'Test Email', from: 'test@example.com', is_read: false },
    { id: 2, subject: 'Another Email', from: 'user@example.com', is_read: true }
  ]

  it('renders email items correctly', () => {
    render(<EmailList emails={mockEmails} onSelect={vi.fn()} />)

    expect(screen.getByText('Test Email')).toBeInTheDocument()
    expect(screen.getByText('Another Email')).toBeInTheDocument()
  })

  it('handles email selection', () => {
    const onSelect = vi.fn()
    render(<EmailList emails={mockEmails} onSelect={onSelect} />)

    const checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(checkbox)

    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('displays unread indicator', () => {
    render(<EmailList emails={mockEmails} onSelect={vi.fn()} />)

    const unreadEmails = screen.getAllByTestId('unread-indicator')
    expect(unreadEmails).toHaveLength(1)
  })
})
```

### Frontend Hook Test

```javascript
// app/src/hooks/__tests__/useKeyboardShortcuts.test.js
import { renderHook } from '@testing-library/react'
import { useNavigate } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useKeyboardShortcuts } from '../useKeyboardShortcuts'

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}))

describe('useKeyboardShortcuts', () => {
  let navigate

  beforeEach(() => {
    navigate = vi.fn()
    useNavigate.mockReturnValue(navigate)
  })

  it('navigates to dashboard on g+d', () => {
    renderHook(() => useKeyboardShortcuts())

    // Simulate 'g' key
    fireEvent.keyDown(document, { key: 'g' })

    // Simulate 'd' key within 1 second
    fireEvent.keyDown(document, { key: 'd' })

    expect(navigate).toHaveBeenCalledWith('/dashboard')
  })

  it('ignores shortcuts when typing in input', () => {
    renderHook(() => useKeyboardShortcuts())

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    fireEvent.keyDown(input, { key: 'g' })
    fireEvent.keyDown(input, { key: 'd' })

    expect(navigate).not.toHaveBeenCalled()
  })
})
```

### Backend API Test

```javascript
// api/auth/__tests__/login.test.js
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { query } from '../../db/connection.js'

describe('POST /api/auth/login', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123'
  }

  beforeAll(async () => {
    // Create test user
    await request('/api/auth/register')
      .post('/register')
      .send(testUser)
  })

  afterAll(async () => {
    // Cleanup test user
    await query('DELETE FROM users WHERE email = $1', [testUser.email])
  })

  it('returns token on successful login', async () => {
    const response = await request('/api/auth/login')
      .post('/login')
      .send(testUser)
      .expect(200)

    expect(response.body).toHaveProperty('token')
    expect(response.body).toHaveProperty('user')
    expect(response.body.user.email).toBe(testUser.email)
  })

  it('returns 401 for invalid credentials', async () => {
    const response = await request('/api/auth/login')
      .post('/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401)

    expect(response.body).toHaveProperty('error')
  })

  it('returns 400 for missing fields', async () => {
    const response = await request('/api/auth/login')
      .post('/login')
      .send({ email: testUser.email })
      .expect(400)

    expect(response.body).toHaveProperty('error')
  })
})
```

### Integration Test

```javascript
// api/__tests__/email-flow.integration.test.js
import { describe, it, expect } from '@jest/globals'
import request from 'supertest'

describe('Email Flow Integration', () => {
  let authToken
  let accountId

  it('completes full email workflow', async () => {
    // 1. Register user
    const registerRes = await request('/api')
      .post('/auth/register')
      .send({ email: 'flow@test.com', password: 'Test123456' })
      .expect(201)

    authToken = registerRes.body.token

    // 2. Connect IMAP account
    const connectRes = await request('/api')
      .post('/email/connect/imap')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'test@example.com',
        imapHost: 'imap.example.com',
        imapPort: 993,
        imapUsername: 'test@example.com',
        imapPassword: 'password123',
        smtpHost: 'smtp.example.com',
        smtpPort: 587
      })
      .expect(201)

    accountId = connectRes.body.account.id

    // 3. Sync emails
    const syncRes = await request('/api')
      .post('/email/sync')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(syncRes.body).toHaveProperty('count')

    // 4. List emails
    const listRes = await request('/api')
      .get('/email/list')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(Array.isArray(listRes.body.emails)).toBe(true)

    // 5. Cleanup
    await request('/api')
      .delete(`/email/accounts/${accountId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
  })
})
```

## Running Tests

### Setup (when implemented)

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- EmailList.test.jsx
```

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Test Categories

### Unit Tests
- Individual components
- Utility functions
- Custom hooks
- API endpoints (isolated)

### Integration Tests
- User flows (login → sync → view emails)
- API endpoint chains
- Database operations
- External service mocks

### E2E Tests (Future)
- Complete user journeys
- Cross-browser testing
- Mobile responsiveness
- Performance benchmarks

## Mocking Strategy

### API Calls
```javascript
import { vi } from 'vitest'
import axios from 'axios'

vi.mock('axios')

axios.get.mockResolvedValue({
  data: { emails: [...mockEmails] }
})
```

### Router
```javascript
import { vi } from 'vitest'
import { useNavigate } from 'react-router-dom'

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}))
```

### Context
```javascript
import { render } from '@testing-library/react'
import { AuthProvider } from '../contexts/AuthContext'

const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}
```

## Continuous Integration

Tests run automatically on:
- Every pull request
- Push to main/develop branches
- Pre-deployment checks

See `.github/workflows/ci.yml` for CI configuration.

## Best Practices

### ✅ Do
- Test user behavior, not implementation
- Use meaningful test descriptions
- Keep tests independent
- Mock external dependencies
- Test error states
- Use data-testid for stable selectors

### ❌ Don't
- Test implementation details
- Create interdependent tests
- Ignore async operations
- Over-mock (test real code when possible)
- Skip edge cases
- Use brittle selectors (class names, etc.)

## Performance Testing

### Bundle Size Monitoring
```bash
# Analyze bundle size
npm run build
du -sh app/dist/*

# Use bundle analyzer (if added)
npm run build -- --analyze
```

### Lighthouse CI
```bash
# Run lighthouse
npx lighthouse http://localhost:5173 --view

# Target scores
# Performance: > 90
# Accessibility: > 95
# Best Practices: > 90
# SEO: > 90
```

## Security Testing

### Dependency Scanning
```bash
# Run npm audit
npm audit

# Fix vulnerabilities
npm audit fix
```

### OWASP Top 10 Checklist
- [ ] SQL Injection prevention (parameterized queries)
- [ ] XSS prevention (React escaping, CSP headers)
- [ ] CSRF protection (SameSite cookies, tokens)
- [ ] Authentication security (JWT, bcrypt)
- [ ] Sensitive data exposure (encryption, HTTPS)
- [ ] Access control (authorization checks)
- [ ] Security misconfiguration (secure headers)
- [ ] Using components with known vulnerabilities (npm audit)
- [ ] Insufficient logging (error tracking, audit logs)
- [ ] API security (rate limiting, validation)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Status**: Testing infrastructure ready for implementation
**Next Steps**: Install testing dependencies and implement sample tests
