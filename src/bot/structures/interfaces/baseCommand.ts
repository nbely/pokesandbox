import IButtonCommand from "./buttonCommand";
import IMessageCommand from "./messageCommand";
import IMessageContextCommand from "./messageContextCommand";
import IModalForm from "./modalForm";
import IRoleSelectMenu from "./roleSelectMenu";
import ISlashCommand from "./slashCommand";
import IStringSelectMenu from "./stringSelectMenu";
import IUserContextCommand from "./userContextCommand";
import IUserSelectMenu from "./userSelectMenu";

export default interface IBaseCommand {
  allClientPermissions?: string[];
  allUserPermissions?: string[];
  anyClientPermissions?: string[];
  anyUserPermissions?: string[];
  channelCooldown?: number;
  globalCooldown?: number;
  guildCooldown?: number;
  ignore?: boolean;
  name: string;
  onlyChannels?: string[];
  onlyGuilds?: string[];
  onlyRoles?: string[] | ((guildId: string) => Promise<string[]>);
  onlyRolesOrAnyUserPermissions?: boolean;
  onlyUsers?: string[];
  ownerOnly?: boolean;
  returnAllClientPermissionsError?: boolean;
  returnAllUserPermissionsError?: boolean;
  returnAnyClientPermissionsError?: boolean;
  returnAnyUserPermissionsError?: boolean;
  returnChannelCooldownError?: boolean;
  returnErrors?: boolean;
  returnGlobalCooldownError?: boolean;
  returnGuildCooldownError?: boolean;
  returnOnlyChannelsError?: boolean;
  returnOnlyGuildsError?: boolean;
  returnOnlyRolesError?: boolean;
  returnOnlyUsersError?: boolean;
  returnOwnerOnlyError?: boolean;
}

export type AnyCommand =
  | IButtonCommand
  | IMessageCommand
  | IMessageContextCommand
  | IModalForm
  | IRoleSelectMenu
  | ISlashCommand
  | IStringSelectMenu
  | IUserContextCommand
  | IUserSelectMenu;
