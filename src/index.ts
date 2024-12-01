import { parse, subDays } from 'date-fns';
import dotenv from 'dotenv';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import { checkIn } from './checkIn.js';
import { processTasksMarkdown } from './processTasksMarkdown.js';

dotenv.config();

const now = new Date();
const argv = yargs(hideBin(process.argv))
  .options({
    y: {
      type: 'boolean',
      default: false,
      alias: 'yesterday',
      description: 'Check in for yesterday (overridden by --date)',
    },
    d: {
      type: 'string',
      alias: 'date',
      description: 'Check in for a specific date (YYYY-MM-DD)',
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
      type: 'boolean',
      default: false,
      alias: 'metGoals',
      description: 'Check box for met goals',
    },
    s: {
      type: 'boolean',
      default: false,
      alias: 'simplified',
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

  const tasks = await processTasksMarkdown(TASKS_MD_PATH, {
    simplified: argv.s,
  });

  await checkIn({
    credentials: { email: STEADY_EMAIL, password: STEADY_PASSWORD },
    date: getDate(),
    tasks,
    metGoals: argv.g,
  });
};

main();
