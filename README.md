# steady-submit

A simple script to submit daily data to [Steady](https://app.steady.space).

I use a markdown file to track my daily tasks and accomplishments. This script reads that file and submits my check-in to Steady.

## Getting started

### Prerequisites

You need to have a Steady account and a markdown file with your daily tasks and accomplishments.

Your markdown file should have the following format:

> [!NOTE] The headings are case-sensitive, but don't have to be exact; e.g., `## Today` and `# Today/Doing` are both valid.

```markdown
## Today

… or something with "Today" in it — this is the list of tasks you want to submit for the previous day

- Task 1
- Task 2

## Done

… or anything with "Done" in it — this is the list of tasks you completed

- Task 1
- Task 2

## Archive

… or any other heading, so long as it doesn't contain "Today" or "Done"

This is the list of tasks you completed in the past and don't want to submit.

- Old task 1
- Old task 2
- Old task 3
```

I use [Obsidian](https://obsidian.md) along with the [Kanban plugin](https://github.com/mgmeyers/obsidian-kanban) to manage my tasks. The plugin creates a markdown file with the above format.

### Running the script

- Run `npm install`
- Set dotenv variables in `.env` file (see `.env.example`).
- Run `npm run start` to submit today's data.
  - See `npm run start -- --help` for options.
