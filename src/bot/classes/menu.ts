import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  Message,
  MessageComponentInteraction,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
} from "discord.js";

import { BotClient } from "../index";
import buildErrorEmbed from "@bot/embeds/errorEmbed";

export class Menu {
  client: BotClient;
  commandInteraction: ChatInputCommandInteraction;
  componentInteraction?:
    | MessageComponentInteraction
    | RoleSelectMenuInteraction;
  components: ActionRowBuilder<ButtonBuilder | RoleSelectMenuBuilder>[] = [];
  content?: string;
  currentPage: number = 1;
  embeds: EmbedBuilder[] = [];
  isBackSelected: boolean = false;
  isCancelled: boolean = false;
  isReset: boolean = false;
  message?: Message;
  prompt: string = "";

  constructor(client: BotClient, interaction: ChatInputCommandInteraction) {
    this.client = client;
    this.commandInteraction = interaction;
  }

  async awaitButtonMenuInteraction(time: number): Promise<string | undefined> {
    await this.awaitMenuInteraction(time);
    return this.componentInteraction?.customId.split("_")[1];
  }

  async awaitMessageReply(time: number): Promise<string> {
    const filter = (message: Message): boolean => {
      return message.author.id === this.commandInteraction.user.id;
    };
    const collectedMessage =
      await this.commandInteraction.channel?.awaitMessages({
        filter,
        errors: ["time"],
        max: 1,
        time,
      });

    const response: string | undefined = collectedMessage?.first()?.content;
    if (!response) {
      throw new Error("Invalid response received.");
    }
    this.isReset = true;
    return response;
  }

  async awaitRoleMenuInteraction(time: number): Promise<string> {
    await this.awaitMenuInteraction(time);
    if (this.componentInteraction?.isRoleSelectMenu()) {
      return this.componentInteraction.values[0];
    } else {
      throw new Error("Invalid Role Menu Interaction");
    }
  }

  async back(): Promise<void> {
    this.isBackSelected = true;
    this.prompt = "";
    this.currentPage = 1;
  }

  async cancel(): Promise<void> {
    this.components = [];
    this.content = "*Command Cancelled*";
    this.embeds = [];

    await this.componentInteraction?.update(this.getResponseOptions());
    this.isCancelled = true;
  }

  async handleError(error?: unknown): Promise<void> {
    let errorMessage = "An unknown error has occurred!";
    let addSupportInfo = false;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      addSupportInfo = true;
    }
    await this.message?.edit({
      embeds: [
        buildErrorEmbed(
          this.client,
          (this.componentInteraction?.member ??
            this.commandInteraction.member) as GuildMember,
          errorMessage,
          addSupportInfo,
        ),
      ],
      components: [],
    });
    this.isCancelled = true;
  }

  async handleMenuReset(): Promise<void> {
    if (this.isReset) {
      if (
        this.componentInteraction?.deferred === false &&
        this.componentInteraction?.replied === false
      ) {
        await this.componentInteraction.deferReply();
      }
      this.message = await this.componentInteraction?.followUp(this.getResponseOptions())
        ?? await this.commandInteraction.followUp(this.getResponseOptions());
      this.isReset = false;
    } else {
      await this.updateEmbedMessage();
    }
  }

  async sendEmbedMessage(): Promise<void> {
    if (!this.message) {
      this.message = await this.commandInteraction.followUp(
        this.getResponseOptions(),
      );
    } else {
      await this.handleMenuReset();
    }
  }

  async updateEmbedMessage(): Promise<void> {
    await this.componentInteraction?.update(this.getResponseOptions());
  }

  private async awaitMenuInteraction(time: number): Promise<void> {
    const filter = (
      componentInteraction: MessageComponentInteraction,
    ): boolean => {
      return (
        componentInteraction.user ===
        (this.componentInteraction?.user ?? this.commandInteraction.user)
      );
    };
    this.componentInteraction = await this.message?.awaitMessageComponent({
      filter,
      time,
    });
  }

  private getResponseOptions() {
    return {
      components: this.components,
      content: this.content,
      embeds: this.embeds,
    };
  }
}
