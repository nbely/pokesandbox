import { Role } from 'discord.js';

import { Server } from '@shared/models';

import { Menu } from '../Menu/Menu';
import { Session } from '../Session/Session';
import { MenuBuilderOptions, MenuCommandOptions } from '../types';
import { getServerInitializedEmbed } from './AdminMenu.embeds';

export interface AdminMenuBuilderOptions<
  C extends MenuCommandOptions = MenuCommandOptions
> extends MenuBuilderOptions<AdminMenu<C>, C> {
  useAdminRoles?: boolean;
  useModRoles?: boolean;
}

export class AdminMenu<
  C extends MenuCommandOptions = MenuCommandOptions
> extends Menu<AdminMenu<C>, C> {
  private _initialized = false;

  private constructor(
    session: Session,
    name: string,
    options: AdminMenuBuilderOptions<C>
  ) {
    super(session, name, options);
  }

  static async create<C extends MenuCommandOptions = MenuCommandOptions>(
    session: Session,
    name: string,
    options: AdminMenuBuilderOptions<C>
  ): Promise<AdminMenu<C>> {
    const menu = new AdminMenu<C>(session, name, options);
    await menu.initialize();
    return menu;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  /* Public Builder Methods */

  public async getRoles(
    server: Server,
    type: string
  ): Promise<(string | Role)[]> {
    let ids: string[] = [];
    if (type === 'admin') {
      ids = server.adminRoleIds ?? [];
    } else if (type === 'mod') {
      ids = server.modRoleIds ?? [];
    } else {
      await this.session.handleError(new Error(`Invalid role type: ${type}.`));
      return [];
    }

    return Promise.all(
      ids.map((id) => {
        return this.getGuildRole(id);
      })
    );
  }

  /* Private Methods */

  private async createNewServer(): Promise<void> {
    if (!this.interaction.guild)
      throw new Error('Guild not found while initializing server.');

    await Server.create({
      adminRoleIds: [],
      discovery: {
        enabled: false,
        icon: this.interaction.guild.icon || undefined,
      },
      modRoleIds: [],
      name: this.interaction.guild.name,
      playerList: [],
      prefixes: [],
      regions: [],
      serverId: this.interaction.guild.id,
    });
  }

  private async fetchNullableServer(): Promise<Server | null> {
    return Server.findOne().byServerId(this.interaction.guild?.id);
  }

  public async fetchServer(): Promise<Server> {
    const server = await this.fetchNullableServer();
    if (!server) {
      throw new Error(
        'There was a problem fetching your server. Please try again later.'
      );
    }

    return server;
  }

  public async fetchServerAndRegions() {
    const server = await Server.findServerWithRegions({
      serverId: this.interaction.guild?.id,
    });
    if (!server) {
      throw new Error(
        'There was a problem fetching your server. Please try again later.'
      );
    }
    return server;
  }

  public async getGuildRole(roleId: string): Promise<string | Role> {
    return (
      this.interaction.guild?.roles.cache.get(roleId) ??
      (await this.interaction.guild?.roles.fetch(roleId)) ??
      roleId
    );
  }

  private async initialize(): Promise<void> {
    const server = await this.fetchNullableServer();

    if (!server) {
      await this.createNewServer();
      await this.interaction.followUp({
        embeds: [await getServerInitializedEmbed(this)],
      });
    }
    this._initialized = true;
  }
}
