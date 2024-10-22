import fs from 'fs/promises';
import { Heading, List } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import path from 'path';

const OBSIDIAN_VAULT_PATH = '/Users/smartin/sync-common/apps/Obsidian/Vault';
const KANBAN_FILE = path.join(OBSIDIAN_VAULT_PATH, 'Vantage', 'Kanban.md');

const fromGfm = (markdown: string) =>
  fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });

const main = async () => {
  const kanbanMd = await fs.readFile(KANBAN_FILE, 'utf-8');
  const kanbanAst = fromGfm(kanbanMd);

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
  console.log(completeList.children[0]);
};

main();
