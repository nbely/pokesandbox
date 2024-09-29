import type { AdminMenu } from '@bot/classes';
import { upsertServer } from '@shared/services';

import getServerMenuEmbed from '../embeds/getServerMenuEmbed';

const handleAddPrefix = async (menu: AdminMenu): Promise<void> => {
  menu.prompt =
    'Please enter a new prefix to use with this bot on your server.';
  menu.components = [];
  menu.embeds = [getServerMenuEmbed(menu)];

  await menu.updateEmbedMessage();

  try {
    const response = await menu.awaitMessageReply(600_000);

    if (!menu.server.prefixes?.includes(response)) {
      menu.server.prefixes = [...menu.server.prefixes, response];
      await upsertServer({ serverId: menu.server.serverId }, menu.server);
      menu.prompt = `Successfully added the prefix: \`${response}\``;
    } else {
      menu.prompt = 'Oops! The entered prefix already exists for this server.';
    }
  } catch (error) {
    await menu.handleError(error);
  }
};

export default handleAddPrefix;
