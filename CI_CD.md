# CI/CD Configuration

This document outlines the comprehensive CI/CD workflows and configuration for Moltbot Worker.

## 🚀 CI/CD Architecture Overview

We've implemented a robust, multi-layered CI/CD pipeline with the following components:

### 📁 Workflow Files

| Workflow | Purpose | Triggers | Key Features |
|----------|---------|-----------|--------------|
| `ci.yml` | Continuous Integration | Push to main/develop, PRs, daily schedule | Multi-node testing, security scanning, container analysis |
| `cd.yml` | Continuous Deployment | Workflow completion, tags, manual | Multi-environment deployment, blue-green, canary, rollback |
| `security.yml` | Security & Compliance | Push, PRs, daily schedule | Vulnerability scanning, secret detection, compliance checks |
| `release.yml` | Release Management | Tags, PR merges, manual | Semantic versioning, Docker publishing, NPM releases |
| `environments.yml` | Environment Management | Manual, environment branches | Staging/production, backup/restore, health checks |
| `performance.yml` | Performance Monitoring | Push, PRs, 6-hourly schedule | Load testing, Lighthouse, regression detection |
| `backup.yml` | Backup & Disaster Recovery | Daily 4 AM, manual | Automated backups, disaster recovery, verification |
| `monitoring.yml` | Monitoring & Alerting | 5-minute schedule, manual | Uptime, performance, security, custom alerts |

## 🔧 Required Secrets

Configure these secrets in your GitHub repository:

### Core Infrastructure
- `CLOUDFLARE_API_TOKEN` - Production deployment token
- `CLOUDFLARE_API_TOKEN_STAGING` - Staging deployment token
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID

### Security & Monitoring
- `SNYK_TOKEN` - Snyk vulnerability scanning
- `SEMGREP_APP_TOKEN` - Semgrep security scanning
- `GITLEAKS_LICENSE` - Gitleaks secret scanning
- `SCORECARD_TOKEN` - OSSF Scorecard token

### Communication
- `SLACK_WEBHOOK_URL` - General notifications
- `SLACK_WEBHOOK_ALERTS` - Critical alerts
- `SLACK_WEBHOOK_SECURITY` - Security notifications
- `SLACK_WEBHOOK_PERFORMANCE` - Performance alerts
- `SLACK_WEBHOOK_BACKUPS` - Backup notifications
- `SLACK_WEBHOOK_REPORTS` - Daily reports

### External Services
- `LHCI_GITHUB_APP_TOKEN` - Lighthouse CI
- `UPTILABOT_TOKEN` - Uptime monitoring
- `NPM_TOKEN` - NPM publishing
- `AWS_ACCESS_KEY_ID` - AWS S3/R2 access
- `AWS_SECRET_ACCESS_KEY` - AWS S3/R2 secret

## 🌍 Environment Configuration

### Environments
1. **Development** (`env/development`)
   - Debug routes enabled
   - Development mode on
   - Hot reloading

2. **Staging** (`env/staging`)
   - Production-like environment
   - Debug routes enabled
   - Canary testing

3. **Production** (`env/production`)
   - Production configuration
   - Debug routes disabled
   - Performance optimized

### Deployment Strategies

#### Standard Deployment
```yaml
# Automatic on merge to main/develop
# Health checks and verification
# Rollback on failure
```

#### Blue-Green Deployment
```yaml
# For major releases (v* tags)
# Zero-downtime deployment
# Traffic switching capability
# Automatic rollback
```

#### Canary Deployment
```yaml
# 10% traffic testing
# Performance monitoring
- Gradual rollout
```

## 🔍 Quality Gates

### Pre-deployment Checks
- ✅ All tests passing (Node 20 & 22)
- ✅ Type checking (TypeScript)
- ✅ Security scan passing
- ✅ Code coverage > 80%
- ✅ No critical vulnerabilities
- ✅ Performance regression test

### Post-deployment Verification
- ✅ Health endpoint responding
- ✅ API endpoints functional
- ✅ Response time < 2s
- ✅ Error rate < 5%
- ✅ Uptime monitoring active

## 📊 Monitoring & Alerting

### Automated Monitoring
- **Uptime**: Every 5 minutes
- **Performance**: Every hour
- **Security**: Every 6 hours
- **Resources**: Every hour
- **Backups**: Daily at 4 AM UTC

### Alert Thresholds
- **Uptime**: < 99.9% triggers alert
- **Response Time**: > 2000ms triggers alert
- **Error Rate**: > 5% triggers alert
- **CPU Usage**: > 80% triggers alert
- **Memory Usage**: > 80% triggers alert

## 🛡️ Security & Compliance

### Security Scans
- **Dependencies**: npm audit + Snyk
- **Code**: CodeQL + Semgrep
- **Secrets**: TruffleHog + Gitleaks
- **Containers**: Trivy + Grype
- **Infrastructure**: Checkov

### Compliance Checks
- **License Compliance**: FOSSA scanning
- **OSSF Scorecard**: Security best practices
- **Security Scorecard**: Automated assessment

## 📦 Release Management

### Semantic Versioning
- `feat:` → Minor version bump
- `fix:` → Patch version bump
- `BREAKING CHANGE:` → Major version bump

### Release Process
1. **Tag** version (`v1.2.3`)
2. **Run** release workflow
3. **Build** multi-platform Docker images
4. **Publish** to NPM (if applicable)
5. **Deploy** to production
6. **Update** documentation

## 🔄 Backup Strategy

### Automated Backups
- **Full**: Daily complete backups
- **Incremental**: 6-hourly differential backups
- **Configuration**: Every deployment
- **Retention**: 30 days (90 days for DR)

### Disaster Recovery
- **RTO**: 15 minutes (Recovery Time Objective)
- **RPO**: 4 hours (Recovery Point Objective)
- **Verification**: Automated integrity checks
- **Rollback**: One-click emergency rollback

## 🎯 Performance Testing

### Load Testing
- **K6**: 100-200 concurrent users
- **Duration**: 15-30 minute tests
- **Metrics**: Response time, throughput, error rate

### Performance Audits
- **Lighthouse**: Performance, accessibility, best practices
- **Regression**: Comparison with baseline
- **Thresholds**: Performance score > 90

## 🚨 Incident Response

### Alert Levels
- **Info**: General information
- **Warning**: Performance degradation
- **Critical**: Service outage

### Escalation
1. **Primary**: Slack channel alerts
2. **Secondary**: Email notifications
3. **Tertiary**: PagerDuty (configurable)

## 🔧 Customization

### Adding New Workflows
1. Create new file in `.github/workflows/`
2. Follow naming convention: `purpose.yml`
3. Include proper secrets and permissions
4. Add appropriate notifications

### Modifying Thresholds
Edit environment variables in relevant workflow files:
- `ALERT_THRESHOLD_UPTIME`
- `ALERT_THRESHOLD_RESPONSE_TIME`
- `ALERT_THRESHOLD_ERROR_RATE`

## 📈 Metrics Collection

### Key Performance Indicators
- **Deployment Frequency**: Number of deployments per week
- **Lead Time**: Time from PR merge to deployment
- **MTTR**: Mean Time To Recovery
- **Change Failure Rate**: Percentage of deployments causing failures

### Monitoring Dashboards
- **GitHub Actions**: Workflow status and metrics
- **Slack**: Real-time alerts and reports
- **External**: UptimeRobot, Lighthouse CI

## 🎛️ Workflow Controls

### Manual Triggers
All workflows support `workflow_dispatch` with customizable inputs:
- Environment selection
- Test types
- Alert levels
- Custom parameters

### Environment Protection
- **Required reviewers**: CODEOWNERS
- **Status checks**: All CI pipelines must pass
- **Branch restrictions**: Protected main branch

## 📚 Best Practices

1. **Branch Management**: Use feature branches, merge to develop → main
2. **Commit Messages**: Follow conventional commits specification
3. **Testing**: Maintain >80% test coverage
4. **Security**: Address critical vulnerabilities within 24 hours
5. **Performance**: Monitor regression on every PR
6. **Documentation**: Update docs with every feature

## 🆘 Troubleshooting

### Common Issues
- **Permission Errors**: Check secret permissions
- **Rate Limiting**: Verify API token scopes
- **Timeouts**: Adjust workflow timeout values
- **Failures**: Check workflow logs and artifacts

### Debug Commands
```bash
# Check workflow status
gh run list --repo <owner/repo>

# View workflow logs
gh run view <run-id> --repo <owner/repo> --log

# Trigger workflow manually
gh workflow run <workflow-name> --repo <owner/repo> --field environment=staging
```

This comprehensive CI/CD setup ensures reliability, security, performance, and maintainability for the Moltbot Worker project.