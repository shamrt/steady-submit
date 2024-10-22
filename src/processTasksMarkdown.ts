import fs from 'fs/promises';
import { toHtml } from 'hast-util-to-html';
import { Heading, List } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { toHast } from 'mdast-util-to-hast';
import { gfm } from 'micromark-extension-gfm';
import { MdastNodes } from 'node_modules/mdast-util-to-hast/lib/state.js';

import { Tasks } from './types/Tasks.js';

const fromGfm = (markdown: string) =>
  fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });

const toGfmHtml = (tree: MdastNodes) => {
  const hast = toHast(tree);
  const html = toHtml(hast);
  return html;
};

export const processTasksMarkdown = async (
  tasksMdPath: string,
): Promise<Tasks> => {
  const tasksMd = await fs.readFile(tasksMdPath, 'utf-8');
  const tasksAst = fromGfm(tasksMd);

  // Yesterday
  const doneHeading = tasksAst.children.find(
    (node) =>
      node.type === 'heading' &&
      node.children[0].type === 'text' &&
      node.children[0].value.includes('Done'),
  ) as Heading;
  const completeList = tasksAst.children.find(
    (node) =>
      node.position &&
      doneHeading.position &&
      node.position.start.line > doneHeading.position.start.line &&
      node.type === 'list' &&
      node.ordered === false,
  ) as List;

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

  const tasks = {
    yesterday: toGfmHtml(completeList),
    // We only care about the first list item in the Today list
    today: `<ul>${toGfmHtml(todayList.children[0])}</ul>`,
  };

  return tasks;
};
