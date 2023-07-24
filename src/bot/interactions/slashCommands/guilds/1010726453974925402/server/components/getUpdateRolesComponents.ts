import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Role } from "discord.js";

import { AdminMenu } from "@bot/classes/adminMenu";
import ServerOption from "@bot/interactions/buttons/server/option";
import paginateButtons from "@bot/utils/paginateButtons";

const getUpdateRolesComponents = (
  menu: AdminMenu,
  roleIds: string[],
  roles: (string | Role)[] | undefined,
): ActionRowBuilder<ButtonBuilder>[] => {
  const fixedStartButtons: ButtonBuilder[] = [
    ServerOption.create({ label: "Add Role", style: ButtonStyle.Success }),
  ];

  const fixedEndButtons: ButtonBuilder[] = [
    ServerOption.create({ label: "Back", style: ButtonStyle.Secondary }),
    ServerOption.create({ label: "Cancel", style: ButtonStyle.Secondary }),
  ];

  const removeRoleButtons: ButtonBuilder[] = roleIds.map((roleId, index) => {
    const roleName: string =
      typeof roles?.[index] !== "string"
        ? (roles?.[index] as Role).name
        : (roles?.[index] as string);
    return ServerOption.create({
      label: `Remove [${roleName}]`,
      style: ButtonStyle.Danger,
      id: index,
    });
  });

  return paginateButtons(
    removeRoleButtons,
    menu.currentPage,
    fixedStartButtons,
    fixedEndButtons,
  );
};

export default getUpdateRolesComponents;
