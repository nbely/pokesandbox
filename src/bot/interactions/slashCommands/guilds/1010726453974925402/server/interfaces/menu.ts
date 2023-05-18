import { IServer } from "@models/server.model";
import { Message, MessageComponentInteraction } from "discord.js";

export interface IServerMenu {
  interaction?: MessageComponentInteraction,
  isCancelled?: boolean,
  isReset?: boolean,
  message?: Message,
  prompt: string,
  server: IServer,
}