import { toHtml } from 'hast-util-to-html';
import { Heading, List, Root } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { toHast } from 'mdast-util-to-hast';
import { gfm } from 'micromark-extension-gfm';
import { MdastNodes } from 'node_modules/mdast-util-to-hast/lib/state.js';

import { Tasks } from './types/Tasks.js';

/** Convert markdown to MDAST */
export const fromGfm = (markdown: string) =>
  fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });

/** Convert MDAST to HTML */
export const toGfmHtml = (tree: MdastNodes) => {
  const hast = toHast(tree);
  const html = toHtml(hast);
  return html;
};

const extractCompletedTasks = (tasksAst: Root) => {
  const doneHeading = tasksAst.children.find(
    (node) =>
      node.type === 'heading' &&
      node.children[0].type === 'text' &&
      node.children[0].value.includes('Done'),
  ) as Heading;
  const doneHeadingIndex = tasksAst.children.findIndex(
    (node) =>
      node.type === 'heading' &&
      node.children[0].type === 'text' &&
      node.children[0].value.includes('Done'),
  );
  const nextHeadingIndex = tasksAst.children.findIndex(
    (node, index) =>
      index > doneHeadingIndex &&
      node.type === 'heading' &&
      node.depth <= doneHeading.depth,
  );
  const doneSection = tasksAst.children.slice(
    doneHeadingIndex,
    nextHeadingIndex === -1 ? undefined : nextHeadingIndex,
  );
  const completeList = doneSection.find(
    (node) =>
      node.position &&
      doneHeading.position &&
      node.position.start.line > doneHeading.position.start.line &&
      node.type === 'list' &&
      node.ordered === false,
  ) as List;
  return completeList || ({ type: 'list', children: [] } as List);
};

export const processTasksMarkdown = (
  tasksMd: string,
  { simplified = false }: { simplified?: boolean } = {},
): Tasks => {
  const tasksAst = fromGfm(tasksMd);

  // Today
  const todayHeading = tasksAst.children.find(
    (node) =>
      node.type === 'heading' &&
      node.children[0].type === 'text' &&
      node.children[0].value.includes('Today'),
  ) as Heading;
  const todayList = tasksAst.children.find(
    (node) =>
      node.position &&
      todayHeading.position &&
      node.position.start.line > todayHeading.position.start.line &&
      node.type === 'list' &&
      node.ordered === false,
  ) as List;
  const firstTaskOfToday = todayList.children[0];

  // Yesterday
  const completeList = extractCompletedTasks(tasksAst);

  if (!simplified) {
    // We assume we worked, at least a little bit, on today's first task, so we
    // include it in the list of completed tasks
    completeList.children.push(firstTaskOfToday);
  }

  const tasks = {
    yesterday:
      completeList.children.length > 0 ? toGfmHtml(completeList) : null,
    // We only care about the first list item in the Today list
    today: ['<ul>', toGfmHtml(firstTaskOfToday), '</ul>'].join('\n'),
  };

  return tasks;
};
