import dotenv from 'dotenv';

import { checkIn } from './checkIn.js';
import { processKanban } from './processKanban.js';

dotenv.config();

const main = async () => {
  const { STEADY_EMAIL, STEADY_PASSWORD } = process.env;

  if (typeof STEADY_EMAIL !== 'string' || typeof STEADY_PASSWORD !== 'string') {
    throw new Error('Missing credentials in dotenv file');
  }

  const tasks = await processKanban();

  await checkIn({
    credentials: { email: STEADY_EMAIL, password: STEADY_PASSWORD },
    tasks,
  });
};

main();
