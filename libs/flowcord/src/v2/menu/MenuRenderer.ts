/**
 * MenuRenderer — Renders menus to Discord in either embeds or display components mode.
 *
 * Handles:
 * - Dual rendering modes (embeds vs layout/Components v2)
 * - Mode transitions (followUp + delete on embed ↔ layout switch)
 * - Reserved button injection
 * - Component ID namespacing on output
 * - Pagination expansion (paginatedGroup → action rows)
 */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  type EmbedBuilder,
  type Interaction,
  type Message,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import type { MenuInstance } from './MenuInstance';
import type {
  ActionRowConfig,
  ButtonConfig,
  ComponentConfig,
  PaginationState,
  RenderMode,
} from '../types/common';
import {
  buildReservedButtonRow,
  injectReservedButtons,
  type ReservedButtonsOptions,
} from '../components/reservedButtons';

export class MenuRenderer {
  private _activeMessageId: string | null = null;
  private _activeMessageMode: RenderMode | null = null;

  get activeMessageMode(): RenderMode | null {
    return this._activeMessageMode;
  }

  /**
   * Build the Discord.js action rows from embed-mode button configs.
   * Namespaces all component IDs via the menu's ComponentIdManager.
   */
  buildEmbedActionRows(
    menuInstance: MenuInstance,
    buttons: ButtonConfig[],
    reservedRow: ActionRowConfig | null
  ): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
    const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

    // Build content button rows (max 5 buttons per row)
    const contentButtons = buttons.filter(
      (b) => !b.id?.startsWith('__reserved')
    );
    for (let i = 0; i < contentButtons.length; i += 5) {
      const chunk = contentButtons.slice(i, i + 5);
      const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
      for (let j = 0; j < chunk.length; j++) {
        const btn = chunk[j];
        const id = btn.id ?? `__btn_${i + j}`;
        const namespacedId = menuInstance.idManager.namespace(id);
        const builder = new ButtonBuilder()
          .setCustomId(namespacedId)
          .setLabel(btn.label)
          .setStyle(btn.style)
          .setDisabled(btn.disabled ?? false);
        if (btn.emoji) builder.setEmoji(btn.emoji);
        row.addComponents(builder);
      }
      rows.push(row);
    }

    // Build reserved button row
    if (reservedRow) {
      const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
      for (const child of reservedRow.children) {
        if (child.type !== 'button') continue;
        const namespacedId = menuInstance.idManager.namespace(
          child.id ?? '__reserved'
        );
        const builder = new ButtonBuilder()
          .setCustomId(namespacedId)
          .setLabel(child.label)
          .setStyle(child.style)
          .setDisabled(child.disabled ?? false);
        row.addComponents(builder);
      }
      rows.push(row);
    }

    return rows;
  }

  /**
   * Build the embeds response payload.
   */
  buildEmbedsPayload(
    embeds: EmbedBuilder[],
    actionRows: ActionRowBuilder<MessageActionRowComponentBuilder>[],
    content?: string,
    paginationState?: PaginationState | null
  ): {
    embeds: EmbedBuilder[];
    components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
    content?: string;
  } {
    // Add page counter to footer if paginating
    if (
      paginationState &&
      paginationState.totalPages > 1 &&
      embeds.length > 0
    ) {
      const lastEmbed = embeds[embeds.length - 1];
      const footerText = `Page ${paginationState.currentPage + 1} of ${
        paginationState.totalPages
      }`;
      const existingFooter = lastEmbed.data.footer?.text;
      lastEmbed.setFooter({
        text: existingFooter ? `${existingFooter} • ${footerText}` : footerText,
      });
    }

    return {
      embeds,
      components: actionRows,
      ...(content ? { content } : {}),
    };
  }

  /**
   * Resolve reserved buttons options from a menu instance's definition state.
   */
  buildReservedButtonsOptions(
    menuInstance: MenuInstance,
    mode: RenderMode
  ): ReservedButtonsOptions {
    return {
      showBack: menuInstance.definition.isReturnable,
      showCancel: menuInstance.definition.isCancellable,
      pagination: menuInstance.paginationState,
      stableButtons: true, // default — can be overridden by pagination config
      mode,
    };
  }
}
