import type { BotClient } from '@bot/classes';
import { modalForms } from '@bot/interactions/modalForms';

export const modalFormsManager = async (client: BotClient) => {
  for (const modalForm of modalForms) {
    if (modalForm.ignore || !modalForm.name || !modalForm.execute) return;

    client.modalForms.set(modalForm.name, modalForm);
  }
};
