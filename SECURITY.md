# Security

## Branch Protection

The `main` branch is protected with the following rules:

- **Required pull request reviews**: At least 1 approval before merging
- **Dismiss stale reviews**: Reviews are dismissed when new commits are pushed
- **Required status checks**: `lint`, `typecheck`, and `build` must pass
- **Strict status checks**: Branches must be up-to-date with `main`
- **Enforce for admins**: Yes
- **Direct pushes**: Blocked

All changes must go through a pull request.
