import {
  fromGfm,
  processTasksMarkdown,
  toGfmHtml,
} from './processTasksMarkdown.js';

const MD_SECTION_SEPARATOR = '\n\n';

const createGfmTaskList = ({
  tasksCount,
  isCompleted = false,
}: {
  tasksCount: number;
  isCompleted?: boolean;
}) =>
  Array.from(
    { length: tasksCount },
    (_, i) => `- [${isCompleted ? 'x' : ''}] Task ${i + 1}`,
  ).join('\n');

type CreateTasksMd = {
  title: string;
  headingDepth?: number;
  tasksCount?: number;
  isCompleted?: boolean;
};

const createTasksSectionMd = ({
  title,
  headingDepth = 2,
  tasksCount = 3,
  isCompleted = false,
}: CreateTasksMd) =>
  [
    [`${'#'.repeat(headingDepth)} ${title}`],
    createGfmTaskList({ tasksCount, isCompleted }),
  ].join(MD_SECTION_SEPARATOR);

const createTodayTasksMd = ({
  tasksCount = 3,
  headingDepth = 2,
}: Partial<CreateTasksMd> = {}) =>
  createTasksSectionMd({
    title: 'Today',
    headingDepth,
    tasksCount,
    isCompleted: false,
  });

const createDoneTasksMd = ({
  tasksCount = 3,
  headingDepth = 2,
}: Partial<CreateTasksMd> = {}) =>
  createTasksSectionMd({
    title: 'Done',
    headingDepth,
    tasksCount,
    isCompleted: true,
  });

const mdToHtml = (markdown: string) => toGfmHtml(fromGfm(markdown));

describe('processTasksMarkdown', () => {
  describe('when simplified mode disabled', () => {
    it("extract yesterday's completed tasks", async () => {
      const markdown = [createTodayTasksMd(), createDoneTasksMd()].join(
        MD_SECTION_SEPARATOR,
      );

      const tasks = processTasksMarkdown(markdown);

      const expectedTodayMd = createGfmTaskList({ tasksCount: 1 });
      const expectedToday = mdToHtml(expectedTodayMd);

      const expectedYesterdayMd = [
        createGfmTaskList({ tasksCount: 3, isCompleted: true }),
        createGfmTaskList({ tasksCount: 1 }),
      ].join('\n');
      const expectedYesterday = mdToHtml(expectedYesterdayMd);

      expect(tasks).toEqual({
        today: expectedToday,
        yesterday: expectedYesterday,
      });
    });

    it("extract only today's first task for yesterday if no tasks are completed #bugfix", async () => {
      const markdown = [
        createTodayTasksMd(),
        createDoneTasksMd({ tasksCount: 0 }),
        createTasksSectionMd({ title: 'Archived', tasksCount: 0 }),
      ].join(MD_SECTION_SEPARATOR);

      const tasks = processTasksMarkdown(markdown);

      const expectedTodayMd = createGfmTaskList({ tasksCount: 1 });
      const expectedToday = mdToHtml(expectedTodayMd);

      expect(tasks).toEqual({
        today: expectedToday,
        yesterday: expectedToday,
      });
    });
  });

  describe('when using simplified mode enabled', () => {
    it('does NOT add the first task from the "Today" tasks list to the "Done" tasks list', async () => {
      const markdown = [createTodayTasksMd(), createDoneTasksMd()].join(
        MD_SECTION_SEPARATOR,
      );

      const tasks = processTasksMarkdown(markdown, { simplified: true });

      const expectedTodayMd = createGfmTaskList({ tasksCount: 1 });
      const expectedToday = mdToHtml(expectedTodayMd);

      const expectedYesterdayMd = createGfmTaskList({
        tasksCount: 3,
        isCompleted: true,
      });
      const expectedYesterday = mdToHtml(expectedYesterdayMd);

      expect(tasks).toEqual({
        today: expectedToday,
        yesterday: expectedYesterday,
      });
    });

    it('extract nothing for yesterday if no tasks are completed', async () => {
      const markdown = [
        createTodayTasksMd(),
        createDoneTasksMd({ tasksCount: 0 }),
        createTasksSectionMd({ title: 'Archived', tasksCount: 0 }),
      ].join(MD_SECTION_SEPARATOR);

      const tasks = processTasksMarkdown(markdown, { simplified: true });

      const expectedTodayMd = createGfmTaskList({ tasksCount: 1 });
      const expectedToday = mdToHtml(expectedTodayMd);

      expect(tasks).toEqual({
        today: expectedToday,
        yesterday: null,
      });
    });
  });
});
