# Using Changesets for Version Management

This project uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation.

## Workflow

### 1. Making Changes

After making changes to the codebase:

```bash
npm run changeset
```

This will prompt you to:
- Select the type of change (major, minor, or patch)
- Provide a summary of the changes

This creates a changeset file in `.changeset/` directory.

### 2. Version Bumping

When ready to release, run:

```bash
npm run version
```

This will:
- Consume all changeset files
- Update the version in `package.json`
- Update the `CHANGELOG.md`
- Delete the consumed changeset files

### 3. Publishing

To publish to npm:

```bash
npm run release
```

This will:
- Build the project
- Publish to npm with the new version

## Change Types

- **patch**: Bug fixes and small changes (1.0.0 → 1.0.1)
- **minor**: New features, backwards compatible (1.0.0 → 1.1.0)
- **major**: Breaking changes (1.0.0 → 2.0.0)

## Example Workflow

```bash
# 1. Make your code changes
vim src/index.ts

# 2. Run tests
npm test

# 3. Create a changeset
npm run changeset
# Select "patch" for bug fixes, "minor" for features
# Write: "Fix image size calculation for large files"

# 4. Commit your changes including the changeset file
git add .
git commit -m "Fix image size calculation"

# 5. When ready to release (usually on main branch)
npm run version
git commit -am "Version bump"

# 6. Publish
npm run release
git push --follow-tags
```

## Benefits

- Automated version bumping based on semantic versioning
- Automatic CHANGELOG.md generation
- Clear documentation of what changed in each release
- Team members can document their changes as they work
