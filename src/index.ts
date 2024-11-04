import { subDays } from 'date-fns';
import dotenv from 'dotenv';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import { checkIn } from './checkIn.js';
import { processTasksMarkdown } from './processTasksMarkdown.js';

dotenv.config();

const main = async () => {
  const argv = yargs(hideBin(process.argv))
    .options({
      y: {
        type: 'boolean',
        default: false,
        alias: 'yesterday',
        description: 'Check in for yesterday',
      },
      g: {
        type: 'boolean',
        default: false,
        alias: 'metGoals',
        description: 'Check box for met goals',
      },
    })
    .strict()
    .parseSync();

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

  const tasks = await processTasksMarkdown(TASKS_MD_PATH);
  const now = new Date();
  const date = argv.y ? subDays(now, 1) : now;

  await checkIn({
    credentials: { email: STEADY_EMAIL, password: STEADY_PASSWORD },
    date,
    tasks,
    metGoals: argv.g,
  });
};

main();
