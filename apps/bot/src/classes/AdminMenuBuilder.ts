import { EmbedBuilder, Role } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

import {
  getCachedLocation,
  getCachedLocations,
  getCachedRegion,
  getCachedRegions,
  getCachedServer,
  saveServer,
} from '@bot/cache';
import { Server } from '@shared/models';
import type { Location, Region } from '@shared/models';
import { MenuBuilder } from '@flowcord';
import type { MenuContext, MenuSessionLike } from '@flowcord';

/**
 * Typed admin helpers injected onto `ctx.admin` by AdminMenuBuilder.
 */
export interface AdminHelpers {
  getServer(): Promise<Server>;
  getRegion(regionId: string): Promise<Region>;
  getRegions(): Promise<Region[]>;
  getLocation(locationId: string): Promise<Location>;
  getLocations(regionId: string): Promise<Location[]>;
  getRoles(type: 'admin' | 'mod'): Promise<(string | Role)[]>;
  getGuildRole(roleId: string): Promise<string | Role>;
}

export type AdminMenuContext<
  TState extends Record<string, unknown> = Record<string, unknown>
> = MenuContext<TState> & { admin: AdminHelpers };

/**
 * AdminMenuBuilder — extends MenuBuilder with PokeSandbox admin domain helpers.
 *
 * Adds `ctx.admin` via context extension so all callbacks have typed access
 * to server, region, location, and role helpers.
 *
 * Also runs server auto-initialization on setup (creates server if not found).
 */
export class AdminMenuBuilder<
  TState extends Record<string, unknown> = Record<string, unknown>
> extends MenuBuilder<TState, AdminMenuContext<TState>> {
  constructor(
    sessionLike: MenuSessionLike,
    name: string,
    options?: Record<string, unknown>
  ) {
    super(sessionLike, name, options);

    // Inject admin helpers onto ctx.admin
    this.extendContext((baseCtx: MenuContext) => ({
      admin: buildAdminHelpers(
        baseCtx.interaction as ChatInputCommandInteraction
      ),
    }));

    // Auto-initialize server on first setup
    this.setup(async (ctx: AdminMenuContext<TState>) => {
      await ensureServerInitialized(ctx);
    });
  }
}

// ---------------------------------------------------------------------------
// Admin helper factory — creates the helpers for a given interaction
// ---------------------------------------------------------------------------

function buildAdminHelpers(
  interaction: ChatInputCommandInteraction
): AdminHelpers {
  return {
    async getServer(): Promise<Server> {
      const server = await getCachedServer(interaction.guild?.id);
      if (!server) {
        throw new Error(
          'There was a problem fetching your server. Please try again later.'
        );
      }
      return server;
    },

    async getRegion(regionId: string): Promise<Region> {
      const region = await getCachedRegion(regionId);
      if (!region) {
        throw new Error(
          'There was a problem fetching the region. Please try again later.'
        );
      }
      return region;
    },

    async getRegions(): Promise<Region[]> {
      const server = await this.getServer();
      return getCachedRegions(server.regions);
    },

    async getLocation(locationId: string): Promise<Location> {
      const location = await getCachedLocation(locationId);
      if (!location) {
        throw new Error(
          'There was a problem fetching the location. Please try again later.'
        );
      }
      return location;
    },

    async getLocations(regionId: string): Promise<Location[]> {
      const region = await this.getRegion(regionId);
      return getCachedLocations(region.locations);
    },

    async getRoles(type: 'admin' | 'mod'): Promise<(string | Role)[]> {
      const server = await this.getServer();
      const ids =
        type === 'admin' ? server.adminRoleIds ?? [] : server.modRoleIds ?? [];

      return Promise.all(ids.map((id) => this.getGuildRole(id)));
    },

    async getGuildRole(roleId: string): Promise<string | Role> {
      return (
        interaction.guild?.roles.cache.get(roleId) ??
        (await interaction.guild?.roles.fetch(roleId)) ??
        roleId
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Server auto-initialization
// ---------------------------------------------------------------------------

async function ensureServerInitialized(ctx: AdminMenuContext): Promise<void> {
  const interaction = ctx.interaction as ChatInputCommandInteraction;
  const server = await getCachedServer(interaction.guild?.id);

  if (!server) {
    if (!interaction.guild) {
      throw new Error('Guild not found while initializing server.');
    }

    const newServer = await Server.create({
      adminRoleIds: [],
      discovery: {
        enabled: false,
        icon: interaction.guild.icon || undefined,
      },
      modRoleIds: [],
      name: interaction.guild.name,
      playerList: [],
      prefixes: [],
      regions: [],
      serverId: interaction.guild.id,
    });

    await saveServer(newServer);

    await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setColor('Gold')
          .setAuthor({
            name: `${interaction.guild.name} Initialized!`,
            iconURL: interaction.guild.iconURL() || undefined,
          })
          .setDescription(
            `Congratulations, your server has been initialized with PokeSandbox!\n` +
              `\nBelow are some basic commands that will be helpful for getting your server setup and starting with creating your first region:` +
              `\n\`/server\`: Use this command at any time to open up the below options menu and update your PokeSandbox server settings.` +
              `\n\`/regions\`: Use this command to create a new region for your server, or to update existing regions.`
          )
          .setTimestamp(),
      ],
    });
  }
}
