export interface IServer {
  _id: string;
  serverId: string;
  adminRoleIds: string[];
  discovery: {
    description?: string;
    enabled: boolean;
    icon?: string;
    inviteLink: string;
  };
  modRoleIds: string[];
  name: string;
  playerList: string[];
  prefixes: string[];
  regions: string[];
}
