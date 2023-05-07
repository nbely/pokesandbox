import { BotClient } from "@bot/index";

export default interface IBotEvent {
  customEvent?: boolean;
  ignore?: boolean;
  name: string;
  execute: (name: string, client?: BotClient, rootPath?: string) => void;
}
