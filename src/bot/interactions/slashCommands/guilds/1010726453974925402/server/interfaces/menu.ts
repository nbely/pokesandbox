import { IServer } from "@models/server.model";
import { Message, MessageComponentInteraction, Role } from "discord.js";

export interface IServerMenu {
  adminRoles?: (string | Role)[], 
  interaction?: MessageComponentInteraction,
  isCancelled?: boolean,
  isReset?: boolean,
  message?: Message,
  modRoles?: (string | Role)[],
  prompt: string,
  server: IServer,
}
