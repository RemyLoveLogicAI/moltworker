# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it by emailing **luvlogic-ai@proton.me** with the subject line "SECURITY: [Brief Description]".

**Please do not** open a public GitHub issue for security vulnerabilities.

### What to Include in Your Report

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

We will respond to security reports within 48 hours and will keep you informed of our progress.

## Security Best Practices

### Secrets Management

**DO:**
- ✅ Use `wrangler secret put` to store all sensitive credentials
- ✅ Use environment variables for configuration
- ✅ Rotate API keys regularly
- ✅ Use principle of least privilege for access tokens
- ✅ Enable GitHub Secret Scanning and push protection
- ✅ Review `.gitignore` before committing files

**DON'T:**
- ❌ Never commit API keys, tokens, or credentials to version control
- ❌ Never pass secrets as command-line arguments
- ❌ Never log secrets or full configuration objects
- ❌ Never include secrets in error messages
- ❌ Never store secrets in code comments or documentation

### Required Secrets Configuration

Configure these secrets using `wrangler secret put <SECRET_NAME>`:

#### Core Authentication
- `ANTHROPIC_API_KEY` - Anthropic API key for AI models
- `MOLTBOT_GATEWAY_TOKEN` - Gateway authentication token
- `CF_ACCESS_TEAM_DOMAIN` - Cloudflare Access team domain
- `CF_ACCESS_AUD` - Cloudflare Access application audience

#### Optional Integrations
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `DISCORD_BOT_TOKEN` - Discord bot token
- `SLACK_BOT_TOKEN` - Slack bot token
- `SLACK_APP_TOKEN` - Slack app token
- `OPENROUTER_API_KEY` - OpenRouter API key
- `GEMINI_API_KEY` - Google Gemini API key
- `YOU_API_KEY` - You.com search API key
- `GITHUB_PAT` - GitHub personal access token
- And others as documented in wrangler.jsonc

### Security Scanning

This project uses multiple security scanning tools:

1. **CodeQL** - Static code analysis for security vulnerabilities
2. **Semgrep** - Security pattern detection and secret scanning
3. **TruffleHog** - Secret scanning with verification
4. **Gitleaks** - Git secret scanner
5. **Trivy** - Container vulnerability scanner
6. **Snyk** - Dependency vulnerability scanning

### Recent Security Fixes

#### 2026-02-21: Security Patch Release
- ✅ Removed dangerous config logging that exposed all API keys
- ✅ Fixed token exposure in CLI arguments (now uses environment only)
- ✅ Sanitized excessive debug logging
- ✅ Enhanced .gitignore to prevent accidental secret commits

## Security Configuration Guidelines

### 1. Gateway Token Security

The gateway token is now passed via environment variable only:

```bash
# DO: Set token via environment/config
wrangler secret put CLAWDBOT_GATEWAY_TOKEN

# DON'T: Pass token as CLI argument (INSECURE - visible in ps aux)
# clawdbot gateway --token "SECRET_TOKEN"  # NEVER DO THIS
```

### 2. Logging Security

Our logging has been sanitized to prevent secret exposure:

```typescript
// DO: Log without sensitive data
console.log('[REQ] Processing request');

// DON'T: Log sensitive information
// console.log('[REQ] Has API key:', !!env.API_KEY);  // Aids reconnaissance
// console.log('Config:', JSON.stringify(config));     // Exposes all secrets
```

### 3. Container Security

- Keep base images updated
- Use minimal base images (Alpine when possible)
- Scan containers regularly with Trivy
- Follow principle of least privilege

### 4. Access Control

- Enable Cloudflare Access for all protected routes
- Use strong, unique tokens for authentication
- Implement proper CORS policies
- Validate all input data

## Security Checklist for Contributors

Before submitting a PR, verify:

- [ ] No secrets committed in code
- [ ] No secrets in comments or documentation
- [ ] Secrets use environment variables
- [ ] Logging doesn't expose sensitive data
- [ ] New dependencies scanned for vulnerabilities
- [ ] Tests don't contain hardcoded credentials
- [ ] `.gitignore` updated for new sensitive files

## Automated Security Checks

Our CI/CD pipeline includes:

- **Pre-commit**: Secret scanning before commits
- **PR Checks**: CodeQL, Semgrep, dependency scanning
- **Daily Scans**: Comprehensive security audit at 3 AM UTC
- **Container Scans**: Every push to main/develop

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Cloudflare Security Best Practices](https://developers.cloudflare.com/security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-21 | Initial security policy |
| 1.1 | 2026-02-21 | Security patch - removed config logging, fixed token exposure |

## Contact

For security concerns, contact: **luvlogic-ai@proton.me**

---

**Remember**: Security is everyone's responsibility. If you see something, say something.
