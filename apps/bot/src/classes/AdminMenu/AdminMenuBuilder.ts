import { Session } from '../Session/Session';

import { MenuBuilder } from '../Menu/MenuBuilder';
import { AdminMenu } from './AdminMenu';

export class AdminMenuBuilder extends MenuBuilder<AdminMenu> {
  /**** Constructor ****/

  public constructor(session: Session, name: string) {
    super(session, name);
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
