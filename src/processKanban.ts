import fs from 'fs/promises';
import { toHtml } from 'hast-util-to-html';
import { Heading, List } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { toHast } from 'mdast-util-to-hast';
import { gfm } from 'micromark-extension-gfm';
import { MdastNodes } from 'node_modules/mdast-util-to-hast/lib/state.js';
import path from 'path';

import { Tasks } from './types/Tasks.js';

const OBSIDIAN_VAULT_PATH = '/Users/smartin/sync-common/apps/Obsidian/Vault';
const KANBAN_FILE = path.join(OBSIDIAN_VAULT_PATH, 'Vantage', 'Kanban.md');

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

export const processKanban = async (): Promise<Tasks> => {
  const kanbanMd = await fs.readFile(KANBAN_FILE, 'utf-8');
  const kanbanAst = fromGfm(kanbanMd);

  // Yesterday
  const doneHeading = kanbanAst.children.find(
    (node) =>
      node.type === 'heading' &&
      node.children[0].type === 'text' &&
      node.children[0].value === 'Done',
  ) as Heading;
  const completeList = kanbanAst.children.find(
    (node) =>
      node.position &&
      doneHeading.position &&
      node.position.start.line > doneHeading.position.start.line &&
      node.type === 'list' &&
      node.ordered === false,
  ) as List;

  // Today
  const todayHeading = kanbanAst.children.find(
    (node) =>
      node.type === 'heading' &&
      node.children[0].type === 'text' &&
      node.children[0].value.includes('Today'),
  ) as Heading;
  const todayList = kanbanAst.children.find(
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
