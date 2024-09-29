import type {
  AutocompleteInteraction,
  CacheType,
  Interaction,
  Message,
} from 'discord.js';

import type { BotClient } from '@bot/classes';

import type { AnyCommand } from '../interfaces';
import getAllClientPermissions from './allClientPermissions';
import getAllUserPermissions from './allUserPermissions';
import getAnyClientPermissions from './anyClientPermissions';
import getAnyUserPermissions from './anyUserPermissions';
import getChannelCooldown from './channelCooldown';
import getGlobalCooldown from './globalCooldown';
import getGuildCooldown from './guildCooldown';
import getOnlyChannels from './onlyChannels';
import getOnlyGuilds from './onlyGuilds';
import getOnlyRoles from './onlyRoles';
import getOnlyUsers from './onlyUsers';
import getOwnerOnly from './ownerOnly';

export const commandOptionsProcessor = async (
  client: BotClient,
  message: Message | Exclude<Interaction, AutocompleteInteraction<CacheType>>,
  command: AnyCommand,
  isInteraction: boolean,
  interactionType: string
) => {
  const allClientPermissions: boolean = await getAllClientPermissions(
    client,
    message,
    command
  );
  const allUserPermissions = await getAllUserPermissions(
    client,
    message,
    command
  );
  const anyClientPermissions = await getAnyClientPermissions(
    client,
    message,
    command
  );
  let anyUserPermissions = await getAnyUserPermissions(
    client,
    message,
    command
  );
  const channelCooldown = await getChannelCooldown(
    client,
    message,
    command,
    isInteraction,
    interactionType
  );
  const globalCooldown = await getGlobalCooldown(
    client,
    message,
    command,
    isInteraction,
    interactionType
  );
  const guildCooldown = await getGuildCooldown(
    client,
    message,
    command,
    isInteraction,
    interactionType
  );
  const onlyChannels = await getOnlyChannels(client, message, command);
  const onlyGuilds = await getOnlyGuilds(client, message, command);
  let onlyRoles = await getOnlyRoles(client, message, command);
  const onlyUsers = await getOnlyUsers(client, message, command, isInteraction);
  const ownerOnly = await getOwnerOnly(client, message, command, isInteraction);
  if (command.onlyRolesOrAnyUserPermissions) {
    anyUserPermissions = anyUserPermissions || onlyRoles;
    onlyRoles = anyUserPermissions;
  }
  const finalCorrection = [
    allClientPermissions,
    anyClientPermissions,
    allUserPermissions,
    anyUserPermissions,
    channelCooldown,
    guildCooldown,
    globalCooldown,
    onlyChannels,
    onlyGuilds,
    onlyRoles,
    onlyUsers,
    ownerOnly,
  ];
  if (finalCorrection.includes(false)) return false;
  else return true;
};
