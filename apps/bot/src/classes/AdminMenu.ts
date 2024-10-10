import { ChatInputCommandInteraction, GuildMember, Role } from 'discord.js';

import { buildErrorEmbed } from '@bot/embeds/errorEmbed';
import type { Region, Server } from '@shared/models';
import {
  createServer,
  findRegionsByObjectIds,
  findServer,
} from '@shared/services';

import type { BotClient } from './BotClient';
import { MenuBuilder, MenuBuilderOptions } from './Menu';
import getServerInitializedEmbed from '@bot/interactions/guilds/1010726453974925402/slashCommands/server/embeds/getServerInitializedEmbed';

export interface AdminMenuBuilderOptions extends MenuBuilderOptions {
  useAdminRoles?: boolean;
  useModRoles?: boolean;
}

export class AdminMenuBuilder extends MenuBuilder {
  private _adminRoles: (string | Role)[] = [];
  private _initialized = false;
  private _modRoles: (string | Role)[] = [];
  private _region?: Region;
  private _regions: Region[] = [];
  private _server: Server | null = null;

  private constructor(
    client: BotClient,
    interaction: ChatInputCommandInteraction,
    options: AdminMenuBuilderOptions
  ) {
    super(client, interaction, options);
  }

  static async create(
    client: BotClient,
    interaction: ChatInputCommandInteraction,
    options?: AdminMenuBuilderOptions
  ): Promise<AdminMenuBuilder> {
    const menu = new AdminMenuBuilder(client, interaction, options);
    await menu.initialize();
    if (options?.useAdminRoles) await menu.populateAdminRoles();
    if (options?.useModRoles) await menu.populateModRoles();
    return menu;
  }

  get adminRoles(): (string | Role)[] {
    return this._adminRoles;
  }

  set adminRoles(adminRoles: (string | Role)[]) {
    this._adminRoles = adminRoles;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  get modRoles(): (string | Role)[] {
    return this._modRoles;
  }

  set modRoles(modRoles: (string | Role)[]) {
    this._modRoles = modRoles;
  }

  get region(): Region {
    if (!this._region)
      throw new Error(
        'Selected Region not found, region must be selected first.'
      );
    return this._region;
  }

  set region(region: Region) {
    this._region = region;
  }

  get regions(): Region[] {
    return this._regions;
  }

  set regions(regions: Region[]) {
    this._regions = regions;
  }

  get server(): Server {
    if (!this._server)
      throw new Error('Server not found, menu be initialized first.');
    return this._server;
  }

  set server(server: Server) {
    this._server = server;
  }

  /* Public Builder Methods */

  public async populateAdminRoles(): Promise<AdminMenuBuilder> {
    if (this.server.adminRoleIds) {
      this.adminRoles = await Promise.all(
        this.server.adminRoleIds.map(
          async (roleId) =>
            this.commandInteraction.guild?.roles.cache.get(roleId) ??
            (await this.commandInteraction.guild?.roles.fetch(roleId)) ??
            roleId
        )
      );
    }
    return this;
  }

  public async populateModRoles(): Promise<AdminMenuBuilder> {
    if (this.server.modRoleIds) {
      this.modRoles = await Promise.all(
        this.server.modRoleIds.map(
          async (roleId) =>
            this.commandInteraction.guild?.roles.cache.get(roleId) ??
            (await this.commandInteraction.guild?.roles.fetch(roleId)) ??
            roleId
        )
      );
    }
    return this;
  }

  public async populateRegions(): Promise<void> {
    this.regions = await findRegionsByObjectIds(this.server.regions);
  }

  /* Private Methods */

  private async createNewServer(): Promise<void> {
    if (!this.commandInteraction.guild)
      throw new Error('Guild not found while initializing server.');

    this.server = await createServer({
      adminRoleIds: [],
      discovery: {
        enabled: false,
        icon: this.commandInteraction.guild.icon || undefined,
      },
      modRoleIds: [],
      name: this.commandInteraction.guild.name,
      playerList: [],
      prefixes: [],
      regions: [],
      serverId: this.commandInteraction.guild.id,
    });
  }

  private async initialize(): Promise<void> {
    await this.fetchServer();
    if (!this._server) {
      if (this.commandInteraction.commandName === 'server') {
        await this.createNewServer();
        await this.commandInteraction.followUp({
          embeds: [getServerInitializedEmbed(this)],
        });
      } else {
        await this.commandInteraction.followUp({
          embeds: [
            buildErrorEmbed(
              this.client,
              this.commandInteraction.member as GuildMember | null,
              'Sorry, this command is not available as your server has not been initialized with PokéSandbox. Please initialize your server using the /server Slash Command.'
            ),
          ],
        });
      }
      this._initialized = false;
    }
    this._initialized = true;
  }

  private async fetchServer(): Promise<void> {
    const serverResponse = await findServer({
      serverId: this.commandInteraction.guild?.id,
    });
    if (serverResponse) {
      this.server = serverResponse;
    }
  }
}
