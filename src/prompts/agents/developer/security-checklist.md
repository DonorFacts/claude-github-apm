# Security Checklist for Development

## Pre-Development Security Review

<pre_development>
Before implementing any feature, ask yourself:
- [ ] Does this feature handle user input?
- [ ] Will it store or process sensitive data?
- [ ] Does it involve authentication or authorization?
- [ ] Will it make external API calls?
- [ ] Could it affect system performance or availability?
- [ ] Does it involve file uploads or downloads?
</pre_development>

## Input Validation Checklist

<input_validation>
### All User Inputs
- [ ] Validate input type (string, number, boolean, etc.)
- [ ] Check input length/size limits
- [ ] Sanitize special characters
- [ ] Validate against allowed values (whitelist)
- [ ] Reject suspicious patterns
- [ ] Handle encoding properly (UTF-8)

### Specific Input Types
```typescript
// Email validation
- [ ] Valid format (RFC 5322)
- [ ] Domain exists (optional)
- [ ] Normalize case

// URL validation
- [ ] Valid protocol (https only for sensitive data)
- [ ] No javascript: or data: URLs
- [ ] Validate domain whitelist if applicable

// File uploads
- [ ] Check file type by content, not extension
- [ ] Limit file size
- [ ] Scan for malware
- [ ] Store outside web root
- [ ] Generate new filenames

// Numbers
- [ ] Check min/max bounds
- [ ] Prevent integer overflow
- [ ] Validate decimal places
```
</input_validation>

## Authentication Security

<authentication>
### Password Requirements
- [ ] Minimum 8 characters
- [ ] Require complexity (uppercase, lowercase, numbers, symbols)
- [ ] Check against common passwords list
- [ ] Hash using bcrypt (min 10 rounds) or Argon2
- [ ] Never store plaintext passwords
- [ ] Implement password history

### Session Management
- [ ] Generate cryptographically secure session IDs
- [ ] Regenerate session ID on login
- [ ] Set secure cookie flags (Secure, HttpOnly, SameSite)
- [ ] Implement session timeout
- [ ] Clear sessions on logout
- [ ] Prevent session fixation

### Multi-Factor Authentication
- [ ] Support TOTP (Time-based One-Time Password)
- [ ] Backup codes for recovery
- [ ] Rate limit verification attempts
- [ ] Secure storage of secrets
</authentication>

## Authorization Checks

<authorization>
### Access Control
- [ ] Check permissions on every request
- [ ] Implement principle of least privilege
- [ ] Validate resource ownership
- [ ] Use role-based access control (RBAC)
- [ ] Log authorization failures
- [ ] Fail securely (deny by default)

### API Security
```typescript
// Every endpoint should have:
- [ ] Authentication check
- [ ] Authorization check
- [ ] Rate limiting
- [ ] Input validation
- [ ] Output encoding
- [ ] Error handling
```
</authorization>

## Data Protection

<data_protection>
### Sensitive Data Handling
- [ ] Identify all PII (Personally Identifiable Information)
- [ ] Encrypt data at rest (AES-256)
- [ ] Use TLS 1.3 for data in transit
- [ ] Implement field-level encryption for highly sensitive data
- [ ] Secure key management (use KMS)
- [ ] Data retention policies

### Database Security
- [ ] Use parameterized queries (prevent SQL injection)
- [ ] Encrypt database connections
- [ ] Principle of least privilege for DB users
- [ ] Regular backups with encryption
- [ ] Audit logging for sensitive operations
- [ ] Data masking in non-production environments
</data_protection>

## API Security Checklist

<api_security>
### Request Security
- [ ] Validate Content-Type header
- [ ] Check request size limits
- [ ] Implement CORS properly
- [ ] Use API keys or OAuth tokens
- [ ] Version your APIs
- [ ] Document security requirements

### Response Security
- [ ] Remove sensitive data from responses
- [ ] Set security headers
- [ ] Prevent information disclosure in errors
- [ ] Use consistent error formats
- [ ] Implement response caching carefully
</api_security>

## Security Headers

<security_headers>
```typescript
// Essential security headers
app.use((req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  
  // HSTS
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  
  next();
});
```
</security_headers>

## Common Vulnerabilities

<vulnerabilities>
### XSS (Cross-Site Scripting)
- [ ] Encode all user input in HTML context
- [ ] Use templating engines with auto-escaping
- [ ] Validate and sanitize rich text input
- [ ] Implement Content Security Policy
- [ ] Avoid eval() and innerHTML

### CSRF (Cross-Site Request Forgery)
- [ ] Use CSRF tokens for state-changing operations
- [ ] Verify referrer header
- [ ] Use SameSite cookie attribute
- [ ] Require re-authentication for sensitive actions

### SQL Injection
- [ ] Always use parameterized queries
- [ ] Validate input types
- [ ] Use stored procedures cautiously
- [ ] Limit database permissions
- [ ] Enable SQL query logging

### NoSQL Injection
- [ ] Validate input types strictly
- [ ] Sanitize query operators
- [ ] Use schema validation
- [ ] Avoid string concatenation in queries

### XXE (XML External Entity)
- [ ] Disable external entity processing
- [ ] Use JSON instead of XML when possible
- [ ] Validate XML schemas
- [ ] Update XML parsers regularly
</vulnerabilities>

## Cryptography Guidelines

<cryptography>
### Encryption
- [ ] Use established libraries (crypto, bcrypt)
- [ ] Never implement custom crypto
- [ ] Use appropriate key lengths (min 256-bit)
- [ ] Rotate encryption keys regularly
- [ ] Secure key storage (environment variables, KMS)

### Hashing
- [ ] Use bcrypt or Argon2 for passwords
- [ ] Use SHA-256 or better for integrity
- [ ] Add salt for password hashing
- [ ] Never use MD5 or SHA-1

### Random Number Generation
```typescript
// ✅ Cryptographically secure
import { randomBytes } from 'crypto';
const token = randomBytes(32).toString('hex');

// ❌ Not secure
const token = Math.random().toString(36);
```
</cryptography>

## Logging and Monitoring

<logging>
### Security Events to Log
- [ ] Authentication attempts (success/failure)
- [ ] Authorization failures
- [ ] Input validation failures
- [ ] System errors and exceptions
- [ ] Administrative actions
- [ ] Data access to sensitive information

### Log Security
- [ ] Never log passwords or tokens
- [ ] Sanitize log data
- [ ] Secure log storage
- [ ] Implement log rotation
- [ ] Monitor for suspicious patterns
- [ ] Use structured logging

### Example Secure Logging
```typescript
logger.info('User login attempt', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date().toISOString(),
  result: 'success'
});

// Never log sensitive data
logger.error('Payment failed', {
  userId: user.id,
  // ❌ DON'T: cardNumber: payment.cardNumber
  lastFour: payment.cardNumber.slice(-4),
  amount: payment.amount,
  error: error.message
});
```
</logging>

## Third-Party Dependencies

<dependencies>
### Dependency Security
- [ ] Audit dependencies regularly (`pnpm audit`)
- [ ] Keep dependencies updated
- [ ] Review dependency licenses
- [ ] Minimize dependency count
- [ ] Use lock files (pnpm-lock.yaml)
- [ ] Scan for known vulnerabilities

### Supply Chain Security
- [ ] Verify package integrity
- [ ] Use official sources
- [ ] Review package permissions
- [ ] Monitor for dependency changes
- [ ] Implement security policies
</dependencies>

## Deployment Security

<deployment>
### Environment Security
- [ ] Use environment variables for secrets
- [ ] Never commit secrets to version control
- [ ] Implement secret rotation
- [ ] Use least-privilege service accounts
- [ ] Secure CI/CD pipelines
- [ ] Implement infrastructure as code

### Production Checklist
- [ ] Remove debug endpoints
- [ ] Disable verbose error messages
- [ ] Update all dependencies
- [ ] Run security scans
- [ ] Configure firewall rules
- [ ] Enable monitoring and alerting
- [ ] Implement backup procedures
- [ ] Document incident response plan
</deployment>

## Security Testing

<testing>
### Automated Security Tests
```typescript
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await api.get(`/search?q=${maliciousInput}`);
    expect(response.status).toBe(400);
    
    // Verify database is intact
    const users = await db.users.count();
    expect(users).toBeGreaterThan(0);
  });
  
  it('should enforce rate limiting', async () => {
    const requests = Array(100).fill(null).map(() => 
      api.post('/login', { email: 'test@example.com', password: 'wrong' })
    );
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
  
  it('should validate JWT expiration', async () => {
    const expiredToken = generateToken({ exp: Date.now() - 1000 });
    const response = await api.get('/protected', {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    expect(response.status).toBe(401);
  });
});
```
</testing>

## Incident Response

<incident_response>
### If Security Breach Suspected
1. [ ] Isolate affected systems
2. [ ] Preserve evidence (logs, memory dumps)
3. [ ] Notify security team immediately
4. [ ] Document timeline of events
5. [ ] Assess scope of breach
6. [ ] Implement containment measures
7. [ ] Begin recovery procedures
8. [ ] Conduct post-mortem analysis

### Regular Security Tasks
- [ ] Weekly dependency audits
- [ ] Monthly security log reviews
- [ ] Quarterly penetration testing
- [ ] Annual security training
- [ ] Continuous security monitoring
</incident_response>

## Final Security Checklist

<final_checklist>
Before deploying any code:
- [ ] All inputs validated and sanitized
- [ ] Authentication and authorization implemented
- [ ] Sensitive data encrypted
- [ ] Security headers configured
- [ ] Error handling doesn't leak information
- [ ] Logging captures security events
- [ ] Dependencies are up-to-date
- [ ] Security tests pass
- [ ] Code reviewed by another developer
- [ ] No secrets in code or commits
</final_checklist>