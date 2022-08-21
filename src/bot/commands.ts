import { CommandInteraction, ChatInputApplicationCommandData, Client } from "discord.js";
import { Hello } from "./commands/hello";

export interface Command extends ChatInputApplicationCommandData {
    run: (client: Client, interaction: CommandInteraction) => void;
}

export const Commands: Command[] = [Hello];
