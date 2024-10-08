import { ActionRowBuilder, type ButtonBuilder, ButtonStyle } from 'discord.js';

import { Button } from '@bot/interactions/buttons/global/button';

export const paginateButtons = (
  buttonList: ButtonBuilder[],
  page = 1,
  fixedStartButtons: ButtonBuilder[] = [],
  fixedEndButtons: ButtonBuilder[] = [],
  nextButtonStyle: ButtonStyle = ButtonStyle.Primary,
  previousButtonStyle: ButtonStyle = ButtonStyle.Primary
): ActionRowBuilder<ButtonBuilder>[] => {
  const buttonSlotCount =
    10 - fixedStartButtons.length - fixedEndButtons.length;
  if (buttonSlotCount <= 0) {
    console.error('No slots for paginated buttons available.');
    return [];
  }
  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  let pageCount = 1,
    isFirstPage: boolean,
    isLastPage: boolean;
  if (buttonList.length <= buttonSlotCount) {
    pageCount = 1;
    isFirstPage = true;
    isLastPage = true;
  } else if (buttonList.length <= 2 * buttonSlotCount - 2) {
    pageCount = 2;
    isFirstPage = page === 1 ? true : false;
    isLastPage = !isFirstPage;
  } else {
    pageCount =
      Math.ceil(
        (buttonList.length - 2 * (buttonSlotCount - 1)) / (buttonSlotCount - 2)
      ) + 2;
    isFirstPage = page === 1 ? true : false;
    isLastPage = page === pageCount ? true : false;
  }

  if (page > pageCount) {
    console.error('Button page specified is greater than the number of pages.');
    return [];
  }
  const currentPageButtons = [...fixedStartButtons];
  currentPageButtons.push(
    ...buttonList.filter((button, index) => {
      if (
        (isFirstPage && isLastPage) ||
        (isFirstPage && index + 1 <= buttonSlotCount - 1) ||
        (isLastPage &&
          index + 1 >
            buttonSlotCount - 1 + (pageCount - 2) * (buttonSlotCount - 2)) ||
        (index + 1 > buttonSlotCount - 1 + (page - 2) * (buttonSlotCount - 2) &&
          index + 1 <= buttonSlotCount - 1 + (page - 1) * (buttonSlotCount - 2))
      )
        return true;
      else return false;
    })
  );
  if (pageCount > 1 && !isFirstPage) {
    currentPageButtons.push(
      Button.create({
        label: 'Previous',
        style: nextButtonStyle,
      })
    );
  }
  if (pageCount > 1 && !isLastPage) {
    currentPageButtons.push(
      Button.create({
        label: 'Next',
        style: previousButtonStyle,
      })
    );
  }

  if (fixedEndButtons) {
    currentPageButtons.push(...fixedEndButtons);
  }

  const hasSecondRow = currentPageButtons.length > 5 ? true : false;
  if (!hasSecondRow) {
    const actionRow = new ActionRowBuilder<ButtonBuilder>();
    currentPageButtons.forEach((button) => actionRow.addComponents(button));
    components.push(actionRow);
  } else {
    const firstActionRow = new ActionRowBuilder<ButtonBuilder>();
    const secondActionRow = new ActionRowBuilder<ButtonBuilder>();
    currentPageButtons.forEach((button, index) => {
      if (index < 5) {
        firstActionRow.addComponents(button);
      } else {
        secondActionRow.addComponents(button);
      }
    });
    components.push(firstActionRow, secondActionRow);
  }

  return components;
};
