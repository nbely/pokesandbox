import { Message, MessageComponentInteraction, Role } from "discord.js";

import { IServer } from "@models/server.model";

export interface IServerMenu {
  adminRoles?: (string | Role)[];
  interaction?: MessageComponentInteraction;
  isCancelled?: boolean;
  isReset?: boolean;
  message?: Message;
  modRoles?: (string | Role)[];
  prompt: string;
  server: IServer;
}
