# Contributing to Email Assistant

Thank you for your interest in contributing to the Email Assistant project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful, inclusive, and professional in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Kevindfranklin.com.git
   cd Kevindfranklin.com
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/kev7n11f/Kevindfranklin.com.git
   ```

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- PostgreSQL database (Neon recommended)
- Anthropic API key (for Claude AI)
- (Optional) Gmail/Outlook OAuth credentials

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   cd api && npm install
   cd ../app && npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

3. **Run database migrations**:
   ```bash
   npm run migrate
   ```

4. **Start development servers**:
   ```bash
   npm run dev
   ```

## Project Structure

```
Kevindfranklin.com/
├── api/                  # Backend serverless functions
│   ├── auth/            # Authentication endpoints
│   ├── email/           # Email management endpoints
│   ├── drafts/          # Draft management endpoints
│   ├── rules/           # Automation rules endpoints
│   ├── analytics/       # Analytics endpoints
│   ├── budget/          # Budget tracking endpoints
│   ├── notifications/   # Notifications endpoints
│   ├── middleware/      # Auth and rate limiting
│   ├── services/        # Business logic (AI, email sync)
│   └── utils/           # Helper functions
├── app/                 # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React Context providers
│   │   ├── hooks/       # Custom React hooks
│   │   └── styles/      # CSS and Tailwind config
│   └── public/          # Static assets
├── db/                  # Database connection and migrations
└── scripts/             # Build and deployment scripts
```

## Coding Standards

### JavaScript/React

- Use **ES6+ syntax** (arrow functions, destructuring, etc.)
- Follow **functional programming** principles where possible
- Use **React Hooks** instead of class components
- Keep components **small and focused** (single responsibility)
- Use **PropTypes** or TypeScript for type checking

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Optional but be consistent
- **Line length**: Maximum 100 characters
- **Naming conventions**:
  - Components: PascalCase (e.g., `EmailList`)
  - Functions: camelCase (e.g., `fetchEmails`)
  - Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
  - Files: Match component name (e.g., `EmailList.jsx`)

### React Best Practices

```javascript
// ✅ Good - Functional component with hooks
const EmailList = ({ emails, onSelect }) => {
  const [selected, setSelected] = useState([])

  useEffect(() => {
    // Load emails
  }, [])

  return (
    <div className="email-list">
      {emails.map(email => (
        <EmailItem key={email.id} email={email} />
      ))}
    </div>
  )
}

// ❌ Bad - Class component
class EmailList extends React.Component {
  // Don't use class components
}
```

### API Endpoint Pattern

```javascript
// api/example/[id].js
import { query } from '../../db/connection.js'
import { authenticate } from '../middleware/auth.js'
import { success, error, handleCors } from '../utils/response.js'

export default async function handler(req, res) {
  handleCors(req, res)
  if (req.method === 'OPTIONS') return

  const user = await authenticate(req, res)
  if (!user) return

  const { id } = req.query

  if (req.method === 'GET') {
    // Handle GET request
    try {
      const result = await query('SELECT * FROM table WHERE id = $1', [id])
      return success(res, result.rows[0])
    } catch (err) {
      console.error('Error:', err)
      return error(res, 'Failed to fetch data')
    }
  }

  return error(res, 'Method not allowed', 405)
}
```

## Making Changes

### Branching Strategy

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Keep your branch up to date**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

3. **Make your changes** with clear, focused commits

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(email): Add multi-select functionality to email list

- Added checkbox selection to email items
- Implemented batch operations UI
- Added select all/none functionality

Closes #123
```

```
fix(auth): Resolve JWT token expiration issue

The JWT tokens were expiring too quickly due to incorrect
configuration. Updated JWT_EXPIRES_IN to 7 days.

Fixes #456
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new features
- Ensure all tests pass before submitting
- Aim for at least 80% code coverage
- Test edge cases and error conditions

Example:
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import EmailList from './EmailList'

describe('EmailList', () => {
  it('renders email items', () => {
    const emails = [{ id: 1, subject: 'Test' }]
    render(<EmailList emails={emails} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('handles email selection', () => {
    const onSelect = jest.fn()
    const emails = [{ id: 1, subject: 'Test' }]
    render(<EmailList emails={emails} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('checkbox'))
    expect(onSelect).toHaveBeenCalledWith(1)
  })
})
```

## Submitting Changes

### Pull Request Process

1. **Ensure all tests pass**:
   ```bash
   npm test
   ```

2. **Update documentation** if needed

3. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request** on GitHub with:
   - Clear title and description
   - Reference to related issues
   - Screenshots/GIFs for UI changes
   - List of changes made

5. **Respond to review feedback** promptly

6. **Squash commits** if requested before merging

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

## Reporting Bugs

### Before Submitting

1. Check if the bug has already been reported
2. Collect information about the bug
3. Try to reproduce with the latest version

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome, Safari]
- Version: [e.g., 1.0.0]

**Additional context**
Any other context about the problem.
```

## Feature Requests

We welcome feature requests! Please provide:

1. **Clear description** of the feature
2. **Use case** - Why is this needed?
3. **Proposed solution** - How should it work?
4. **Alternatives considered** - Other approaches?
5. **Additional context** - Mockups, examples, etc.

## Questions?

- Open an issue with the `question` label
- Reach out to maintainers
- Check existing documentation

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to Email Assistant! 🎉
