import { EmbedBuilder, Role } from 'discord.js';

import { Region, Server } from '@shared/models';

import { Menu } from '../Menu/Menu';
import { Session } from '../Session/Session';
import { MenuBuilderOptions, MenuButtonConfig } from '../types';
import { getServerInitializedEmbed } from './AdminMenu.embeds';

export interface AdminMenuBuilderOptions extends MenuBuilderOptions<AdminMenu> {
  useAdminRoles?: boolean;
  useModRoles?: boolean;
}

export class AdminMenu extends Menu {
  private _initialized = false;

  protected _handleMessage?: (
    menu: AdminMenu,
    response: string
  ) => Promise<void>;
  protected _setButtons: (menu: AdminMenu) => Promise<MenuButtonConfig[]>;
  protected _setEmbeds: (menu: AdminMenu) => Promise<EmbedBuilder[]>;

  private constructor(
    session: Session,
    name: string,
    options: AdminMenuBuilderOptions
  ) {
    super(session, name, options);
  }

  static async create(
    session: Session,
    name: string,
    options?: AdminMenuBuilderOptions
  ): Promise<AdminMenu> {
    const menu = new AdminMenu(session, name, options);
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
    try {
      return Server.findOne().byServerId(this.interaction.guild?.id);
    } catch (error) {
      await this.session.handleError(error);
    }
  }

  public async fetchServer(): Promise<Server> {
    const server = await this.fetchNullableServer();
    if (!server) {
      await this.session.handleError(
        new Error(
          'There was a problem fetching your server. Please try again later.'
        )
      );
    }

    return server;
  }

  public async fetchServerAndRegions() {
    try {
      const server = await Server.findServerWithRegions({
        serverId: this.interaction.guild?.id,
      });
      if (!server) {
        throw new Error(
          'There was a problem fetching your server. Please try again later.'
        );
      }
      return server;
    } catch (error) {
      await this.session.handleError(error);
    }
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
