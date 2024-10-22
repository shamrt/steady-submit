import dotenv from 'dotenv';

import { checkIn } from './checkIn.js';
import { processTasksMarkdown } from './processTasksMarkdown.js';

dotenv.config();

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

  const tasks = await processTasksMarkdown(TASKS_MD_PATH);

  await checkIn({
    credentials: { email: STEADY_EMAIL, password: STEADY_PASSWORD },
    tasks,
  });
};

main();
