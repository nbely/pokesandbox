import { Interaction, Message } from "discord.js";

import { AnyCommand } from "@structures/interfaces/baseCommand";
import { BotClient } from "@bot/index";
import getAllClientPermissions from "./allClientPermissions";



const commandOptionsProcessor = async (
  client: BotClient,
  message: Message | Interaction | any,
  command: AnyCommand,
  isInteraction: boolean,
  interactionType: string
) => {
  const allClientPermissions: boolean = await getAllClientPermissions(client, message, command);
  const anyClientPermissions = await require('./AnyClientPermissions').default(client, message, command);
  const allUserPermissions = await require("./AllUserPermissions").default(client, message, command);
  const anyUserPermissions = await require("./AnyUserPermissions").default(client, message, command);
  const channelCooldown = await require("./ChannelCooldown").default(client, message, command, isInteraction, interactionType);
  const globalCooldown = await require("./GlobalCooldown").default(client, message, command, isInteraction, interactionType);
  const guildCooldown = await require("./GuildCooldown").default(client, message, command, isInteraction, interactionType);
  const onlyChannels = await require("./OnlyChannels").default(client, message, command);
  const onlyGuilds = await require("./OnlyGuilds").default(client, message, command);
  const onlyRoles = await require("./OnlyRoles").default(client, message, command);
  const onlyUsers = await require("./OnlyUsers").default(client, message, command, isInteraction);
  const ownerOnly = await require("./OwnerOnly").default(client, message, command, isInteraction);
  const finalCorrection = [allClientPermissions, anyClientPermissions, allUserPermissions, anyUserPermissions, channelCooldown, guildCooldown, globalCooldown, onlyChannels, onlyGuilds, onlyRoles, onlyUsers, ownerOnly];
  if (finalCorrection.includes(false)) return false;
  else return true;

}

export default commandOptionsProcessor;
