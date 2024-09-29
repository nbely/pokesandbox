import { ButtonStyle } from 'discord.js';

import type { AdminMenu } from '@bot/classes';

const getManageRegionMenuComponents = (menu: AdminMenu): void => {
  menu.paginationOptions = {
    ...menu.paginationOptions,
    buttons: [
      menu.createButton('1', ButtonStyle.Primary, 'Pokedex'),
      menu.createButton('2', ButtonStyle.Primary, 'Moves'),
      menu.createButton('3', ButtonStyle.Primary, 'Progression'),
      menu.createButton('4', ButtonStyle.Primary, 'Locations'),
      menu.createButton('5', ButtonStyle.Primary, 'Transportation'),
      menu.createButton('6', ButtonStyle.Primary, 'Quests'),
      menu.createButton('7', ButtonStyle.Primary, 'Shops'),
      menu.createButton('8', ButtonStyle.Primary, 'Mechanics'),
      menu.createButton('9', ButtonStyle.Primary, 'Graphics'),
    ],
    fixedEndButtons: [],
    fixedStartButtons: [
      menu.createButton(
        menu.region.deployed ? 'Undeploy' : 'Deploy',
        menu.region.deployed ? ButtonStyle.Danger : ButtonStyle.Success
      ),
    ],
    hideBackButton: false,
    nextButtonStyle: ButtonStyle.Secondary,
    previousButtonStyle: ButtonStyle.Secondary,
    type: 'buttons',
  };
};

export default getManageRegionMenuComponents;
