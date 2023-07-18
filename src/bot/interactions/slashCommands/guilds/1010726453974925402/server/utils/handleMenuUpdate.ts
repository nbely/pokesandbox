import {
  InteractionReplyOptions,
  InteractionUpdateOptions,
  MessagePayload,
} from "discord.js";

import { IServerMenu } from "../interfaces/menu";

const handleMenuUpdate = async (
  menu: IServerMenu,
  options: string | MessagePayload | InteractionReplyOptions | InteractionUpdateOptions,
): Promise<IServerMenu> => {

  if (menu.isReset) {
    if (menu.interaction?.deferred === false && menu.interaction?.replied === false) {
      await menu.interaction?.deferReply();
    }
    menu.message = await menu.interaction?.followUp(options as InteractionReplyOptions);
    menu.isReset = false;
  } else {
    await menu.interaction?.update(options as InteractionUpdateOptions);
  }

  return menu;
};

export default handleMenuUpdate;
