import { RoleSelectMenuBuilder } from 'discord.js';

import type { IRoleSelectMenu } from '@bot/structures/interfaces';

export const AddServerRoleMenu: IRoleSelectMenu = {
  name: 'server_add-role',
  create: () => {
    return new RoleSelectMenuBuilder()
      .setCustomId('server_add-role')
      .setPlaceholder('Choose a Role to Add');
  },
};
