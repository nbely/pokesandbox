import { EmbedBuilder, Role } from 'discord.js';

import { Region, Server } from '@shared/models';

import { Menu } from '../Menu/Menu';
import { Session } from '../Session/Session';
import { MenuBuilderOptions, MenuButtonConfig, MenuCommandOptions, SelectMenuConfig } from '../types';
import { getServerInitializedEmbed } from './AdminMenu.embeds';

export interface AdminMenuBuilderOptions<C extends MenuCommandOptions = MenuCommandOptions> extends Omit<MenuBuilderOptions<Menu<C>, C>, 'handleMessage' | 'setButtons' | 'setEmbeds' | 'setSelectMenu'> {
  useAdminRoles?: boolean;
  useModRoles?: boolean;
  handleMessage?: (menu: AdminMenu<C>, response: string) => Promise<void>;
  setButtons?: (menu: AdminMenu<C>) => Promise<MenuButtonConfig<Menu<C>>[]>;
  setEmbeds: (menu: AdminMenu<C>) => Promise<EmbedBuilder[]>;
  setSelectMenu?: (menu: AdminMenu<C>) => SelectMenuConfig<Menu<C>>;
}

export class AdminMenu<C extends MenuCommandOptions = MenuCommandOptions> extends Menu<C> {
  private _initialized = false;

  private constructor(
    session: Session,
    name: string,
    options: AdminMenuBuilderOptions<C>
  ) {
    // Convert AdminMenuBuilderOptions to MenuBuilderOptions for super call
    const menuOptions: MenuBuilderOptions<Menu<C>, C> = {
      ...options,
      handleMessage: options.handleMessage as ((menu: Menu<C>, response: string) => Promise<void>) | undefined,
      setButtons: options.setButtons as ((menu: Menu<C>) => Promise<MenuButtonConfig<Menu<C>>[]>) | undefined,
      setEmbeds: options.setEmbeds as (menu: Menu<C>) => Promise<EmbedBuilder[]>,
      setSelectMenu: options.setSelectMenu as ((menu: Menu<C>) => SelectMenuConfig<Menu<C>>) | undefined,
    };
    super(session, name, menuOptions);
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
    try {
      const serverId = this.interaction.guild?.id;
      if (!serverId) {
        return null;
      }
      return Server.findOne().byServerId(serverId);
    } catch (error) {
      await this.session.handleError(error);
      return null;
    }
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
    try {
      const serverId = this.interaction.guild?.id;
      if (!serverId) {
        throw new Error('Guild ID is not available.');
      }
      const server = await Server.findServerWithRegions({
        serverId,
      });
      if (!server) {
        throw new Error(
          'There was a problem fetching your server. Please try again later.'
        );
      }
      return server;
    } catch (error) {
      await this.session.handleError(error);
      throw error;
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
