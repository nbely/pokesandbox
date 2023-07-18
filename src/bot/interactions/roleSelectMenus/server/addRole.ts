import { RoleSelectMenuBuilder } from "discord.js";

import IRoleSelectMenu from "@structures/interfaces/roleSelectMenu";

const AddRoleMenu: IRoleSelectMenu = {
  name: "server_add-role",
  create: () => {
    return new RoleSelectMenuBuilder()
    .setCustomId("server_add-role")
    .setPlaceholder("Choose a Role to Add");
  },
};

export default AddRoleMenu;
