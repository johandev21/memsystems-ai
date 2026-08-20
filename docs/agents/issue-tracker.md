# Issue tracker: GitHub

Issues and specs for this repository live in GitHub Issues under `johandev21/memsystems-ai`. Use the `gh` CLI for all operations and infer the repository from the current checkout.

## Conventions

- Create issues with `gh issue create`.
- Read complete issues and comments with `gh issue view <number> --comments`.
- List issues with `gh issue list` and request JSON fields when filtering is needed.
- Comment with `gh issue comment`, edit labels with `gh issue edit`, and close with `gh issue close`.
- Pull requests are not treated as an incoming triage request surface.

GitHub shares one number space across issues and pull requests. Resolve ambiguous references before acting.

## Publishing

When an engineering skill says to publish a spec or ticket, create a GitHub issue. Apply the mapped `ready-for-agent` label when the artifact is ready for implementation.

## Blocking relationships

Use GitHub's native issue dependencies when available. Add a blocking edge through the issue-dependencies API using the blocker's numeric database ID, not its issue number or node ID. If native dependencies are unavailable, add a `Blocked by: #<number>` section to the dependent issue. A ticket is actionable only when every blocker is closed.

Do not close or modify a parent issue while publishing child implementation tickets.
