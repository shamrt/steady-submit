import { format } from 'date-fns';
import puppeteer from 'puppeteer';

import { Credentials } from './types/Credentials.js';
import { Tasks } from './types/Tasks.js';

const STEADY_URL = 'https://app.steady.space';

export const checkIn = async ({
  credentials,
  date = new Date(),
  tasks,
  metGoals = false,
  mood,
}: {
  credentials: Credentials;
  date: Date;
  tasks: Tasks;
  metGoals?: boolean;
  mood: string;
}) => {
  if (!tasks.today) {
    throw new Error('Must at least provide task definitions for today');
  }

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.emulateTimezone('America/Toronto');

  await page.goto(
    `${STEADY_URL}/signin?user[email]=${encodeURIComponent(credentials.email)}`,
  );

  // Login
  await page.waitForSelector('button[type="submit"]');
  await page.locator('input[name="user[password]"]').fill(credentials.password);
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => {
    return (
      window.location.href.includes('/users/remember_me') ||
      window.location.href.includes('/digest')
    );
  });

  // Check in
  const shortDate = format(date, 'yyyy-MM-dd');

  const checkInUrl = `${STEADY_URL}/check-ins/${shortDate}/edit`;
  await page.goto(checkInUrl);

  // Add yesterday's tasks
  // NOTE: These can be empty
  if (tasks.yesterday) {
    const PREV_TASK_SELECTOR = '#question_previous .ProseMirror';
    await page.waitForSelector(PREV_TASK_SELECTOR);
    await page.evaluate<
      [string, string],
      (selector: string, tasksHtml: string) => void
    >(
      (selector, tasksHtml) => {
        const previousTaskElement = document.querySelector(selector);
        previousTaskElement?.setHTMLUnsafe(tasksHtml);
      },
      PREV_TASK_SELECTOR,
      tasks.yesterday,
    );
  }

  // Add today's tasks
  const NEXT_TASK_SELECTOR = '#question_next .ProseMirror';
  await page.waitForSelector(NEXT_TASK_SELECTOR);
  await page.evaluate<
    [string, string],
    (selector: string, tasks: string) => void
  >(
    (selector, tasks) => {
      const nextTaskElement = document.querySelector(selector);
      nextTaskElement?.setHTMLUnsafe(tasks);
    },
    NEXT_TASK_SELECTOR,
    tasks.today,
  );

  // Wait for the next task field to be populated
  await page.waitForFunction<[string]>(
    (selector) => {
      const nextTaskElement = document.querySelector(selector);
      return (
        nextTaskElement?.textContent && nextTaskElement.textContent.length > 0
      );
    },
    undefined,
    NEXT_TASK_SELECTOR,
  );

  // Check the box for met goals, but only after the check-in is complete
  // so the previous day's check-in is not auto-completed.
  if (metGoals) {
    await page.click('#answer_set_previous_completed');
  }

  await page.click(`#question_mood label[for="feeling-${mood}"]`);

  await page.click('.submit button[type="submit"]');

  await page.waitForSelector('::-p-text(Daily digest)');

  // Return to the check-in page in case we want to edit it
  await page.goto(checkInUrl);
};
