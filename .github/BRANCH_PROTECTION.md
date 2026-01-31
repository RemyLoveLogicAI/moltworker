# Branch Protection Setup

This document outlines the recommended branch protection rules for the main branch.

## Required Settings (Manual Configuration)

Repository administrators must configure these settings in GitHub:

1. Go to Repository Settings > Branches > Branch protection rule
2. Add rule for `main` branch
3. Enable the following settings:

### Required Status Checks
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- [x] Required status checks:
  - `Type check` (from workflow)
  - `Run tests` (from workflow)

### Additional Protections
- [x] Require pull request reviews before merging
  - Number of required reviewers: 1
  - [x] Dismiss stale PR approvals when new commits are pushed
  - [x] Require review from CODEOWNERS

- [x] Restrict pushes that create files
- [x] Do not allow bypassing the above settings

## Automation

These protections ensure:
- All code passes tests and type checking
- Code is reviewed before merging
- PRs stay up-to-date with main branch
- CODEOWNERS must approve changes they own

## Alternative: GitHub CLI Setup

```bash
# Install GitHub CLI if not already installed
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh

# Authenticate
gh auth login

# Set up branch protection
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Type check","Run tests"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null
```