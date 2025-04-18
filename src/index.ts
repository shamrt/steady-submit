import { parse, subDays } from 'date-fns';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import { checkIn } from './checkIn.js';
import { processTasksMarkdown } from './processTasksMarkdown.js';

dotenv.config();

const now = new Date();
const argv = yargs(hideBin(process.argv))
  .options({
    y: {
      alias: 'yesterday',
      description: 'Check in for yesterday (overridden by --date)',
      type: 'boolean',
      default: false,
    },
    d: {
      alias: 'date',
      description: 'Check in for a specific date (YYYY-MM-DD)',
      type: 'string',
      coerce: (d: string) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          throw new Error(
            `Invalid format provided for --date. Received: ${d}. Expected: YYYY-MM-DD`,
          );
        }

        return parse(d, 'yyyy-MM-dd', now);
      },
    },
    g: {
      alias: 'metGoals',
      type: 'boolean',
      default: false,
      description: 'Check box for met goals',
    },
    m: {
      alias: 'mood',
      description:
        'Mood to check in with. See Steady check-in form for options.',
      type: 'string',
      default: 'nerdy',
    },
    s: {
      alias: 'simplified',
      type: 'boolean',
      default: false,
      description:
        "Submit tasks in simplified form, as they are in the markdown file, without including today's first task in yesterday's completed tasks.",
    },
  })
  .strict()
  .parseSync();

const getDate = () => {
  if (argv.d) {
    return argv.d;
  }

  const date = argv.y ? subDays(now, 1) : now;
  return date;
};

const main = async () => {
  const { STEADY_EMAIL, STEADY_PASSWORD, TASKS_MD_PATH } = process.env;

  if (typeof STEADY_EMAIL !== 'string') {
    throw new Error('Missing STEADY_EMAIL in dotenv file');
  }
  if (typeof STEADY_PASSWORD !== 'string') {
    throw new Error('Missing STEADY_PASSWORD in dotenv file');
  }
  if (typeof TASKS_MD_PATH !== 'string') {
    throw new Error('Missing TASKS_MD_PATH in dotenv file');
  }

  const tasksMd = await fs.readFile(TASKS_MD_PATH, 'utf-8');
  const tasks = processTasksMarkdown(tasksMd, {
    simplified: argv.s,
  });

  await checkIn({
    credentials: { email: STEADY_EMAIL, password: STEADY_PASSWORD },
    date: getDate(),
    tasks,
    metGoals: argv.g,
    mood: argv.m,
  });
};

main();
