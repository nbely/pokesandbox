import {
  Client,
  CommandInteraction,
  Interaction,
  InteractionType 
} from "discord.js";

import { commands } from "../commands";

export default (client: Client): void => {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.type === InteractionType.ApplicationCommand) {
      await handleSlashCommand(client, interaction);
    }
  });
};

const handleSlashCommand = async (client: Client, interaction: CommandInteraction): Promise<void> => {
  if (!interaction.isChatInputCommand()) return;

  const slashCommand = commands.find(command => command.command.name === interaction.commandName);
  if (!slashCommand) {
    interaction.followUp({ content: "An error has ocurred" });
    return;
  }

  await interaction.deferReply();
  slashCommand.execute(client, interaction);
}
