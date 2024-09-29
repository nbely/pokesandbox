import { ChatInputCommandInteraction, GuildMember, Role } from 'discord.js';

import { buildErrorEmbed } from '@bot/embeds/errorEmbed';
import type { Region, Server } from '@shared/models';
import {
  createServer,
  findRegionsByObjectIds,
  findServer,
} from '@shared/services';

import type { BotClient } from './BotClient';
import { Menu } from './Menu';

export class AdminMenu extends Menu {
  private _adminRoles: (string | Role)[] = [];
  private _modRoles: (string | Role)[] = [];
  private _region?: Region;
  private _regions: Region[] = [];
  private _server: Server | null = null;

  constructor(client: BotClient, interaction: ChatInputCommandInteraction) {
    super(client, interaction);
  }

  get adminRoles(): (string | Role)[] {
    return this._adminRoles;
  }

  set adminRoles(adminRoles: (string | Role)[]) {
    this._adminRoles = adminRoles;
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

  async createNewServer(): Promise<void> {
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

  async initialize(): Promise<boolean> {
    await this.fetchServer();
    if (!this._server) {
      if (this.commandInteraction.commandName === 'server') {
        await this.createNewServer();
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
      return false;
    }
    return true;
  }

  async populateAdminRoles(): Promise<void> {
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
  }

  async populateModRoles(): Promise<void> {
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
  }

  async populateRegions(): Promise<void> {
    this.regions = await findRegionsByObjectIds(this.server.regions);
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
