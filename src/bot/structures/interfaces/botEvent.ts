import { BotClient } from "@bot/index";

export default interface IBotEvent {
  customEvent?: boolean;
  name: string;
  execute: (name: string, client?: BotClient, rootPath?: string) => void;
}
