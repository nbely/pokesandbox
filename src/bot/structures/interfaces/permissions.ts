type UserPermissions<T> = "AddReactions" | "Administrator" | "AttachFiles" | "BanMembers"
  | "ChangeNickname" | "Connect" | "CreateInstantInvite" | "CreatePrivateThreads"
  | "CreatePublicThreads" | "DeafenMembers" | "EmbedLinks" | "KickMembers"
  | "ManageChannels" | "ManageEmojisAndStickers" | "ManageEvents" | "ManageGuild"
  | "ManageGuildExpressions" | "ManageMessages" | "ManageNicknames" | "ManageRoles"
  | "ManageThreads" | "ManageWebhooks" | "MentionEveryone" | "ModerateMembers"
  | "MoveMembers" | "MuteMembers" | "PrioritySpeaker" | "ReadMessageHistory"
  | "RequestToSpeak" | "SendMessages" | "SendMessagesInThreads" | "SendVoiceMessages"
  | "SendTTSMessages" | "Speak" | "Stream" | "UseExternalEmojis"
  | "UseApplicationCommands" | "UseEmbeddedActivities" | "UseExternalSounds"
  | "UseExternalStickers" | "UseSoundboard" | "UseVAD" | "ViewAuditLog"
  | "ViewChannel" | "ViewCreatorMonetizationAnalytics" | "ViewGuildInsights";

export default UserPermissions;
