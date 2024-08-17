import { ButtonStyle, Role } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";

const setUpdateRolesComponents = (
  menu: AdminMenu,
  roleIds: string[],
  roles: (string | Role)[] | undefined
): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    buttons: roleIds.map((_, index) => {
      const roleName: string =
        typeof roles?.[index] !== "string"
          ? (roles?.[index] as Role).name
          : (roles?.[index] as string);
      return menu.createButton(
        `Remove [${roleName}]`,
        ButtonStyle.Danger,
        index
      );
    }),
    fixedEndButtons: [],
    fixedStartButtons: [menu.createButton("Add Role", ButtonStyle.Success)],
  };
};

export default setUpdateRolesComponents;
