import { RoleSelectMenuBuilder } from "discord.js";

import IRoleSelectMenu from "@structures/interfaces/roleSelectMenu";

const AddAdminRoleMenu: IRoleSelectMenu = {
  name: "server_add-admin-role",
  create: () => {
    return new RoleSelectMenuBuilder()
    .setCustomId("server_add-admin-role")
    .setPlaceholder("Choose a Role to Add");
  },
};

export default AddAdminRoleMenu;
