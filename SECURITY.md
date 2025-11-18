# Security Policy

## Overview

The Email Assistant project takes security seriously. This document outlines our security policies, supported versions, and how to report vulnerabilities.

## Supported Versions

We actively support and provide security updates for the following versions:

| Version | Supported          | End of Support |
| ------- | ------------------ | -------------- |
| 1.0.x   | :white_check_mark: | TBD            |
| < 1.0   | :x:                | -              |

## Security Features

### Authentication & Authorization

- **JWT Tokens**: 7-day expiration, signed with HS256
- **Password Hashing**: bcrypt with 10 salt rounds
- **Session Management**: Secure token storage and validation
- **OAuth 2.0**: Google and Microsoft OAuth for email providers
- **Rate Limiting**: 100 requests per 15 minutes per IP

### Data Protection

- **Encryption at Rest**: AES-256-GCM for sensitive credentials
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Database Security**: Parameterized queries prevent SQL injection
- **Input Validation**: Comprehensive validation on all API endpoints
- **Output Encoding**: React automatic XSS protection

### API Security

- **CORS**: Configured for specific origins
- **Request Validation**: Schema validation for all endpoints
- **Error Handling**: No sensitive information in error responses
- **Authentication Required**: All protected endpoints require valid JWT
- **Token Refresh**: Automatic OAuth token refresh for expired credentials

### Infrastructure Security

- **Environment Variables**: Sensitive config stored in environment variables
- **Database**: Neon PostgreSQL with SSL connections
- **Deployment**: Vercel serverless with automatic HTTPS
- **Dependencies**: Regular security audits via npm audit
- **CSP Headers**: Content Security Policy for XSS protection

## Known Security Considerations

### Current Limitations

1. **OAuth Token Storage**: Refresh tokens are encrypted but stored in database
2. **Rate Limiting**: IP-based, can be bypassed with rotating IPs
3. **2FA**: Not currently implemented for application login
4. **Session Revocation**: No centralized session revocation system
5. **Audit Logging**: Limited audit trail for security events

### Planned Improvements

- [ ] Implement 2FA/MFA for user accounts
- [ ] Add session revocation endpoint
- [ ] Enhanced audit logging
- [ ] Implement CSRF protection
- [ ] Add security headers middleware
- [ ] Implement account lockout after failed attempts
- [ ] Add IP whitelist option for sensitive accounts

## Reporting a Vulnerability

### How to Report

If you discover a security vulnerability, please follow these steps:

1. **DO NOT** open a public issue
2. **DO NOT** disclose the vulnerability publicly
3. Email security details to: **security@kevindfranklin.com** (if available) or create a private security advisory

### What to Include

Please include the following information in your report:

- **Description**: Clear description of the vulnerability
- **Impact**: Potential impact and severity assessment
- **Steps to Reproduce**: Detailed steps to reproduce the vulnerability
- **Proof of Concept**: If possible, include a PoC (without causing harm)
- **Affected Versions**: Which versions are affected
- **Suggested Fix**: If you have ideas for remediation
- **Your Contact Info**: How we can reach you for follow-up

### Example Report

```markdown
**Vulnerability**: SQL Injection in email search endpoint
**Severity**: High
**Affected Versions**: 1.0.0 and earlier
**Impact**: Attacker could access unauthorized email data

**Steps to Reproduce**:
1. Navigate to /api/email/search
2. Submit payload: `' OR '1'='1`
3. Observe unauthorized data access

**Suggested Fix**: Use parameterized queries for search terms
**Reporter**: John Doe (john@example.com)
```

### Response Timeline

- **Initial Response**: Within 48 hours
- **Assessment**: Within 5 business days
- **Status Updates**: Every 7 days until resolved
- **Fix Development**: Varies by severity (Critical: 1-3 days, High: 1-2 weeks)
- **Public Disclosure**: After fix is released and deployed

### Severity Levels

| Level    | Description                                    | Response Time |
| -------- | ---------------------------------------------- | ------------- |
| Critical | Active exploitation, data breach imminent      | < 24 hours    |
| High     | Potential for significant impact               | < 3 days      |
| Medium   | Limited impact, requires specific conditions   | < 2 weeks     |
| Low      | Minimal impact, theoretical vulnerability      | < 4 weeks     |

## Security Best Practices for Deployments

### For Administrators

1. **Environment Variables**
   ```bash
   # Generate strong secrets
   JWT_SECRET=$(openssl rand -base64 32)
   ENCRYPTION_KEY=$(openssl rand -hex 16)
   ```

2. **Database Security**
   - Use SSL connections (`?sslmode=require`)
   - Restrict database access by IP
   - Use strong database passwords (16+ characters)
   - Enable automatic backups

3. **API Keys**
   - Rotate API keys regularly (every 90 days)
   - Use separate keys for dev/staging/prod
   - Monitor API usage for anomalies
   - Set budget limits on AI API usage

4. **Access Control**
   - Use least privilege principle
   - Limit admin access
   - Enable audit logging
   - Review access logs regularly

5. **Updates**
   - Keep dependencies up to date
   - Apply security patches immediately
   - Monitor security advisories
   - Run `npm audit` weekly

### For Users

1. **Passwords**
   - Use strong, unique passwords (16+ characters)
   - Use a password manager
   - Never reuse passwords across services

2. **Email Account Security**
   - Use app-specific passwords (not main password)
   - Enable 2FA on email accounts
   - Review connected apps regularly
   - Revoke access for unused accounts

3. **API Keys**
   - Never commit API keys to version control
   - Don't share API keys
   - Monitor usage in provider dashboards
   - Set budget alerts

4. **Browser Security**
   - Keep browser up to date
   - Use HTTPS Everywhere extension
   - Clear browser data regularly
   - Be cautious of browser extensions

## Vulnerability Disclosure Policy

### Coordinated Disclosure

We follow responsible disclosure practices:

1. **Report received** → We acknowledge within 48 hours
2. **Assessment** → We verify and assess impact
3. **Development** → We develop and test a fix
4. **Testing** → Fix is tested in staging environment
5. **Release** → Fix is deployed to production
6. **Disclosure** → Public disclosure after fix is deployed (90 days max)

### Public Disclosure Timeline

- **Immediate**: If actively exploited in the wild
- **7 days**: Critical vulnerabilities with PoC
- **30 days**: High severity vulnerabilities
- **90 days**: Medium/Low severity issues

### Recognition

We appreciate security researchers who help keep our project secure:

- **Hall of Fame**: Public recognition (with your permission)
- **Early Notification**: Get notified of security updates first
- **Collaboration**: Work with us to improve security

## Security Checklist

### Development

- [ ] All inputs validated and sanitized
- [ ] Parameterized database queries used
- [ ] Secrets not hardcoded in source code
- [ ] Error messages don't leak sensitive info
- [ ] Authentication required for protected endpoints
- [ ] Authorization checks on all resources
- [ ] HTTPS enforced for all connections
- [ ] Dependencies regularly updated
- [ ] Security headers configured
- [ ] Logging doesn't include sensitive data

### Deployment

- [ ] Environment variables configured
- [ ] Strong secrets generated
- [ ] Database SSL enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] HTTPS/TLS enabled
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Audit logging active
- [ ] Security scan completed

### User Setup

- [ ] Strong password created
- [ ] API keys secured
- [ ] App passwords used (not main password)
- [ ] 2FA enabled on email accounts
- [ ] Budget limits configured
- [ ] Regular security reviews scheduled

## Security Resources

### Internal Documentation

- [Contributing Guidelines](CONTRIBUTING.md)
- [README](EMAIL_ASSISTANT_COMPLETE_README.md)
- [Quick Start Guide](QUICK_START.md)

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security Best Practices](https://react.dev/learn/security)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

### Tools

- `npm audit` - Dependency vulnerability scanning
- `eslint` - Code quality and security linting
- GitHub Dependabot - Automated dependency updates
- Vercel Security - Platform security features

## Contact

For security-related questions or concerns:

- **Security Issues**: Use private security advisory on GitHub
- **General Security Questions**: Open a discussion or issue
- **Urgent Matters**: Contact repository maintainers directly

## Legal

### Safe Harbor

We support safe harbor for security researchers who:

- Act in good faith
- Don't access or modify user data beyond the minimum needed
- Don't harm the availability of the service
- Report vulnerabilities promptly
- Keep findings confidential until resolved
- Comply with all applicable laws

### Scope

This security policy applies to:

- ✅ Email Assistant application code
- ✅ API endpoints
- ✅ Database queries
- ✅ Authentication/Authorization
- ✅ Client-side security
- ❌ Third-party services (report to provider)
- ❌ Deployment platform (report to Vercel)
- ❌ Social engineering attacks
- ❌ Physical security

## Version History

- **v1.0** (2024-11-18): Initial security policy

---

**Last Updated**: November 18, 2024
**Maintainer**: Kevin D. Franklin
**License**: MIT
