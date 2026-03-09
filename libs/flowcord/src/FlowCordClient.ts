import type { ClientUser } from 'discord.js';

/**
 * Minimal client interface required by FlowCord framework.
 * Bot developers can extend their Discord.js Client to implement this interface.
 */
export interface FlowCordClient {
  /**
   * The client user (bot user) or null if not logged in
   */
  user: ClientUser | null;
}
