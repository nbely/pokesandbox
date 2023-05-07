import IButtonCommand from "./buttonCommand";
import IMessageCommand from "./messageCommand";
import IMessageContextCommand from "./messageContextCommand";
import IModalForm from "./modalForm";
import ISlashCommand from "./slashCommand";
import IStringSelectMenu from "./stringSelectMenu";
import IUserContextCommand from "./userContextCommand";
import IUserSelectMenu from "./userSelectMenu";

export default interface IBaseCommand {
  allClientPermissions?: string[],
  allUserPermissions?: string[],
  anyClientPermissions?: string[],
  anyUserPermissions?: string[],
  channelCooldown?: number,
  globalCooldown?: number,
  guildCooldown?: number,
  ignore?: boolean,
  name: string,
  onlyChannels?: string[],
  onlyGuilds?: string[],
  onlyRoles?: string[],
  onlyUsers?: string[],
  ownerOnly?: boolean,
  returnAllClientPermissionsError?: boolean,
  returnAllUserPermissionsError?: boolean,
  returnAnyClientPermissionsError?: boolean,
  returnAnyUserPermissionsError?: boolean,
  returnChannelCooldownError?: boolean,
  returnErrors?: boolean,
  returnGlobalCooldownError?: boolean,
  returnGuildCooldownError?: boolean,
  returnOnlyChannelsError?: boolean,
  returnOnlyGuildsError?: boolean,
  returnOnlyRolesError?: boolean,
  returnOnlyUsersError?: boolean,
  returnOwnerOnlyError?: boolean,
}

export type AnyCommand = IButtonCommand | IMessageCommand
  | IMessageContextCommand | IModalForm | ISlashCommand
  | IStringSelectMenu | IUserContextCommand | IUserSelectMenu;
