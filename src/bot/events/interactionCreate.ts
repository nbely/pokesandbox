import { CommandInteraction, Client, Interaction, InteractionType } from "discord.js";
import { Commands } from "../commands";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.type === InteractionType.ApplicationCommand) {
            await handleSlashCommand(client, interaction);
        }
    });
};

const handleSlashCommand = async (client: Client, interaction: CommandInteraction): Promise<void> => {
    const slashCommand = Commands.find(command => command.name === interaction.commandName);
    if (!slashCommand) {
        interaction.followUp({ content: "An error has ocurred" });
        return;
    }

    await interaction.deferReply();

    slashCommand.run(client, interaction);
}
