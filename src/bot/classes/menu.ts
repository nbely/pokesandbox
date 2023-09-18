import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  GuildMember,
  InteractionCollector,
  Message,
  MessageComponentInteraction,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
} from "discord.js";

import { BotClient } from "../index";
import Button from "@bot/interactions/buttons/global/button";
import buildErrorEmbed from "@bot/embeds/errorEmbed";
import paginateButtons from "@bot/utils/paginateButtons";

type ComponentBuilder = ButtonBuilder | RoleSelectMenuBuilder;
type ComponentInteraction = MessageComponentInteraction
  | RoleSelectMenuInteraction;

export type PaginationOptions = {
  backButtonStyle?: ButtonStyle;
  buttons?: ButtonBuilder[];
  cancelButtonStyle?: ButtonStyle;
  fixedStartButtons?: ButtonBuilder[];
  fixedEndButtons?: ButtonBuilder[];
  hideBackButton?: boolean;
  hideCancelButton?: boolean;
  nextButtonStyle?: ButtonStyle;
  previousButtonStyle?: ButtonStyle;
  quantityPerPage: number;
  totalQuantity?: number;
  type: "buttons" | "list";
}

export class Menu {
  private _client: BotClient;
  private _commandInteraction: ChatInputCommandInteraction;
  private _componentInteraction?: ComponentInteraction;
  private _components: ActionRowBuilder<ComponentBuilder>[] = [];
  private _content?: string;
  private _currentPage: number = 1;
  private _embeds: EmbedBuilder[] = [];
  private _isBackSelected: boolean = false;
  private _isCancelled: boolean = false;
  private _isReset: boolean = false;
  private _isRootMenu: boolean = true;
  private _message?: Message;
  private _paginationOptions: PaginationOptions = {
    backButtonStyle: ButtonStyle.Secondary,
    buttons: [],
    cancelButtonStyle: ButtonStyle.Secondary,
    fixedStartButtons: [],
    fixedEndButtons: [this.createButton("Cancel",ButtonStyle.Secondary)],
    hideBackButton: false,
    hideCancelButton: false,
    nextButtonStyle: ButtonStyle.Primary,
    previousButtonStyle: ButtonStyle.Primary,
    quantityPerPage: 10,
    type: "buttons",
  }
  private _prompt: string = "";

  constructor(client: BotClient, interaction: ChatInputCommandInteraction) {
    this._client = client;
    this._commandInteraction = interaction;
  }

  get client(): BotClient {
    return this._client;
  }

  get commandInteraction(): ChatInputCommandInteraction {
    return this._commandInteraction;
  }

  get componentInteraction(): ComponentInteraction | undefined {
    return this._componentInteraction;
  }

  get components(): ActionRowBuilder<ComponentBuilder>[] {
    return this._components;
  }

  set components(components: ActionRowBuilder<ComponentBuilder>[]) {
    this._components = components;
  }

  get content(): string | undefined {
    return this._content;
  }

  set content(content: string | undefined) {
    this._content = content;
  }

  get currentPage(): number {
    return this._currentPage;
  }

  set currentPage(currentPage: number) {
    this._currentPage = currentPage;
  }

  get embeds(): EmbedBuilder[] {
    return this._embeds;
  }

  set embeds(embeds: EmbedBuilder[]) {
    this._embeds = embeds;
  }

  get isBackSelected(): boolean {
    return this._isBackSelected;
  }

  set isBackSelected(isBackSelected: boolean) {
    this._isBackSelected = isBackSelected;
  }

  get isCancelled(): boolean {
    return this._isCancelled;
  }

  set isCancelled(isCancelled: boolean) {
    this._isCancelled = isCancelled;
  }

  get isReset(): boolean {
    return this._isReset;
  }

  set isReset(isReset: boolean) {
    this._isReset = isReset;
  }

  get isRootMenu(): boolean {
    return this._isRootMenu;
  }

  set isRootMenu(isRootMenu: boolean) {
    this._isRootMenu = isRootMenu;
  }

  get message(): Message | undefined {
    return this._message;
  }

  set message(message: Message | undefined) {
    this._message = message;
  }

  get paginationOptions(): PaginationOptions {
    return this._paginationOptions;
  }

  set paginationOptions(paginationOptions: PaginationOptions) {
    this._paginationOptions = paginationOptions;
    if (paginationOptions.type === "buttons") {
      this._components = paginateButtons(
        paginationOptions.buttons ?? [],
        this.currentPage,
        paginationOptions.fixedStartButtons,
        [
          ...paginationOptions.fixedEndButtons ?? [],
          ...(paginationOptions.hideBackButton || this.isRootMenu ? [] : [
            this.createButton(
              "Back",
              paginationOptions.backButtonStyle ?? ButtonStyle.Secondary
            )
          ]),
          ...(paginationOptions.hideCancelButton ? [] : [
            this.createButton(
              "Cancel",
              paginationOptions.cancelButtonStyle ?? ButtonStyle.Secondary
            )
          ]),
        ],
        paginationOptions.nextButtonStyle,
        paginationOptions.previousButtonStyle
      );
    } else {
      this.paginateList();
    }
  }

  get prompt(): string {
    return this._prompt;
  }

  set prompt(prompt: string) {
    this._prompt = prompt;
  }

  async awaitButtonMenuInteraction(time: number): Promise<string | undefined> {
    try {
      await this.awaitMenuInteraction(time);
    } catch (error) {
      await this.handleError(error);
    }
    const buttonId = this.componentInteraction?.customId.split("_")[1];
    if (buttonId !== undefined) {
      this.isRootMenu = false;
      if (buttonId === "Back") {
        this.back();
      } else if (buttonId === "Cancel") {
        await this.cancel();
      } else if (buttonId === "Next") {
        this.currentPage++;
      } else if (buttonId === "Previous") {
        this.currentPage--;
      } else {
        return buttonId;
      }
    } else {
      await this.handleError(new Error("Invalid Button Menu Interaction"));
    }
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

  back(): void {
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

  async collectMessageOrButtonInteraction(time: number): Promise<string | undefined> {
    const promise = new Promise<string | undefined>(async (resolve, reject) => {
      let compCollector: InteractionCollector<ButtonInteraction> | undefined;
      
      if (this.components.length > 0) {
        const compFilter = (
          componentInteraction: MessageComponentInteraction,
        ): boolean => {
          return (
            componentInteraction.user ===
            (this.componentInteraction?.user ?? this.commandInteraction.user)
          );
        };
        compCollector = this.message?.createMessageComponentCollector({
          componentType: ComponentType.Button,
          max: 1,
          filter: compFilter,
          time
        });
      }

      const msgFilter = (message: Message): boolean => {
        return message.author.id === this.commandInteraction.user.id;
      };
      const msgCollector = this.commandInteraction.channel?.createMessageCollector({
        filter: msgFilter,
        max: 1,
        time
      });

      compCollector?.on("collect", async (componentInteraction) => {
        msgCollector?.stop();
        this._componentInteraction = componentInteraction;
        const buttonId = componentInteraction.customId.split("_")[1];
        if (buttonId === "Back") {
          this.back();
        } else if (buttonId === "Cancel") {
          await this.cancel();
        } else if (buttonId === "Next") {
          this.currentPage++;
        } else if (buttonId === "Previous") {
          this.currentPage--;
        } else {
          resolve(buttonId);
        }
        resolve(undefined);
      });
      compCollector?.on("end", async (collected) => {
        console.log('compCollector end')
        if (collected.size === 0) {
          if (msgCollector) {
            if (msgCollector?.ended && msgCollector?.received === 0) {
              await this.handleError(new Error("No response received."));
              resolve(undefined);
            }
          } else {
            await this.handleError(new Error("No response received."));
            resolve(undefined);
          }
        }
      });

      msgCollector?.on("collect", async (message) => {
        compCollector?.stop();
        this.isReset = true;
        resolve(message.content);
      });
      msgCollector?.on("end", async (collected) => {
        console.log('msgCollector end')
        if (collected.size === 0) {
          if (compCollector) {
            if (compCollector?.ended && compCollector?.total === 0) {
              await this.handleError(new Error("No response received."));
              resolve(undefined);
            }
          } else {
            await this.handleError(new Error("No response received."));
            resolve(undefined);
          }
        }
      });
    });
    return promise; 
  }

  createButton(
    label: string,
    style: ButtonStyle = ButtonStyle.Primary,
    id?: number | string
  ): ButtonBuilder {
    return Button.create({ label, style, id });
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

  async sendEmbedMessage(): Promise<void> {
    if (!this.message) {
      this.message = await this.commandInteraction.followUp(
        this.getResponseOptions(),
      );
    } else {
      await this.updateEmbedMessage();
    }
  }

  async updateEmbedMessage(): Promise<void> {
    if (this.isReset) {
      if (
        this.componentInteraction?.deferred === false &&
        this.componentInteraction?.replied === false
      ) {
        await this.componentInteraction.deferReply();
      }
      this.message =
        (await this.componentInteraction?.followUp(
          this.getResponseOptions(),
        )) ??
        (await this.commandInteraction.followUp(this.getResponseOptions()));
      this.isReset = false;
    } else {
      await this.componentInteraction?.update(this.getResponseOptions());
    }
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
    this._componentInteraction = await this.message?.awaitMessageComponent({
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

  private paginateList() {
    let showNextButton: boolean = false;
    let showPreviousButton: boolean = false;

    const totalPages = Math.ceil((this.paginationOptions.totalQuantity ?? 0)
      / this.paginationOptions.quantityPerPage);

    if (totalPages > 1 && this.currentPage < totalPages) {
      showNextButton = true;
    } 
    if (this.currentPage > 1) {
      showPreviousButton = true;
    }

    const actionRow = new ActionRowBuilder<ButtonBuilder>();

    if (showPreviousButton) {
      actionRow.addComponents(
        this.createButton("Previous", this.paginationOptions.previousButtonStyle),
      );
    }
    if (showNextButton) {
      actionRow.addComponents(
        this.createButton("Next", this.paginationOptions.nextButtonStyle),
      );
    }
    if (!this.paginationOptions.hideBackButton && !this.isRootMenu) {
      actionRow.addComponents(
        this.createButton("Back", this.paginationOptions.backButtonStyle),
      );
    }
    if (!this.paginationOptions.hideCancelButton) {
      actionRow.addComponents(
        this.createButton("Cancel", this.paginationOptions.cancelButtonStyle),
      );
    }
    if (actionRow.components.length > 0) {
      this.components = [actionRow];
    }
  }
}
