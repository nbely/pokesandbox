import { Session } from '../Session/Session';

import { MenuBuilder } from '../Menu/MenuBuilder';
import { AdminMenu } from './AdminMenu';
import { MenuCommandOptions } from '../types';

export class AdminMenuBuilder<
  O extends MenuCommandOptions = MenuCommandOptions
> extends MenuBuilder<AdminMenu, O> {
  /**** Constructor ****/

  public constructor(session: Session, name: string, options: O = {} as O) {
    super(session, name, options);
  }

  /**** Getters & Setters ****/

  /**** Public Methods ****/

  public async build(): Promise<AdminMenu> {
    // Reuse the base class's build logic
    return super.build() as Promise<AdminMenu>;
  }

  /**** Private Methods ****/

  /**** Protected Methods ****/
  protected async createMenu(): Promise<AdminMenu> {
    // Override the factory method to create an AdminMenu
    return await AdminMenu.create(
      this._session,
      this._name,
      this.getBuilderOptions()
    );
  }
}
