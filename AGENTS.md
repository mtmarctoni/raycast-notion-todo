# Code style

## Commit convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

Format: `<type>(<scope>): <description>`

| Type       | Usage                                      |
| ---------- | ------------------------------------------ |
| `feat`     | New feature                                |
| `fix`      | Bug fix                                    |
| `docs`     | Documentation only                         |
| `refactor` | Code restructuring (no behavior change)    |
| `style`    | Formatting, whitespace (no logic change)   |
| `test`     | Adding or fixing tests                     |
| `chore`    | Tooling, dependencies, CI                  |
| `perf`     | Performance improvement                    |

Hooks enforce this via `husky` + `commitlint`. Use `git commit` as normal -- linting runs automatically.
