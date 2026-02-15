import { Session } from '../Session/Session';

import { MenuBuilder } from '../Menu/MenuBuilder';
import { AdminMenu, AdminMenuBuilderOptions } from './AdminMenu';
import { MenuCommandOptions } from '../types';

export class AdminMenuBuilder<
  O extends MenuCommandOptions = MenuCommandOptions
> extends MenuBuilder<AdminMenu<O>, O> {
  /**** Constructor ****/

  public constructor(session: Session, name: string, options: O = {} as O) {
    super(session, name, options);
  }

  /**** Getters & Setters ****/

  /**** Public Methods ****/

  public async build(): Promise<AdminMenu<O>> {
    // Reuse the base class's build logic
    return super.build() as Promise<AdminMenu<O>>;
  }

  /**** Private Methods ****/

  /**** Protected Methods ****/
  protected async createMenu(): Promise<AdminMenu<O>> {
    // Override the factory method to create an AdminMenu
    return await AdminMenu.create<O>(
      this._session,
      this._name,
      this.getBuilderOptions() as AdminMenuBuilderOptions<O>
    );
  }
}
