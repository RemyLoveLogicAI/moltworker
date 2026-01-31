# Release Strategy

This document outlines the version release strategy for the Moltbot Worker project.

## Versioning

We use [Semantic Versioning](https://semver.org/) (SemVer) for versioning our releases:

- **MAJOR**: Breaking changes that require users to update their configuration or code
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes that are backward compatible

## Current Version

The current version is defined in `package.json` and follows the format `X.Y.Z`.

## Release Process

### Manual Releases (Current)

Since this is a Cloudflare Worker project, releases are currently managed manually:

1. Update version in `package.json`
2. Update CHANGELOG.md with release notes
3. Commit the version bump: `git commit -m "chore: bump version to X.Y.Z"`
4. Tag the release: `git tag vX.Y.Z`
5. Push both commits and tags: `git push && git push --tags`
6. Deploy to Cloudflare: `npm run deploy`

### Commit Message Guidelines

We use conventional commits that help determine version bumps:

- `feat:` - Triggers MINOR version bump
- `fix:` - Triggers PATCH version bump  
- `feat!:`, `fix!:`, `refactor!:` - Triggers MAJOR version bump
- `BREAKING CHANGE:` in footer - Triggers MAJOR version bump

### Release Notes Template

When creating a release, follow this template:

```markdown
## vX.Y.Z - YYYY-MM-DD

### Added
- New feature description (#123)

### Changed
- Changed behavior (#124)

### Deprecated
- Feature that will be removed in future (#125)

### Removed
- Removed feature (#126)

### Fixed
- Bug fix description (#127)

### Security
- Security fix description (#128)
```

## Automated Releases (Future)

For automated releases, we can implement semantic-release:

### Setup (Optional)

```bash
npm install --save-dev semantic-release @semantic-release/github @semantic-release/changelog
```

Add to package.json:
```json
{
  "release": {
    "branches": ["main"],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/changelog",
      "@semantic-release/github"
    ]
  }
}
```

### GitHub Actions (Optional)

```yaml
name: Release
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Deployment Strategy

### Environments

- **Production**: Deployed to Cloudflare Workers via `npm run deploy`
- **Development**: Local development via `npm run start`

### Deployment Steps

1. Ensure all tests pass
2. Update version number
3. Build the project: `npm run build`
4. Deploy to Cloudflare: `npm run deploy`
5. Verify deployment works correctly

## Rollback Strategy

If a deployment causes issues:

1. Roll back by deploying the previous version tag
2. Document the issue and fix in a patch release
3. Deploy the patch release

## Version Compatibility

### Compatibility Matrix

| Version | Cloudflare Workers | Node.js | Breaking Changes |
|---------|-------------------|---------|------------------|
| 1.x.x   | ✅                | 18+     | N/A              |

### Migration Guides

For major releases, provide migration guides in:
- `docs/migration/vX.Y.Z.md`
- Release notes on GitHub

## Changelog

Maintain `CHANGELOG.md` with all notable changes:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TBA

## [1.0.0] - 2024-01-XX

### Added
- Initial release
- Moltbot gateway proxying
- Admin UI
- Device management API
```