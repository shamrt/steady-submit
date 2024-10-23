import puppeteer from 'puppeteer';

import { Credentials } from './types/Credentials.js';
import { Tasks } from './types/Tasks.js';

const STEADY_URL = 'https://app.steady.space';

export const checkIn = async ({
  credentials,
  date = new Date(),
  tasks,
}: {
  credentials: Credentials;
  date: Date;
  tasks: Tasks;
}) => {
  if (!tasks.yesterday || !tasks.today) {
    throw new Error('Must provide tasks for yesterday and today');
  }

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.emulateTimezone('America/Toronto');

  await page.goto(STEADY_URL);

  // Login
  await page.waitForSelector('input[name="user[email]"]');
  await page.locator('input[name="user[email]"]').fill(credentials.email);
  await page.locator('input[name="user[password]"]').fill(credentials.password);
  await page.click('button[type="submit"]');

  await page.waitForNavigation();
  await page.waitForSelector('h1');

  // Check in
  const shortDate = Intl.DateTimeFormat('default', {
    dateStyle: 'short',
  }).format(date);

  const checkInUrl = `${STEADY_URL}/check-ins/${shortDate}/edit`;
  await page.goto(checkInUrl);
  await page.waitForSelector('#question_previous_label');

  await page.evaluate<[Tasks], (tasks: Tasks) => void>((tasks) => {
    document
      .querySelector('#question_previous .ProseMirror')
      ?.setHTMLUnsafe(tasks.yesterday);
  }, tasks);

  await page.evaluate<[Tasks], (tasks: Tasks) => void>((tasks) => {
    document
      .querySelector('#question_next .ProseMirror')
      ?.setHTMLUnsafe(tasks.today);
  }, tasks);

  await page.click('#question_mood label[for="feeling-nerdy"]');

  await page.click('.questions button[type="submit"]');

  // Return to the check-in page in case we want to edit it
  await page.waitForNavigation();
  await page.goto(checkInUrl);
};
