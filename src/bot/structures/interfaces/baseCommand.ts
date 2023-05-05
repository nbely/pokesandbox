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
  ownerOnly?: boolean,
  returnAllClientPermissionsError?: boolean,
  returnErrors?: boolean,
}

export type AnyCommand = IButtonCommand | IMessageCommand
  | IMessageContextCommand | IModalForm | ISlashCommand
  | IStringSelectMenu | IUserContextCommand | IUserSelectMenu;
