import { ButtonStyle, type Role } from 'discord.js';

import type { AdminMenuBuilder } from '@bot/classes';

const setUpdateRolesComponents = (
  menu: AdminMenuBuilder,
  roleIds: string[],
  roles: (string | Role)[] | undefined
): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    buttons: roleIds.map((_, index) => {
      const roleName: string =
        typeof roles?.[index] !== 'string'
          ? (roles?.[index] as Role).name
          : (roles?.[index] as string);
      return menu.createButton(
        `Remove [${roleName}]`,
        ButtonStyle.Danger,
        index
      );
    }),
    fixedEndButtons: [],
    fixedStartButtons: [menu.createButton('Add Role', ButtonStyle.Success)],
  };
};

export default setUpdateRolesComponents;
